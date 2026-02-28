# Database Migration Guide: Local → Production

## Overview
Migrate all data from local `specialistdb` to production `specialistdb_prod` on MongoDB Atlas.

## Prerequisites

### Option 1: Using Node.js Script (Recommended - No Extra Tools Needed)
```bash
npm install mongodb
node migrate-db.js
```

### Option 2: Using MongoDB Command-Line Tools
You'll need `mongodump` and `mongorestore` installed:

**Windows:**
```powershell
# Download MongoDB Database Tools from:
# https://www.mongodb.com/try/download/database-tools
# Or install via Chocolatey:
choco install mongodb-database-tools
```

**macOS:**
```bash
brew install mongodb-database-tools
```

**Linux:**
```bash
sudo apt-get install mongodb-database-tools
```

---

## Migration Methods

### Method 1: Node.js Script (EASIEST)

1. **Run the migration script:**
   ```bash
   cd c:\Work\specialistly
   node migrate-db.js
   ```

2. **What it does:**
   - Connects to local MongoDB (localhost:27017)
   - Connects to MongoDB Atlas production cluster
   - Copies all collections and documents
   - Inserts data into `specialistdb_prod`

3. **Output example:**
   ```
   🔄 Starting database migration...
   
   📡 Connecting to local database...
   ✅ Connected to local database
   
   📡 Connecting to production database (MongoDB Atlas)...
   ✅ Connected to production database
   
   📋 Fetching collections from local database...
   Found 3 collections
   
   ⏳ Migrating collection: users...
     Found 5 documents
     ✅ Inserted 5 documents
   
   ✨ Database migration completed successfully!
   ```

---

### Method 2: MongoDB Dump & Restore

1. **Dump local database:**
   ```bash
   mongodump --db specialistdb --out ./db-backup
   ```
   
   Creates a backup folder `db-backup` with all collections

2. **Restore to production:**
   ```bash
   mongorestore --uri "mongodb+srv://specialistly_user:SpeciXlistly01@cluster0.jseized.mongodb.net/specialistdb_prod?appName=Cluster0" ./db-backup/specialistdb
   ```

---

### Method 3: Manual Export/Import (Using MongoDB Compass)

1. **Connect to local MongoDB in Compass**
2. **Select specialistdb database**
3. **Right-click each collection → Export Collection**
4. **Save as JSON files**
5. **Connect to MongoDB Atlas in Compass**
6. **Create specialistdb_prod database**
7. **Right-click → Import Collection**
8. **Select each JSON file**

---

## Verification

After migration, verify the data transferred correctly:

```bash
# In MongoDB Compass or mongosh:

# Check collections
show collections

# Count documents in each collection
db.users.countDocuments()
db.specialists.countDocuments()
db.appointments.countDocuments()
# ... etc for all collections
```

Or run this verification script:

```bash
node verify-migration.js
```

---

## Backup Before Migration

Recommended: Backup production before migrating:

```bash
mongodump --uri "mongodb+srv://specialistly_user:SpeciXlistly01@cluster0.jseized.mongodb.net/specialistdb_prod?appName=Cluster0" --out ./prod-backup
```

This creates a backup in `./prod-backup` folder.

---

## Connection Strings

**Local Development:**
```
mongodb://localhost:27017/specialistdb
```

**Production (MongoDB Atlas):**
```
mongodb+srv://specialistly_user:SpeciXlistly01@cluster0.jseized.mongodb.net/specialistdb_prod?appName=Cluster0
```

---

## Troubleshooting

**"Cannot connect to local MongoDB"**
- Ensure MongoDB is running: `mongod` or via MongoDB Desktop Client
- Check local MongoDB is on port 27017

**"Connection timeout to MongoDB Atlas"**
- Check internet connection
- Verify MongoDB Atlas whitelist includes your IP
- Check credentials: specialistly_user / SpeciXlistly01

**"mongodump/mongorestore not found"**
- Install MongoDB Database Tools (see Prerequisites)
- Add to PATH if needed

---

## After Migration

1. **Update .env.production in backend** ✅ (Already done)
2. **Test production deployment** with migrated data
3. **Verify all features work** (users, specialists, appointments, etc.)
4. **Keep local backup** for reference

---

## Rollback (If Needed)

To revert production to previous state:

```bash
# Use the backup created before migration
mongorestore --uri "mongodb+srv://specialistly_user:SpeciXlistly01@cluster0.jseized.mongodb.net/specialistdb_prod?appName=Cluster0" ./prod-backup/specialistdb_prod
```
