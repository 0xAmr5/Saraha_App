import nodemailer from "nodemailer";

export const sendEmail = async ({ to, subject, html, attachments = [] } = {}) => {
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: "amrothman154@gmail.com", 
            pass: "aohcvqdkstlnqrcc",   
        },
    });

    const info = await transporter.sendMail({
        from: `"Saraha App 💙" <amrothman154@gmail.com>`,
        to,
        subject,
        html,
        attachments,
    });

    return info.accepted.length > 0; 
};