const express = require('express');
const router = express.Router();
const taskController = require('../controlllers/taskControlle');

router.post('/', taskController.createTask);

router.get('/', taskController.getAllTasks);

router.patch('/:id', taskController.updateTaskStatus);
router.delete('/:id', taskController.deleteTask);


module.exports = router;