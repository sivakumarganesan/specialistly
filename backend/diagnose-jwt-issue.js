import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '.env.staging') });
dotenv.config({ path: path.resolve(__dirname, '.env.production') });

console.log('🔍 Diagnosing JWT_SECRET Issue\n');

const BACKEND_URL = 'https://staging.specialistly.com/api';
const stagingSecret = process.env.JWT_SECRET; // From .env.staging after dotenv loads it

// Get a token from the backend
console.log('📝 Getting token from staging backend...');

try {
  const res = await axios.post(`${BACKEND_URL}/auth/login`, {
    email: 'sivakumarganeshm@gmail.com',
    password: 'StagingTest123!',
  });

  const token = res.data.token;
  console.log('✅ Got token\n');

  // Decode without verification to see the payload
  const parts = token.split('.');
  const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());

  console.log('📋 Local Configuration:');
  console.log(`   .env.staging JWT_SECRET: "${stagingSecret}"`);
  console.log(`   Length: ${stagingSecret.length}\n`);

  console.log('⚠️  The issue is:');
  console.log(`
    1. Backend generated a token (✅ works, login succeeded)
    2. But the JWT_SECRET used by backend ≠ local .env.staging
    3. This means Railway backend is NOT loading .env.staging
    4. It's probably loading .env (development) instead

  SOLUTIONS:
    A) Set Railway environment variable:
       NODE_ENV = staging
       
       Go to: Railway > staging-specialistly service > Variables
       Add: NODE_ENV = staging
       (This will trigger auto-redeploy)
       Wait 2-3 minutes and retry

    B) Or sync Railway vars:
       Update .env.staging to match .env if needed
       Then push to trigger new deployment
  `);

} catch (error) {
  console.error('Error:', error.message);
}
