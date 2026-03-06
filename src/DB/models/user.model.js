import mongoose from "mongoose";
import { genderEnum, providerEnum } from "../../common/enum/user.enum.js";

const userSchema = new mongoose.Schema({
    firstName: { type: String, required: true, minLength: 2, trim: true },
    lastName: { type: String, required: true, minLength: 2, trim: true },
    email: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true, trim: true },
    gender: { type: String, enum: Object.values(genderEnum), default: genderEnum.male },
    provider: { type: String, enum: Object.values(providerEnum), default: providerEnum.system },
    phone: { type: String, required: true },
    profilePicture: String,
    confirmed: Boolean,
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

userSchema.virtual("userName").get(function() {
    return `${this.firstName} ${this.lastName}`;
});

userSchema.add({
    otp: { type: String },
    otpExpiration: { type: Date }
});

const userModel = mongoose.models.user || mongoose.model("user", userSchema);
export default userModel;


import { OAuth2Client } from 'google-auth-library';
const client = new OAuth2Client();

export const loginWithGmail = async (req, res, next) => {
    const { idToken } = req.body;
    
    try {
        const ticket = await client.verifyIdToken({
            idToken,
            audience: process.env.GOOGLE_CLIENT_ID, 
        });
        const { email, given_name, family_name } = ticket.getPayload();

        let user = await userModel.findOne({ email });
        
        if (!user) {
            user = await userModel.create({
                firstName: given_name,
                lastName: family_name,
                email,
                password: Hash({ plain_text: "OAuth_Default_Password" }), 
                confirmed: true, 
                provider: "google"
            });
        }

        const token = GenerateToken({ 
            payload: { id: user._id, email: user.email }, 
            signature: "Amr" 
        });
        
        return res.status(200).json({ message: "Success ✅", token });
    } catch (error) {
        return res.status(400).json({ message: "Invalid Google Token 🔴", error: error.message });
    }
};