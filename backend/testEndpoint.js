// testEndpoint.js
const fetch = require('node-fetch'); // we'll use http module since fetch isn't standard in all older node versions
const http = require('http');

const data = JSON.stringify({ examId: 1 });

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/attempts/start',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, res => {
  console.log(`STATUS: ${res.statusCode}`);
  res.on('data', d => {
    process.stdout.write(d);
  });
});

req.on('error', error => {
  console.error(error);
});

req.write(data);
req.end();
