const prisma = require('../utils/prisma');

// 1. Get user notifications
exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    // Assuming req.user has a role or mode, adjust 'COURIER' dynamically if needed
    const appMode = req.user.lastActiveMode || 'COURIER'; 

    const notifications = await prisma.notification.findMany({
      where: {
        OR: [
          { userId: userId },
          { targetRole: appMode },
          { targetRole: 'BOTH' }
        ]
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    res.status(200).json({ success: true, data: notifications });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to load notifications" });
  }
};

// 2. Mark single notification as read
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.notification.update({
      where: { id },
      data: { isRead: true }
    });
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false });
  }
};

// 3. Mark all as read
exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true }
    });
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false });
  }
};

// 4. Delete notification
exports.deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.notification.delete({ where: { id } });
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false });
  }
};