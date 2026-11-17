const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Protected Customer Routes
router.use(authenticateToken);
router.use(requireRole('customer'));

router.get('/dashboard', customerController.getCustomerDashboard);
router.post('/bookings', customerController.createBooking);
router.post('/bookings/:id/cancel', customerController.cancelBooking);
router.post('/payments/process', customerController.processPayment);
router.get('/analytics', customerController.getCustomerAnalytics);
router.get('/notifications', customerController.getNotifications);
router.put('/notifications/:id/read', customerController.markNotificationRead);

module.exports = router;
