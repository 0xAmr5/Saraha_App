import mongoose, { Schema, model } from "mongoose";
import { genderEnum, providerEnum } from "../../common/enum/user.enum.js";

const userSchema = new Schema({
    firstName: { type: String, required: true, minLength: 2, trim: true },
    lastName: { type: String, required: true, minLength: 2, trim: true },
    email: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true, trim: true },
    gender: { 
        type: String, 
        enum: Object.values(genderEnum), 
        default: genderEnum.male 
    },
    provider: { 
        type: String, 
        enum: Object.values(providerEnum), 
        default: providerEnum.system 
    },
    phone: { type: String, required: true },
    profilePicture: {
        secure_url: String,
        public_id: String
    },
    coverPictures: [{ secure_url: String, public_id: String }], 
    
    gallery: [{
        secure_url: String,
        public_id: String
    }], 

    confirmed: { type: Boolean, default: false },
    
    // --- حقول أسايمنت 13 (Security & 2FA) ---
    failedAttempts: { type: Number, default: 0 }, 
    banUntil: { type: Date }, 
    is2FAEnabled: { type: Boolean, default: false }, 
    
    // --- حقول الـ Visits (أسايمنت 12) ---
    visitCount: { type: Number, default: 0 },
    
    // --- حقول الـ OTP ---
    otp: { type: String },
    otpExpiration: { type: Date },
    changeCredentialTime: { type: Date }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// --- حقول الـ Forgot Password (أسايمنت 14) ---
    changeCredentialTime: { type: Date };

// Virtual للـ userName
userSchema.virtual("userName").get(function() {
    return `${this.firstName} ${this.lastName}`;
});

userSchema.index({ createdAt: 1 }, { 
    expireAfterSeconds: 86400, 
    partialFilterExpression: { confirmed: false } 
});

const userModel = mongoose.models.user || model("user", userSchema);

export default userModel;