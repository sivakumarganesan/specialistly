import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const creatorProfileSchema = new mongoose.Schema(
  {
    creatorName: String,
    email: String,
    bio: String,
    stripeAccountId: String,
    stripeConnectStatus: String,
    commissionPercentage: Number,
  },
  { collection: 'creatorprofiles' }
);

const courseSchema = new mongoose.Schema(
  {
    title: String,
    specialistId: mongoose.Schema.Types.ObjectId,
    specialistEmail: String,
    price: Number,
  },
  { collection: 'courses' }
);

const CreatorProfile = mongoose.model('CreatorProfile', creatorProfileSchema);
const Course = mongoose.model('Course', courseSchema);

async function diagnose() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    // Check creator profiles
    console.log('📋 Creator Profiles:');
    const profiles = await CreatorProfile.find({});
    if (profiles.length === 0) {
      console.log('   (none found)');
    } else {
      profiles.forEach((p) => {
        console.log(`   • ${p.creatorName} (${p.email})`);
        console.log(`     └─ Stripe: ${p.stripeAccountId || 'NOT SET'} [${p.stripeConnectStatus}]`);
      });
    }

    // Check courses
    console.log('\n📚 Paid Courses:');
    const courses = await Course.find({ price: { $gt: 0 } });
    if (courses.length === 0) {
      console.log('   (none found)');
    } else {
      for (const course of courses) {
        console.log(`   • ${course.title} ($${(course.price / 100).toFixed(2)})`);
        console.log(`     └─ Specialist: ${course.specialistEmail}`);
        
        // Find specialist for this course
        const specialist = await CreatorProfile.findById(course.specialistId);
        if (specialist) {
          console.log(`        Stripe Setup: ${specialist.stripeAccountId ? '✅ YES' : '❌ NO'}`);
        } else {
          console.log(`        Stripe Setup: ⚠️  Specialist profile not found`);
        }
      }
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

diagnose();
