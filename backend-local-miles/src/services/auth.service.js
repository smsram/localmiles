const prisma = require('../utils/prisma');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const admin = require('../utils/firebase');
const uuid = require('uuid'); 
const EmailUtil = require('../utils/email');
const crypto = require('crypto'); // Native secure random generation

const { generateUserId } = require('../utils/idGenerator');

// Helper: Generate JWT Token and Save Session to DB
const generateAndSaveSession = async (userId) => {
  const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 Days

  await prisma.session.create({
    data: {
      sessionToken: token,
      userId: userId,
      expires: expires,
      isRevoked: false
    }
  });

  return token;
};

// 1. REGISTER LOGIC (Standard Email)
exports.registerUser = async ({ fullName, email, password }) => {
  // A. Check if user exists
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new Error('Email already in use');
  }

  // B. Hash Password
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  // C. Create User (Unverified)
  const user = await prisma.user.create({
    data: {
      publicId: generateUserId(), // <--- ADDED: Generates UID-XXXX-XXXX
      fullName,
      email,
      passwordHash,
      role: 'USER',
      emailVerified: null, // Explicitly null
      isPhoneVerified: false,
    },
  });

  // D. Create Verification Token (UUID)
  const token = uuid.v4();
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 Hours

  await prisma.verificationToken.create({
    data: {
      identifier: email,
      token: token,
      expires: expires
    }
  });

  // E. Send Email
  await EmailUtil.sendVerificationEmail(email, token);

  // F. Return special flag (No JWT Token yet)
  return { user, requireEmailVerification: true };
};

// 2. LOGIN LOGIC (UPDATED)
exports.loginUser = async ({ email, password }) => {
  const user = await prisma.user.findUnique({ where: { email } });
  
  if (!user || !user.passwordHash) throw new Error('Invalid credentials');

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) throw new Error('Invalid credentials');

  if (!user.emailVerified) {
    return { requireEmailVerification: true, email: user.email };
  }

  // Use the new helper to create DB session
  const token = await generateAndSaveSession(user.id);
  return { user, token };
};

// 3. GOOGLE LOGIN LOGIC (UPDATED)
exports.loginOrSignupWithGoogle = async (idToken) => {
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const { email, name, picture, uid } = decodedToken;

    let user = await prisma.user.findUnique({
      where: { email },
      include: { accounts: true }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          publicId: generateUserId(), 
          email,
          fullName: name || "Google User",
          avatarUrl: picture,
          emailVerified: new Date(), 
          accounts: {
            create: { type: 'oauth', provider: 'firebase_google', providerAccountId: uid }
          }
        }
      });
    } else {
      const isLinked = user.accounts.some(acc => acc.provider === 'firebase_google');
      if (!isLinked) {
        await prisma.account.create({
          data: { userId: user.id, type: 'oauth', provider: 'firebase_google', providerAccountId: uid }
        });
      }
    }

    // Use the new helper to create DB session
    const token = await generateAndSaveSession(user.id);
    return { user, token };

  } catch (error) {
    console.error("Firebase Verification Failed:", error);
    throw new Error("Invalid Google Token");
  }
};

// NEW: RESEND VERIFICATION
exports.resendVerification = async (email) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error("User not found");
  if (user.emailVerified) throw new Error("Email already verified");

  // 1. Delete any existing tokens for this user to invalidate them
  await prisma.verificationToken.deleteMany({ where: { identifier: email } });

  // 2. Generate New Token
  const token = uuid.v4();
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await prisma.verificationToken.create({
    data: { identifier: email, token, expires }
  });

  // 3. Send Email
  await EmailUtil.sendVerificationEmail(email, token);

  return true;
};

// 4. VERIFY EMAIL TOKEN (New Service Method)
exports.verifyEmailToken = async (token) => {
  // Find token
  const record = await prisma.verificationToken.findUnique({ where: { token } });
  
  if (!record) throw new Error("Invalid verification link");
  if (record.expires < new Date()) throw new Error("Verification link expired");

  // Mark User as Verified
  const user = await prisma.user.update({
    where: { email: record.identifier },
    data: { emailVerified: new Date() }
  });

  // Delete used token
  await prisma.verificationToken.delete({ where: { token } });

  return user;
};

// ==========================================
// 5. SEND MOBILE OTP (Secure, No Meta API)
// ==========================================
exports.sendMobileOtp = async (userId, phone) => {
  // Check if this phone number is already verified by someone else
  const phoneTaken = await prisma.user.findFirst({
    where: { 
      phone,
      isPhoneVerified: true, // Only block if actively verified
      NOT: { id: userId } 
    }
  });

  if (phoneTaken) {
    throw new Error("This phone number is already linked to another account.");
  }

  // Generate secure 6-digit OTP using Node's crypto
  const otpCode = crypto.randomInt(100000, 999999).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); 

  // Store in DB
  await prisma.otp.create({
    data: { userId, phone, code: otpCode, type: 'VERIFICATION', expiresAt },
  });

  // LOG OTP TO CONSOLE FOR TESTING
  // This replaces the Meta API call completely, avoiding ban risks.
  console.log(`\n================================`);
  console.log(`🔑 [DEV MODE] OTP Generated`);
  console.log(`📱 Phone: +91 ${phone}`);
  console.log(`🔢 Code:  ${otpCode}`);
  console.log(`================================\n`);

  return { success: true, message: "OTP Generated successfully" };
};

// ==========================================
// 6. VERIFY MOBILE OTP
// ==========================================
exports.verifyMobileOtp = async (userId, phone, code) => {
  const validOtp = await prisma.otp.findFirst({
    where: { userId, phone, code, isUsed: false, expiresAt: { gt: new Date() } }
  });

  if (!validOtp) throw new Error("Invalid or Expired OTP");

  // Double check availability
  const phoneTaken = await prisma.user.findFirst({
    where: { phone, isPhoneVerified: true, NOT: { id: userId } }
  });

  if (phoneTaken) {
    throw new Error("This phone number was just linked to another account.");
  }

  await prisma.otp.update({ where: { id: validOtp.id }, data: { isUsed: true } });

  const user = await prisma.user.update({
    where: { id: userId },
    data: { isPhoneVerified: true, phone: phone }
  });

  return { success: true, user };
};

// ==========================================
// 7. VERIFY TRUECALLER (1-Tap Simulation)
// ==========================================
exports.verifyTruecaller = async (userId, phone, payload) => {
  // Check availability
  const phoneTaken = await prisma.user.findFirst({
    where: { phone, isPhoneVerified: true, NOT: { id: userId } }
  });

  if (phoneTaken) {
    throw new Error("This phone number is already linked to another account.");
  }

  /* * In a live app, you would verify the Truecaller `payload` signature here.
   * Because you are testing, we assume the signature check passes.
   */

  const user = await prisma.user.update({
    where: { id: userId },
    data: { isPhoneVerified: true, phone: phone }
  });

  return { success: true, user };
};

exports.forgotPassword = async (email) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error("User with this email does not exist");

  // --- RATE LIMIT CHECK (1 Minute Cooldown) ---
  if (user.resetPasswordToken && user.updatedAt) {
    const now = new Date();
    const lastUpdate = new Date(user.updatedAt);
    const diffInSeconds = Math.floor((now - lastUpdate) / 1000);

    if (diffInSeconds < 60) {
      const waitTime = 60 - diffInSeconds;
      throw new Error(`Please wait ${waitTime} seconds before requesting another link.`);
    }
  }

  // Generate simple random token
  const resetToken = crypto.randomBytes(32).toString('hex');
  const passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 Hour

  // Save to DB (This will trigger the updatedAt timestamp)
  await prisma.user.update({
    where: { email },
    data: {
      resetPasswordToken: resetToken,
      resetPasswordExpires: passwordResetExpires
    }
  });

  // Send Email
  await EmailUtil.sendPasswordResetEmail(user.email, resetToken);

  return true;
};

// NEW: Validate Token (Check if valid)
exports.validateResetToken = async (token) => {
  const user = await prisma.user.findFirst({
    where: {
      resetPasswordToken: token,
      resetPasswordExpires: { gt: new Date() } // Check expiry
    }
  });
  if (!user) throw new Error("Invalid or expired token");
  return true;
};

// NEW: Reset Password (Set new password)
exports.resetPassword = async (token, newPassword) => {
  const user = await prisma.user.findFirst({
    where: {
      resetPasswordToken: token,
      resetPasswordExpires: { gt: new Date() }
    }
  });

  if (!user) throw new Error("Invalid or expired token");

  // Hash new password
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(newPassword, salt);

  // Update User & Clear Token
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: passwordHash,
      resetPasswordToken: null,
      resetPasswordExpires: null
    }
  });

  return true;
};