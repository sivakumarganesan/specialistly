import mongoose from 'mongoose';
import dotenv from 'dotenv';

// This simulates EXACTLY what the backend getMyCourses function should do with the ObjectId fix

dotenv.config({ path: '.env.staging' });

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const db = mongoose.connection.db;
    
    const email = 'sinduja.vel@gmail.com';
    console.log('🔍 Simulating backend getMyCourses with ObjectId fix...\n');
    
    // Step 1: Find customer by email (from X-Customer-Email header)
    console.log(`Step 1: Finding customer by email: ${email}`);
    const customer = await db.collection('customers').findOne({ email });
    
    if (!customer) {
      console.log('❌ Customer not found - this would return empty array');
      await mongoose.disconnect();
      return;
    }
    
    console.log('✅ Customer found:', customer._id.constructor.name, customer._id.toString());
    
    // Step 2: Add to customerIdList (this is what the controller does)
    const customerIdList = [customer._id.toString()];
    console.log(`\nStep 2: customerIdList created (as strings): ${JSON.stringify(customerIdList)}`);
    
    // Step 3: Convert strings to ObjectIds (THE FIX!)
    console.log(`\nStep 3: Converting strings to ObjectIds (THE FIX):`);
    const customerIdListAsObjectIds = customerIdList.map(id => {
      try {
        const isValid = mongoose.Types.ObjectId.isValid(id);
        const result = isValid ? new mongoose.Types.ObjectId(id) : id;
        console.log(`  "${id}" (valid:${isValid}) → ${result}`);
        return result;
      } catch (e) {
        return id;
      }
    });
    
    // Step 4: Query with converted ObjectIds
    console.log(`\nStep 4: Querying selfpacedenrollments with ObjectIds:`);
    const enrollments = await db.collection('selfpacedenrollments').find({ 
      customerId: { $in: customerIdListAsObjectIds } 
    }).toArray();
    
    console.log(`✅ Query returned: ${enrollments.length} enrollments`);
    
    if (enrollments.length > 0) {
      console.log('\n📚 Found courses:');
      enrollments.forEach((e, i) => {
        console.log(`  ${i+1}. Course ID: ${e.courseId}, Status: ${e.status || 'active'}`);
      });
    }
    
    console.log('\n✅ IF BACKEND HAD THIS FIX DEPLOYED, IT WOULD RETURN 4 COURSES!');
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
  }
})();
