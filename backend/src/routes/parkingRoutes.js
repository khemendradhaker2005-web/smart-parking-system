const express = require('express');
const router = express.Router();
const parkingController = require('../controllers/parkingController');

router.get('/locations', parkingController.getLocations);
router.get('/locations/:id', parkingController.getLocationDetails);

module.exports = router;
