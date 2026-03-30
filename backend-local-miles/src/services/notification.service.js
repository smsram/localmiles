const prisma = require('../utils/prisma');

/**
 * Create a new notification
 * @param {Object} params
 * @param {String} [params.userId] - Specific user ID (optional for broadcasts)
 * @param {String} params.title - Notification title
 * @param {String} params.message - Notification body
 * @param {String} [params.type='INFO'] - Type of alert
 * @param {String} [params.targetRole='BOTH'] - 'SENDER', 'COURIER', or 'BOTH'
 */
exports.createNotification = async ({ userId = null, title, message, type = 'INFO', targetRole = 'BOTH' }) => {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type,
        targetRole
      }
    });
    
    // Optional: If you are using Socket.io, you can emit this live to the user here
    // const io = require('./socket.service').getIo();
    // if (userId) io.to(userId).emit('new_notification', notification);

    return notification;
  } catch (error) {
    console.error("Failed to create notification:", error);
    return null;
  }
};