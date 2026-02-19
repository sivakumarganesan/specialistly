# Consulting Slots System - Troubleshooting Guide

## Quick Diagnosis

**Is your problem:**

- [❌ 404/Routes not found](#-routing-errors)
- [❌ Database errors](#-database-errors)
- [❌ Booking conflicts](#-booking-logic-errors)
- [❌ API response errors](#-api-response-errors)
- [❌ Performance issues](#-performance-issues)
- [❌ Frontend integration issues](#-frontend-issues)

---

## ❌ Routing Errors

### Problem: 404 Not Found

```
POST http://localhost:5000/api/consulting-slots
Response: 404 Not Found
```

### Solutions:

#### 1. Check if routes are mounted in server.js

```bash
grep -n "consulting-slots" backend/server.js
```

Should output:
```
15: import consultingSlotRoutes from './routes/consultingSlotRoutes.js'
42: app.use('/api/consulting-slots', consultingSlotRoutes);
```

**If not found:**
```javascript
// Add to backend/server.js around line 40:

import consultingSlotRoutes from './routes/consultingSlotRoutes.js';

// Then in your app initialization:
app.use('/api/consulting-slots', consultingSlotRoutes);
```

#### 2. Check if routes file exists

```bash
ls -la backend/routes/consultingSlotRoutes.js
```

Should output: `consultingSlotRoutes.js` exists

**If missing:** Create from [backend/routes/consultingSlotRoutes.js](consultingSlotRoutes.js)

#### 3. Check if controller file exists

```bash
ls -la backend/controllers/consultingSlotController.js
```

Should output: `consultingSlotController.js` exists

**If missing:** Create from [backend/controllers/consultingSlotController.js](consultingSlotController.js)

#### 4. Restart server

```bash
# Kill current process
Ctrl+C

# Clear npm cache
npm cache clean --force

# Restart
npm start
```

---

## ❌ Database Errors

### Problem: MongoDB Connection Error

```
MongooseError: Cannot connect to MongoDB
MongooseError: connect ECONNREFUSED
```

### Solutions:

#### 1. Check MongoDB is running

**Windows (MongoDB Atlas):**
```bash
# If using Atlas, check connection string in .env
cat .env | grep MONGO_URI

# Should look like:
# MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/dbname
```

**Windows (Local MongoDB):**
```powershell
# Check if MongoDB service is running
Get-Service MongoDB

# If not running, start it:
Start-Service MongoDB

# Or if installed via brew:
brew services start mongodb-community
```

#### 2. Check connection string is correct

```bash
# Test connection with mongosh
mongosh "mongodb+srv://user:password@cluster.mongodb.net/database"

# If fails: Check username, password, IP whitelist in MongoDB Atlas
```

#### 3. Check environment variables

```bash
# Verify .env is not in .gitignore
cat .gitignore | grep .env

# If included, copy from .env.example or create new
# Ensure MONGO_URI is set correctly
```

#### 4. Connection pool exhausted

```
Error: MongoError: topology destroyed
```

**Solutions:**
```javascript
// In server.js, check MongoDB connection options:

mongoose.connect(process.env.MONGO_URI, {
  maxPoolSize: 10,        // Add this
  minPoolSize: 2,         // Add this
  serverSelectionTimeoutMS: 5000,
});
```

---

## ❌ Database Errors - Collections

### Problem: Collection not created

```
Error: consultingslots is not a collection
```

### Solutions:

#### 1. Check if collection exists

```bash
# Connect to MongoDB
mongosh

# List collections
use specialistly_db
show collections

# Should see "consultingslots" in output
```

**If not exists:**
```bash
# Create first document to auto-create collection
db.consultingslots.insertOne({
  specialistEmail: "test@example.com",
  date: new Date(),
  startTime: "14:00",
  endTime: "15:00"
})
```

#### 2. Check if indexes were created

```bash
# View indexes
db.consultingslots.getIndexes()

# Should see multiple indexes including name and _id
```

**If missing, create manually:**
```bash
db.consultingslots.createIndex({ specialistId: 1, date: 1 })
db.consultingslots.createIndex({ date: 1, status: 1, isFullyBooked: 1 })
```

---

## ❌ Model Errors

### Problem: ConsultingSlot model not found

```
Error: Cannot find module 'ConsultingSlot'
```

### Solutions:

#### 1. Check import statement in controller

```javascript
// In backend/controllers/consultingSlotController.js

// ❌ WRONG:
const ConsultingSlot = require('ConsultingSlot');

// ✅ CORRECT:
import ConsultingSlot from '../models/ConsultingSlot.js';
```

#### 2. Check file location

```bash
# File must be at:
backend/models/ConsultingSlot.js

# Verify:
ls -la backend/models/ConsultingSlot.js
```

#### 3. Check export statement in model

```javascript
// In backend/models/ConsultingSlot.js - END OF FILE:

// ❌ WRONG:
module.exports = mongoose.model('ConsultingSlot', consultingSlotSchema);

// ✅ CORRECT:
export default mongoose.model('ConsultingSlot', consultingSlotSchema);
```

---

## ❌ Booking Logic Errors

### Problem: Can't book slot - "Slot is fully booked"

```
Response: 409 Conflict - "Slot is fully booked"
```

### Self-Check:

```bash
# 1. Check slot capacity
GET /api/consulting-slots/slot/{slotId}

# Response should show:
# "totalCapacity": 1,
# "bookedCount": 0,        ← Must be less than totalCapacity
# "isFullyBooked": false   ← Must be false
```

**If isFullyBooked is true but bookedCount < totalCapacity:**

```bash
# Fix: Update the flag
mongosh → use specialistly_db

db.consultingslots.updateOne(
  { _id: ObjectId("{slotId}") },
  { 
    $set: { 
      isFullyBooked: false,
      bookedCount: 0 
    } 
  }
)
```

---

### Problem: Duplicate booking error

```
Response: 400 - "Customer has already booked this slot"
```

### Self-Check:

```bash
# 1. Check if customer already booked
GET /api/consulting-slots/slot/{slotId}

# Look at bookings array:
# "bookings": [
#   {
#     "customerId": "{same_customer_id}"  ← Duplicate!
#   }
# ]

# 2. Remove duplicate booking
POST /api/consulting-slots/{slotId}/book/{customerId}
# Use DELETE instead to remove
DELETE /api/consulting-slots/{slotId}/book/{customerId}

# 3. Try booking again with different customer
```

---

## ❌ API Response Errors

### Problem: 409 Conflict - Time Slot Conflict

```
Response: 409 Conflict
{
  "message": "Time slot conflict: Specialist already has a slot during this time"
}
```

### Solutions:

This is **WORKING AS DESIGNED** - prevents double-booking

**To resolve:**
1. Choose different time that doesn't overlap
2. Or delete the conflicting slot first
3. Or edit the existing slot

**Check conflicts:**
```bash
# View specialist's all slots
GET /api/consulting-slots/{specialistEmail}

# Find a time gap:
# Existing: 14:00-15:00
# ✅ Can create: 13:00-14:00 or 15:00-16:00
# ❌ Cannot create: 14:30-15:30 (overlaps)
```

---

### Problem: 400 Validation Error

```
Response: 400
{
  "message": "End time must be after start time"
}
```

### Solutions:

Check your request body:

```json
// ❌ WRONG:
{
  "startTime": "15:00",
  "endTime": "14:00"  ← Earlier than start!
}

// ✅ CORRECT:
{
  "startTime": "14:00",
  "endTime": "15:00"  ← After start
}
```

Also check time format:
```javascript
// ❌ WRONG: "2:00 PM", "14:00:00", "14-00"
// ✅ CORRECT: "14:00" (24-hour HH:MM format)
```

---

### Problem: 409 Cannot Delete - Has Bookings

```
Response: 409
{
  "message": "Cannot delete slot with 1 booking(s). Please cancel all bookings first."
}
```

### Solutions:

```bash
# 1. View the booking
GET /api/consulting-slots/slot/{slotId}

# 2. Cancel booking first
DELETE /api/consulting-slots/{slotId}/book/{customerId}

# 3. Now delete the slot
DELETE /api/consulting-slots/{slotId}
```

---

## ❌ Performance Issues

### Problem: Queries are slow (> 1 second)

```
GET /api/consulting-slots/available takes 2000ms
```

### Solutions:

#### 1. Check if indexes exist

```bash
mongosh → use specialistly_db
db.consultingslots.getIndexes()

# Should show indexes on specialistId+date and date+status+isFullyBooked
```

**If missing, create them:**

```javascript
// In backend/models/ConsultingSlot.js, add to schema:

consultingSlotSchema.index({ specialistId: 1, date: 1 });
consultingSlotSchema.index({ date: 1, status: 1, isFullyBooked: 1 });

// Then restart server to apply indexes
```

#### 2. Check query plan

```bash
# Explain the query
db.consultingslots.find({
  date: { $gte: ISODate("2026-02-19") },
  status: "active"
}).explain("executionStats")

# Look for "executionStages.stage": "COLLSCAN" (bad)
# Should see "IXSCAN" (good, using index)
```

#### 3. Check database size

```bash
db.consultingslots.stats()

# Large "size" or "count" might indicate:
# - Too many old records (archive old data)
# - Database stats are stale (run compact)

# Compact database:
db.runCommand({ compact: 'consultingslots' })
```

---

### Problem: All queries are slow (not just consulting slots)

```
Every API call is slow, not just /api/consulting-slots
```

### Solutions:

#### 1. Check MongoDB connection

```bash
# Ping MongoDB
mongosh → db.adminCommand("ping")

# Should respond quickly with { ok: 1 }
```

#### 2. Check server resources

```bash
# Check CPU/Memory usage
# Windows: Task Manager → Processes → MongoDB
# Mac: Activity Monitor
# Linux: top

# If high usage, restart MongoDB
```

#### 3. Check network latency

```bash
# If using MongoDB Atlas:
# Check network connection to server
nping -c 4 cluster.mongodb.net

# Latency should be < 50ms
```

---

## ❌ Frontend Issues

### Problem: Can't fetch slots from frontend

```javascript
const response = await fetch('/api/consulting-slots/available?specialistEmail=john@example.com');
// Error: 404 or CORS error
```

### Solutions:

#### 1. Check CORS headers

```javascript
// In backend/server.js, add CORS:

import cors from 'cors';  // npm install cors

app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}));
```

#### 2. Check API URL

```javascript
// ❌ WRONG:
fetch('api/consulting-slots/available')  // Missing /

// ✅ CORRECT:
fetch('/api/consulting-slots/available')  // Has /
```

#### 3. Check request headers

```javascript
// ✅ CORRECT:
fetch('/api/consulting-slots', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'  // Required for POST
  },
  body: JSON.stringify(data)
})
```

---

### Problem: Frontend receives 401 Unauthorized

```
Response: 401
{
  "message": "Unauthorized"
}
```

### Solutions:

```javascript
// If your API requires authentication:

const response = await fetch('/api/consulting-slots/available', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`  // Add auth token
  }
});

// Or with cookies:
fetch('/api/consulting-slots/available', {
  credentials: 'include'  // Send cookies
})
```

---

### Problem: TypeScript errors in React component

```typescript
// Error: Type 'unknown' is not assignable to type 'ConsultingSlot'
```

### Solutions:

```typescript
// Define the type properly:

interface ConsultingSlot {
  _id: string;
  specialistEmail: string;
  date: string;
  startTime: string;
  endTime: string;
  totalCapacity: number;
  bookedCount: number;
  isFullyBooked: boolean;
  bookings: Array<{
    customerId: string;
    customerEmail: string;
    customerName: string;
  }>;
}

// Then use in fetch:
const response = await fetch('/api/consulting-slots/available');
const data: { data: ConsultingSlot[] } = await response.json();
```

---

## ❌ Data Consistency Issues

### Problem: Duplicate slots after create

```
Created one slot, but two appear in database
```

### Solutions:

#### 1. Check if create endpoint is idempotent

```bash
# Verify by searching database
mongosh → use specialistly_db

db.consultingslots.find({
  specialistEmail: "john@example.com",
  date: "2026-02-20",
  startTime: "14:00"
})

# If multiple results: User clicked twice while request was pending
# Solution: Disable button after click until response
```

#### 2. Remove duplicates

```bash
# Get the duplicate IDs
db.consultingslots.find({...}).pretty()

# Remove extras
db.consultingslots.deleteOne({ _id: ObjectId("...") })
```

---

### Problem: bookedCount doesn't match bookings array

```
bookedCount: 2, but bookings: [{...}]  // Only 1 booking!
```

### Solutions:

#### 1. Recalculate manually

```bash
mongosh → use specialistly_db

db.consultingslots.updateOne(
  { _id: ObjectId("{slotId}") },
  { $set: { bookedCount: 1 } }  // Set to actual count
)
```

#### 2. Check for orphaned bookings

```bash
# Find where bookedCount > actual array length
db.consultingslots.find({ bookedCount: { $gt: 2 } })

# View the booking for that slot
db.consultingslots.findOne({ _id: ObjectId("...") })

# If bookings array is too short, rebuild it
```

---

## ❌ General Diagnostics

### Run Full Diagnostic

```bash
# 1. Check all files exist
ls -la backend/models/ConsultingSlot.js
ls -la backend/controllers/consultingSlotController.js
ls -la backend/routes/consultingSlotRoutes.js

# 2. Check MongoDB connection
mongosh → db.adminCommand("ping")

# 3. Check collection exists
mongosh → use specialistly_db → show collections

# 4. Check routes mounted
grep -n "consulting-slots" backend/server.js

# 5. Test one endpoint
curl -X GET "http://localhost:5000/api/consulting-slots/available?specialistEmail=test@example.com"
```

### Common Resolution Order

1. ✅ Check if files exist (models, controllers, routes)
2. ✅ Check if routes are mounted in server.js
3. ✅ Restart server
4. ✅ Check MongoDB connection
5. ✅ Check collection exists
6. ✅ Test endpoint with curl
7. ✅ Check CORS headers
8. ✅ Check frontend auth/headers

---

## Still Having Issues?

Check these files for exact implementation:

| File | Purpose |
|------|---------|
| [CONSULTING_SLOTS_API_REFERENCE.md](CONSULTING_SLOTS_API_REFERENCE.md) | Expected request/response format |
| [CONSULTING_SLOTS_TESTING_GUIDE.md](CONSULTING_SLOTS_TESTING_GUIDE.md) | Step-by-step test scenarios |
| [backend/models/ConsultingSlot.js](../backend/models/ConsultingSlot.js) | Database schema |
| [backend/controllers/consultingSlotController.js](../backend/controllers/consultingSlotController.js) | Business logic |
| [backend/routes/consultingSlotRoutes.js](../backend/routes/consultingSlotRoutes.js) | Route definitions |

---

**Any other issues? Check the code comments in the model, controller, or routes files!**

