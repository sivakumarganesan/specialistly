import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.staging' });

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const db = mongoose.connection.db;
    
    console.log('🔍 Detailed inspection of customer and enrollment IDs...\n');
    
    // Get the customer
    const customer = await db.collection('customers').findOne({ email: /sinduja/i });
    
    console.log('Customer record:');
    console.log(`  _id: ${customer._id}`);
    console.log(`  _id type: ${typeof customer._id.toString()}`);
    console.log(`  _id value: ${customer._id.toString()}`);
    console.log(`  _id constructor: ${customer._id.constructor.name}`);
    
    console.log('\nEnrollments:');
    const enrollments = await db.collection('selfpacedenrollments').find({ customerId: customer._id }).limit(2).toArray();
    
    for (const enrollment of enrollments) {
      console.log(`\n  Enrollment ${enrollment._id}:`);
      console.log(`    customerId: ${enrollment.customerId}`);
      console.log(`    customerId type: ${typeof enrollment.customerId.toString()}`);
      console.log(`    customerId value: ${enrollment.customerId.toString()}`);
      console.log(`    customerId constructor: ${enrollment.customerId.constructor.name}`);
      console.log(`    Match? ${enrollment.customerId.toString() === customer._id.toString()}`);
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
  }
})();
