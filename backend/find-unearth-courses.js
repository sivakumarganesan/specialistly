import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.staging' });

async function findUnearthCourse() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  
  console.log('=== FINDING UNEARTH ONE EARTH COURSES ===\n');
  
  // Find courses with Unearth in the name
  const courses = await db.collection('courses').find({
    title: { $regex: 'Unearth', $options: 'i' }
  }).toArray();
  
  if (courses.length === 0) {
    console.log('No courses found with Unearth in title');
    console.log('Looking at ALL courses to understand branding...\n');
    const allCourses = await db.collection('courses').find({}).limit(5).toArray();
    allCourses.forEach(c => {
      console.log('Course: ' + c.title);
      console.log('  Specialist: ' + c.specialistEmail);
      console.log('  Page/Brand: ' + (c.pageName || c.brandedDomain || 'N/A'));
      console.log('  Website ID: ' + (c.websiteId || 'N/A'));
    });
  } else {
    console.log('Found ' + courses.length + ' Unearth One Earth courses:');
    courses.forEach(c => {
      console.log('  Title: ' + c.title);
      console.log('  Specialist Email: ' + c.specialistEmail);
      console.log('  Page Name: ' + (c.pageName || 'N/A'));
      console.log('  Website ID: ' + (c.websiteId || 'N/A'));
    });
  }
  
  // Find if customer has any course
  const customer = await db.collection('customers').findOne({ email: 'sinduja.vel@gmail.com' });
  if (customer) {
    const enrollment = await db.collection('selfpacedenrollments').findOne({ customerId: customer._id });
    if (enrollment) {
      const course = await db.collection('courses').findOne({ _id: enrollment.courseId });
      console.log('\nFirst course customer is enrolled in:');
      console.log('  ' + course.title);
      console.log('  Specialist: ' + course.specialistEmail);
      console.log('  Page Name: ' + (course.pageName || 'N/A'));
      console.log('  Website ID: ' + (course.websiteId || 'N/A'));
    }
  }
  
  // Check for websites with this name
  console.log('\n=== CHECKING WEBSITES ===');
  const websites = await db.collection('websites').find({
    name: { $regex: 'Unearth', $options: 'i' }
  }).toArray();
  
  if (websites.length > 0) {
    console.log('Found ' + websites.length + ' website(s):');
    websites.forEach(w => {
      console.log('  Name: ' + w.name);
      console.log('  Owner ID: ' + w.ownerId);
      console.log('  Status: ' + w.status);
    });
  }
  
  await mongoose.disconnect();
}

findUnearthCourse().catch(e => console.error('ERROR:', e));
