const express = require('express');
const router = express.Router();
const taskController = require('../controlllers/taskControlle');

router.post('/', taskController.createTask);

router.get('/', taskController.getAllTasks);

module.exports = router;