const express = require('express');
const router = express.Router();
const staffController = require('../controllers/staffController');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Protected Staff Routes
router.use(authenticateToken);
router.use(requireRole('staff', 'admin'));

router.get('/dashboard-stats', staffController.getStaffDashboardStats);
router.post('/entry', staffController.recordVehicleEntry);
router.post('/exit', staffController.markVehicleExit);
router.post('/verify-payment', staffController.verifyPaymentAndRelease);
router.post('/manual-override', staffController.manualOverrideExit);

router.get('/active-vehicles', staffController.getActiveVehicles);
router.get('/slot-grid', staffController.getSlotGrid);
router.put('/slots/:slotId/status', staffController.updateSlotStatus);

router.get('/customers', staffController.getCustomerRecords);
router.get('/history', staffController.getParkingHistory);
router.get('/analytics', staffController.getStaffAnalytics);

module.exports = router;
