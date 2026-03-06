import joi from "joi";

export const signUpSchema = joi.object({
    firstName: joi.string().min(2).max(20).required(),
    lastName: joi.string().min(2).max(20).required(),
    email: joi.string().email().required(),
    password: joi.string().required(),
    cPassword: joi.string().valid(joi.ref('password')).required(),
    gender: joi.string().valid('male', 'female').required(),
    phone: joi.string().required(),
    attachments: joi.any() 
}).unknown(true);

export const signInSchema = joi.object({
    email: joi.string().email().required(),
    password: joi.string().required()
}).required();

export const confirmEmailSchema = joi.object({
    email: joi.string().email().required(),
    otp: joi.string().length(6).required()
}).required();