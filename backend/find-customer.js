import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.staging' });

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const db = mongoose.connection.db;
    
    console.log('🔍 Searching for customer by email pattern...\n');
    
    // Search for email containing 'sinduja'
    const customers = await db.collection('customers').find({ email: /sinduja/i }).toArray();
    
    if (customers.length === 0) {
      console.log('❌ No customers with "sinduja" in email\n');
      console.log('📋 Sample customers:');
      const sample = await db.collection('customers').find({}).limit(5).toArray();
      sample.forEach(c => {
        console.log(`  - ${c.email} (id: ${c._id})`);
      });
    } else {
      console.log(`✅ Found ${customers.length} customer(s) with "sinduja":\n`);
      for (const customer of customers) {
        console.log(`  Email: ${customer.email}`);
        console.log(`  ID: ${customer._id}`);
        
        // Find enrollments for this customer
        const enrollments = await db.collection('selfpacedenrollments').find({ customerId: customer._id }).toArray();
        console.log(`  Enrollments (with ObjectId): ${enrollments.length}`);
        
        const enrollmentsStr = await db.collection('selfpacedenrollments').find({ customerId: customer._id.toString() }).toArray();
        console.log(`  Enrollments (with string): ${enrollmentsStr.length}\n`);
      }
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
  }
})();
