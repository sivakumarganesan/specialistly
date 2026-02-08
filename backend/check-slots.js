import mongoose from 'mongoose';

const mongoURI = 'mongodb://localhost:27017/specialistdb';

mongoose.connect(mongoURI).then(async () => {
  const db = mongoose.connection.db;
  const slots = await db.collection('appointmentslots').find({}).limit(3).toArray();
  
  console.log('\n📅 Sample Appointment Slots:');
  slots.forEach((slot, i) => {
    console.log(`\nSlot ${i + 1}:`);
    console.log(`  Date: ${slot.date}`);
    console.log(`  Start Time: ${slot.startTime}`);
    console.log(`  End Time: ${slot.endTime}`);
    console.log(`  Status: ${slot.status}`);
  });
  
  process.exit(0);
}).catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
