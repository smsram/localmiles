const express = require('express');
const authRoutes = require('./auth.routes');
const webhookRoutes = require('./webhook.routes');
const userRoutes = require('./user.routes');
const configRoutes = require('./config.routes');
const addressRoutes = require('./address.routes');
const pricingRoutes = require('./pricing.routes');
const packageRoutes = require('./package.routes');
const walletRoutes = require('./wallet.routes');
const courierRouteRoutes = require('./courier-route.routes.js');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/webhooks', webhookRoutes);
router.use('/user', userRoutes);
router.use('/config', configRoutes);
router.use('/addresses', addressRoutes);
router.use('/pricing', pricingRoutes);
router.use('/packages', packageRoutes);
router.use('/wallet', walletRoutes);
router.use('/courier-routes', courierRouteRoutes);

module.exports = router;