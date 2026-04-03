import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config({ quiet: true });

export const sendEmail = async (
  { to, subject = "", html = "", attachments = [] } = {}
) => {
const transporter = nodemailer.createTransport({
    service: 'gmail', // تأكد إنها gmail مش Gmail
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

  const info = await transporter.sendMail({
    from: `"Amr${process.env.EMAIL}>`,
    to,
    subject,
    html,
    attachments,
  });

  console.log("Message sent:", info.messageId);
  return info.accepted.length ? true : false;
};

export const generateOtp = async () => {
  return Math.floor(Math.random() * 900000 + 100000);
};