import fetch from 'node-fetch';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

dotenv.config();

(async () => {
  try {
    const baseURL = process.env.BACKEND_URL || 'http://localhost:5000';
    
    const testPayload = {
      userId: '69865d068842af4984f76dba',
      email: 'sivakumarganeshm@gmail.com',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60)
    };
    
    const secret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
    const token = jwt.sign(testPayload, secret);
    
    console.log('📋 Testing API endpoints with test token:\n');
    
    // Test get websites
    console.log('🔍 Testing GET /page-builder/websites');
    const websitesRes = await fetch(`${baseURL}/api/page-builder/websites`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });
    
    const websitesData = await websitesRes.json();
    console.log(`Status: ${websitesRes.status}`);
    console.log('Response:', JSON.stringify(websitesData, null, 2));
    
    if (websitesData.data && websitesData.data.length > 0) {
      const websiteId = websitesData.data[0]._id;
      console.log(`\n🔍 Using website ID: ${websiteId}`);
      
      // Test get website details
      console.log(`\n🔍 Testing GET /page-builder/websites/${websiteId}`);
      const detailRes = await fetch(`${baseURL}/api/page-builder/websites/${websiteId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });
      
      const detailData = await detailRes.json();
      console.log(`Status: ${detailRes.status}`);
      console.log('Response:', JSON.stringify(detailData, null, 2));
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
})();
