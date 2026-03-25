const express = require('express');
const router = express.Router();
const AddressController = require('../../controllers/address.controller');

// Correctly import 'protect'
const { protect } = require('../../middlewares/auth.middleware');

// Apply middleware
router.use(protect);

// Routes
router.post('/', AddressController.addAddress);
router.get('/', AddressController.getAddresses);
router.get('/:id', AddressController.getSingleAddress);
router.put('/:id', AddressController.updateAddress);
router.delete('/:id', AddressController.deleteAddress);
router.put('/:id/default', AddressController.setDefault);

module.exports = router;