const prisma = require('../utils/prisma');

// ==========================================
// GET SENDER DASHBOARD STATS
// ==========================================
exports.getDashboardStats = async (req, res) => {
  try {
    const senderId = req.user.id;

    // 1. Get Lifetime Totals (Avoid counting cancelled orders in total spent)
    const totalPackages = await prisma.package.count({ 
      where: { senderId } 
    });
    
    const spentAggregation = await prisma.package.aggregate({
      where: { 
        senderId,
        status: { not: 'CANCELLED' } 
      },
      _sum: { price: true }
    });
    const totalSpent = spentAggregation._sum.price || 0;

    // 2. Active Shipments Count
    const activeStatuses = ['PENDING', 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT'];
    const activeCount = await prisma.package.count({
      where: {
        senderId,
        status: { in: activeStatuses }
      }
    });

    // 3. Recent Shipments (Top 5 for the table)
    const recentShipments = await prisma.package.findMany({
      where: { senderId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        publicId: true,
        receiverName: true,
        dropAddress: true,
        status: true,
        price: true
      }
    });

    // 4. Live Delivery (Get the most relevant active package for the map tracker)
    const activePackages = await prisma.package.findMany({
      where: { 
        senderId, 
        status: { in: activeStatuses } 
      },
      orderBy: { updatedAt: 'desc' },
      include: {
        courier: {
          select: { fullName: true, phone: true }
        }
      }
    });

    // Sort in JavaScript to prioritize packages that are actually moving
    // IN_TRANSIT is most important, followed by PICKED_UP, etc.
    const statusPriority = { 'IN_TRANSIT': 1, 'PICKED_UP': 2, 'ASSIGNED': 3, 'PENDING': 4 };
    activePackages.sort((a, b) => statusPriority[a.status] - statusPriority[b.status]);
    
    const liveDelivery = activePackages.length > 0 ? activePackages[0] : null;

    res.status(200).json({
      success: true,
      data: {
        totalPackages,
        totalSpent,
        activeCount,
        recentShipments,
        liveDelivery
      }
    });
  } catch (error) {
    console.error("Sender Dashboard Stats Error:", error);
    res.status(500).json({ success: false, message: "Failed to load dashboard data." });
  }
};