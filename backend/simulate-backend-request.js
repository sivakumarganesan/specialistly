import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Import models
import Customer from './models/Customer.js';
import SelfPacedEnrollment from './models/SelfPacedEnrollment.js';
import Course from './models/Course.js';

dotenv.config({ path: '.env.staging' });

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    console.log('🔍 Simulating exact backend request flow...\n');
    
    // Simulate request object
    const req = {
      user: undefined,  // No auth
      query: {},
      headers: {
        'x-customer-email': 'sinduja.vel@gmail.com'
      }
    };
    
    console.log('1️⃣ Request object:');
    console.log('  req.user:', req.user);
    console.log('  req.headers[x-customer-email]:', req.headers['x-customer-email']);
    console.log('  req.query.customerId:', req.query.customerId);
    
    // Simulate getMyCourses logic
    let customerIdList = [];
    
    // Priority 3: Check X-Customer-Email header
    if (customerIdList.length === 0 && req.headers['x-customer-email']) {
      console.log('\n2️⃣ Found X-Customer-Email header, looking up customer...');
      const headerEmail = req.headers['x-customer-email'];
      console.log('  Email:', headerEmail);
      
      const customer = await Customer.findOne({ email: headerEmail });
      if (customer) {
        customerIdList.push(customer._id.toString());
        console.log('  ✅ Customer found:');
        console.log('    ID:', customer._id.toString());
        console.log('    Type:', customer._id.constructor.name);
      } else {
        console.log('  ❌ Customer NOT found!');
        console.log('\n  Checking all customers in database...');
        const allCustomers = await Customer.find({}).limit(5);
        console.log(`  Total customers: ${await Customer.countDocuments()}`);
        allCustomers.forEach(c => {
          console.log(`    - ${c.email}`);
        });
      }
    }
    
    if (customerIdList.length === 0) {
      console.log('\n❌ No customer ID found - will return empty array');
    } else {
      console.log('\n3️⃣ Converting IDs to ObjectIds...');
      const customerIdListAsObjectIds = customerIdList.map(id => {
        try {
          return mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : id;
        } catch (e) {
          return id;
        }
      });
      
      console.log('4️⃣ Querying enrollments (without populate)...');
      const enrollments = await SelfPacedEnrollment.find({ 
        customerId: { $in: customerIdListAsObjectIds } 
      });
      
      console.log(`  Found: ${enrollments.length} enrollments`);
      
      if (enrollments.length > 0) {
        console.log('\n✅ WITH SCHEMA FIX - Mongoose query now finds courses!');
        enrollments.forEach((e, i) => {
          console.log(`  ${i+1}. courseId: ${e.courseId}`);
        });
      }
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
  }
})();
