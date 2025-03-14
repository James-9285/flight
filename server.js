/*************************************************
 * server.js
 *************************************************/
require('dotenv').config(); // تحميل متغيرات البيئة من ملف .env إن وجد
const express = require('express');
const cors = require('cors');
const requestLogger = require('./middlewares/requestLogger');

// استورد الدوال الخاصة بالاتصال بـRedis
const { redisConnect } = require('./services/redisClient');

// راوتر الطيران
const flightRoutes = require('./routes/flightRoutes');
// راوتر ويب
const web = require('./routes/web');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json()); // استلام البيانات بصيغة JSON
app.use(requestLogger);

// جميع مسارات الطيران
app.use('/api/b2b/v1/flight', flightRoutes);
// مسارات ويب
app.use('/', web);

/**
 * شغّل السيرفر + اتصل بـRedis مرّة واحدة
 */
(async () => {
  await redisConnect();
  
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
})();
