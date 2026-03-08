import fetch from 'node-fetch';

const API_BASE = 'https://specialistly-production.up.railway.app/api';

async function testEndpoints() {
  const endpoints = [
    { method: 'GET', url: '/customers', name: 'Get Customers' },
    { method: 'GET', url: '/services', name: 'Get Services' },
    { method: 'GET', url: '/courses', name: 'Get Courses' },
    { method: 'GET', url: '/health', name: 'Health Check' },
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${API_BASE}${endpoint.url}`, {
        method: endpoint.method,
        headers: { 'Content-Type': 'application/json' },
      });
      
      const data = await response.json();
      const dataLength = Array.isArray(data.data) ? data.data.length : 'N/A';
      
      console.log(`✓ ${endpoint.name} (${response.status}): ${dataLength} items`);
    } catch (error) {
      console.log(`✗ ${endpoint.name}: ${error.message}`);
    }
  }
}

testEndpoints();
