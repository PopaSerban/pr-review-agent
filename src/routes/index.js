const express = require('express');
const healthRoutes = require('./health');
const webhookRoutes = require('./webhook');

const router = express.Router();

router.use(healthRoutes);
router.use(webhookRoutes);

module.exports = router;
