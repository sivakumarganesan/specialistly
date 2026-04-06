import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.staging' });

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const db = mongoose.connection.db;
    
    console.log('🔍 Testing ObjectId conversion logic locally...\n');
    
    const email = 'sinduja.vel@gmail.com';
    const customer = await db.collection('customers').findOne({ email });
    
    if (!customer) {
      console.log('❌ Customer not found');
      await mongoose.disconnect();
      return;
    }
    
    console.log('✅ Customer found');
    console.log('  _id:', customer._id);
    console.log('  Type:', customer._id.constructor.name);
    
    // Simulate what backend does
    const customerIdList = [customer._id.toString()];
    console.log('\n1️⃣ customerIdList:', customerIdList);
    
    console.log('\n2️⃣ Converting to ObjectIds:');
    const customerIdListAsObjectIds = customerIdList.map(id => {
      try {
        const isValid = mongoose.Types.ObjectId.isValid(id);
        if (isValid) {
          return new mongoose.Types.ObjectId(id);
        } else {
          return id;
        }
      } catch (e) {
        return id;
      }
    });
    
    console.log('  Result:', customerIdListAsObjectIds.map(id => id.toString()));
    
    // Test the query
    console.log('\n3️⃣ Querying enrollments...');
    const enrollments = await db.collection('selfpacedenrollments').find({ 
      customerId: { $in: customerIdListAsObjectIds } 
    }).toArray();
    
    console.log('✅ SUCCESS! Found:', enrollments.length, 'enrollments');
    
    if (enrollments.length > 0) {
      console.log('\n📚 Courses:');
      enrollments.forEach((e, i) => {
        console.log(`  ${i+1}. ${e.courseId}`);
      });
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  }
})();
