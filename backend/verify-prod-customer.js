import mongoose from 'mongoose';

async function checkProdDB() {
  const prodUri = 'mongodb+srv://specialistly_user:SpeciXlistly01@cluster0.jseized.mongodb.net/specialistlydb_prod?appName=Cluster0';
  
  console.log('🔍 Checking production database...\n');
  
  try {
    await mongoose.connect(prodUri, { serverSelectionTimeoutMS: 5000 });
    const db = mongoose.connection.db;
    
    // Check if customers collection exists
    const customer = await db.collection('customers').findOne({ email: 'sinduja.vel@gmail.com' });
    
    if (customer) {
      console.log('✅ Customer found in production:');
      console.log(`   Email: ${customer.email}`);
      console.log(`   ID: ${customer._id}`);
      console.log(`   ID Type: ${customer._id.constructor.name}`);
      
      // Check enrollments
      const enrollments = await db.collection('selfpacedenrollments')
        .find({ customerId: customer._id.toString() })
        .toArray();
      
      console.log(`\n   Enrollments (matching String ID): ${enrollments.length}`);
      
      // Also check with ObjectId
      const enrollmentsObjId = await db.collection('selfpacedenrollments')
        .find({ customerId: customer._id })
        .toArray();
      
      console.log(`   Enrollments (matching ObjectId ID): ${enrollmentsObjId.length}`);
      
      if (enrollments.length > 0) {
        console.log(`\n   ✅ Found enrollments with String ID!`);
        enrollments.slice(0, 2).forEach(e => {
          console.log(`   - Course: ${e.courseId}, Type: ${e.customerId.constructor.name}`);
        });
      }
    } else {
      console.log('❌ Customer NOT found in production');
      const count = await db.collection('customers').countDocuments();
      console.log(`   Total customers in production: ${count}`);
      
      if (count > 0) {
        const sample = await db.collection('customers').findOne();
        console.log(`   Sample customer: ${sample.email || sample.name}`);
      }
    }
    
    await mongoose.disconnect();
  } catch (e) {
    console.error('❌ ERROR:', e.message);
  }
}

checkProdDB();
