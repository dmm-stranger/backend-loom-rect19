import nodemailer from "nodemailer";

const createTransporter = () =>
  nodemailer.createTransport({
    service: "gmail",
    auth: { user: process.env.SMTP_EMAIL, pass: process.env.SMTP_PASSWORD },
  });

const sendEmail = async ({ to, subject, html }) => {
  const transporter = createTransporter();
  const info = await transporter.sendMail({
    from: `"${process.env.FROM_NAME || "TechStore"}" <${process.env.FROM_EMAIL || process.env.SMTP_EMAIL}>`,
    to, subject, html,
  });
  if (process.env.NODE_ENV === "development") console.log(`📧 Email sent to ${to}: ${info.messageId}`);
  return info;
};

export const passwordResetTemplate = (name, resetUrl) => ({
  subject: "TechStore — Password Reset Request",
  html: `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
      <div style="background:#1a1a2e;padding:20px;border-radius:8px 8px 0 0;text-align:center;">
        <h1 style="color:#fff;margin:0;">TechStore</h1>
      </div>
      <div style="background:#f9f9f9;padding:30px;border-radius:0 0 8px 8px;">
        <h2 style="color:#333;">Password Reset Request</h2>
        <p style="color:#666;">Hi <strong>${name}</strong>,</p>
        <p style="color:#666;">We received a request to reset your password. Click the button below to reset it.</p>
        <div style="text-align:center;margin:30px 0;">
          <a href="${resetUrl}" style="background:#e94560;color:#fff;padding:14px 32px;text-decoration:none;border-radius:6px;font-size:16px;font-weight:bold;display:inline-block;">Reset Password</a>
        </div>
        <p style="color:#999;font-size:14px;">This link expires in <strong>10 minutes</strong>.</p>
        <p style="color:#999;font-size:14px;">If you didn't request this, you can safely ignore this email.</p>
        <hr style="border:none;border-top:1px solid #eee;margin:20px 0;">
        <p style="color:#bbb;font-size:12px;text-align:center;">TechStore — Your Tech Destination</p>
      </div>
    </div>
  `,
});

export const passwordChangedTemplate = (name) => ({
  subject: "TechStore — Password Changed Successfully",
  html: `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
      <div style="background:#1a1a2e;padding:20px;border-radius:8px 8px 0 0;text-align:center;">
        <h1 style="color:#fff;margin:0;">TechStore</h1>
      </div>
      <div style="background:#f9f9f9;padding:30px;border-radius:0 0 8px 8px;">
        <h2 style="color:#333;">Password Changed</h2>
        <p style="color:#666;">Hi <strong>${name}</strong>,</p>
        <p style="color:#666;">Your password has been changed successfully.</p>
        <p style="color:#666;">If you did not make this change, please contact support immediately.</p>
        <hr style="border:none;border-top:1px solid #eee;margin:20px 0;">
        <p style="color:#bbb;font-size:12px;text-align:center;">TechStore — Your Tech Destination</p>
      </div>
    </div>
  `,
});

export default sendEmail;
