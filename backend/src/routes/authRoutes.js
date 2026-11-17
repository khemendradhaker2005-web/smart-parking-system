const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

router.post('/register', authController.registerCustomer);
router.post('/login', authController.login);

router.get('/profile', authenticateToken, authController.getProfile);
router.post('/vehicles', authenticateToken, authController.addVehicle);
router.delete('/vehicles/:id', authenticateToken, authController.deleteVehicle);

module.exports = router;
