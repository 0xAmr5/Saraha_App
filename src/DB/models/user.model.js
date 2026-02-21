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