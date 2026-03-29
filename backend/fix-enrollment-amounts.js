/**
 * One-time migration: backfill `amount` on SelfPacedEnrollment records
 * that are missing it.
 *
 * For each enrollment where amount is null/undefined:
 *   - If paymentStatus === 'completed' → set amount = course.price
 *   - Otherwise → set amount = 0
 *
 * Usage:  node fix-enrollment-amounts.js
 * Requires MONGODB_URI env variable (or defaults to localhost).
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/specialistly';

async function run() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  const db = mongoose.connection.db;
  const enrollments = db.collection('selfpacedenrollments');
  const courses = db.collection('courses');

  // Find enrollments with no amount set
  const missing = await enrollments
    .find({ $or: [{ amount: null }, { amount: { $exists: false } }] })
    .toArray();

  console.log(`Found ${missing.length} enrollments with missing amount`);

  if (missing.length === 0) {
    console.log('Nothing to fix');
    await mongoose.disconnect();
    return;
  }

  // Build courseId → price map
  const courseIds = [...new Set(missing.map(e => e.courseId?.toString()).filter(Boolean))];
  const coursesDocs = await courses
    .find({ _id: { $in: courseIds.map(id => new mongoose.Types.ObjectId(id)) } })
    .project({ _id: 1, price: 1 })
    .toArray();
  const priceMap = {};
  for (const c of coursesDocs) {
    priceMap[c._id.toString()] = c.price || 0;
  }

  let updated = 0;
  for (const e of missing) {
    const coursePrice = priceMap[e.courseId?.toString()] || 0;
    const amount = e.paymentStatus === 'completed' ? coursePrice : 0;

    await enrollments.updateOne(
      { _id: e._id },
      { $set: { amount } }
    );
    updated++;
  }

  console.log(`Updated ${updated} enrollments`);
  await mongoose.disconnect();
  console.log('Done');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
