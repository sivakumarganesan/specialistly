import fetch from 'node-fetch';

async function test() {
  try {
    const response = await fetch('http://localhost:5001/api/appointments/scheduled-webinars?specialistEmail=specialist@test.com');
    const data = await response.json();
    console.log('Response Status:', response.status);
    console.log('Response Data:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }
}

test();
