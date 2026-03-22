import mongoose from 'mongoose';
import Service from './models/Service.js';
import dotenv from 'dotenv';

dotenv.config();

async function checkAllWebinars() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Find ALL webinar services
    const webinars = await Service.find({ type: 'webinar' });
    
    console.log(`Found ${webinars.length} webinar services:\n`);
    
    webinars.forEach(service => {
      console.log(`Service: "${service.title}"`);
      console.log(`  Creator: ${service.creator}`);
      console.log(`  Status: ${service.status}`);
      console.log(`  Session Frequency: ${service.sessionFrequency}`);
      console.log(`  Event Type: ${service.eventType}`);
      console.log(`  Webinar Dates:`, JSON.stringify(service.webinarDates, null, 2));
      console.log(`  Weekly Schedule:`, JSON.stringify(service.weeklySchedule, null, 2));
      console.log();
    });
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkAllWebinars();
