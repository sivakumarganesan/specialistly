import mongoose from 'mongoose';
import dotenv from 'dotenv';

async function checkProductionData() {
  console.log('🔍 CHECKING PRODUCTION DATABASE CONTENT\n');
  
  // Load production env
  dotenv.config({ path: './.env.production' });
  const prodUri = process.env.MONGODB_URI;
  
  try {
    await mongoose.connect(prodUri);
    const db = mongoose.connection.db;
    
    // Count documents in key collections
    const customersCount = await db.collection('customers').countDocuments();
    const enrollmentsCount = await db.collection('selfpacedenrollments').countDocuments();
    const coursesCount = await db.collection('selfpacedcourses').countDocuments();
    
    console.log(`📊 PRODUCTION DATABASE STATISTICS`);
    console.log(`---------------------------------`);
    console.log(`Customers: ${customersCount}`);
    console.log(`Enrollments: ${enrollmentsCount}`);
    console.log(`Courses: ${coursesCount}`);
    
    console.log(`\n📋 SAMPLE DATA`);
    console.log(`--------------`);
    
    if (customersCount > 0) {
      const sampleCustomers = await db.collection('customers').find().limit(3).toArray();
      console.log(`\nCustomers:`);
      sampleCustomers.forEach(c => {
        console.log(`  - ${c.email || c.name || c._id}`);
      });
    } else {
      console.log(`\n⚠️  NO CUSTOMERS in production database!`);
    }
    
    if (enrollmentsCount > 0) {
      const sampleEnrollments = await db.collection('selfpacedenrollments').find().limit(3).toArray();
      console.log(`\nEnrollments:`);
      sampleEnrollments.forEach(e => {
        console.log(`  - Customer: ${e.customerId}, Course: ${e.courseId}`);
      });
    } else {
      console.log(`\n⚠️  NO ENROLLMENTS in production database!`);
    }
    
    console.log(`\n🎯 CONCLUSION`);
    console.log(`-------------`);
    if (customersCount === 0 && enrollmentsCount === 0) {
      console.log(`Production database appears to be FRESH/EMPTY`);
      console.log(`Likely scenario: Data needs to be migrated from staging OR`);
      console.log(`production is a new environment that needs live data`);
    } else if (enrollmentsCount === 0) {
      console.log(`Production has customers but NO ENROLLMENTS`);
      console.log(`This explains why "My Courses" is empty`);
    } else {
      console.log(`Production has data, but customers might not have enrollments with their email`);
    }
    
    await mongoose.disconnect();
  } catch (e) {
    console.error('ERROR connecting to production database:', e.message);
  }
}

checkProductionData();
