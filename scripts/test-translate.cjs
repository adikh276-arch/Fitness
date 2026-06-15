const https = require('https');
require('dotenv').config();

const API_KEY = process.env.GOOGLE_TRANSLATE_API_KEY;
console.log('API Key found:', API_KEY ? API_KEY.slice(0, 10) + '...' : 'NOT FOUND');

const body = JSON.stringify({ q: 'hello', target: 'es', format: 'text' });

const options = {
  hostname: 'translation.googleapis.com',
  path: `/language/translate/v2?key=${API_KEY}`,
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:', data);
  });
});
req.on('error', e => console.error('Error:', e.message));
req.write(body);
req.end();
