import mongoose from 'mongoose';
import Service from './models/Service.js';
import dotenv from 'dotenv';

dotenv.config();

async function checkWebinarDates() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Find webinar services with selected dates
    const webinars = await Service.find({
      type: 'webinar',
      sessionFrequency: 'selected'
    });
    
    console.log(`Found ${webinars.length} webinar services with selected dates:\n`);
    
    webinars.forEach(service => {
      console.log(`Service: "${service.title}"`);
      console.log(`  Creator: ${service.creator}`);
      console.log(`  Status: ${service.status}`);
      console.log(`  Session Frequency: ${service.sessionFrequency}`);
      console.log(`  Webinar Dates:`, service.webinarDates);
      console.log();
    });
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkWebinarDates();
