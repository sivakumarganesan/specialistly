import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load staging env
dotenv.config({ path: './backend/.env.staging' });

async function debugMyCourses() {
  try {
    const stagingUri = process.env.MONGODB_URI;
    console.log('🔍 Connecting to staging database...');
    await mongoose.connect(stagingUri);
    
    const db = mongoose.connection.db;
    
    const testEmail = 'sinduja.vel@gmail.com';
    
    // Find customer
    console.log(`\n1️⃣  Looking for customer: ${testEmail}`);
    const customer = await db.collection('customers').findOne({ email: testEmail });
    if (!customer) {
      console.log('❌ Customer NOT found');
      const sampleCustomers = await db.collection('customers').find().limit(3).toArray();
      console.log('Sample customers:', sampleCustomers.map(c => c.email));
    } else {
      console.log('✅ Customer found:', customer._id);
      
      // Find enrollments
      console.log(`\n2️⃣  Looking for enrollments with customerId: ${customer._id}`);
      const enrollments = await db.collection('selfpacedenrollments').find({ customerId: customer._id.toString() }).toArray();
      console.log(`Found ${enrollments.length} enrollments`);
      
      if (enrollments.length === 0) {
        console.log('\n⚠️  No enrollments found for this customer');
        console.log('Checking sample enrollments in the collection...');
        const samples = await db.collection('selfpacedenrollments').find().limit(5).toArray();
        console.log('Sample enrollments:', samples.map(e => ({ 
          customerId: e.customerId, 
          customerId_type: typeof e.customerId,
          customerEmail: e.customerEmail 
        })));
      } else {
        console.log('✅ Enrollments found:');
        enrollments.forEach(e => {
          console.log(`  - Course: ${e.courseId}, Status: ${e.status}`);
        });
      }
    }
    
    await mongoose.disconnect();
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
}

debugMyCourses();
