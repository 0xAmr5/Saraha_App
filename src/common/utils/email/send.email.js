import nodemailer from "nodemailer";

export const sendEmail = async ({ to, subject, html, attachments = [] } = {}) => {
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: "amrothman12345@gmail.com", 
            pass: "amro123456789",   
        },
    });

    const info = await transporter.sendMail({
        from: `"Saraha App 💙" <amrothman12345@gmail.com>`,
        to,
        subject,
        html,
        attachments,
    });

    return info.accepted.length > 0; 
};