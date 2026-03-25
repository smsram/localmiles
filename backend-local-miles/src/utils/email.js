const nodemailer = require('nodemailer');

// 1. Setup Transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// 2. Direct Image Link (PNG)
const LOGO_PNG = "https://drive.google.com/uc?export=view&id=1ixDihzpAYahGYvUxEXC_RdXsiI4C8VxN";

// ==========================================
// 1. SEND VERIFICATION EMAIL
// ==========================================
exports.sendVerificationEmail = async (to, token) => {
  const link = `${process.env.CLIENT_URL}/verify-email?token=${token}`;

  const mailOptions = {
    from: `"Local Miles" <${process.env.EMAIL_USER}>`,
    to: to,
    subject: 'Confirm your email address',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          /* Base Resets */
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f9fafb; margin: 0; padding: 0; width: 100%; }
          
          /* Layout Wrappers */
          .wrapper { width: 100%; background-color: #f9fafb; padding: 50px 0; }
          .container { max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; }
          
          /* Content Area */
          .content { padding: 48px; text-align: left; }
          
          /* Typography */
          h1 { color: #111827; font-size: 24px; font-weight: 800; margin: 0 0 24px 0; line-height: 1.2; }
          p { color: #4B5563; font-size: 16px; line-height: 1.6; margin: 0 0 32px 0; }
          
          /* Button */
          .btn { 
            background-color: #D4AF37; 
            color: #ffffff !important; 
            padding: 14px 32px; 
            text-decoration: none; 
            border-radius: 6px; 
            font-weight: 600; 
            display: inline-block; 
            font-size: 16px; 
          }
          .btn:hover { background-color: #b8962e; }

          /* Links */
          .link-box { margin-top: 32px; padding-top: 32px; border-top: 1px solid #f3f4f6; }
          .link-text { font-size: 14px; color: #6B7280; margin-bottom: 8px; }
          .raw-link { color: #D4AF37; text-decoration: none; word-break: break-all; font-size: 14px; }
          
          /* Footer - Centered */
          .footer { padding: 32px; text-align: center; background-color: #f9fafb; }
          .footer-logo { height: 24px; width: auto; display: block; margin: 0 auto 16px auto; opacity: 0.8; }
          .copyright { font-size: 12px; color: #9CA3AF; }
        </style>
      </head>
      <body>
        <div class="wrapper">
          <div class="container">
            <div class="content">
              <h1>Confirm your email</h1>
              <p>Welcome to Local Miles. To finish setting up your account, please verify your email address by clicking the button below.</p>
              
              <a href="${link}" class="btn">Verify Email Address</a>

              <div class="link-box">
                <div class="link-text">Or paste this link in your browser:</div>
                <a href="${link}" class="raw-link">${link}</a>
              </div>
            </div>
            
            <div class="footer">
              <img src="${LOGO_PNG}" alt="Local Miles" class="footer-logo" />
              <div class="copyright">
                &copy; ${new Date().getFullYear()} Local Miles. All rights reserved.
              </div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  await transporter.sendMail(mailOptions);
};

// ==========================================
// 2. SEND RESET PASSWORD EMAIL
// ==========================================
exports.sendPasswordResetEmail = async (to, token) => {
  const link = `${process.env.CLIENT_URL}/reset-password?token=${token}`;

  const mailOptions = {
    from: `"Local Miles Security" <${process.env.EMAIL_USER}>`,
    to: to,
    subject: 'Reset your password',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          /* Base Resets */
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f9fafb; margin: 0; padding: 0; width: 100%; }
          
          /* Layout Wrappers */
          .wrapper { width: 100%; background-color: #f9fafb; padding: 50px 0; }
          .container { max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; }
          
          /* Content Area */
          .content { padding: 48px; text-align: left; }
          
          /* Typography */
          h1 { color: #111827; font-size: 22px; font-weight: 800; margin: 0 0 24px 0; }
          p { color: #4B5563; font-size: 16px; line-height: 1.6; margin: 0 0 32px 0; }
          
          /* Black Button */
          .btn-black { 
            background-color: #111111; 
            color: #ffffff !important; 
            padding: 14px 32px; 
            text-decoration: none; 
            border-radius: 6px; 
            font-weight: 600; 
            display: inline-block; 
            font-size: 15px; 
          }
          .btn-black:hover { background-color: #000000; }

          /* Warning Box */
          .warning-box {
            margin-top: 32px;
            padding: 16px;
            background-color: #FEF2F2;
            color: #991B1B;
            font-size: 14px;
            border-radius: 6px;
            border: 1px solid #FEE2E2;
          }

          /* Footer - Centered */
          .footer { padding: 32px; text-align: center; background-color: #f9fafb; }
          .footer-logo { height: 24px; width: auto; display: block; margin: 0 auto 16px auto; opacity: 0.8; }
          .copyright { font-size: 12px; color: #9CA3AF; }
        </style>
      </head>
      <body>
        <div class="wrapper">
          <div class="container">
            <div class="content">
              <h1>Reset your password</h1>
              <p>We received a request to reset the password for your Local Miles account. Click the button below to choose a new password.</p>
              
              <a href="${link}" class="btn-black">Set New Password</a>

              <div class="warning-box">
                This link expires in 60 minutes. If you didn't request this change, you can safely ignore this email.
              </div>
            </div>

            <div class="footer">
              <img src="${LOGO_PNG}" alt="Local Miles" class="footer-logo" />
              <div class="copyright">
                &copy; ${new Date().getFullYear()} Local Miles. All rights reserved.
              </div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Email error:", error);
  }
};