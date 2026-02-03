const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhookController');
const { verifyWebhookSignature, validatePullRequestEvent } = require('../middleware/webhookValidator');

router.post(
  '/webhook',
  verifyWebhookSignature,
  validatePullRequestEvent,
  webhookController.handlePullRequest
);

module.exports = router;
