import mongoose from 'mongoose';
import Customer from './models/Customer.js';

async function testCustomers() {
  try {
    await mongoose.connect('mongodb+srv://specialistly_user:SpeciXlistly01@cluster0.jseized.mongodb.net/specialistlydb_prod?appName=Cluster0');
    
    console.log('Connected to MongoDB');
    
    const customers = await Customer.find({});
    console.log('Customers found:', customers.length);
    console.log('Customers:', JSON.stringify(customers, null, 2));
    
    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

testCustomers();
