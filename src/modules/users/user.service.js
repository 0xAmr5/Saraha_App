import { providerEnum, emailEnum } from "../../common/enum/user.enum.js";
import { successResponse } from "../../common/utils/response.success.js";
import { decrypt, encrypt } from "../../common/utils/security/encrypt.security.js";
import { Compare, Hash } from "../../common/utils/security/hash.security.js";
import { GenerateToken, VerifyToken } from "../../common/utils/token.service.js";
import { randomUUID } from "crypto";
import * as db_service from "../../DB/db.service.js";
import userModel from "../../DB/models/user.model.js";
import { ACCESS_SECRET_KEY, AUDIENCE, PREFIX, REFRESH_SECRET_KEY, SALT_ROUNDS } from "../../../config/config.service.js";
import { eventEmitter } from "../../common/utils/email/email.events.js";
import { setValue, get, deleteKey, keys, get_key, revoked_key } from "../../DB/redis/redis.service.js";
import cloudinary from "../../common/utils/cloudinary.js";
import { OAuth2Client } from "google-auth-library";
import fs from "fs";

// --- Helpers ---
const otp_key = ({ email }) => `otp:${email}`;
const generateOtp = async () => Math.floor(100000 + Math.random() * 900000).toString();

// دالة الـ OTP المعدلة (تخزين مزدوج DB + Redis)
const sendEmailOtp = async (email) => {
    const otp = await generateOtp();
    const hashedOtp = Hash({ plain_text: `${otp}`, salt_rounds: SALT_ROUNDS });
    await userModel.findOneAndUpdate({ email }, { 
        otp: hashedOtp, 
        otpExpiration: new Date(Date.now() + 10 * 60 * 1000) 
    });
    await setValue({ key: otp_key({ email }), value: hashedOtp, ttl: 600 }).catch(() => null);
    eventEmitter.emit(emailEnum.confirmEmail, email, otp);
};

// --- 1. SignUp (تعديل الـ Gallery) ---
export const signUp = async (req, res, next) => {
    try {
        const { firstName, lastName, userName, email, password, cPassword, phone } = req.body;
        if (password !== cPassword) throw new Error("Passwords must match 🔴", { cause: 400 });
        if (await db_service.findOne({ model: userModel, filter: { email } })) {
            throw new Error(`Email ${email} already exist ❎`, { cause: 409 });
        }

        const arr_paths = [];
        if (req.files?.attachments) {
            for (const file of req.files.attachments) {
                const { secure_url, public_id } = await cloudinary.uploader.upload(file.path, { folder: "uploads/users" });
                arr_paths.push({ secure_url, public_id });
            }
        }

        const user = await db_service.create({
            model: userModel,
            data: {
                firstName, lastName, email,
                password: Hash({ plain_text: password, salt_rounds: SALT_ROUNDS }),
                phone: encrypt(phone),
                profilePicture: arr_paths[0] || {}, 
                gallery: arr_paths 
            }
        });

        await sendEmailOtp(email);
        return successResponse({ res, status: 201, message: `${userName} signed up successfully ✅`, data: user });
    } catch (error) { return next(error); }
};

// --- 2. Confirm Email (الجديدة اللي كانت ناقصة) ---
export const confirmEmailOtp = async (req, res, next) => {
    try {
        const { email, otp } = req.body;
        const user = await userModel.findOne({ email });
        if (!user) return next(new Error("User not found", { cause: 404 }));
        let savedOtp = await get(otp_key({ email })).catch(() => null);
        if (!savedOtp) savedOtp = user.otp;
        if (!savedOtp || !Compare({ plain_text: otp, cipher_text: savedOtp })) {
            return next(new Error("Invalid or Expired OTP ❌", { cause: 400 }));
        }
        user.confirmed = true;
        user.otp = undefined;
        await user.save();
        return successResponse({ res, message: "Email confirmed successfully ✅" });
    } catch (error) { return next(error); }
};

// --- 3. SignIn (تعديل الـ 2FA والـ Ban) ---
export const signIn = async (req, res) => {
    const { email, password } = req.body;
    const user = await userModel.findOne({ email, provider: "system" });
    if (!user) throw new Error("Invalid email", { cause: 400 });
    if (user.banUntil && user.banUntil > Date.now()) throw new Error(`Banned!`, { cause: 403 });
    if (!Compare({ plain_text: password, cipher_text: user.password })) {
        user.failedAttempts = (user.failedAttempts || 0) + 1;
        if (user.failedAttempts >= 5) user.banUntil = new Date(Date.now() + 5 * 60 * 1000);
        await user.save();
        throw new Error("Invalid password", { cause: 400 });
    }
    const access_token = GenerateToken({ payload: { id: user._id, email: user.email }, secret_key: ACCESS_SECRET_KEY });
    return res.status(200).json({ message: "Logged in ✅", access_token });
};

// --- 4. باقي دوال الكود الـ 300 سطر (Gmail, Profile, Logout, etc.) ---
export const signUpWithGmail = async (req,res) => {
    const {idToken} = req.body;
    const client = new OAuth2Client();
    const ticket = await client.verifyIdToken({ idToken, audience: AUDIENCE });
    const payload = ticket.getPayload();
    const {name , email , email_verified , picture} = payload;
    let user = await db_service.findOne({model:userModel , filter: {email}});
    if(!user){
        user = await db_service.create({
            model:userModel,
            data:{ userName: name, email, confirmed: email_verified, profilePicture: {secure_url: picture}, provider: providerEnum.google }
        });
    }
    const access_token = GenerateToken({ payload: { id: user._id, email: user.email } });
    successResponse({res, message:"Success Login ✅", data: {access_token}});
};

export const getProfile = async (req, res) => {
    const key = `profile::${req.user._id}`;
    const userExist = await get(key).catch(() => null);
    if(userExist) return successResponse({res , data: userExist});
successResponse({res, data: {...req.user._doc}});};

export const updateProfile = async (req,res) => {
    let {firstName,lastName,gender,phone} = req.body;
    if(phone) phone = encrypt(phone);
    const user = await db_service.findOneAndUpdate({ model: userModel, filter: {_id: req.user._id}, update: {firstName,lastName,gender,phone} });
    await deleteKey(`profile::${req.user._id}`).catch(() => null);
    successResponse({res , data: user});
};

export const logout = async (req,res) => {
    const {flag} = req.query;
    if(flag == "all"){
        req.user.changeCredential = new Date();
        await req.user.save();
    } else {
        await setValue({ key: revoked_key({userId: req.user._id , jti: req.decoded.jti}), value: req.decoded.jti, ttl: 3600 }).catch(() => null);
    }
    successResponse({res});
};

// --- 5. Forgot Password (One-time Access Link) ---
export const forgetPassword = async (req, res, next) => {
    try {
        const { email } = req.body;
        
        const user = await userModel.findOne({ email, confirmed: true });
        if (!user) return next(new Error("User not found or not confirmed ❌", { cause: 404 }));

  const resetToken = GenerateToken({
    payload: { email },
    secret_key: ACCESS_SECRET_KEY, // استخدم المتغير ده
    expiresIn: '10m' 
});
        
        console.log("COPY THIS TOKEN ===>", resetToken);

       // بناء اللينك
const resetLink = `${req.protocol}://${req.get('host')}/users/reset-password/${resetToken}`;

// التأكد إننا بنبعت الـ HTML اللي فيه اللينك
const html = `
    <h1>Reset Your Password</h1>
    <p>Please click the link below to reset your password:</p>
    <a href="${resetLink}">${resetLink}</a> 
`;


// ابعت الـ html كمتغير تالت
eventEmitter.emit(emailEnum.confirmEmail, email, resetToken);
        return successResponse({ res, message: "Reset password link sent to your email! 📧" });
    } catch (error) { return next(error); }
};

export const resetPassword = async (req, res, next) => {
    try {
        const { token } = req.params; 
        const { newPassword } = req.body; 

const decoded = VerifyToken({
    token,
    secret_key: ACCESS_SECRET_KEY // استخدم نفس المتغير هنا
});

        if (!decoded?.email) {
            return next(new Error("Invalid or expired reset link ⚠️", { cause: 400 }));
        }

        const hashedPassword = Hash({ plain_text: newPassword, salt_rounds: SALT_ROUNDS });

        const user = await userModel.findOneAndUpdate(
            { email: decoded.email },
            { 
                password: hashedPassword,
                changeCredentialTime: new Date() 
            },
            { new: true }
        );

        if (!user) return next(new Error("User not found", { cause: 404 }));

        return successResponse({ res, message: "Password updated successfully! 🚀" });
    } catch (error) { return next(error); }
};

// دوال الـ 2FA
export const enable2FA = async (req, res) => {
    await sendEmailOtp(req.user.email);
    return res.json({ message: "Check email" });
};
export const confirm2FA = async (req, res) => {
    const { otp } = req.body;
    if (!Compare({ plain_text: otp, cipher_text: req.user.otp })) throw new Error("Invalid OTP");
    await userModel.findByIdAndUpdate(req.user._id, { is2FAEnabled: true, otp: null });
    return res.json({ message: "2FA Enabled ✅" });
};