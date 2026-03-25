const prisma = require('../utils/prisma');
const bcrypt = require('bcryptjs'); // Needed for password comparison/hashing
const AuthService = require('../services/auth.service');
const { validationResult } = require('express-validator');

// 1. REGISTER CONTROLLER
exports.register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const result = await AuthService.registerUser(req.body);

    // CASE A: Standard Signup -> Send "Check Email" flag
    if (result.requireEmailVerification) {
      return res.status(201).json({
        success: true,
        message: "Verification email sent",
        requireEmailVerification: true,
        email: result.user.email
      });
    }

    // CASE B: Fallback (Shouldn't happen with current logic but good safety)
    res.status(201).json({ success: true, token: result.token, user: result.user });

  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// NEW: VERIFY EMAIL CONTROLLER
exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ success: false, message: "Token missing" });

    await AuthService.verifyEmailToken(token);

    res.status(200).json({ success: true, message: "Email verified successfully" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// 2. LOGIN CONTROLLER (Updated)
exports.login = async (req, res) => {
  try {
    const result = await AuthService.loginUser(req.body);

    // CASE A: Email Not Verified
    if (result.requireEmailVerification) {
      return res.status(403).json({ 
        success: false, 
        message: "Email not verified", 
        requireEmailVerification: true, 
        email: result.email 
      });
    }

    // CASE B: Success
    res.status(200).json({
      success: true,
      message: "Logged in successfully",
      token: result.token,
      user: {
        id: result.user.id,
        fullName: result.user.fullName,
        email: result.user.email,
        role: result.user.role,
        isPhoneVerified: result.user.isPhoneVerified,
        primaryGoal: result.user.primaryGoal,
        lastActiveMode: result.user.lastActiveMode
      },
    });
  } catch (error) {
    res.status(401).json({ success: false, message: error.message });
  }
};

// NEW: RESEND CONTROLLER
exports.resendVerification = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: "Email is required" });

    // This service call (we updated in the previous turn) 
    // deletes old tokens and sends a new one via EmailUtil
    await AuthService.resendVerification(email);

    res.status(200).json({ 
      success: true, 
      message: "Previous tokens expired. New verification email sent." 
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// 3. GOOGLE CONTROLLER
exports.googleAuth = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ success: false, message: "No token provided" });

    const { user, token: jwtToken } = await AuthService.loginOrSignupWithGoogle(token);

    res.status(200).json({
      success: true,
      message: "Google Login Successful",
      token: jwtToken,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        avatar: user.avatarUrl,
        isPhoneVerified: user.isPhoneVerified,
        primaryGoal: user.primaryGoal,
        lastActiveMode: user.lastActiveMode
      },
    });
  } catch (error) {
    console.error("Google Auth Error:", error);
    res.status(400).json({ success: false, message: "Google Authentication Failed" });
  }
};

// 4. SEND OTP
exports.sendOtp = async (req, res) => {
  try {
    const { phone } = req.body;
    const userId = req.user?.id || req.body.userId; 
    if (!phone) return res.status(400).json({ success: false, message: "Phone is required" });

    await AuthService.sendMobileOtp(userId, phone);
    res.status(200).json({ success: true, message: "OTP sent successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 5. VERIFY OTP
exports.verifyOtp = async (req, res) => {
  try {
    const { phone, code } = req.body;
    const userId = req.user?.id || req.body.userId; 

    const result = await AuthService.verifyMobileOtp(userId, phone, code);
    res.status(200).json({ success: true, user: result.user });
  } catch (error) {
    // If it's a Prisma error, we send a clean message instead of the technical trace
    const cleanMessage = error.message.includes('Unique constraint') 
      ? "This phone number is already in use by another account." 
      : error.message;

    res.status(400).json({ success: false, message: cleanMessage });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    await AuthService.forgotPassword(req.body.email);
    res.status(200).json({ success: true, message: "Reset email sent" });
  } catch (error) {
    // For security, don't reveal if user exists or not, but for dev we send error
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.validateResetToken = async (req, res) => {
  try {
    await AuthService.validateResetToken(req.body.token);
    res.status(200).json({ success: true, valid: true });
  } catch (error) {
    res.status(400).json({ success: false, valid: false, message: error.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    await AuthService.resetPassword(token, password);
    res.status(200).json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// 2. CHANGE PASSWORD (Now bcrypt will work)
exports.changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    const user = await prisma.user.findUnique({ where: { id: userId } });

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Current password is incorrect." });
    }

    // Hash and save new password
    const salt = await bcrypt.genSalt(10);
    const newPasswordHash = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash }
    });

    res.status(200).json({ success: true, message: "Password updated successfully." });
  } catch (error) {
    console.error("Change Password Error:", error);
    res.status(500).json({ success: false, message: "Server error while changing password." });
  }
};

// --- ADD THIS TO YOUR GET ME FUNCTION ---
exports.getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        isPhoneVerified: true,
        walletBalance: true,
        role: true,
        avatarUrl: true,
        // FETCH PREFERENCES FOR SETTINGS PAGE
        pushNotifications: true,
        emailAlerts: true,
        language: true 
      }
    });

    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ==========================================
// NEW: SESSION MANAGEMENT
// ==========================================

// 1. Verify Session (Used by frontend AuthGuard)
exports.verifySession = async (req, res) => {
  try {
    // Extract token from header directly
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: "No token provided" });
    }
    
    const token = authHeader.split(' ')[1];

    const session = await prisma.session.findUnique({
      where: { sessionToken: token }
    });

    // Check if session exists, is not revoked, and is not expired
    if (!session || session.isRevoked || session.expires < new Date()) {
      return res.status(401).json({ success: false, message: "Session invalid or revoked" });
    }

    res.status(200).json({ success: true, message: "Session is active" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error during verification" });
  }
};

// 2. Logout (Revokes current session)
exports.logout = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      await prisma.session.update({
        where: { sessionToken: token },
        data: { isRevoked: true }
      });
    }
    res.status(200).json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Logout failed" });
  }
};

// 3. Revoke All OTHER Sessions (For Security Settings)
exports.revokeOtherSessions = async (req, res) => {
  try {
    const userId = req.user.id; // From protect middleware
    const currentToken = req.headers.authorization?.split(' ')[1];

    const result = await prisma.session.updateMany({
      where: {
        userId: userId,
        sessionToken: { not: currentToken },
        isRevoked: false // Only touch active ones
      },
      data: { isRevoked: true }
    });

    res.status(200).json({ 
      success: true, 
      message: `Successfully logged out of ${result.count} other device(s).` 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to revoke sessions" });
  }
};

// GET /api/v1/auth/sessions
exports.getSessions = async (req, res) => {
  try {
    const currentToken = req.headers.authorization?.split(' ')[1];
    
    // Fetch all non-revoked sessions for this user
    const sessions = await prisma.session.findMany({
      where: { 
        userId: req.user.id,
        isRevoked: false,
        expires: { gt: new Date() } // Only active ones
      },
      orderBy: { createdAt: 'desc' }
    });

    // Map through and tag the current session
    const data = sessions.map(session => ({
      ...session,
      isCurrent: session.sessionToken === currentToken
    }));

    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Get Sessions Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch sessions" });
  }
};

// POST /api/v1/auth/revoke-session (Revoke single specific session)
exports.revokeSpecificSession = async (req, res) => {
  try {
    const { sessionId } = req.body;
    const userId = req.user.id;

    // Verify ownership before revoking
    const session = await prisma.session.findUnique({ where: { id: sessionId } });
    if (!session || session.userId !== userId) {
      return res.status(403).json({ success: false, message: "Unauthorized action" });
    }

    await prisma.session.update({
      where: { id: sessionId },
      data: { isRevoked: true }
    });

    res.status(200).json({ success: true, message: "Device logged out successfully." });
  } catch (error) {
    console.error("Revoke Session Error:", error);
    res.status(500).json({ success: false, message: "Failed to logout device" });
  }
};