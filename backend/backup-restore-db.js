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

const PROD_DB_URI = process.env.MONGODB_URI;
const STAGING_DB_URI = stagingEnv.MONGODB_URI;
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
    
    // Save backup
    fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2));
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
    // Read backup file
    const backupData = JSON.parse(fs.readFileSync(backupFile, 'utf8'));
    
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
 * Step 4: Combined backup, anonymize, and restore
 */
async function cloneWithAnonymize() {
  console.log('🔄 Starting production → staging clone with anonymization\n');
  
  try {
    // Step 1: Backup
    const backupFile = await backupProductionDB();
    console.log('');
    
    // Step 2: Anonymize
    const backupData = JSON.parse(fs.readFileSync(backupFile, 'utf8'));
    const anonymizedData = anonymizeData(backupData);
    
    // Save anonymized backup
    const anonFile = backupFile.replace('.json', '-anonymized.json');
    fs.writeFileSync(anonFile, JSON.stringify(anonymizedData, null, 2));
    console.log(`   Anonymized backup: ${anonFile}\n`);
    
    // Step 3: Restore to staging
    await restoreStagingDB(anonFile);
    
    console.log('\n✅ Clone complete!');
    console.log('   Production data (anonymized) is now in Staging');
    console.log('   Ready for QA testing\n');
    console.log('⚠️  VERIFY:');
    console.log('   - All customer data is anonymized');
    console.log('   - No real payment IDs in staging');
    console.log('   - No real emails exposed');
    
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
          --action clone-with-anonymize    Full cycle: backup → anonymize → restore
          --action list                    List all available backups
          --help                           Show this help
        
        Examples:
          node scripts/backup-restore-db.js --action backup
          node scripts/backup-restore-db.js --action list
          node scripts/backup-restore-db.js --action clone-with-anonymize
      `);
      break;
    
    default:
      await cloneWithAnonymize();
  }
})();
