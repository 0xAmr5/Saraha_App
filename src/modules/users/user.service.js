import { providerEnum } from "../../common/enum/user.enum.js";
import { successResponse } from "../../common/utils/response.success.js";
import { GenerateToken } from "../../common/utils/token.service.js";
import * as db_service from "../../DB/db.service.js";
import userModel from "../../DB/models/user.model.js";
import { Hash, Compare } from "../../common/utils/security/hash.security.js"; 
import { encrypt, decrypt } from "../../common/utils/security/encrypt.security.js";
import { sendEmail } from "../../common/utils/email/send.email.js";
import { v4 as uuidv4 } from "uuid";

export const signUp = async (req, res) => {
    const { userName, email, password, cPassword, gender, phone } = req.body;

    if (password !== cPassword) {
        throw new Error("Confirmed password must match the password 🔴", { cause: 400 });
    }

    if (await db_service.findOne({ model: userModel, filter: { email } })) {
        throw new Error(`Email ${email} already exist 🔴`, { cause: 400 });
    }

    const hashedPassword = Hash({ plain_text: password }); 
    const encryptedPhone = encrypt({ plain_text: phone });

    const user = await db_service.create({
        model: userModel, 
        data: { 
            firstName: userName, 
            email, 
            password: hashedPassword, 
            gender, 
            phone: encryptedPhone 
        } 
    });

    await sendEmail({
        to: email,
        subject: "Welcome to Saraha App 💙",
        html: `<h1>Hi ${userName}</h1><p>Your OTP for verification is: <b>123456</b></p>`
    });

    return successResponse({ 
        res, 
        status: 201, 
        message: "User signed up successfully. Check your email ✅", 
        data: user 
    });
};

export const signIn = async (req, res) => {
    const { email, password } = req.body;

    const user = await db_service.findOne({
        model: userModel, 
        filter: { email, provider: providerEnum.system } 
    });

    if (!user) {
        throw new Error("Invalid email ❌", { cause: 400 });
    }

    const match = Compare({ plain_text: password, cipher_text: user.password });
    if (!match) {
        throw new Error("Invalid password ❌", { cause: 400 });
    }

    const access_token = GenerateToken({
        payload: { id: user._id }, 
        secret_key: "amr", 
        options: { jti: uuidv4() } 
    });

    return successResponse({
        res, 
        status: 200, 
        message: "User signed in successfully ✅", 
        data: { access_token } 
    });
};

export const getProfile = async (req, res) => {
    const decryptedPhone = decrypt({ cipher_text: req.user.phone });

    return successResponse({
        res, 
        data: { ...req.user._doc, phone: decryptedPhone } 
    });
};