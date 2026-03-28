const express = require('express');
const router = express.Router();
const { 
  updateRole, 
  updateUserProfile, 
  getCourierProfile, 
  updateCourierDetails 
} = require('../../controllers/user.controller');
const { protect } = require('../../middlewares/auth.middleware'); 

// All routes here require authentication
router.use(protect);

// POST /api/v1/user/update-role
router.post('/update-role', updateRole);

// PUT /api/v1/user/me
router.put('/me', updateUserProfile);

// GET /api/v1/user/courier-profile
router.get('/courier-profile', getCourierProfile);

// PUT /api/v1/user/courier-details (Handles Avatar, Identity Docs, and Vehicle Info)
router.put('/courier-details', updateCourierDetails);

module.exports = router;