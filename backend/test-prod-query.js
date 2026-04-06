import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.production' });

// Define minimal schemas for testing
const customerSchema = new mongoose.Schema({ email: String });
const enrollmentSchema = new mongoose.Schema({
  customerId: String,
  courseId: String
});

async function testQuery() {
  console.log('🧪 Testing enrollment query against production database...\n');
  
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const Customer = mongoose.model('Customer', customerSchema);
    const Enrollment = mongoose.model('Enrollment', enrollmentSchema, 'selfpacedenrollments');
    
    // Find customer
    const customer = await Customer.findOne({ email: 'sinduja.vel@gmail.com' });
    console.log('Customer lookup:');
    console.log(`  Email: ${customer.email}`);
    console.log(`  _id: ${customer._id}`);
    console.log(`  _id.toString(): ${customer._id.toString()}`);
    
    const customerIdString = customer._id.toString();
    console.log(`\nQuerying enrollments with customerId: "${customerIdString}"`);
    
    const enrollments = await Enrollment.find({ 
      customerId: { $in: [customerIdString] } 
    });
    
    console.log(`\n✅ Found enrollments: ${enrollments.length}`);
    
    if (enrollments.length > 0) {
      console.log('\n🎉 SUCCESS! Production database is returning enrollments');
    } else {
      console.log('\n⚠️ No enrollments found. Checking raw database...');
      
      const rawEnrollments = await mongoose.connection.db
        .collection('selfpacedenrollments')
        .find({ customerId: customerIdString })
        .toArray();
      
      console.log(`Raw MongoDB query result: ${rawEnrollments.length}`);
    }
    
    await mongoose.disconnect();
  } catch (e) {
    console.error('ERROR:', e.message);
  }
}

testQuery();
