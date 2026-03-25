const express = require('express');
const router = express.Router();
const { protect } = require('../../middlewares/auth.middleware');
const { getWalletDetails, topUpWallet, withdrawWallet } = require('../../controllers/wallet.controller');

router.get('/', protect, getWalletDetails);
router.post('/topup', protect, topUpWallet);
router.post('/withdraw', protect, withdrawWallet);

module.exports = router;