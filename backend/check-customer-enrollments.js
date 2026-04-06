import mongoose from 'mongoose';
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.staging' });

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('MONGODB_URI not set in .env');
  process.exit(1);
}

const client = new MongoClient(uri);

(async () => {
  try {
    await client.connect();
    const db = client.db('specialistly');
    
    // Find the customer
    console.log('🔍 Searching for customer: sinduja.vel@gmail.com\n');
    const customer = await db.collection('customers').findOne({ email: 'sinduja.vel@gmail.com' });
    
    if (!customer) {
      console.log('❌ Customer not found!');
      console.log('\n📋 Searching in enrollments collection to find what customer ID has 4 enrollments...');
      
      // Group enrollments by customerId to find which ID has the most
      const pipeline = [
        { $group: { _id: '$customerId', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ];
      
      const enrollmentGroups = await db.collection('selfpacedenrollments').aggregate(pipeline).toArray();
      console.log('\nTop customer IDs by enrollment count:');
      for (const group of enrollmentGroups) {
        console.log(`  ${group._id}: ${group.count} enrollments`);
      }
      
      console.log('\n📋 Available customers:');
      const allCustomers = await db.collection('customers').find({}).limit(10).toArray();
      console.log(`(Total customers: ${allCustomers.length})`);
      allCustomers.forEach(c => {
        console.log(`  - ${c.email} (id: ${c._id})`);
      });
    } else {
      console.log('✅ Customer found!');
      console.log('  ID:', customer._id);
      console.log('  Email:', customer.email);
      
      // Find enrollments for this customer
      console.log('\n🔍 Searching for enrollments...\n');
      const enrollments = await db.collection('selfpacedenrollments').find({ customerId: customer._id }).toArray();
      console.log(`✅ Found ${enrollments.length} enrollments (using ObjectId)`);
      
      if (enrollments.length === 0) {
        // Try with string ID
        console.log('\n📋 Trying with string ID...');
        const enrollmentsStr = await db.collection('selfpacedenrollments').find({ customerId: customer._id.toString() }).toArray();
        console.log(`   Found ${enrollmentsStr.length} enrollments with string ID`);
      } else {
        console.log('\n📋 Found enrollments using ObjectId:');
        enrollments.slice(0, 3).forEach((e, i) => {
          console.log(`  ${i+1}. Course ID: ${e.courseId}`);
        });
      }
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.close();
  }
})();
