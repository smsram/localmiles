const express = require('express');
const router = express.Router();
const { protect } = require('../../middlewares/auth.middleware');
const { getWalletDetails, topUpWallet, withdrawWallet, getCourierEarnings } = require('../../controllers/wallet.controller');

router.get('/', protect, getWalletDetails);
router.post('/topup', protect, topUpWallet);
router.post('/withdraw', protect, withdrawWallet);
router.get('/earnings', protect, getCourierEarnings);

module.exports = router;