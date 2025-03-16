// routes/flightRoutes.js
const express = require('express');
const router = express.Router();
const flightController = require('../controllers/flightController');


// مثال على المسارات المطلوب إنشاؤها (سنوضّح low-fare-search كأساس للفكرة):
router.post('/low-fare-search', flightController.lowFareSearch);

router.post('/get-fare-rule', flightController.getFareRule);
router.post('/get-brand-fares', flightController.getBrandFares);
router.post('/seat-map', flightController.seatMap);
router.post('/meal-map', flightController.mealMap);
router.post('/baggage-map', flightController.baggageMap);
router.post('/get-price', flightController.getPrice);
router.post('/book', flightController.bookFlight);
router.post('/ticket', flightController.ticketFlight);
router.post('/cancel', flightController.cancelFlight);
router.post('/void', flightController.voidFlight);
router.post('/get-book', flightController.getBookData);


module.exports = router;
