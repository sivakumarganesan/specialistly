import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Test BOTH environments
async function checkEnvironments() {
  console.log('🔍 CHECKING PRODUCTION vs STAGING DATABASES\n');
  
  // Staging database
  console.log('1️⃣  STAGING DATABASE');
  console.log('-------------------');
  dotenv.config({ path: './.env.staging' });
  let stagingUri = process.env.MONGODB_URI;
  console.log('Connection: ' + (stagingUri ? stagingUri.substring(0, 50) + '...' : 'NOT FOUND'));
  
  if (stagingUri) {
    try {
      await mongoose.connect(stagingUri);
      const db = mongoose.connection.db;
      
      const customer = await db.collection('customers').findOne({ email: 'sinduja.vel@gmail.com' });
      const enrollments = customer 
        ? await db.collection('selfpacedenrollments').find({ customerId: customer._id }).toArray()
        : [];
      
      console.log('Customer: ' + (customer ? customer.email : 'NOT FOUND'));
      console.log('Enrollments: ' + enrollments.length);
      
      await mongoose.disconnect();
    } catch (e) {
      console.log('Error: ' + e.message);
    }
  }
  
  console.log('\n2️⃣  PRODUCTION DATABASE');
  console.log('-----------------------');
  
  // Clear staging config
  delete process.env.MONGODB_URI;
  
  // Load production config
  dotenv.config({ path: './.env.production', override: true });
  let prodUri = process.env.MONGODB_URI;
  console.log('Connection: ' + (prodUri ? prodUri.substring(0, 50) + '...' : 'NOT FOUND'));
  
  if (prodUri) {
    try {
      await mongoose.connect(prodUri);
      const db = mongoose.connection.db;
      
      const customer = await db.collection('customers').findOne({ email: 'sinduja.vel@gmail.com' });
      const enrollments = customer
        ? await db.collection('selfpacedenrollments').find({ customerId: customer._id }).toArray()
        : [];
      
      console.log('Customer: ' + (customer ? customer.email : 'NOT FOUND'));
      console.log('Enrollments: ' + enrollments.length);
      
      await mongoose.disconnect();
    } catch (e) {
      console.log('Error: ' + e.message);
    }
  }
  
  console.log('\n📊 ANALYSIS');
  console.log('-----------');
  if (stagingUri === prodUri) {
    console.log('⚠️  Same database! (expected for staging/prod sync)');
  } else {
    console.log('❌ DIFFERENT DATABASES!');
    console.log('   Staging and Production use separate databases');
    console.log('   → Production database does not have the test customer');
    console.log('   → This is why enrollments are not visible in prod');
  }
}

checkEnvironments().catch(e => console.error('ERROR:', e));
