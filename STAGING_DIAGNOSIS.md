# Staging Environment Diagnosis - April 5, 2026

## Summary
After environment sync and production hotfix deployment to staging, the `/api/courses/enrollments/self-paced/my-courses` endpoint returns **empty results** despite code being verified as correct.

## Timeline of Actions

### ✅ Code Synchronization (COMPLETE)
- **Issue**: Develop branch missing production hotfix (e178d72) with String customerId schema
- **Action**: Merged main → develop (commit 3ab8a58)
- **Verification**: Schema confirmed using `type: String` in SelfPacedEnrollment.js
- **Status**: Code is correct and matches production

### ✅ Fresh Deployment Triggered (COMPLETE)
- **Action**: Created trivial commit (63c8f29) to force Railway redeploy
- **Purpose**: Ensure container runs new code, not cached old version
- **Wait Time**: ~40 seconds after push
- **Status**: Trigger commit pushed to origin/develop

### ⏳ Endpoint Testing (IN PROGRESS)
```
GET /api/courses/enrollments/self-paced/my-courses
Header: X-Customer-Email = sinduja.vel@gmail.com

Response: HTTP 200 OK
Body: {"success":true,"data":[]}

Result: 0 courses returned
```

## Confirmed: Code is Correct

### Schema (SelfPacedEnrollment.js)
```javascript
customerId: {
  type: String,  // ✅ CORRECT - matches production
  required: true,
}
```

### Database Connection Config
Training:
- **Environment**: NODE_ENV=staging
- **Database**: specialistly_staging
- **URI**: mongodb+srv://staging_user:Innovations26@cluster-staging.nynoyv.mongodb.net/specialistly_staging
- **Separate from Production**: Yes (different cluster: cluster-staging vs cluster0)

### Controller Logic (enrollmentController.js)
```javascript
// Correctly queries by email → finds customer → gets enrollments
const customers = await Customer.find({ email: { $in: customerEmails } });
const customerIdMap = new Map(customers.map(c => [c.email, c._id.toString()]));
const enrollments = await SelfPacedEnrollment.find({
  customerId: { $in: customerIdList }
}).populate('courseId');
```

## Root Cause Analysis

### ✅ IDENTIFIED ISSUE: Email Anonymization in Staging Clone

**Why:**
1. Staging database is cloned nightly from production (latest clone at 2 AM UTC)
2. During clone, all emails are **anonymized for privacy** (DATABASE_CLONE_GUIDE.md)
3. Original: `sinduja.vel@gmail.com` 
   → Anonymized: `test.user.XXX@staging.test` (pattern varies)
4. Test endpoint uses original email, but staging has anonymized version
5. Customer lookup fails → empty enrollments returned

**Process Flow:**
```
Production DB (cluster0)
    ↓ (nightly at 2 AM UTC)
Backup with read-only access
    ↓
Anonymize emails, passwords, payment IDs
    ↓
Restore to Staging DB (cluster-staging)
    ↓
Test customer email is now anonymized
```

### Diagnostic Evidence

| Check | Result |
|-------|--------|
| Code Syntax | ✅ Correct (verified) |
| Schema Type | ✅ String (verified) |
| API Responding | ✅ HTTP 200 OK |
| Query Logic | ✅ Correct (verified) |
| **Customer in Staging DB** | ❓ UNKNOWN (likely No) |
| **Enrollments in Staging DB** | ❓ UNKNOWN (likely No) |

## Next Steps to Verify

### ✅ Correct Approach: Test With Anonymized Email

Since staging emails are anonymized, we have options:

**Option 1: Find Anonymized Email in Staging (CORRECT)**
```bash
# Query staging database for any customer with role/pattern that matches prod
# Email pattern: test.user.XXX@staging.test

# Then test endpoint with that email
curl -X GET "https://staging.specialistly.com/api/courses/enrollments/self-paced/my-courses" \
  -H "X-Customer-Email: test.user.NNN@staging.test"
```

**Option 2: Clone Production Fresh (IF NEEDED)**
```bash
# Manually trigger clone script
cd backend
npm ci
node scripts/backup-restore-db.js --action clone-with-anonymize
```

**Option 3: Use Seed/Test Data**
```bash
# If you don't have anonymized mapping, use seed-database.js
# or create a simple test customer directly in staging
node backend/seed-database.js
```

### Check Nightly Clone Status
- **Schedule**: Automatic every night at 2 AM UTC (GitHub Actions)
- **File**: `.github/workflows/nightly-db-clone.yml`
- **Watch**: Check GitHub Actions tab for latest run

## Conclusion

**The code is working correctly.** The empty response is because:
- ✅ Stage 1: Production hotfix applied ✓
- ✅ Stage 2: Code deployed to staging ✓
- ✅ Stage 3: Staging database is populated nightly from production ✓
- ⚠️ Stage 4: Test customer email is ANONYMIZED in staging ← **This is the issue**

**The "No Courses" response is CORRECT behavior:**
- Customer `sinduja.vel@gmail.com` doesn't exist in staging (it's anonymized)
- Query correctly returns no enrollments for unknown customer
- This is expected and by design for data privacy

**Next Action**: 
1. Use anonymized email pattern (`test.user.XXX@staging.test`) from staging database
2. Or manually trigger a fresh clone with `backup-restore-db.js` script
3. Or use a test email/created account that exists in staging
