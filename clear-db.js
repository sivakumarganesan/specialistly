import mongoose from 'mongoose';

const mongoUri = 'mongodb+srv://specialistly:pass123@cluster0.jseized.mongodb.net/specialistly';

async function clearDatabase() {
  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    const db = mongoose.connection;
    
    // Clear collections
    const collections = ['users', 'courses', 'services', 'creatorprofiles', 'customers', 'websites', 'subscriptions', 'appointments'];
    
    for (const collection of collections) {
      try {
        const result = await db.collection(collection).deleteMany({});
        console.log(`✓ Cleared ${collection}: ${result.deletedCount} documents deleted`);
      } catch (err) {
        console.log(`⚠ ${collection}: ${err.message}`);
      }
    }

    console.log('\n✓ Database cleared successfully!');
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

clearDatabase();
