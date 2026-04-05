import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.staging' });

async function checkUnearthOneEarth() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  
  console.log('=== CHECKING UNEARTH ONE EARTH SPECIALIST ===\n');
  
  // Find the specialist by searching
  const specialists = await db.collection('creatorprofiles').find({}).toArray();
  const specialist = specialists.find(s => s.specialistName && s.specialistName.includes('Unearth One Earth'));
  
  if (!specialist) {
    console.log('❌ Specialist not found by name');
    console.log('   Available specialists:');
    specialists.forEach(s => {
      console.log('   - ' + s.specialistName + ' (' + s.email + ')');
    });
    await mongoose.disconnect();
    return;
  }
  
  console.log('✓ Found specialist: ' + specialist.specialistName);
  console.log('  Email: ' + specialist.email);
  console.log('  ID: ' + specialist._id.toString());
  
  // Find courses for this specialist
  const courses = await db.collection('courses').find({
    specialistEmail: specialist.email
  }).toArray();
  
  console.log('\nCourses by this specialist: ' + courses.length);
  courses.forEach(c => {
    console.log('  - ' + c.title + ' (status: ' + c.status + ', id: ' + c._id.toString().substring(0, 8) + '...)');
  });
  
  // Now check enrollments for customer sinduja
  const customer = await db.collection('customers').findOne({
    email: 'sinduja.vel@gmail.com'
  });
  
  if (customer) {
    console.log('\nChecking enrollments for sinduja.vel@gmail.com:');
    const enrollments = await db.collection('selfpacedenrollments').find({
      customerId: customer._id
    }).toArray();
    
    console.log('  Total enrollments: ' + enrollments.length);
    
    let foundFromSpecialist = false;
    for (const e of enrollments) {
      const course = await db.collection('courses').findOne({ _id: e.courseId });
      if (course && course.specialistEmail === specialist.email) {
        foundFromSpecialist = true;
        console.log('  ✓ Enrolled in: ' + course.title);
      }
    }
    
    if (!foundFromSpecialist) {
      console.log('  ℹ️  No enrollments from this specialist');
      console.log('  (This explains why they see "No Courses Yet" on this page)');
    }
  }
  
  await mongoose.disconnect();
}

checkUnearthOneEarth().catch(e => {
  console.error('ERROR:', e);
  process.exit(1);
});
