// 1. استيراد الـ Template والـ sendEmail ✅
import { sendEmail } from "./send.email.js";
import { emailTemplate } from "./email.template.js"; // السطر ده اللي ناقصك
import { emailEnum } from "../../enum/user.enum.js";
import { EventEmitter } from "node:events";

export const eventEmitter = new EventEmitter();

// 2. الـ Listener اللي بينفذ المهمة
eventEmitter.on(emailEnum.confirmEmail, async (email, otp) => {
    await sendEmail({
        to: email,
        subject: "Confirm Your Email - Saraha App",
        html: emailTemplate(otp) // دلوقتي هيشوفها ويشتغل ✅
    });
});