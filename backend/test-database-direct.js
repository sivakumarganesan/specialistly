import mongoose from 'mongoose';
import Customer from './models/Customer.js';
import dotenv from 'dotenv';

dotenv.config();

async function testDatabaseDirect() {
  try {
    console.log('MongoDB URI:', process.env.MONGODB_URI?.substring(0, 50) + '...');
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB');
    
    // Get all customers
    const customers = await Customer.find({});
    console.log('Total customers found:', customers.length);
    
    if (customers.length > 0) {
      console.log('First customer:');
      console.log(JSON.stringify(customers[0], null, 2));
    }
    
    // Check database stats
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\nCollections in database:');
    collections.forEach(col => {
      console.log('  -', col.name);
    });
    
    // Check customers collection specifically
    const db = mongoose.connection.db;
    const customersCollection = db.collection('customers');
    const count = await customersCollection.countDocuments();
    console.log('\nDirect collection count:', count);
    
    const docs = await customersCollection.find({}).toArray();
    console.log('Direct collection docs:', docs.length);
    if (docs.length > 0) {
      console.log('First doc from direct collection:');
      console.log(JSON.stringify(docs[0], null, 2));
    }
    
    await mongoose.disconnect();
    console.log('\n✓ Disconnected');
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

testDatabaseDirect();
