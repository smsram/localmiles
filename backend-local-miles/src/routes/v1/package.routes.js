const express = require('express');
const router = express.Router();
const { protect } = require('../../middlewares/auth.middleware');
const upload = require('../../middlewares/upload.middleware');

const { 
  createDraftPackage, 
  getPackageByPublicId, 
  updateDraftPackage, 
  processPayment,
  getMyShipments,
  deletePackage,
  cancelOrder,
  getAvailableJobs,
  getCourierActivities,
  acceptPackage,
  updatePackageStatus,
  resendPickupOtp,
  verifyPickup,
  resendDeliveryOtp,
  verifyDelivery,
  getPublicTrackingInfo,
  submitReview // Added the review function
} = require('../../controllers/package.controller');

// ==========================================
// 1. STATIC & PUBLIC ROUTES (MUST BE FIRST!)
// ==========================================
// Public tracking (No Auth)
router.get('/public-track/:id', getPublicTrackingInfo);

// Protected Static Routes
router.get('/available', protect, getAvailableJobs);
router.get('/courier/activities', protect, getCourierActivities);
router.get('/my-shipments', protect, getMyShipments); 
router.post('/draft', protect, upload.array('images', 10), createDraftPackage);


// ==========================================
// 2. DYNAMIC ROUTES (WITH :id)
// ==========================================

// OTP Verification & Resending
router.post('/:id/resend-pickup-otp', protect, resendPickupOtp);
router.post('/:id/verify-pickup', protect, verifyPickup);
router.post('/:id/resend-delivery-otp', protect, resendDeliveryOtp);
router.post('/:id/verify-delivery', protect, verifyDelivery);

// NEW: Courier Review Route
router.post('/:id/review', protect, submitReview);

// Order Management
router.put('/:id', protect, upload.array('images', 10), updateDraftPackage);
router.post('/:id/pay', protect, processPayment);
router.delete('/:id', protect, deletePackage);
router.post('/:id/cancel', protect, cancelOrder);

// Courier Specific Actions
router.post('/:id/accept', protect, acceptPackage);
router.put('/:id/status', protect, updatePackageStatus);

// ==========================================
// 3. THE CATCH-ALL (ID LOOKUP)
// ==========================================
// This must stay at the VERY bottom because it matches any /:id pattern
router.get('/:id', protect, getPackageByPublicId);

module.exports = router;