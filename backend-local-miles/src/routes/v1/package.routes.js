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
  getCourierActivities
} = require('../../controllers/package.controller');

// ==========================================
// 1. SPECIFIC ROUTES (MUST BE FIRST)
// ==========================================

// GET /api/v1/packages/my-shipments
// This MUST come before '/:id' or Express will think "my-shipments" is an ID
router.get('/my-shipments', protect, getMyShipments); 

// POST /api/v1/packages/draft
router.post('/draft', protect, upload.array('images', 10), createDraftPackage);

// ==========================================
// 2. DYNAMIC ROUTES (WITH :id)
// ==========================================

// PUT /api/v1/packages/:id (Update)
router.put('/:id', protect, upload.array('images', 10), updateDraftPackage);

// POST /api/v1/packages/:id/pay (Pay)
router.post('/:id/pay', protect, processPayment);

// GET /api/v1/packages/:id (Read)
// This catches anything else like "LM26-XXX", so it must be last
router.get('/:id', protect, getPackageByPublicId);

// DELETE /api/v1/packages/:id (Delete Draft)
router.delete('/:id', protect, deletePackage);

router.post('/:id/cancel', protect, cancelOrder);

router.get('/available', protect, getAvailableJobs);

router.get('/courier/activities', protect, getCourierActivities);

module.exports = router;