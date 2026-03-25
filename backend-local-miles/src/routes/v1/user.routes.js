const express = require('express');
const router = express.Router();
const { updateRole, updateUserProfile } = require('../../controllers/user.controller');
const { protect } = require('../../middlewares/auth.middleware'); 

// All routes here require authentication
router.use(protect);

// POST /api/v1/user/update-role
router.post('/update-role', updateRole);

// PUT /api/v1/user/me
router.put('/me', updateUserProfile);

module.exports = router;