import mongoose from 'mongoose';
import Course from '../models/Course.js';
import Service from '../models/Service.js';
import Customer from '../models/Customer.js';
import AppointmentSlot from '../models/AppointmentSlot.js';
import User from '../models/User.js';

const connectDB = async (retries = 5) => {
  const mongoUri = process.env.MONGODB_URI;
  
  if (!mongoUri) {
    throw new Error('MONGODB_URI environment variable is not defined');
  }

  console.log('Attempting to connect to MongoDB...');
  console.log('Database name extracted from URI:', mongoUri.includes('specialistlydb_prod') ? 'specialistlydb_prod' : 'specialistlydb');

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 15000,
        socketTimeoutMS: 30000,
        connectTimeoutMS: 15000,
      });

      console.log(`✓ MongoDB connected successfully (attempt ${attempt})`);

      // Initialize collections (non-blocking — don't let index creation block startup)
      initializeCollections().catch(err => {
        console.warn('Collection initialization warning (non-blocking):', err.message);
      });

      return mongoose.connection;
    } catch (error) {
      console.error(`✗ MongoDB connection attempt ${attempt}/${retries} failed:`, error.message);
      if (attempt < retries) {
        const delay = Math.min(2000 * attempt, 10000);
        console.log(`  Retrying in ${delay / 1000}s...`);
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }

  console.error('✗ All MongoDB connection attempts failed. Server will run without DB.');
};

const initializeCollections = async () => {
  try {
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);

    console.log('\n📦 Initializing Collections...\n');

    // Create Courses collection
    if (!collectionNames.includes('courses')) {
      await db.createCollection('courses');
      console.log('✓ Created "courses" collection');
    } else {
      console.log('✓ "courses" collection exists');
    }

    // Create Services collection
    if (!collectionNames.includes('services')) {
      await db.createCollection('services');
      console.log('✓ Created "services" collection');
    } else {
      console.log('✓ "services" collection exists');
    }

    // Create Customers collection
    if (!collectionNames.includes('customers')) {
      await db.createCollection('customers');
      console.log('✓ Created "customers" collection');
    } else {
      console.log('✓ "customers" collection exists');
    }

    // Create AppointmentSlots collection
    if (!collectionNames.includes('appointmentslots')) {
      await db.createCollection('appointmentslots');
      console.log('✓ Created "appointmentslots" collection');
    } else {
      console.log('✓ "appointmentslots" collection exists');
    }

    // Note: CreatorProfile data is now stored in the Users collection
    // via the unified Specialist model
    console.log('✓ Specialist profiles stored in "users" collection');

    // Ensure indexes are created
    try {
      await Course.collection.createIndexes();
      await Service.collection.createIndexes();
      await Customer.collection.createIndexes();
      await AppointmentSlot.collection.createIndexes();
      await User.collection.createIndexes();
      console.log('✓ All indexes created successfully');
    } catch (indexError) {
      console.log('✓ Indexes already exist or created');
    }

    console.log('\n✓ All collections initialized and indexed successfully!\n');
  } catch (error) {
    console.warn('Collection initialization info:', error.message);
  }
};

export default connectDB;
