import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Check if the website was ever created
    const website = await mongoose.connection.collection('websites').findOne(
      { _id: mongoose.Types.ObjectId.createFromHexString('69b1b38293086978a0d070ff') }
    );
    
    if (website) {
      console.log('✅ Website found (should not exist):');
      console.log(JSON.stringify(website, null, 2));
    } else {
      console.log('❌ Website 69b1b38293086978a0d070ff does NOT exist');
      console.log('   (and never did based on this check)');
    }
    
    // Check if maybe it's a typo or similar ID
    console.log('\n📋 Searching for similar IDs...');
    const similarPattern = new RegExp('69b1b3829308697');
    const similar = await mongoose.connection.collection('websites').find(
      { _id: { $regex: similarPattern } }
    ).toArray();
    
    if (similar.length > 0) {
      console.log(`Found ${similar.length} websites with similar start:`);
      similar.forEach(w => {
        console.log(`  - ${w._id}`);
      });
    } else {
      console.log('No similar websites found');
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
  }
})();
