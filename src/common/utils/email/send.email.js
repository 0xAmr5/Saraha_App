import nodemailer from "nodemailer";
import { EMAIL, PASSWORD } from "../../../config/config.js";

export const sendEmail = async ({ to, subject = "", html = "", attachments = [] } = {}) => {
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: EMAIL,
            pass: PASSWORD,
        },
    });

    const info = await transporter.sendMail({
        from: `"3bny" <${EMAIL}>`,
        to,
        subject,
        html,
        attachments,
    });

    console.log("Message sent:", info.messageId);
    return info.accepted.length ? true : false;
};