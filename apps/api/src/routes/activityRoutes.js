const express = require('express');
const router = express.Router();
const activityController = require('../controlllers/activityControlle');

// GET /api/logs
router.get('/', activityController.getAllLogs);

module.exports = router;