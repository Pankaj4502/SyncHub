const express = require('express');
const router = express.Router();
const projectController = require('../controlllers/projectController');

router.post('/', projectController.createProject);
router.get('/', projectController.getAllProjects);
router.delete('/:id', projectController.deleteProject);

module.exports = router;