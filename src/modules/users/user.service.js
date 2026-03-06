import userModel from "../../DB/models/user.model.js";
import { sendEmail } from "../../common/utils/email/send.email.js";
import { Hash, Compare } from "../../common/utils/security/hash.security.js";
import { encrypt } from "../../common/utils/security/encrypt.security.js";
import { GenerateToken } from "../../common/utils/token.service.js";
import joi from "joi";
import fs from "fs"; 

// 1. SignUp Logic
export const signUp = async (req, res, next) => {
    const uploadedFiles = [];
    if (req.files?.attachments) {
        req.files.attachments.forEach(file => uploadedFiles.push(file.path));
    }

    try {
        // --- 1. Joi Validation ---
        const signUpSchema = joi.object({
            firstName: joi.string().required(),
            lastName: joi.string().required(),
            email: joi.string().email().required(),
            password: joi.string().required(),
            cPassword: joi.string().valid(joi.ref('password')).required().messages({
                'any.only': 'Confirmed password must match password 🔴'
            }),
            gender: joi.string().required(),
            phone: joi.string().required()
        }).unknown(true); 

        const result = signUpSchema.validate(req.body, { abortEarly: false });
        
        if (result.error) {
            const error = new Error("Validation error");
            error.details = result.error.details;
            error.cause = 400;
            throw error;
        }
        
        const { firstName, lastName, email, password, gender, phone } = result.value;

        // --- 2. Check Existence ---
        const userExist = await userModel.findOne({ email });
        if (userExist) {
            const error = new Error(`Email ${email} already exist 🔴`);
            error.cause = 409;
            throw error;
        }

        // --- 3. Security & OTP ---
        const hashedPassword = Hash({ plain_text: password });
        const encryptedPhone = encrypt({ plainText: phone });
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiration = new Date(Date.now() + 5 * 60 * 1000); 

        // --- 4. Create User ---
        const newUser = await userModel.create({
            firstName,
            lastName,
            email,
            password: hashedPassword,
            gender,
            phone: encryptedPhone,
            otp,
            otpExpiration,
            confirmed: false,
            profilePicture: uploadedFiles[0] || null, 
            coverPicture: uploadedFiles 
        });

        // --- 5. Send Email ---
        await sendEmail({
            to: email,
            subject: "Verify your account - Saraha App 💙",
            html: `<h1>Your OTP is: ${otp}</h1>`
        });

        return res.status(201).json({ 
            message: "User signed up successfully. Check your email for OTP ✅", 
            data: { id: newUser._id, email: newUser.email } 
        });

    } catch (error) {
        if (uploadedFiles.length > 0) {
            uploadedFiles.forEach(path => {
                if (fs.existsSync(path)) fs.unlinkSync(path);
            });
        }

        return res.status(error.cause || 500).json({ 
            message: error.message, 
            errors: error.details || [] 
        });
    }
};

// 2. Confirm Email
export const confirmEmail = async (req, res, next) => {
    const { email, otp } = req.body;
    const user = await userModel.findOne({ email });
    
    if (!user) return res.status(404).json({ message: "User not found 🔴" });
    if (user.otp !== otp) return res.status(400).json({ message: "Invalid OTP 🔴" });
    if (new Date() > user.otpExpiration) return res.status(400).json({ message: "OTP has expired 🔴" });

    await userModel.updateOne(
        { email },
        { confirmed: true, $unset: { otp: 1, otpExpiration: 1 } }
    );

    return res.status(200).json({ message: "Email confirmed successfully ✅" });
};

// 3. SignIn
export const signIn = async (req, res, next) => {
    const { email, password } = req.body;
    const user = await userModel.findOne({ email });
    
    if (!user || !user.confirmed) {
        return res.status(401).json({ message: "Invalid email or email not confirmed 🔴" });
    }

    const isPasswordMatch = Compare({ plain_text: password, cipher_text: user.password });
    if (!isPasswordMatch) {
        return res.status(401).json({ message: "Invalid password 🔴" });
    }

    const token = GenerateToken({ payload: { id: user._id, email: user.email }, signature: "Amr" });
    return res.status(200).json({ message: "Signed in successfully ✅", token });
};

// 4. Get Profile
export const getProfile = async (req, res, next) => {
    try {
        const user = await userModel.findById(req.user.id);
        return res.status(200).json({ message: "Done ✅", user });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};