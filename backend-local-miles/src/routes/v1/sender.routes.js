const express = require('express');
const router = express.Router();
const senderController = require('../../controllers/sender.controller');
const { protect } = require('../../middlewares/auth.middleware');

// All sender routes require the user to be logged in
router.use(protect);

// GET /api/v1/sender/stats
router.get('/stats', senderController.getDashboardStats);

module.exports = router;