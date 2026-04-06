import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.staging' });

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const db = mongoose.connection.db;
    
    console.log('🔍 Checking enrollments and their linked courses...\n');
    
    const email = 'sinduja.vel@gmail.com';
    const customer = await db.collection('customers').findOne({ email });
    
    if (!customer) {
      console.log('Customer not found');
      await mongoose.disconnect();
      return;
    }
    
    console.log('Customer found:', customer._id);
    
    // Get the enrollments
    const enrollments = await db.collection('selfpacedenrollments').find({ 
      customerId: customer._id 
    }).toArray();
    
    console.log(`\nFound ${enrollments.length} enrollments\n`);
    
    // Check each enrollment's courseId
    for (const enrollment of enrollments) {
      console.log(`Enrollment ${enrollment._id}`);
      console.log(`  courseId: ${enrollment.courseId}`);
      console.log(`  courseId type: ${enrollment.courseId.constructor.name}`);
      
      // Try to find the course
      const course = await db.collection('courses').findOne({ 
        _id: enrollment.courseId 
      });
      
      if (course) {
        console.log(`  ✅ Course found: ${course.title}`);
      } else {
        console.log(`  ❌ COURSE NOT FOUND! (This will cause 500 error)`);
      }
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
  }
})();
