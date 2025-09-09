const nodemailer = require('nodemailer');

async function getTransport() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
  }

  // Development fallback: Ethereal test account
  if (process.env.NODE_ENV !== 'production') {
    const testAccount = await nodemailer.createTestAccount();
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: { user: testAccount.user, pass: testAccount.pass },
    });
  }

  throw new Error('SMTP configuration missing');
}

async function sendOtpEmail({ to, otp }) {
  const transporter = await getTransport();
  const appName = process.env.APP_NAME || 'Job Portal';
  const from = process.env.SMTP_FROM || `no-reply@${(process.env.CLIENT_URL || 'localhost').replace(/^https?:\/\//, '')}`;
  const subject = `${appName} - Your verification code`;
  const html = `
    <div style="font-family:Arial,sans-serif;padding:16px;background:#0b0f17;color:#eee;">
      <h2 style="margin-top:0;color:#fff;">Verify your email</h2>
      <p>Your one-time password (OTP) is:</p>
      <p style="font-size:28px;font-weight:bold;letter-spacing:6px;background:#111;padding:12px 16px;border-radius:8px;display:inline-block;">${otp}</p>
      <p>This code expires in 10 minutes.</p>
      <p style="color:#9aa4b2">If you did not request this, you can ignore this email.</p>
    </div>
  `;

  const info = await transporter.sendMail({ from, to, subject, html });
  if (process.env.NODE_ENV !== 'production' && nodemailer.getTestMessageUrl) {
    // eslint-disable-next-line no-console
    console.log('OTP email preview URL:', nodemailer.getTestMessageUrl(info));
  }
}

async function sendResetPasswordEmail({ to, resetUrl }) {
  const transporter = await getTransport();
  const appName = process.env.APP_NAME || 'Job Portal';
  const from = process.env.SMTP_FROM || `no-reply@${(process.env.CLIENT_URL || 'localhost').replace(/^https?:\/\//, '')}`;
  const subject = `${appName} - Reset your password`;
  const html = `
    <div style="font-family:Arial,sans-serif;padding:16px;background:#0b0f17;color:#eee;">
      <h2 style="margin-top:0;color:#fff;">Reset your password</h2>
      <p>Click the button below to reset your password. This link expires in 30 minutes.</p>
      <p><a href="${resetUrl}" style="display:inline-block;background:#5b8def;color:#fff;padding:10px 14px;border-radius:8px;text-decoration:none;">Reset Password</a></p>
      <p style="color:#9aa4b2">If you did not request this, you can ignore this email.</p>
    </div>
  `;
  const info = await transporter.sendMail({ from, to, subject, html });
  if (process.env.NODE_ENV !== 'production' && nodemailer.getTestMessageUrl) {
    // eslint-disable-next-line no-console
    console.log('Reset email preview URL:', nodemailer.getTestMessageUrl(info));
  }
}

module.exports = { sendOtpEmail, sendResetPasswordEmail };


