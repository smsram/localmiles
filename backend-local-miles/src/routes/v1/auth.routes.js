const express = require('express');
const { body } = require('express-validator');

// Controller Import
const AuthController = require('../../controllers/auth.controller');

// Middleware Import (Destructured)
const { protect } = require('../../middlewares/auth.middleware');

const router = express.Router();

// --- VALIDATION RULES ---
const registerValidation = [
  body('fullName').notEmpty().withMessage('Full name is required'),
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

const loginValidation = [
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password').exists().withMessage('Password is required'),
];

// --- ROUTES ---

// 1. Auth (Public)
// FIXED: Changed .registerUser to .register
router.post('/register', registerValidation, AuthController.register); 

// FIXED: Changed .loginUser to .login
router.post('/login', loginValidation, AuthController.login);

// FIXED: Changed .loginOrSignupWithGoogle to .googleAuth
router.post('/google', AuthController.googleAuth);

// 2. Mobile OTP
// FIXED: Changed .sendMobileOtp to .sendOtp
router.post('/send-otp', protect, AuthController.sendOtp); 

// FIXED: Changed .verifyMobileOtp to .verifyOtp
router.post('/verify-otp', protect, AuthController.verifyOtp);

// 3. Email Verification
// FIXED: Changed .verifyEmailToken to .verifyEmail
router.post('/verify-email', AuthController.verifyEmail);
router.post('/resend-verification', AuthController.resendVerification);

// 4. Password Reset
router.post('/forgot-password', AuthController.forgotPassword);
router.post('/validate-reset-token', AuthController.validateResetToken);
router.post('/reset-password', AuthController.resetPassword);

// 5. Protected Route
router.get('/me', protect, AuthController.getMe); 

// --- NEW SESSION ROUTES ---
// No protect middleware on verify-session because it manually validates the token
router.get('/verify-session', AuthController.verifySession); 

// Logout current device
router.post('/logout', AuthController.logout);

// Logout all other devices (Requires auth)
router.post('/revoke-sessions', protect, AuthController.revokeOtherSessions);

router.post('/change-password', protect, AuthController.changePassword);

// Add these to your protected routes block
router.get('/sessions', protect, AuthController.getSessions);
router.post('/revoke-session', protect, AuthController.revokeSpecificSession);

module.exports = router;