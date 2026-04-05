import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.staging' });

async function testFix() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  
  console.log('=== Testing ObjectId Conversion Fix ===\n');
  
  const email = 'sinduja.vel@gmail.com';
  const customer = await db.collection('customers').findOne({ email });
  
  if (!customer) {
    console.log('❌ Customer not found');
    await mongoose.disconnect();
    return;
  }
  
  const customerIdList = [customer._id.toString()];
  console.log('✓ Customer found:', email);
  console.log('  customerIdList (strings):', customerIdList);
  
  // Convert to ObjectIds (this is what the fix does)
  const customerIdListAsObjectIds = customerIdList.map(id => {
    try {
      return mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : id;
    } catch (e) {
      return id;
    }
  });
  console.log('  After conversion to ObjectIds:', customerIdListAsObjectIds.map(id => id.toString()));
  
  // Query with string IDs (OLD - broken)
  const enrollmentsOld = await db.collection('selfpacedenrollments').find({ 
    customerId: { $in: customerIdList } 
  }).toArray();
  
  // Query with ObjectIds (NEW - fixed)
  const enrollmentsNew = await db.collection('selfpacedenrollments').find({ 
    customerId: { $in: customerIdListAsObjectIds } 
  }).toArray();
  
  console.log('\n=== Query Results ===');
  console.log('Old method (string IDs):', enrollmentsOld.length, 'enrollments');
  console.log('New method (ObjectIds):', enrollmentsNew.length, 'enrollments');
  
  if (enrollmentsNew.length > 0 && enrollmentsOld.length === 0) {
    console.log('\n✅ FIX WORKS! Converting to ObjectIds solves the problem');
    console.log('   Found ' + enrollmentsNew.length + ' courses that were hidden before');
  } else if (enrollmentsNew.length === 0) {
    console.log('\n❌ Still no results - problem not fixed');
  } else {
    console.log('\n⚠️  Both methods return same result - issue may be elsewhere');
  }
  
  await mongoose.disconnect();
}

testFix().catch(e => console.error('ERROR:', e));
