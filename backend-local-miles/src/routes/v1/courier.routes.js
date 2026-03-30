const express = require('express');
const router = express.Router();
const courierController = require('../../controllers/courier.controller'); // Move heartbeat logic here
const { protect } = require('../../middlewares/auth.middleware');

router.use(protect);

// High-frequency background pings
router.post('/heartbeat', courierController.processHeartbeat);

module.exports = router;