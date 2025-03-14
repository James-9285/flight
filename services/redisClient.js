/*************************************************
 * services/redisClient.js
 *************************************************/
const { createClient } = require('redis');

const client = createClient({
  url: 'redis://127.0.0.1:6379'
});

// لو لديك كلمة سر أو إعدادات أخرى:
// const client = createClient({
//   socket: {
//     host: '127.0.0.1',
//     port: 6379
//   },
//   password: 'secretIfYouHaveOne'
// });

client.on('error', (err) => {
  console.error('Redis Client Error', err);
});

/**
 * يجب استدعاء هذه الدالة مرة واحدة عند بدء تشغيل السيرفر
 * لتشغيل client.connect().
 */
async function redisConnect() {
  if (!client.isOpen) {
    await client.connect();
    console.log('Redis connected!');
  }
}

// نصدّر client والدالة
module.exports = {
  client,
  redisConnect
};
