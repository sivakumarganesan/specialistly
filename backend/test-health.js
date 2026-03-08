import fetch from 'node-fetch';

const RAILWAY_API_URL = 'https://specialistly-production.up.railway.app/api/health';

async function testHealth() {
  try {
    console.log('Testing health endpoint...');
    
    const response = await fetch(RAILWAY_API_URL);
    const data = await response.json();
    
    console.log('Health response:', JSON.stringify(data, null, 2));
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testHealth();
