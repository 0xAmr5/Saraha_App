// التعديل هنا: شيلنا الأقواس من حول userModel لأنه export default
import userModel from "../../DB/models/user.model.js";
import { sendEmail } from "../../common/utils/email/send.email.js";
import { Hash, Compare } from "../../common/utils/security/hash.security.js";
import { encrypt } from "../../common/utils/security/encrypt.security.js";
import { GenerateToken } from "../../common/utils/token.service.js";

// 1. SignUp Logic
export const signUp = async (req, res, next) => {
    const { firstName, lastName, email, password, gender, phone } = req.body;

    const userExist = await userModel.findOne({ email });
    if (userExist) {
        throw new Error(`Email ${email} already exist 🔴`);
    }

    const hashedPassword = Hash({ plain_text: password });
    const encryptedPhone = encrypt({ plainText: phone });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiration = new Date(Date.now() + 5 * 60 * 1000); 

    const newUser = await userModel.create({
        firstName,
        lastName,
        email,
        password: hashedPassword,
        gender,
        phone: encryptedPhone,
        otp,
        otpExpiration,
        confirmed: false // تأكدنا إن الحالة الافتراضية غير مفعل
    });

    await sendEmail({
        to: email,
        subject: "Verify your account - Saraha App 💙",
        html: `<h1>Your OTP is: ${otp}</h1>`
    });

    return res.status(201).json({ 
        message: "User signed up successfully. Check your email for OTP ✅", 
        data: { id: newUser._id, email: newUser.email } 
    });
};

// 2. Confirm Email Logic
export const confirmEmail = async (req, res, next) => {
    const { email, otp } = req.body;
    const user = await userModel.findOne({ email });
    
    if (!user) throw new Error("User not found 🔴");
    if (user.otp !== otp) throw new Error("Invalid OTP 🔴");
    if (new Date() > user.otpExpiration) throw new Error("OTP has expired 🔴");

    await userModel.updateOne(
        { email },
        { confirmed: true, $unset: { otp: 1, otpExpiration: 1 } }
    );

    return res.status(200).json({ message: "Email confirmed successfully ✅" });
};

// 3. SignIn Logic
export const signIn = async (req, res, next) => {
    const { email, password } = req.body;
    const user = await userModel.findOne({ email });
    
    if (!user || !user.confirmed) {
        throw new Error("Invalid email or email not confirmed 🔴");
    }

    const isPasswordMatch = Compare({ plain_text: password, cipher_text: user.password });
    if (!isPasswordMatch) {
        throw new Error("Invalid password 🔴");
    }

    const token = GenerateToken({ payload: { id: user._id, email: user.email }, signature: "Amr" });
    return res.status(200).json({ message: "Signed in successfully ✅", token });
};