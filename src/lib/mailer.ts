// /lib/mailer.ts
import nodemailer from "nodemailer";

export async function sendResetEmail(to: string, link: string) {
  if (!process.env.MAIL_USER || !process.env.MAIL_PASS) {
    throw new Error("MAIL_USER or MAIL_PASS not set in .env.local");
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });

  const html = `
    <div style="font-family: Inter, Arial, sans-serif; line-height:1.6;">
      <h2>Password Reset</h2>
      <p>Click the button below to reset your password:</p>
      <a href="${link}"
         style="background:#007bff;color:#fff;padding:10px 20px;text-decoration:none;border-radius:5px;">
         Reset Password
      </a>
      <p>This link expires in 1 hour.</p>
      <br/>
      <p>If you didn’t request this, please ignore this email.</p>
      <br/>
      <p>– WebCrest Team</p>
    </div>
  `;

  try {
    const info = await transporter.sendMail({
      from: `"WebCrest" <${process.env.MAIL_USER}>`,
      to,
      subject: "Reset your password",
      html,
    });

    console.log("✅ Email sent:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error("❌ Email send error:", error);
    return { success: false, error: error.message };
  }
}
