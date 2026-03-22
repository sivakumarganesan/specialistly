import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    console.log('📋 Raw MongoDB Collection Check:\n');
    
    // Query raw collection without Mongoose
    const collection = mongoose.connection.collection('websites');
    const allDocs = await collection.find({}).toArray();
    
    console.log(`Total documents in 'websites' collection: ${allDocs.length}\n`);
    
    allDocs.forEach((doc, i) => {
      console.log(`${i+1}. Document`);
      console.log(`   _id: ${doc._id}`);
      console.log(`   creatorEmail: ${doc.creatorEmail}`);
      console.log(`   specialistId: ${doc.specialistId}`);
      console.log(`   name: ${doc.name}`);
      console.log(`   Keys: ${Object.keys(doc).join(', ')}`);
      console.log('');
    });
    
    // Specifically look for the problem ID
    console.log('🔎 Looking for 69b1b38293086978a0d070ff:');
    const targetId = mongoose.Types.ObjectId.createFromHexString('69b1b38293086978a0d070ff');
    const doc = await collection.findOne({ _id: targetId });
    
    if (doc) {
      console.log('   ✅ FOUND:');
      console.log(JSON.stringify(doc, null, 2));
    } else {
      console.log('   ❌ NOT FOUND');
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
})();
