#!/usr/bin/env node

/**
 * MongoDB Atlas Migration Script
 * Migrates data between any two MongoDB instances
 * 
 * Usage:
 *   node migrate-atlas.js <source_uri> <source_db> <target_uri> <target_db>
 * 
 * Example (Development → Production):
 *   node migrate-atlas.js \
 *     "mongodb+srv://user:pass@dev-cluster.mongodb.net/?appName=Cluster0" \
 *     "specialistdb" \
 *     "mongodb+srv://specialistly_user:SpeciXlistly01@cluster0.jseized.mongodb.net/?appName=Cluster0" \
 *     "specialistdb_prod"
 */

import { MongoClient } from 'mongodb';

const args = process.argv.slice(2);

if (args.length < 4) {
  console.error('\n❌ Missing arguments!\n');
  console.error('Usage:');
  console.error('  node migrate-atlas.js <source_uri> <source_db> <target_uri> <target_db>\n');
  console.error('Example:');
  console.error('  node migrate-atlas.js \\');
  console.error('    "mongodb+srv://user:pass@dev.mongodb.net/?appName=Cluster0" \\');
  console.error('    "specialistdb" \\');
  console.error('    "mongodb+srv://user:pass@prod.mongodb.net/?appName=Cluster0" \\');
  console.error('    "specialistdb_prod"\n');
  process.exit(1);
}

const [SOURCE_URI, SOURCE_DB, TARGET_URI, TARGET_DB] = args;

async function migrateDatabase() {
  let sourceClient;
  let targetClient;

  try {
    console.log('🔄 Starting database migration...\n');

    // Connect to source database
    console.log(`📡 Connecting to source database: ${SOURCE_DB}...`);
    sourceClient = new MongoClient(SOURCE_URI);
    await sourceClient.connect();
    const sourceDb = sourceClient.db(SOURCE_DB);
    console.log(`✅ Connected to source database\n`);

    // Connect to target database
    console.log(`📡 Connecting to target database: ${TARGET_DB}...`);
    targetClient = new MongoClient(TARGET_URI);
    await targetClient.connect();
    const targetDb = targetClient.db(TARGET_DB);
    console.log(`✅ Connected to target database\n`);

    // Get all collections from source database
    console.log('📋 Fetching collections from source database...');
    const collections = await sourceDb.listCollections().toArray();
    console.log(`Found ${collections.length} collections\n`);

    if (collections.length === 0) {
      console.log('ℹ️ No collections to migrate');
      return;
    }

    // Migrate each collection
    let totalDocuments = 0;
    for (const collectionInfo of collections) {
      const collectionName = collectionInfo.name;
      console.log(`⏳ Migrating collection: ${collectionName}...`);

      const sourceCollection = sourceDb.collection(collectionName);
      const targetCollection = targetDb.collection(collectionName);

      // Get all documents from source collection
      const documents = await sourceCollection.find({}).toArray();
      console.log(`  Found ${documents.length} documents`);

      if (documents.length > 0) {
        // Clear target collection first
        await targetCollection.deleteMany({});

        // Insert documents to target
        const result = await targetCollection.insertMany(documents);
        console.log(`  ✅ Inserted ${result.insertedCount} documents\n`);
        totalDocuments += result.insertedCount;
      } else {
        console.log(`  ℹ️ No documents to migrate\n`);
      }
    }

    console.log('✨ Database migration completed successfully!');
    console.log('📊 Summary:');
    console.log(`   Source: ${SOURCE_DB}`);
    console.log(`   Target: ${TARGET_DB}`);
    console.log(`   Collections migrated: ${collections.length}`);
    console.log(`   Total documents: ${totalDocuments}`);

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    // Close connections
    if (sourceClient) await sourceClient.close();
    if (targetClient) await targetClient.close();
  }
}

// Run migration
migrateDatabase();
