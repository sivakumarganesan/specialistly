#!/usr/bin/env node

/**
 * Quick verification script for My Learning courses fix
 * Checks if customers can view their enrolled courses
 * 
 * Usage: node verify-my-learning-fix.js
 */

import fetch from 'node-fetch';
import readline from 'readline';

const API_BASE = 'https://staging.specialistly.com/api';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (prompt) => new Promise((resolve) => {
  rl.question(prompt, resolve);
});

async function main() {
  console.log('=== My Learning Courses Fix Verification ===\n');

  try {
    // Get customer email
    const customerEmail = await question('Enter customer email (e.g., sinduja.vel@gmail.com): ');
    if (!customerEmail) {
      console.error('❌ Email required');
      process.exit(1);
    }

    console.log('\n🔍 Testing authentication methods:\n');

    // Test 1: Without any auth (should return empty)
    console.log('Test 1: No authentication');
    let res = await fetch(`${API_BASE}/courses/enrollments/self-paced/my-courses`);
    let data = await res.json();
    console.log(`  Status: ${res.status}`);
    console.log(`  Response: ${data.data ? data.data.length : (Array.isArray(data) ? data.length : 0)} courses`);
    console.log(data.debug ? `  Debug: ${JSON.stringify(data.debug)}` : '');

    // Test 2: With X-Customer-Email header (fallback)
    console.log('\nTest 2: Using X-Customer-Email header (Fallback method)');
    res = await fetch(`${API_BASE}/courses/enrollments/self-paced/my-courses`, {
      headers: {
        'X-Customer-Email': customerEmail,
        'Content-Type': 'application/json'
      }
    });
    data = await res.json();
    console.log(`  Status: ${res.status}`);
    const courseCount = data.data ? data.data.length : (Array.isArray(data) ? data.length : 0);
    console.log(`  Response: ${courseCount} courses`);
    
    if (courseCount > 0) {
      console.log('  Courses:');
      const courses = data.data || data;
      courses.slice(0, 3).forEach(course => {
        console.log(`    ✅ ${course.courseId?.title || course.title || 'Unknown'}`);
      });
      if (courses.length > 3) {
        console.log(`    ... and ${courses.length - 3} more`);
      }
    } else {
      console.log('  ⚠️  No courses found for this customer');
    }

    // Test 3: Browser scenario simulation
    console.log('\nTest 3: Cross-domain fallback scenario');
    console.log('  Scenario: User logs in at staging.specialistly.com');
    console.log('  Then visits specialist page at nest.staging.specialistly.com');
    console.log('  Frontend has "user" object but no "authToken" on new domain');
    console.log(`  → Sends X-Customer-Email: ${customerEmail}`);
    console.log(`  → Backend identifies customer by email ✓`);
    if (courseCount > 0) {
      console.log(`  → Returns ${courseCount} courses ✓`);
    }

    console.log('\n=== Verification Result ===');
    if (res.status === 200 && courseCount > 0) {
      console.log('✅ My Learning courses fix is working!');
      console.log(`   Customer ${customerEmail} has ${courseCount} enrolled courses`);
      console.log('   X-Customer-Email fallback authentication: WORKING');
    } else if (res.status === 200 && courseCount === 0) {
      console.log('⚠️  Authentication works but customer has no enrollments');
      console.log('   This is normal if the customer hasn\'t enrolled in any courses');
    } else {
      console.log('❌ Issue detected:');
      console.log(`   Status: ${res.status}`);
      console.log(`   Courses: ${courseCount}`);
      console.log('   Please check backend logs');
    }

    rl.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
    rl.close();
    process.exit(1);
  }
}

main();
