import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    console.log('🔍 Database Check:\n');
    
    // Check all websites
    console.log('1️⃣  Websites with specialistId === undefined:');
    const withoutSpecialistId = await mongoose.connection.collection('websites').find(
      { specialistId: { $exists: false } }
    ).toArray();
    console.log(`   Found ${withoutSpecialistId.length}`);
    withoutSpecialistId.forEach(w => {
      console.log(`   - ${w._id} (${w.creatorEmail})`);
    });
    
    console.log('\n2️⃣  Websites with specialistId === null:');
    const withNullSpecialistId = await mongoose.connection.collection('websites').find(
      { specialistId: null }
    ).toArray();
    console.log(`   Found ${withNullSpecialistId.length}`);
    withNullSpecialistId.forEach(w => {
      console.log(`   - ${w._id} (${w.creatorEmail})`);
    });
    
    console.log('\n3️⃣  ALL websites in database:');
    const allWebsites = await mongoose.connection.collection('websites').find({}).toArray();
    console.log(`   Total: ${allWebsites.length}\n`);
    allWebsites.forEach(w => {
      console.log(`   ID: ${w._id}`);
      console.log(`   Email: ${w.creatorEmail}`);
      console.log(`   specialistId: ${w.specialistId}`);
      console.log(`   specialistId type: ${typeof w.specialistId}`);
      console.log('   ---');
    });
    
    // Now check if maybe the website exists via a different query
    console.log('\n4️⃣  Direct findById for problematic website:');
    const websiteCollection = mongoose.connection.collection('websites');
    const specificWebsite = await websiteCollection.findOne({
      _id: mongoose.Types.ObjectId.createFromHexString('69b1b38293086978a0d070ff')
    });
    
    if (specificWebsite) {
      console.log('   ✅ FOUND it!');
      console.log(JSON.stringify(specificWebsite, null, 2));
    } else {
      console.log('   ❌ NOT FOUND');
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
  }
})();
