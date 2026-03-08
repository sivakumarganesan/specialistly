import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const courseSchema = new mongoose.Schema(
  {
    title: String,
    specialistId: mongoose.Schema.Types.ObjectId,
    specialistEmail: String,
    price: Number,
  },
  { collection: 'courses' }
);

const Course = mongoose.model('Course', courseSchema);

async function listAllCourses() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    // Check ALL courses
    console.log('📚 All Courses (Free + Paid):');
    const courses = await Course.find({});
    
    if (courses.length === 0) {
      console.log('   (none found - you need to create a course first)\n');
      console.log('Steps to test payment flow:');
      console.log('1. Login as specialist (sivakumarganeshm@gmail.com)');
      console.log('2. Create a NEW course with a price (e.g., $19.99)');
      console.log('3. Publish the course');
      console.log('4. Logout and login as a CUSTOMER');
      console.log('5. Find the course and click "Enroll Now"');
      console.log('6. Test payment with card: 4242 4242 4242 4242');
    } else {
      courses.forEach((course) => {
        const price = course.price ? `$${(course.price / 100).toFixed(2)}` : 'FREE';
        console.log(`   • ${course.title} (ID: ${course._id})`);
        console.log(`     └─ Specialist: ${course.specialistEmail || 'Unknown'}`);
        console.log(`     └─ Price: ${price}`);
        console.log(`     └─ Specialist ID: ${course.specialistId}`);
      });
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

listAllCourses();
