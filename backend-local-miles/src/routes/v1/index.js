const express = require('express');
const authRoutes = require('./auth.routes');
const webhookRoutes = require('./webhook.routes');
const userRoutes = require('./user.routes');
const configRoutes = require('./config.routes'); 
const addressRoutes = require('./address.routes');
const pricingRoutes = require('./pricing.routes'); 
const packageRoutes = require('./package.routes'); 

// 1. Import Wallet Routes
const walletRoutes = require('./wallet.routes'); // <--- ADD THIS

const router = express.Router();

// Mount Routes
router.use('/auth', authRoutes);
router.use('/webhooks', webhookRoutes);
router.use('/user', userRoutes);
router.use('/config', configRoutes);
router.use('/addresses', addressRoutes);
router.use('/pricing', pricingRoutes);
router.use('/packages', packageRoutes);

// 2. Mount Wallet Route
// This enables: /api/v1/wallet and /api/v1/wallet/topup
router.use('/wallet', walletRoutes); // <--- ADD THIS

module.exports = router;