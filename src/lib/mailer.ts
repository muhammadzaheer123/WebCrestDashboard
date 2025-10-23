import nodemailer from "nodemailer";

export async function sendResetEmail(to: string, link: string) {
  const user = process.env.MAIL_USER;
  const pass = process.env.MAIL_PASS;

  if (!user || !pass) {
    throw new Error("MAIL_USER or MAIL_PASS missing in .env.local");
  }

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true, // SSL
    auth: {
      user: process.env.MAIL_USER!, // webcrestllc@gmail.com
      pass: process.env.MAIL_PASS!, // 16-char App Password
    },
    tls: { minVersion: "TLSv1.2" },
  });

  try {
    await transporter.verify();
    console.log("SMTP verify: OK for", user);
  } catch (e) {
    console.error("SMTP verify failed:", e);
    return { success: false, error: String(e) };
  }

  const html = `
    <div style="font-family: Inter, Arial, sans-serif; line-height:1.6;">
      <h2>Password Reset</h2>
      <p>Click the button below to reset your password (valid 1 hour):</p>
      <a href="${link}" style="background:#007bff;color:#fff;padding:10px 20px;text-decoration:none;border-radius:6px;text-decoration:none;">
        Reset Password
      </a>
      <p>If you didn’t request this, please ignore this email.</p>
      <p>— WebCrest</p>
    </div>
  `;

  try {
    const info = await transporter.sendMail({
      from: `"WebCrest" <${user}>`,
      to,
      subject: "Reset your password",
      html,
    });

    console.log("✅ Email sent:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (err: any) {
    console.error("❌ Email send error:", err?.response || err?.message || err);
    return {
      success: false,
      error: err?.response || err?.message || String(err),
    };
  }
}
