const express = require('express');
const WebhookController = require('../../controllers/webhook.controller');
const router = express.Router();

// GET is for setup verification, POST is for actual messages
router.get('/whatsapp', WebhookController.verifyWebhook);
router.post('/whatsapp', WebhookController.handleIncomingMessage);

module.exports = router;