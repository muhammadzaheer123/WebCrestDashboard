import nodemailer from "nodemailer";

export async function sendResetEmail(to: string, otp: string) {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: `"WebCrest" <${process.env.MAIL_USER}>`,
    to,
    subject: "Password Reset OTP",
    html: `
      <h2>Password Reset</h2>
      <p>Your OTP is:</p>
      <h1>${otp}</h1>
      <p>This code expires in 10 minutes.</p>
    `,
  });
}
//   <div style="font-family: Inter, Arial, sans-serif; line-height:1.6;">
//     <h2>Password Reset</h2>
//     <p>Click the button below to reset your password (valid 1 hour):</p>
//     <a href="${link}" style="background:#007bff;color:#fff;padding:10px 20px;text-decoration:none;border-radius:6px;text-decoration:none;">
//       Reset Password
//     </a>
//     <p>If you didn’t request this, please ignore this email.</p>
//     <p>— WebCrest</p>
//   </div>
// `;
