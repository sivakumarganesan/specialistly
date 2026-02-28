import dotenv from 'dotenv';
dotenv.config();
import { MongoClient } from 'mongodb';

async function updateSlots() {
  const client = new MongoClient(process.env.MONGODB_URI);
  try {
    await client.connect();
    const db = client.db('specialistdb');
    const collection = db.collection('appointmentslots');
    
    // Update ALL documents in the collection
    const result = await collection.updateMany(
      {},
      {
        $set: {
          specialistEmail: 'sivakumarganeshm@gmail.com',
          specialistName: 'Siva Kumar Ganesham'
        }
      }
    );
    
    console.log(`✓ Updated ${result.modifiedCount} documents`);
    
    // Verify
    const count = await collection.countDocuments({
      specialistEmail: 'sivakumarganeshm@gmail.com',
      status: 'available'
    });
    console.log(`✓ Now ${count} available slots for the specialist`);
    
  } finally {
    await client.close();
  }
}

updateSlots().catch(console.error);
