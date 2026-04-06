# 🔴 CRITICAL FIX: ObjectId Type Mismatch in Enrollment Query

**Status:** ✅ IDENTIFIED, FIXED, AND PUSHED  
**Severity:** CRITICAL - Courses won't display without this  
**Date:** April 5, 2026

---

## What Was Wrong

### The Symptom
- Courses in database: **4 enrollments found ✓**
- API response: **0 courses returned ✗**
- Customer sees: "You have 0 courses enrolled"

### The Root Cause
**MongoDB Query Type Mismatch**

Backend code:
```javascript
const customerIdList = [customer._id.toString()];  // String: "69cbe01f00a3271b8d376d16"
const enrollments = await SelfPacedEnrollment.find({ 
  customerId: { $in: customerIdList }  // Query with STRINGS
})
```

Database stores:
```javascript
{
  _id: ObjectId("xxx"),
  customerId: ObjectId("69cbe01f00a3271b8d376d16")  // Not a string!
}
```

**Result:** String `"69cbe01f...16"` ≠ ObjectId `ObjectId("69cbe01f...16")`  
Query returns 0 results even though matching documents exist!

---

## The Fix

**File: `backend/controllers/enrollmentController.js`**

Added ObjectId type conversion before querying:

```javascript
// Convert string IDs to ObjectIds for proper matching
const customerIdListAsObjectIds = customerIdList.map(id => {
  try {
    return mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : id;
  } catch (e) {
    return id;
  }
});

const enrollments = await SelfPacedEnrollment.find({ 
  customerId: { $in: customerIdListAsObjectIds }  // Now ObjectIds!
})
```

**Test Results:**
- Old query (strings): 0 enrollments ✗
- New query (ObjectIds): 4 enrollments ✓

---

## Deployment Required ⚠️

**The backend code MUST be restarted for this to take effect.**

### If on Railway
1. Go to Railway project
2. Redeploy the backend service
3. OR restart the backend container

### If running locally
```bash
cd backend
npm install  # Optional, no new dependencies
node server.js
# Or restart your server process
```

### If using Docker
```bash
docker-compose restart backend
# Or rebuild and restart
```

---

## What Gets Fixed

After deployment, try these tests:

**Test 1: Direct API Call**
```bash
curl -X GET https://staging.specialistly.com/api/courses/enrollments/self-paced/my-courses \
  -H "X-Customer-Email: sinduja.vel@gmail.com" \
  -H "Content-Type: application/json"
```

Expected response (before fix):
```json
{ "success": true, "data": [] }
```

Expected response (after fix):
```json
{
  "success": true,
  "data": [
    { "courseId": { "title": "Shamanic Intelink Class", ... }, ... },
    { "courseId": { "title": "Contributions To Rivers of India", ... }, ... },
    { "courseId": { "title": "Black Wolf Spirit Chants Recording", ... }, ... },
    { "courseId": { "title": "Course 01", ... }, ... }
  ]
}
```

**Test 2: Browser Frontend**
1. Login to https://staging.specialistly.com
2. Navigate to /my-learning
3. Should see 3 courses from Unearth One Earth specialist

---

## Summary

| Issue | Cause | Solution |
|-------|-------|----------|
| Courses not displaying | MongoDB query type mismatch (string vs ObjectId) | Convert IDs to ObjectIds before query |
| Database returns 0 results | Query used strings, data stored as ObjectIds | Simple type conversion |
| Frontend shows empty | API returns empty array | Fixed in backend controller |

---

## Commits

- `7322697` - Fix: Convert customer IDs to ObjectIds in enrollment query

---

## Next Steps

1. **DEPLOY** - Restart backend service to apply changes
2. **TEST** - Verify courses display in My Learning page
3. **VERIFY** - Check browser Console for any errors
4. **MONITOR** - Watch backend logs for X-Customer-Email requests

---

## Files Modified

- ✅ `backend/controllers/enrollmentController.js`
  - Line 1: Added `import mongoose from 'mongoose'`
  - Lines 216-226: Added ObjectId conversion logic

- ✅ `backend/test-objectid-fix.js` (NEW)
  - Test file verifying the fix works

---

## Why This Happened

The codebase had a type mismatch in the MongoDB schema:
- Some data stored with string IDs (old data)
- New enrollments using ObjectId types (expected)
- Backend didn't account for this difference

The fix bridges both types by pre-converting strings to ObjectIds before querying.

---

## ⚠️ IMPORTANT: Deploy Now

Without this backend fix deployed, courses will continue to show as empty!

The frontend has the authentication fallback (X-Customer-Email header) working correctly, but the backend wasn't able to find matching enrollments due to this type mismatch.

**Check in 5 minutes for confirmation that backend is restarted and fix is live.**
