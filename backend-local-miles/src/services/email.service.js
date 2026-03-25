const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

exports.sendVerificationEmail = async (email, token) => {
  // Uses CLIENT_URL from .env
  const link = `${process.env.CLIENT_URL}/verify-email?token=${token}`;

  try {
    await transporter.sendMail({
      from: '"Local Miles Security" <no-reply@localmiles.in>',
      to: email,
      subject: 'Verify your Local Miles Account',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #333;">Welcome to Local Miles!</h2>
          <p>Please click the button below to verify your email address and activate your account.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${link}" style="background-color: #000; color: #fff; padding: 14px 28px; text-decoration: none; border-radius: 5px; font-weight: bold;">Verify Email Address</a>
          </div>
          
          <p style="color: #666; font-size: 14px;">If the button doesn't work, copy and paste this link:</p>
          <p style="color: #666; font-size: 12px;">${link}</p>
        </div>
      `,
    });
    console.log(`📧 Verification email sent to ${email}`);
  } catch (error) {
    console.error("❌ Email sending failed:", error);
  }
};