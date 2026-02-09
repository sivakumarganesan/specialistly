import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Customer from './models/Customer.js';
import AppointmentSlot from './models/AppointmentSlot.js';

dotenv.config();

const mongoUri = process.env.MONGODB_URI;

async function migrateCustomers() {
  try {
    await mongoose.connect(mongoUri);
    console.log('✓ Connected to MongoDB');

    // Get all customers
    const customers = await Customer.find();
    console.log(`Found ${customers.length} customers to migrate`);

    for (const customer of customers) {
      // Get all appointment slots booked by this customer
      const slots = await AppointmentSlot.find({ 
        customerEmail: customer.email,
        status: 'booked'
      });

      if (slots.length > 0) {
        // Initialize specialists array if not present
        if (!customer.specialists) {
          customer.specialists = [];
        }

        // Add specialists from appointment slots
        for (const slot of slots) {
          if (slot.specialistEmail) {
            const existingSpecialist = customer.specialists.find(
              (s) => s.specialistEmail === slot.specialistEmail
            );
            if (!existingSpecialist) {
              customer.specialists.push({
                specialistId: slot.specialistId || null,
                specialistEmail: slot.specialistEmail,
                specialistName: slot.specialistName || 'Unknown',
                firstBookedDate: slot.startTime || new Date(),
              });
            }
          }
        }

        await customer.save();
        console.log(`✓ Migrated ${customer.name} - added ${customer.specialists.length} specialist(s)`);
      }
    }

    console.log('\n✓ Migration completed successfully!');
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error.message);
    process.exit(1);
  }
}

migrateCustomers();
