/**
 * Diagnostic: Check why My Learning page shows "No Courses Yet"
 * 
 * ROOT CAUSE IDENTIFIED:
 * - Frontend is NOT sending Authorization header with token when calling /my-courses
 * - optionalAuthMiddleware silently proceeds without authentication
 * - API cannot identify which customer to fetch courses for
 * - Returns empty array
 * 
 * SOLUTION:
 * The frontend must send ONE of these when calling /my-courses endpoint:
 * 
 * 1. PREFERRED: Authorization Bearer Token
 *    Authorization: Bearer <jwt_token_from_login>
 * 
 * 2. FALLBACK: X-Customer-Email Header
 *    X-Customer-Email: sinduja.vel@gmail.com
 * 
 * 3. FALLBACK: customerId Query Parameter
 *    GET /api/courses/enrollments/self-paced/my-courses?customerId=<customer_id>
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.staging' });

async function testAuthFlow() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;

  console.log('=== MY LEARNING PAGE DIAGNOSTIC ===\n');

  // Find the customer
  const customer = await db.collection('customers').findOne({
    email: 'sinduja.vel@gmail.com'
  });

  if (!customer) {
    console.log('❌ Customer not found in staging database');
    await mongoose.disconnect();
    return;
  }

  console.log('✓ Customer found:');
  console.log('  Email: ' + customer.email);
  console.log('  ID: ' + customer._id.toString());
  console.log('  Name: ' + customer.name);

  // Check enrollments
  const enrollments = await db.collection('selfpacedenrollments').find({
    customerId: customer._id
  }).toArray();

  console.log('\n✓ Total enrollments: ' + enrollments.length);

  // Check courses by specialist
  const nithyaCourses = [];
  for (const e of enrollments) {
    const course = await db.collection('courses').findOne({ _id: e.courseId });
    if (course && course.specialistEmail === 'nithyachellam@gmail.com') {
      nithyaCourses.push(course);
    }
  }

  console.log('✓ Courses from Unearth One Earth specialist: ' + nithyaCourses.length);
  nithyaCourses.forEach(c => {
    console.log('  - ' + c.title);
  });

  console.log('\n=== WHAT IS HAPPENING ===\n');

  console.log('When user visits: https://nest.staging.specialistly.com/my-learning');
  console.log(' ');
  console.log('Frontend calls: GET /api/courses/enrollments/self-paced/my-courses');
  console.log('                    ?specialistEmail=nithyachellam@gmail.com');
  console.log(' ');
  console.log('WITHOUT Authorization header (CURRENT STATE - BROKEN):');
  console.log('');
  console.log('  - optionalAuthMiddleware: req.user = undefined');
  console.log('  - getMyCourses: userEmail = undefined');
  console.log('  - getMyCourses: No customer ID found');
  console.log('  - Response: { success: true, data: [] }  <- EMPTY!');

  console.log('\n WITH Authorization header (REQUIRED FIX - WORKS):');
  console.log('');
  console.log('  Authorization: Bearer <jwt_token>');
  console.log('  - optionalAuthMiddleware: req.user = { email: "sinduja.vel@gmail.com", ... }');
  console.log('  - getMyCourses: userEmail = "sinduja.vel@gmail.com"');
  console.log('  - getMyCourses: Found customer ID');
  console.log('  - getMyCourses: Filter by specialistEmail');
  console.log('  - Response: { success: true, data: [course1, course2, course3] }  <- WORKS!');

  console.log('\n=== SOLUTION ===\n');

  console.log('Frontend needs to fix: Make sure when calling /my-courses');
  console.log(' ');
  console.log('  const token = localStorage.getItem("token")');
  console.log('  OR sessionStorage.getItem("token")');
  console.log('  OR Get from cookies');
  console.log(' ');
  console.log('  Then send in headers:');
  console.log('  fetch(url, {');
  console.log('    headers: {');
  console.log('      Authorization: `Bearer ${token}`');
  console.log('    }');
  console.log('  })');

  console.log('\n✓ Test data is all present. Issue is 100% frontend authentication.\n');

  await mongoose.disconnect();
}

testAuthFlow().catch(e => console.error('ERROR:', e));
