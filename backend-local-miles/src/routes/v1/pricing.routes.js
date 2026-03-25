const express = require('express');
const router = express.Router();

// CORRECTED PATH: Go up two levels (../../) to reach src/controllers
const { getEstimate } = require('../../controllers/pricing.controller'); 

router.post('/estimate', getEstimate);

module.exports = router;