const express = require('express');
const { login, createAdmin, getUsers, createUser, updateUser, deleteUser } = require('../controllers/authController');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.post('/login', login);
router.post('/setup-admin', createAdmin);

router.get('/users', authenticate, requireAdmin, getUsers);
router.post('/users', authenticate, requireAdmin, createUser);
router.put('/users/:id', authenticate, requireAdmin, updateUser);
router.delete('/users/:id', authenticate, requireAdmin, deleteUser);

module.exports = router;
