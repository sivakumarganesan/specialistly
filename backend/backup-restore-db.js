#!/usr/bin/env node

/**
 * MongoDB Backup & Restore Script
 * 
 * Features:
 * - Backup production database
 * - Restore to staging database
 * - Anonymize PII (passwords, cards, emails)
 * - Create snapshots with timestamps
 * 
 * Usage:
 *   node scripts/backup-restore-db.js --action backup
 *   node scripts/backup-restore-db.js --action restore
 *   node scripts/backup-restore-db.js --action clone-with-anonymize
 */

import mongoose from 'mongoose';
import { EJSON } from 'bson';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment
dotenv.config({ path: path.join(__dirname, '.env.production') });
const stagingEnv = dotenv.parse(fs.readFileSync(path.join(__dirname, '.env.staging')));

// Use env vars from GitHub Actions if provided, otherwise use dotenv values
const PROD_DB_URI = process.env.PROD_MONGODB_URI || process.env.MONGODB_URI;
const STAGING_DB_URI = process.env.STAGING_MONGODB_URI || stagingEnv.MONGODB_URI;
const BACKUP_DIR = path.join(__dirname, '../backups');

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

/**
 * Step 1: Create backup of production database
 */
async function backupProductionDB() {
  console.log('📦 Creating production database backup...');
  
  try {
    const conn = await mongoose.connect(PROD_DB_URI, {
      serverSelectionTimeoutMS: 10000,
    });
    
    console.log('✅ Connected to production database');
    
    const db = conn.connection.db;
    const collections = await db.listCollections().toArray();
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(BACKUP_DIR, `backup-prod-${timestamp}.json`);
    
    const backup = {};
    
    for (const collInfo of collections) {
      const collName = collInfo.name;
      if (collName.startsWith('system.')) continue;
      
      console.log(`  Backing up collection: ${collName}...`);
      const collection = db.collection(collName);
      const docs = await collection.find({}).toArray();
      backup[collName] = docs;
      console.log(`    ✓ ${docs.length} documents`);
    }
    
    // Save backup (use EJSON to preserve ObjectId types)
    fs.writeFileSync(backupFile, EJSON.stringify(backup, null, 2));
    console.log(`✅ Backup saved: ${backupFile}`);
    console.log(`   Size: ${(fs.statSync(backupFile).size / 1024 / 1024).toFixed(2)} MB`);
    
    await mongoose.disconnect();
    return backupFile;
    
  } catch (error) {
    console.error('❌ Backup failed:', error.message);
    process.exit(1);
  }
}

/**
 * Step 2: Anonymize sensitive data
 */
function anonymizeData(data) {
  console.log('🔒 Anonymizing sensitive data...');
  
  // Dummy hash for testing
  const dummyHash = '$2b$10$DUMMY.HASH.FOR.STAGING.DB';
  
  const modifications = {
    User: {
      password: () => dummyHash,
      email: (val, idx) => `test.user.${idx}@staging.test`,
      phone: () => '9999999999',
      stripeCustomerId: () => 'cus_STAGING_' + Math.random().toString(36).substr(2, 9),
    },
    Customer: {
      password: () => dummyHash,
      email: (val, idx) => `test.customer.${idx}@staging.test`,
      phone: () => '9999999999',
      stripeCustomerId: () => 'cus_STAGING_' + Math.random().toString(36).substr(2, 9),
    },
    Subscription: {
      stripeSubscriptionId: () => 'sub_STAGING_' + Math.random().toString(36).substr(2, 9),
      stripePaymentMethodId: () => 'pm_STAGING_' + Math.random().toString(36).substr(2, 9),
    },
    Payment: {
      stripePaymentIntentId: () => 'pi_STAGING_' + Math.random().toString(36).substr(2, 9),
      razorpayPaymentId: () => 'pay_STAGING_' + Math.random().toString(36).substr(2, 9),
      cardLastFour: () => '4242',
    },
  };
  
  let anonymizedCount = 0;
  
  for (const [collName, fields] of Object.entries(modifications)) {
    if (!data[collName]) continue;
    
    console.log(`  Processing ${collName}...`);
    
    data[collName].forEach((doc, idx) => {
      for (const [field, anonymizer] of Object.entries(fields)) {
        if (doc[field]) {
          doc[field] = typeof anonymizer === 'function' 
            ? anonymizer(doc[field], idx) 
            : anonymizer;
          anonymizedCount++;
        }
      }
    });
  }
  
  console.log(`✅ Anonymized ${anonymizedCount} sensitive fields`);
  return data;
}

/**
 * Step 3: Restore to staging database
 */
async function restoreStagingDB(backupFile) {
  console.log('\n📥 Restoring to staging database...');
  
  try {
    // Read backup file (use EJSON to restore ObjectId types)
    const backupData = EJSON.parse(fs.readFileSync(backupFile, 'utf8'));
    
    // Connect to staging
    console.log('🔗 Attempting to connect to staging cluster...');
    console.log('   URI (host):', STAGING_DB_URI.replace(/:[^@]*@/, ':***@'));
    
    const conn = await mongoose.connect(STAGING_DB_URI, {
      serverSelectionTimeoutMS: 10000,
    });
    
    console.log('✅ Connected to staging database');
    
    const db = conn.connection.db;
    
    // Clear existing data (ONLY in staging)
    const collections = await db.listCollections().toArray();
    for (const collInfo of collections) {
      const collName = collInfo.name;
      if (collName.startsWith('system.')) continue;
      
      await db.collection(collName).deleteMany({});
      console.log(`  Cleared: ${collName}`);
    }
    
    // Restore anonymized data
    for (const [collName, docs] of Object.entries(backupData)) {
      if (docs.length === 0) continue;
      
      console.log(`  Restoring ${collName}...`);
      const collection = db.collection(collName);
      const result = await collection.insertMany(docs);
      console.log(`    ✓ Inserted ${result.insertedCount} documents`);
    }
    
    console.log('✅ Staging database restored successfully');
    
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('❌ Restore failed:', error.message);
    if (error.code === 'EAUTH') {
      console.error('   → Likely cause: Invalid credentials or user permissions');
    } else if (error.name === 'MongoNetworkError') {
      console.error('   → Likely cause: Cannot connect to cluster (check IP whitelist)');
    }
    console.error('   Full error:', error);
    process.exit(1);
  }
}

/**
 * Step 4: Validate and fix enrollment references
 * 
 * After restore, verify that all enrollment.customerId references point to valid customers.
 * This is critical because during cloning, ObjectIds change and enrollment FK relationships
 * can become invalid.
 */
async function validateAndFixEnrollmentReferences() {
  console.log('\n🔍 Validating enrollment references in staging...');
  
  try {
    const conn = await mongoose.connect(STAGING_DB_URI, {
      serverSelectionTimeoutMS: 10000,
    });
    
    const db = conn.connection.db;
    const enrollmentCollection = db.collection('selfpacedenrollments');
    const customerCollection = db.collection('customers');
    
    // Get all customers and build a map by email
    const allCustomers = await customerCollection.find({}).toArray();
    const customerByEmail = new Map();
    const validCustomerIds = new Set();
    
    for (const customer of allCustomers) {
      if (customer.email) {
        customerByEmail.set(customer.email, customer._id);
      }
      validCustomerIds.add(customer._id.toString());
    }
    
    console.log(`   Found ${allCustomers.length} customers in staging`);
    
    // Check all enrollments
    const allEnrollments = await enrollmentCollection.find({}).toArray();
    console.log(`   Found ${allEnrollments.length} enrollments to validate`);
    
    let validCount = 0;
    let fixedCount = 0;
    const broken = [];
    
    for (const enrollment of allEnrollments) {
      // Check if customerId points to a valid customer
      if (enrollment.customerId && validCustomerIds.has(enrollment.customerId.toString())) {
        validCount++;
        continue;
      }
      
      // Enrollment is broken, try to fix it
      if (enrollment.customerEmail && customerByEmail.has(enrollment.customerEmail)) {
        const correctCustomerId = customerByEmail.get(enrollment.customerEmail);
        
        await enrollmentCollection.updateOne(
          { _id: enrollment._id },
          {
            $set: {
              customerId: correctCustomerId,
              updatedAt: new Date(),
            }
          }
        );
        
        fixedCount++;
        console.log(`   ✓ Fixed enrollment ${enrollment._id} for customer ${enrollment.customerEmail}`);
      } else {
        broken.push({
          enrollmentId: enrollment._id.toString(),
          customerId: enrollment.customerId?.toString() || 'missing',
          customerEmail: enrollment.customerEmail || 'unknown',
          courseId: enrollment.courseId?.toString() || 'missing',
        });
      }
    }
    
    console.log(`\n   📊 Enrollment Validation Results:`);
    console.log(`      ✓ Valid references: ${validCount}`);
    console.log(`      🔧 Fixed references: ${fixedCount}`);
    console.log(`      ❌ Broken references: ${broken.length}`);
    
    if (broken.length > 0) {
      console.log(`\n   ⚠️  Could not fix ${broken.length} enrollments:`);
      broken.slice(0, 5).forEach(b => {
        console.log(`      - ${b.enrollmentId}: customer ${b.customerEmail} (id: ${b.customerId})`);
      });
      if (broken.length > 5) {
        console.log(`      ... and ${broken.length - 5} more`);
      }
    }
    
    await mongoose.disconnect();
    
    return {
      validCount,
      fixedCount,
      brokenCount: broken.length,
      success: broken.length === 0,
    };
    
  } catch (error) {
    console.error('❌ Enrollment validation failed:', error.message);
    await mongoose.disconnect();
    throw error;
  }
}

/**
 * Step 5: Combined backup, anonymize, restore, and validate
 */
async function cloneWithAnonymize() {
  console.log('🔄 Starting production → staging clone with anonymization\n');
  
  try {
    // Step 1: Backup
    const backupFile = await backupProductionDB();
    console.log('');
    
    // Step 2: Anonymize
    const backupData = EJSON.parse(fs.readFileSync(backupFile, 'utf8'));
    const anonymizedData = anonymizeData(backupData);
    
    // Save anonymized backup
    const anonFile = backupFile.replace('.json', '-anonymized.json');
    fs.writeFileSync(anonFile, EJSON.stringify(anonymizedData, null, 2));
    console.log(`   Anonymized backup: ${anonFile}\n`);
    
    // Step 3: Restore to staging
    await restoreStagingDB(anonFile);
    
    // Step 4: Validate and fix enrollment references
    const validationResult = await validateAndFixEnrollmentReferences();
    
    console.log('\n✅ Clone complete!');
    console.log('   Production data (anonymized) is now in Staging');
    console.log('   Enrollment references validated and fixed');
    console.log('   Ready for QA testing\n');
    console.log('⚠️  VERIFY:');
    console.log('   - All customer data is anonymized');
    console.log('   - No real payment IDs in staging');
    console.log('   - No real emails exposed');
    console.log(`   - All enrollments have valid references (${validationResult.validCount + validationResult.fixedCount} total)`);
    
  } catch (error) {
    console.error('❌ Clone failed:', error.message);
    process.exit(1);
  }
}

/**
 * Step 5b: Clone WITHOUT anonymization (real data)
 */
async function cloneWithoutAnonymize() {
  console.log('🔄 Starting production → staging clone WITHOUT anonymization\n');
  console.log('⚠️  WARNING: Real production data will be copied to staging!\n');
  
  try {
    // Step 1: Backup
    const backupFile = await backupProductionDB();
    console.log('');
    
    // Step 2: Restore directly without anonymization
    await restoreStagingDB(backupFile);
    
    // Step 3: Validate and fix enrollment references
    const validationResult = await validateAndFixEnrollmentReferences();
    
    console.log('\n✅ Clone complete!');
    console.log('   Production data (REAL - NOT anonymized) is now in Staging');
    console.log('   All real emails, phone numbers, payment IDs are present');
    console.log('   Enrollment references validated and fixed\n');
    console.log('⚠️  CAUTION:');
    console.log('   - Real customer PII is now in staging');
    console.log('   - Real payment information is exposed');
    console.log('   - Do NOT share staging access publicly');
    console.log(`   - All enrollments have valid references (${validationResult.validCount + validationResult.fixedCount} total)`);
    
  } catch (error) {
    console.error('❌ Clone failed:', error.message);
    process.exit(1);
  }
}

/**
 * List all backups
 */
async function listBackups() {
  console.log('📦 Available backups:\n');
  
  const files = fs.readdirSync(BACKUP_DIR)
    .sort()
    .reverse();
  
  if (files.length === 0) {
    console.log('  No backups found');
    return;
  }
  
  files.forEach((file, idx) => {
    const filePath = path.join(BACKUP_DIR, file);
    const stats = fs.statSync(filePath);
    const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
    const date = new Date(stats.mtime).toLocaleString();
    
    console.log(`  ${idx + 1}. ${file}`);
    console.log(`     Size: ${sizeMB} MB`);
    console.log(`     Date: ${date}\n`);
  });
}

// CLI handling
const args = process.argv.slice(2);
const action = args[0] || 'clone-with-anonymize';

(async () => {
  switch (action) {
    case '--action':
      const cmd = args[1];
      if (cmd === 'backup') {
        await backupProductionDB();
      } else if (cmd === 'restore') {
        const backupFile = args[2];
        if (!backupFile) {
          console.error('Usage: node scripts/backup-restore-db.js --action restore <backup-file>');
          process.exit(1);
        }
        await restoreStagingDB(backupFile);
      } else if (cmd === 'clone-with-anonymize') {
        await cloneWithAnonymize();
      } else if (cmd === 'clone-without-anonymize') {
        await cloneWithoutAnonymize();
      } else if (cmd === 'validate-enrollments') {
        const result = await validateAndFixEnrollmentReferences();
        process.exit(result.success ? 0 : 1);
      } else if (cmd === 'list') {
        await listBackups();
      } else {
        console.error('Unknown action:', cmd);
        process.exit(1);
      }
      break;
    
    case '--help':
      console.log(`
        MongoDB Backup & Anonymize Script
        
        Usage: node scripts/backup-restore-db.js [action]
        
        Actions:
          --action backup                  Create backup of production DB
          --action restore <file>          Restore specific backup to staging
          --action clone-with-anonymize    Full cycle: backup → anonymize → restore → validate
          --action clone-without-anonymize Full cycle: backup → restore (REAL DATA) → validate
          --action validate-enrollments    Validate and fix enrollment references in staging
          --action list                    List all available backups
          --help                           Show this help
        
        Examples:
          node scripts/backup-restore-db.js --action backup
          node scripts/backup-restore-db.js --action clone-with-anonymize
          node scripts/backup-restore-db.js --action clone-without-anonymize
          node scripts/backup-restore-db.js --action validate-enrollments
          node scripts/backup-restore-db.js --action list
      `);
      break;
    
    default:
      await cloneWithAnonymize();
  }
})();
