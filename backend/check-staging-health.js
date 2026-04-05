import https from 'https';

console.log('Checking staging backend health...\n');

https.get('https://staging.specialistly.com/api/health', (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log(`Status: ${res.statusCode}`);
    console.log(`Response: ${data.substring(0, 500)}`);
  });
}).on('error', (err) => {
  console.error('Error:', err.message);
});
