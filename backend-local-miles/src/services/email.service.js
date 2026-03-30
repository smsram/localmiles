const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const getEmailTemplate = (title, content) => `
  <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.05); border: 1px solid #eaeaea;">
    <div style="background-color: #171717; padding: 24px; text-align: center;">
      <h1 style="color: #D4AF37; margin: 0; font-size: 24px; letter-spacing: 1px;">LOCAL MILES</h1>
    </div>
    <div style="padding: 32px; color: #333333;">
      <h2 style="margin-top: 0; color: #171717;">${title}</h2>
      ${content}
    </div>
    <div style="background-color: #f9f9f9; padding: 16px; text-align: center; color: #888888; font-size: 12px;">
      &copy; ${new Date().getFullYear()} Local Miles Logistics. All rights reserved.
    </div>
  </div>
`;

exports.sendVerificationEmail = async (email, token) => {
  const link = `${process.env.CLIENT_URL}/verify-email?token=${token}`;
  const content = `
    <p>Welcome! Please verify your email address to activate your account.</p>
    <div style="text-align: center; margin: 32px 0;">
      <a href="${link}" style="background-color: #171717; color: #D4AF37; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Verify Email</a>
    </div>
  `;
  try {
    await transporter.sendMail({ from: '"Local Miles" <no-reply@localmiles.in>', to: email, subject: 'Verify your Local Miles Account', html: getEmailTemplate('Account Verification', content) });
  } catch (error) { console.error("Email failed:", error); }
};

// ==========================================
// SEND PICKUP OTP (WITH QR)
// ==========================================
exports.sendPickupOtpEmail = async (email, otp, packageTitle) => {
  // Using QuickChart API to generate a clean, email-safe QR code containing the OTP
  const qrCodeUrl = `https://quickchart.io/qr?text=${otp}&size=200&margin=2`;

  const content = `
    <p>Your courier has arrived to pick up <strong>"${packageTitle}"</strong>.</p>
    <p>Please provide the following secure OTP to the courier, or let them scan the QR code to confirm the handover:</p>
    
    <div style="text-align: center; margin: 32px 0;">
      <span style="font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #171717; background: #f4f4f5; padding: 16px 24px; border-radius: 12px; border: 2px dashed #D4AF37; display: inline-block; margin-bottom: 24px;">${otp}</span>
      
      <div style="margin-top: 16px;">
        <p style="font-size: 13px; color: #888; margin-bottom: 8px; text-transform: uppercase; font-weight: bold;">OR SCAN QR CODE</p>
        <img src="${qrCodeUrl}" alt="OTP QR Code" style="width: 180px; height: 180px; border-radius: 12px; border: 1px solid #eaeaea; padding: 8px; background: white;" />
      </div>
    </div>
    
    <p style="font-size: 14px; color: #666; text-align: center;">Do not share this code until the courier is physically present with you.</p>
  `;
  try {
    await transporter.sendMail({ from: '"Local Miles" <no-reply@localmiles.in>', to: email, subject: `Pickup OTP for ${packageTitle}`, html: getEmailTemplate('Secure Pickup Verification', content) });
  } catch (error) { console.error("Email failed:", error); }
};

// ==========================================
// SEND DELIVERY OTP & TRACKING LINK (WITH QR)
// ==========================================
exports.sendDeliveryOtpAndTracking = async (email, otp, packageTitle, publicId) => {
  const trackingLink = `${process.env.CLIENT_URL}/track/${publicId}`;
  const qrCodeUrl = `https://quickchart.io/qr?text=${otp}&size=200&margin=2`;

  const content = `
    <p>Great news! Your package <strong>"${packageTitle}"</strong> is on its way.</p>
    
    <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 16px; border-radius: 8px; margin: 24px 0;">
      <h3 style="margin: 0 0 8px 0; color: #166534; font-size: 16px;">Live Tracking Active</h3>
      <p style="margin: 0; font-size: 14px; color: #15803d;">You can track the courier's live location here:</p>
      <a href="${trackingLink}" style="color: #16a34a; font-weight: bold; display: inline-block; margin-top: 8px;">View Live Map &rarr;</a>
    </div>

    <p>When the courier arrives, provide this Delivery OTP, or let them scan the QR code to receive your package:</p>
    
    <div style="text-align: center; margin: 32px 0;">
      <span style="font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #171717; background: #f4f4f5; padding: 16px 24px; border-radius: 12px; border: 2px dashed #D4AF37; display: inline-block; margin-bottom: 24px;">${otp}</span>
      
      <div style="margin-top: 16px;">
        <p style="font-size: 13px; color: #888; margin-bottom: 8px; text-transform: uppercase; font-weight: bold;">OR SCAN QR CODE</p>
        <img src="${qrCodeUrl}" alt="Delivery OTP QR Code" style="width: 180px; height: 180px; border-radius: 12px; border: 1px solid #eaeaea; padding: 8px; background: white;" />
      </div>
    </div>
  `;
  try {
    await transporter.sendMail({ from: '"Local Miles" <no-reply@localmiles.in>', to: email, subject: `Package Out for Delivery - OTP Inside`, html: getEmailTemplate('Delivery in Progress', content) });
  } catch (error) { console.error("Email failed:", error); }
};