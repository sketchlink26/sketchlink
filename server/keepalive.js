const https = require('https');
setInterval(() => {
  const url = process.env.RENDER_URL || 'https://sketchlink-server-uzw4.onrender.com';
  https.get(url + '/api/health', (res) => {
    console.log('Keep-alive:', res.statusCode);
  }).on('error', () => {});
}, 840000);
module.exports = () => {};
