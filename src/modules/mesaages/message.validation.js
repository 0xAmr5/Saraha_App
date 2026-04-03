import joi from "joi";
import { generalRules } from "../../common/utils/generalRules.js";

export const sendMessageSchema = {
    body: joi.object({
        content: joi.string().min(1).required(),
        userId: generalRules.id.required(),
    }).required(),

    files: joi.array().items(generalRules.file).max(5)
}

export const getMessageSchema = {
    params: joi.object({
        messageId: generalRules.id.required()
    }).required()
}