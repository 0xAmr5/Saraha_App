export const emailTemplate = (otp) => {
    return `
    <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px; border: 1px solid #ddd;">
        <h2 style="color: #007bff;">Saraha App Verification</h2>
        <p>Hello! Your verification code is:</p>
        <h1 style="background: #f4f4f4; padding: 10px; display: inline-block; letter-spacing: 5px;">${otp}</h1>
        <p>This code is valid for 5 minutes. If you didn't request this, please ignore this email.</p>
        <hr>
        <p style="font-size: 12px; color: #888;">&copy; 2026 Saraha App - Route Academy</p>
    </div>
    `;
};