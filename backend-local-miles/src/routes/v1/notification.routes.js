const express = require('express');
const router = express.Router();
const notificationController = require('../../controllers/notification.controller');
const { protect } = require('../../middlewares/auth.middleware');

// All notification routes require the user to be logged in
router.use(protect);

router.get('/', notificationController.getNotifications);
router.put('/read-all', notificationController.markAllAsRead);
router.put('/:id/read', notificationController.markAsRead);
router.delete('/:id', notificationController.deleteNotification);

module.exports = router;