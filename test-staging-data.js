import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: './backend/.env.staging' });

async function checkStagingData() {
  try {
    const uri = process.env.MONGODB_URI;
    console.log('Connecting to staging...');
    await mongoose.connect(uri);
    
    const db = mongoose.connection.db;
    
    // Check for customer
    const customer = await db.collection('customers').findOne({ email: 'sinduja.vel@gmail.com' });
    
    if (!customer) {
      console.log('❌ Customer NOT found in staging');
      const count = await db.collection('customers').countDocuments();
      console.log(`Total customers in staging: ${count}`);
    } else {
      console.log(`✅ Customer found: ${customer._id}`);
      console.log(`Customer ID type: ${typeof customer._id}`);
      console.log(`Customer ID string: "${customer._id.toString()}"`);
      
      // Check enrollments
      const enrollments = await db.collection('selfpacedenrollments').find({
        customerId: customer._id.toString()
      }).toArray();
      
      console.log(`\nEnrollments found: ${enrollments.length}`);
      if (enrollments.length > 0) {
        enrollments.forEach((e, i) => {
          console.log(`  ${i+1}. Course: ${e.courseId}, CustomerId: ${e.customerId}`);
        });
      } else {
        console.log('Checking with ObjectId query...');
        const enrollmentsWithObjectId = await db.collection('selfpacedenrollments').find({
          customerId: customer._id
        }).toArray();
        console.log(`With ObjectId: ${enrollmentsWithObjectId.length} found`);
      }
    }
    
    await mongoose.disconnect();
  } catch (e) {
    console.error('Error:', e.message);
  }
}

checkStagingData();
