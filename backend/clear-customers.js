import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const clearCustomers = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: 'specialistdb',
    });

    console.log('✓ Connected to MongoDB');

    // Delete all customers
    const result = await mongoose.connection.db.collection('customers').deleteMany({});
    console.log(`✓ Deleted ${result.deletedCount} customer(s)`);

    // Also clear customer-related appointment bookings
    const appointmentResult = await mongoose.connection.db.collection('appointmentslots').updateMany(
      { customerEmail: { $exists: true } },
      { 
        $set: { 
          status: 'available',
          bookedBy: null,
          customerEmail: null,
          customerName: null,
          googleMeetLink: null,
          googleEventId: null,
          serviceTitle: null
        } 
      }
    );
    console.log(`✓ Reset ${appointmentResult.modifiedCount} appointment slot(s)`);

    console.log('\n✅ All customers removed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('✗ Error:', error.message);
    process.exit(1);
  }
};

clearCustomers();
