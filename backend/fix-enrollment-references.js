#!/usr/bin/env node

/**
 * Fix Broken Customer References in Enrollment Data
 * 
 * During database clone, customer ObjectIds changed but enrollment documents
 * still referenced the old IDs. This script repairs the cross-references by:
 * 1. Finding enrollments with invalid customerId references
 * 2. Matching them by email or other fields
 * 3. Updating customerId to point to the correct customer
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env.staging') });

const STAGING_URI = process.env.MONGODB_URI;

async function main() {
  console.log('🔧 Fixing enrollment reference IDs...\n');
  
  const conn = await mongoose.connect(STAGING_URI, {
    serverSelectionTimeoutMS: 10000,
  });
  
  console.log('✅ Connected to staging database\n');
  
  const db = conn.connection.db;
  
  // Get all customers
  const customers = await db.collection('customers').find({}).toArray();
  console.log(`Found ${customers.length} customers`);
  
  // Create lookup maps
  const customersByEmail = new Map();
  const customersById = new Map();
  
  customers.forEach(customer => {
    if (customer.email) {
      customersByEmail.set(customer.email.toLowerCase(), customer);
    }
    customersById.set(customer._id.toString(), customer);
  });
  
  console.log(`Built lookup map: ${customersByEmail.size} by email, ${customersById.size} by ID\n`);
  
  // Get all enrollments
  const enrollments = await db.collection('selfpacedenrollments').find({}).toArray();
  console.log(`Found ${enrollments.length} enrollments\n`);
  
  let fixedCount = 0;
  let invalidCount = 0;
  const issues = [];
  
  for (const enrollment of enrollments) {
    const enrollmentCustomerId = enrollment.customerId?.toString();
    
    // Check if this enrollment's customerId points to a valid customer
    if (!customersById.has(enrollmentCustomerId)) {
      invalidCount++;
      
      // Try to find the correct customer by email
      let correctCustomer = null;
      
      // Check if enrollment has email field
      if (enrollment.customerEmail) {
        correctCustomer = customersByEmail.get(enrollment.customerEmail.toLowerCase());
      }
      
      // If found, update the enrollment
      if (correctCustomer) {
        console.log(`  Fixing enrollment ${enrollment._id}:`);
        console.log(`    Old customerId: ${enrollmentCustomerId}`);
        console.log(`    New customerId: ${correctCustomer._id}`);
        console.log(`    Email: ${enrollment.customerEmail}`);
        
        await db.collection('selfpacedenrollments').updateOne(
          { _id: enrollment._id },
          { $set: { customerId: correctCustomer._id } }
        );
        
        fixedCount++;
      } else {
        issues.push({
          enrollmentId: enrollment._id.toString(),
          customerId: enrollmentCustomerId,
          customerEmail: enrollment.customerEmail || 'NO EMAIL',
          reason: 'Could not find matching customer',
        });
      }
    }
  }
  
  console.log(`\n✅ Fixed: ${fixedCount} enrollments`);
  console.log(`⚠️  Invalid references found: ${invalidCount}`);
  
  if (issues.length > 0) {
    console.log(`\n❌ Unresolved issues: ${issues.length}`);
    console.table(issues);
  }
  
  // Verify the fix
  console.log('\n🔍 Verification...');
  const fixedEnrollments = await db.collection('selfpacedenrollments').find({}).toArray();
  let stillBroken = 0;
  
  for (const enrollment of fixedEnrollments) {
    if (!customersById.has(enrollment.customerId?.toString())) {
      stillBroken++;
    }
  }
  
  if (stillBroken === 0) {
    console.log('✅ All enrollment references are now valid!');
  } else {
    console.log(`❌ Still ${stillBroken} broken references`);
  }
  
  // Test a course retrieval
  console.log('\n🧪 Test: Checking if courses appear for customers...');
  const testCustomer = customers[0];
  if (testCustomer) {
    const testEnrollment = await db.collection('selfpacedenrollments').findOne({
      customerId: testCustomer._id
    });
    
    if (testEnrollment) {
      console.log(`✅ Customer ${testCustomer.email} has ${testEnrollment ? '1+' : '0'} enrollments`);
    } else {
      console.log(`⚠️  Customer ${testCustomer.email} has 0 enrollments`);
    }
  }
  
  await mongoose.disconnect();
  console.log('\n✅ Done!');
}

main().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
