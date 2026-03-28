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
    const user = await prisma.user.findUnique({ 
      where: { id: userId }, 
      select: { walletBalance: true } 
    });

    // Date Boundaries
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - (startOfWeek.getDay() || 7) + 1); 
    startOfWeek.setHours(0, 0, 0, 0);

    // 1. Today's Trips (Completed Deliveries)
    const todayTrips = await prisma.package.count({
      where: { 
        courierId: userId, 
        status: 'DELIVERED', 
        updatedAt: { gte: startOfToday } 
      }
    });

    // 2. Today's Earnings (Sum of CREDIT transactions today tagged as COURIER)
    const todayTxns = await prisma.transaction.findMany({
      where: { 
        userId, 
        type: 'CREDIT', 
        status: 'SUCCESS', 
        appMode: 'COURIER', // Excludes Sender Top-ups
        createdAt: { gte: startOfToday } 
      }
    });
    const todayEarnings = todayTxns.reduce((sum, t) => sum + t.amount, 0);

    // 3. Weekly Chart Data (Mon - Sun) tagged as COURIER
    const weekTxns = await prisma.transaction.findMany({
      where: { 
        userId, 
        type: 'CREDIT', 
        status: 'SUCCESS', 
        appMode: 'COURIER', // Excludes Sender Top-ups
        createdAt: { gte: startOfWeek } 
      }
    });

    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const weeklyData = days.map(day => ({ day, val: 0, active: false }));

    weekTxns.forEach(t => {
      const d = new Date(t.createdAt);
      let dayIndex = d.getDay() - 1; // 0 = Mon, 6 = Sun
      if (dayIndex === -1) dayIndex = 6; 
      weeklyData[dayIndex].val += t.amount;
    });

    let todayIndex = new Date().getDay() - 1;
    if (todayIndex === -1) todayIndex = 6;
    weeklyData[todayIndex].active = true;

    // 4. Recent Courier Transactions
    const recentTransactions = await prisma.transaction.findMany({
      where: { 
        userId,
        appMode: 'COURIER' // Only show delivery payouts/withdrawals
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    res.status(200).json({
      success: true,
      data: {
        balance: user.walletBalance,
        todayEarnings,
        todayTrips,
        onlineHours: 5.5, 
        weeklyData,
        recentTransactions
      }
    });
  } catch (error) {
    console.error("Courier Earnings Error:", error);
    res.status(500).json({ success: false, message: "Failed to load earnings" });
  }
};