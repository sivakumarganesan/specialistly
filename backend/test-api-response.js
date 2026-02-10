import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const API_URL = 'https://specialistly-production.up.railway.app/api/customers';

async function testAPI() {
  try {
    console.log('Fetching from:', API_URL);
    
    const response = await fetch(API_URL, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers));
    
    const data = await response.json();
    console.log('Response body:', JSON.stringify(data, null, 2));
    
    if (data.success) {
      console.log('✓ API returned success');
      console.log('Data array length:', Array.isArray(data.data) ? data.data.length : 'not an array');
    } else {
      console.log('✗ API returned failure');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

testAPI();
