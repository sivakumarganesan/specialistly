import mongoose from 'mongoose';

async function checkProductionData() {
  const prodUri = 'mongodb+srv://specialistly_user:SpeciXlistly01@cluster0.jseized.mongodb.net/specialistlydb_prod?appName=Cluster0';
  
  console.log('🔍 CHECKING PRODUCTION DATABASE CONTENT\n');
  
  try {
    await mongoose.connect(prodUri, { serverSelectionTimeoutMS: 5000 });
    const db = mongoose.connection.db;
    
    const customersCount = await db.collection('customers').countDocuments();
    const enrollmentsCount = await db.collection('selfpacedenrollments').countDocuments();
    const coursesCount = await db.collection('selfpacedcourses').countDocuments();
    
    console.log(`📊 PRODUCTION DATABASE STATISTICS`);
    console.log(`---------------------------------`);
    console.log(`Customers: ${customersCount}`);
    console.log(`Enrollments: ${enrollmentsCount}`);
    console.log(`Courses: ${coursesCount}`);
    
    if (customersCount > 0) {
      const customer = await db.collection('customers').findOne({ email: 'sinduja.vel@gmail.com' });
      if (customer) {
        console.log(`\n✅ Found test customer in production`);
        console.log(`   ID: ${customer._id}`);
        
        const enrollments = await db.collection('selfpacedenrollments').find({ customerId: customer._id }).toArray();
        console.log(`   Enrollments: ${enrollments.length}`);
      } else {
        console.log(`\n❌ Test customer NOT in production`);
        
        // Show sample customers
        const samples = await db.collection('customers').find().limit(3).toArray();
        console.log(`\n   Sample customers in production:`);
        samples.forEach(c => console.log(`   - ${c.email || c.name || 'unknown'}`));
      }
    } else {
      console.log(`\n❌ Production has NO CUSTOMERS!`);
    }
    
    console.log(`\n🎯 LIKELY SCENARIO`);
    console.log(`------------------`);
    if (customersCount === 0 && enrollmentsCount === 0) {
      console.log(`Production database is EMPTY or FRESH`);
      console.log(`Test data exists only in staging`);
    } else if (enrollmentsCount > 0) {
      console.log(`Production has enrollments - issue is in query/schema`);
    } else {
      console.log(`Production has customers but NO enrollments`);
    }
    
    await mongoose.disconnect();
  } catch (e) {
    console.error('❌ ERROR:', e.message);
  }
}

checkProductionData();
