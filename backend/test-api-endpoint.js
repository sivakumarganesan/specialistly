import mongoose from 'mongoose';
import Service from './models/Service.js';
import dotenv from 'dotenv';

dotenv.config();

async function simulateAPIEndpoint() {
  try {
    console.log('Simulating API GET /api/services?creator=sivakumarganeshm@gmail.com\n');
    
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Simulate the getAllServices controller logic with the fix
    const { creator, status } = {
      creator: 'sivakumarganeshm@gmail.com',
      status: undefined // No status parameter, like the frontend calls it
    };
    
    const filter = {};
    
    if (creator) {
      filter.creator = creator;
    }
    
    // NEW LOGIC (with fix)
    if (status) {
      filter.status = status;
    } else if (!creator) {
      // If no creator and no status specified (public browsing), only return active services
      filter.status = 'active';
    }
    // If creator is specified without status, return ALL their services (both active and draft)
    
    console.log('Filter applied:', JSON.stringify(filter));
    const services = await Service.find(filter);
    
    console.log(`\nAPI Response:`);
    console.log(JSON.stringify({
      success: true,
      data: services.map(s => ({
        id: s._id,
        title: s.title,
        status: s.status,
        creator: s.creator
      }))
    }, null, 2));
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

simulateAPIEndpoint();
