#!/usr/bin/env node

/**
 * Fix Staging Database _id Types
 * 
 * The backup-restore process serialized ObjectIds to JSON strings.
 * This script converts all string _id fields back to proper ObjectIds.
 * It also fixes known reference fields (e.g., websiteId, userId) that
 * should be ObjectIds.
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

// Known reference fields that should be ObjectIds (field name -> true)
const OBJECTID_FIELDS = new Set([
  '_id',
  'websiteId',
  'pageId',
  'sectionId',
  'userId',
  'courseId',
  'customerId',
  'enrollmentId',
  'specialistId',
  'creatorId',
  'templateId',
  'certificateId',
  'couponId',
  'conversationId',
  'messageId',
  'serviceId',
  'scheduleId',
  'slotId',
  'appointmentId',
  'brandingId',
  'profileId',
  'commissionId',
  'mediaId',
]);

function isObjectIdString(val) {
  return typeof val === 'string' && /^[a-f0-9]{24}$/.test(val);
}

async function fixCollection(db, collName) {
  const collection = db.collection(collName);
  const docs = await collection.find({}).toArray();
  
  if (docs.length === 0) return 0;

  let fixedCount = 0;

  for (const doc of docs) {
    const oldId = doc._id;
    
    // Only fix if _id is a string that looks like an ObjectId
    if (!isObjectIdString(oldId)) continue;

    const objectId = new mongoose.Types.ObjectId(oldId);

    // Check if ObjectId version already exists (partial previous run)
    const existing = await collection.findOne({ _id: objectId });
    if (existing) {
      // Just delete the string duplicate
      await collection.deleteOne({ _id: oldId });
      fixedCount++;
      continue;
    }

    // Build the new document with fixed IDs
    const newDoc = { ...doc };
    const fieldsFixed = [];

    // Fix _id
    newDoc._id = objectId;
    fieldsFixed.push('_id');

    // Fix known reference fields
    for (const [key, val] of Object.entries(newDoc)) {
      if (key === '_id') continue;
      
      if (OBJECTID_FIELDS.has(key) && isObjectIdString(val)) {
        newDoc[key] = new mongoose.Types.ObjectId(val);
        fieldsFixed.push(key);
      }
      
      // Handle arrays of ObjectId strings (e.g., sections: [...])
      if (Array.isArray(val)) {
        const fixedArr = val.map(item => {
          if (isObjectIdString(item)) {
            fieldsFixed.push(`${key}[]`);
            return new mongoose.Types.ObjectId(item);
          }
          return item;
        });
        newDoc[key] = fixedArr;
      }

      // Handle nested objects with known ref fields (one level deep)
      if (val && typeof val === 'object' && !Array.isArray(val) && !(val instanceof mongoose.Types.ObjectId) && !(val instanceof Date)) {
        for (const [nestedKey, nestedVal] of Object.entries(val)) {
          if (OBJECTID_FIELDS.has(nestedKey) && isObjectIdString(nestedVal)) {
            newDoc[key][nestedKey] = new mongoose.Types.ObjectId(nestedVal);
            fieldsFixed.push(`${key}.${nestedKey}`);
          }
        }
      }
    }

    // Delete old doc and insert new one (can't update _id)
    await collection.deleteOne({ _id: oldId });
    await collection.insertOne(newDoc);
    fixedCount++;
  }

  return fixedCount;
}

async function main() {
  console.log('🔧 Fixing staging database _id types...\n');
  
  const conn = await mongoose.connect(STAGING_URI, {
    serverSelectionTimeoutMS: 10000,
  });
  
  console.log('✅ Connected to staging database\n');
  
  const db = conn.connection.db;
  const collections = await db.listCollections().toArray();
  
  let totalFixed = 0;
  
  for (const colInfo of collections) {
    if (colInfo.name.startsWith('system.')) continue;
    
    const fixed = await fixCollection(db, colInfo.name);
    if (fixed > 0) {
      console.log(`  ✓ ${colInfo.name}: fixed ${fixed} documents`);
      totalFixed += fixed;
    } else {
      console.log(`  - ${colInfo.name}: no fixes needed`);
    }
  }
  
  console.log(`\n✅ Fixed ${totalFixed} documents total`);
  
  // Verify
  console.log('\n🔍 Verifying fix...');
  const website = await db.collection('websites').findOne({ subdomain: 'nest' });
  console.log(`  Website "nest" _id type: ${website._id.constructor.name}`);
  
  const byObjectId = await db.collection('websites').findOne({ 
    _id: new mongoose.Types.ObjectId(website._id.toString()) 
  });
  console.log(`  findById works: ${byObjectId ? 'YES ✅' : 'NO ❌'}`);
  
  await mongoose.disconnect();
  console.log('\nDone!');
}

main().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
