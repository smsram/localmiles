const prisma = require('../utils/prisma');

// Get Wallet Balance & Transactions
exports.getWalletDetails = async (req, res) => {
  try {
    const userId = req.user.id;

    // Run queries in parallel
    const [user, transactions] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { walletBalance: true }
      }),
      prisma.transaction.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 50 // Fetch last 50 transactions
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

// Simulate Adding Money (Top-Up)
exports.topUpWallet = async (req, res) => {
  try {
    const userId = req.user.id;
    const { amount } = req.body;

    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      return res.status(400).json({ success: false, message: "Invalid amount" });
    }

    // In a real app, this happens inside a Stripe/Razorpay Webhook after payment succeeds.
    // Here we simulate a successful transaction instantly.
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

exports.withdrawWallet = async (req, res) => {
  try {
    const userId = req.user.id;
    const { amount } = req.body;

    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) return res.status(400).json({ success: false, message: "Invalid amount" });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user.walletBalance < parsedAmount) return res.status(400).json({ success: false, message: "Insufficient balance" });

    // Deduct and Log
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