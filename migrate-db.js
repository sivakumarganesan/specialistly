#!/usr/bin/env node

/**
 * Database Migration Script
 * Migrates data from local specialistdb to production specialistdb_prod
 * 
 * Usage: node migrate-db.js
 */

import { MongoClient } from 'mongodb';

// Configuration
const LOCAL_URI = 'mongodb://localhost:27017/specialistdb';
const PROD_URI = 'mongodb+srv://specialistly_user:SpeciXlistly01@cluster0.jseized.mongodb.net/specialistdb_prod?appName=Cluster0';

async function migrateDatabase() {
  let localClient;
  let prodClient;

  try {
    console.log('🔄 Starting database migration...\n');

    // Connect to local database
    console.log('📡 Connecting to local database (localhost:27017)...');
    localClient = new MongoClient(LOCAL_URI);
    await localClient.connect();
    const localDb = localClient.db('specialistdb');
    console.log('✅ Connected to local database\n');

    // Connect to production database
    console.log('📡 Connecting to production database (MongoDB Atlas)...');
    prodClient = new MongoClient(PROD_URI);
    await prodClient.connect();
    const prodDb = prodClient.db('specialistdb_prod');
    console.log('✅ Connected to production database\n');

    // Get all collections from local database
    console.log('📋 Fetching collections from local database...');
    const collections = await localDb.listCollections().toArray();
    console.log(`Found ${collections.length} collections\n`);

    // Migrate each collection
    for (const collectionInfo of collections) {
      const collectionName = collectionInfo.name;
      console.log(`⏳ Migrating collection: ${collectionName}...`);

      const localCollection = localDb.collection(collectionName);
      const prodCollection = prodDb.collection(collectionName);

      // Get all documents from local collection
      const documents = await localCollection.find({}).toArray();
      console.log(`  Found ${documents.length} documents`);

      if (documents.length > 0) {
        // Clear production collection first
        await prodCollection.deleteMany({});

        // Insert documents to production
        const result = await prodCollection.insertMany(documents);
        console.log(`  ✅ Inserted ${result.insertedCount} documents\n`);
      } else {
        console.log(`  ℹ️ No documents to migrate\n`);
      }
    }

    console.log('✨ Database migration completed successfully!');
    console.log('📊 Summary:');
    console.log(`   Source: specialistdb (local)`);
    console.log(`   Target: specialistdb_prod (MongoDB Atlas)`);
    console.log(`   Collections migrated: ${collections.length}`);

  } catch (error) {
    if (error.message.includes('ECONNREFUSED')) {
      console.error('❌ Cannot connect to local MongoDB');
      console.error('\n📌 Make sure MongoDB is running:');
      console.error('   • Start MongoDB Desktop Client, OR');
      console.error('   • Run: mongod (in another terminal)');
      console.error('\n   Then retry: node migrate-db.js');
    } else {
      console.error('❌ Migration failed:', error.message);
    }
    process.exit(1);
  } finally {
    // Close connections
    if (localClient) await localClient.close();
    if (prodClient) await prodClient.close();
  }
}

// Run migration
migrateDatabase();
