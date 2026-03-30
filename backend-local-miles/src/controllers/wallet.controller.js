const prisma = require('../utils/prisma');

// ==========================================
// 1. GET WALLET DETAILS (Universal / Sender)
// ==========================================
exports.getWalletDetails = async (req, res) => {
  try {
    const userId = req.user.id;
    const { mode } = req.query; // Support ?mode=SENDER or ?mode=COURIER

    const whereClause = { userId };
    if (mode && ['SENDER', 'COURIER'].includes(mode.toUpperCase())) {
      whereClause.appMode = mode.toUpperCase();
    }

    // Run queries in parallel
    const [user, transactions] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { walletBalance: true }
      }),
      prisma.transaction.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        take: 50 
      })
    ]);

    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    res.status(200).json({
      success: true,
      data: {
        balance: user.walletBalance,
        transactions
      }
    });
  } catch (error) {
    console.error("Wallet Fetch Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch wallet details" });
  }
};

// ==========================================
// 2. SIMULATE TOP-UP (Usually Sender Mode)
// ==========================================
exports.topUpWallet = async (req, res) => {
  try {
    const userId = req.user.id;
    const { amount, appMode = 'SENDER' } = req.body;

    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      return res.status(400).json({ success: false, message: "Invalid amount" });
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { walletBalance: { increment: parsedAmount } }
      }),
      prisma.transaction.create({
        data: {
          userId,
          amount: parsedAmount,
          type: 'CREDIT',
          status: 'SUCCESS',
          method: 'ONLINE',
          appMode: appMode.toUpperCase(), // Partition the transaction
          description: 'Added via Online Payment'
        }
      })
    ]);

    res.status(200).json({ success: true, message: `₹${parsedAmount} added to wallet successfully!` });

  } catch (error) {
    console.error("Wallet Top-up Error:", error);
    res.status(500).json({ success: false, message: "Failed to add money" });
  }
};

// ==========================================
// 3. WITHDRAW MONEY (Usually Courier Mode)
// ==========================================
exports.withdrawWallet = async (req, res) => {
  try {
    const userId = req.user.id;
    const { amount, appMode = 'COURIER' } = req.body;

    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) return res.status(400).json({ success: false, message: "Invalid amount" });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user.walletBalance < parsedAmount) return res.status(400).json({ success: false, message: "Insufficient balance" });

    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { walletBalance: { decrement: parsedAmount } }
      }),
      prisma.transaction.create({
        data: {
          userId,
          amount: parsedAmount,
          type: 'DEBIT',
          status: 'SUCCESS',
          method: 'ONLINE',
          appMode: appMode.toUpperCase(), // Partition the transaction
          description: 'Withdrawal to Bank Account'
        }
      })
    ]);

    res.status(200).json({ success: true, message: `₹${parsedAmount} withdrawn to your bank successfully!` });

  } catch (error) {
    console.error("Wallet Withdraw Error:", error);
    res.status(500).json({ success: false, message: "Failed to process withdrawal" });
  }
};

// ==========================================
// 4. COURIER SPECIFIC EARNINGS DASHBOARD
// ==========================================
exports.getCourierEarnings = async (req, res) => {
  try {
    const userId = req.user.id;
    const weeksAgo = parseInt(req.query.weeksAgo) || 0; // Extract from query

    const user = await prisma.user.findUnique({ 
      where: { id: userId }, 
      select: { walletBalance: true } 
    });

    // --- 1. "TODAY" BOUNDARIES (Always current actual day for the top cards) ---
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const todayTrips = await prisma.package.count({
      where: { courierId: userId, status: 'DELIVERED', updatedAt: { gte: startOfToday } }
    });

    const todayTxns = await prisma.transaction.findMany({
      where: { userId, type: 'CREDIT', status: 'SUCCESS', appMode: 'COURIER', createdAt: { gte: startOfToday } }
    });
    const todayEarnings = todayTxns.reduce((sum, t) => sum + t.amount, 0);

    const todayShifts = await prisma.courierShift.findMany({
      where: { courierId: userId, startTime: { gte: startOfToday } }
    });
    
    let todayOnlineHours = 0;
    todayShifts.forEach(s => {
      const end = s.endTime || s.lastHeartbeat || new Date();
      todayOnlineHours += (new Date(end) - new Date(s.startTime)) / (1000 * 60 * 60);
    });

    // --- 2. WEEKLY GRAPH BOUNDARIES (Calculated based on weeksAgo) ---
    const startOfWeek = new Date();
    const currentDay = startOfWeek.getDay();
    // Go to previous Monday, then subtract weeksAgo * 7 days
    const diff = startOfWeek.getDate() - currentDay + (currentDay === 0 ? -6 : 1) - (weeksAgo * 7);
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999); // End of Sunday

    // Fetch transactions strictly for the targeted week
    const weekTxns = await prisma.transaction.findMany({
      where: { 
        userId, type: 'CREDIT', status: 'SUCCESS', appMode: 'COURIER', 
        createdAt: { gte: startOfWeek, lte: endOfWeek } 
      }
    });

    // Fetch shifts strictly for the targeted week
    const weekShifts = await prisma.courierShift.findMany({
      where: {
        courierId: userId,
        startTime: { gte: startOfWeek, lte: endOfWeek }
      }
    });

    // --- 3. BUILD WEEKLY ARRAY ---
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const weeklyData = days.map(dayName => ({ day: dayName, earnings: 0, hours: 0, active: false }));

    weekTxns.forEach(t => {
      const d = new Date(t.createdAt);
      let dayIndex = d.getDay() - 1; 
      if (dayIndex === -1) dayIndex = 6; 
      if (weeklyData[dayIndex]) weeklyData[dayIndex].earnings += t.amount;
    });

    weekShifts.forEach(s => {
      const d = new Date(s.startTime);
      let dayIndex = d.getDay() - 1;
      if (dayIndex === -1) dayIndex = 6;

      const end = s.endTime || s.lastHeartbeat || new Date();
      const durationHrs = (new Date(end) - new Date(s.startTime)) / (1000 * 60 * 60);
      if (weeklyData[dayIndex]) weeklyData[dayIndex].hours += durationHrs;
    });

    // Only highlight "Today" if we are looking at the current week (weeksAgo === 0)
    if (weeksAgo === 0) {
      let todayIndex = new Date().getDay() - 1;
      if (todayIndex === -1) todayIndex = 6;
      weeklyData[todayIndex].active = true;
    }

    // --- 4. RECENT ACTIVITY (Merge Transactions + Packages) ---
    // A. Fetch last 5 courier transactions
    const recentTxnsRaw = await prisma.transaction.findMany({
      where: { userId, appMode: 'COURIER' },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    // B. Fetch last 5 updated packages for this courier
    const recentPkgsRaw = await prisma.package.findMany({
      where: { courierId: userId },
      orderBy: { updatedAt: 'desc' },
      take: 5
    });

    // C. Merge them into a standard array, sort by date, and take the top 5 overall
    const combinedActivity = [
      ...recentTxnsRaw.map(t => ({ type: 'TXN', date: t.createdAt, data: t })),
      ...recentPkgsRaw.map(p => ({ type: 'PKG', date: p.updatedAt, data: p }))
    ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

    res.status(200).json({
      success: true,
      data: {
        balance: user.walletBalance,
        todayEarnings,
        todayTrips,
        onlineHours: parseFloat(todayOnlineHours.toFixed(2)), 
        weeklyData: weeklyData.map(d => ({
          ...d,
          earnings: parseFloat(d.earnings.toFixed(2)),
          hours: parseFloat(d.hours.toFixed(2))
        })),
        combinedActivity // Contains both Wallet Credits & Package Updates
      }
    });
  } catch (error) {
    console.error("Courier Earnings Error:", error);
    res.status(500).json({ success: false, message: "Failed to load earnings" });
  }
};