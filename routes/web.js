// routes/web.js
const express = require('express');
const router = express.Router();
const testController = require('../controllers/testController');

// مثال على المسارات المطلوب إنشاؤها (سنوضّح low-fare-search كأساس للفكرة):
router.get('/price', testController.price);
router.get('/test2', testController.aggregatorService);

 
// مسار تجريبي
router.get('/', (req, res) => {
    res.send('Welcome to My Multi-Airline Flight API');
  });
  
module.exports = router;
