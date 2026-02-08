import mongoose from 'mongoose';

const mongoUri = 'mongodb+srv://sivakumarganeshm:specialistlydb@cluster0.jseized.mongodb.net/?appName=Cluster0';

async function clearDatabase() {
  try {
    await mongoose.connect(mongoUri, {
      dbName: 'specialistdb'
    });
    console.log('Connected to MongoDB');

    const db = mongoose.connection;
    
    // Clear collections
    const collections = ['users', 'courses', 'services', 'creatorprofiles', 'customers', 'websites', 'subscriptions', 'appointments', 'appointmentslots'];
    
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
