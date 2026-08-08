const express = require('express');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { getDashboardStats } = require('../controllers/dashboardController');

const router = express.Router();

// Dashboard inherently required ADMIN only per requirements
router.get('/dashboard/stats', authenticate, requireAdmin, getDashboardStats);

module.exports = router;
