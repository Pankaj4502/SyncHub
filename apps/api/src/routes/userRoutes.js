const express = require('express');
const router = express.Router();
const userController = require('../controlllers/userController');

// POST /api/users -> triggers the createUser function
router.post('/', userController.createUser);
router.get('/', userController.getAllUsers);

module.exports = router;