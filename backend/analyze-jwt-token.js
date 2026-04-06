import axios from 'axios';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '.env.staging') });

const BACKEND_URL = process.env.BACKEND_URL || 'https://staging.specialistly.com/api';
const JWT_SECRET = process.env.JWT_SECRET;

console.log('🔍 Analyzing JWT Token from Login\n');

try {
  // Login and get token
  const loginResponse = await axios.post(`${BACKEND_URL}/auth/login`, {
    email: 'sivakumarganeshm@gmail.com',
    password: 'StagingTest123!',
  });

  const token = loginResponse.data.token;
  
  console.log('📝 Token received from login endpoint\n');
  
  // Decode JWT (without verification, just to see payload)
  const parts = token.split('.');
  const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
  
  console.log('📋 JWT Payload:');
  console.log(`   userId: ${payload.userId}`);
  console.log(`   userId type: ${typeof payload.userId}`);
  console.log(`   email: ${payload.email}`);
  console.log(`   iat: ${new Date(payload.iat * 1000).toISOString()}`);
  console.log(`   exp: ${new Date(payload.exp * 1000).toISOString()}\n`);

  // Verify JWT
  console.log('📝 Verifying JWT...');
  const decoded = jwt.verify(token, JWT_SECRET);
  console.log(`   ✅ JWT valid`);
  console.log(`   Decoded userId: ${decoded.userId}`);
  console.log(`   Decoded userId type: ${typeof decoded.userId}\n`);

  // Return what middleware would get
  console.log('📋 What adminMiddleware will receive:');
  console.log(`   {"userId": "${decoded.userId}", "email": "${decoded.email}"}`);

} catch (error) {
  if (error.response) {
    console.error('❌ API Error:', error.response.status, error.response.data);
  } else {
    console.error('❌ Error:', error.message);
  }
}
