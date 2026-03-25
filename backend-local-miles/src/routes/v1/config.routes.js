const express = require('express');
const router = express.Router();

// FIX: Destructure 'getMapConfig' directly, just like 'getCloudinaryConfig'
const { getMapConfig, getCloudinaryConfig } = require('../../controllers/config.controller');

// Route: GET /api/v1/config/maps
// FIX: Use the function directly
router.get('/maps', getMapConfig);

// GET /api/v1/config/cloudinary
router.get('/cloudinary', getCloudinaryConfig);

module.exports = router;