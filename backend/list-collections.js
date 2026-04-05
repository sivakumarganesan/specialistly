import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.staging' });

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const db = mongoose.connection.db;
    
    console.log('📋 Available collections in staging database:\n');
    const collections = await db.listCollections().toArray();
    console.log(`Total collections: ${collections.length}\n`);
    
    for (const collection of collections) {
      const count = await db.collection(collection.name).countDocuments();
      console.log(`  ${collection.name}: ${count} documents`);
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
  }
})();
