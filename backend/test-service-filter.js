import mongoose from 'mongoose';
import Service from './models/Service.js';
import dotenv from 'dotenv';

dotenv.config();

async function testServiceFilter() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected\n');
    
    const creatorEmail = 'sivakumarganeshm@gmail.com';
    
    // Test 1: Get ALL services for creator (both active and draft)
    console.log('Test 1: Simulating creator fetching their services (no status filter)');
    console.log(`Query: { creator: "${creatorEmail}" }`);
    const allServices = await Service.find({ creator: creatorEmail });
    console.log(`Found: ${allServices.length} services`);
    allServices.forEach((s, i) => {
      console.log(`  ${i+1}. "${s.title}" - status: ${s.status}`);
    });
    
    // Test 2: Get only active services for public browsing
    console.log('\nTest 2: Simulating public browsing (no creator, only active)');
    console.log('Query: { status: "active" }');
    const publicServices = await Service.find({ status: 'active' });
    console.log(`Found: ${publicServices.length} active services`);
    
    // Test 3: Check for draft services
    console.log('\nTest 3: Check for draft services');
    const draftServices = await Service.find({ status: 'draft' });
    console.log(`Found: ${draftServices.length} draft services`);
    draftServices.forEach((s, i) => {
      console.log(`  ${i+1}. "${s.title}" by ${s.creator}`);
    });
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testServiceFilter();
