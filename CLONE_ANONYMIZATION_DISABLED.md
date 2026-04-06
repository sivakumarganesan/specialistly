# Database Clone Configuration Update - April 5, 2026

## Summary
Anonymization has been **disabled by default** for database clones. Staging now clones with **real production data**.

## Changes Made

### 1. Updated Clone Script - Option 2 Enabled ✅
Added new `clone-without-anonymize` action to both:
- `backend/backup-restore-db.js`
- `scripts/backup-restore-db.js`

### 2. Updated GitHub Actions Workflow ✅  
Modified `nightly-db-clone.yml`:
- **Default behavior**: `clone-without-anonymize` (NO anonymization)
- **Manual trigger option**: Can still choose to anonymize if needed
- Changed default from `anonymize_data: true` → `false`

### 3. Updated Documentation ✅
Help text updated to show both options:
```bash
--action clone-with-anonymize    # Old: anonymize emails, payment IDs, PII
--action clone-without-anonymize # New: keep real production data
```

---

## Usage

### Run Manual Clone (Without Anonymization)
```bash
cd backend
npm ci
node backup-restore-db.js --action clone-without-anonymize
```

### Run Manual Clone (With Anonymization - if needed)
```bash
cd backend  
npm ci
node backup-restore-db.js --action clone-with-anonymize
```

### Automatic Nightly Clone
- Runs automatically daily at 2 AM UTC
- Uses `clone-without-anonymize` by default
- Real data will be in staging each morning

---

## Benefits

✅ **Easier Testing**: Use real customer emails from production  
✅ **Better Data Fidelity**: Test with authentic data patterns  
✅ **Faster Debugging**: No need to find anonymized email mappings  
✅ **Staging = Production**: Same data structure and content  

## Cautions

⚠️ **Real PII**: Production customer information is now in staging  
⚠️ **Real Payment IDs**: Stripe and Razorpay IDs are copied as-is  
⚠️ **Secure Access**: NEVER share staging database credentials publicly  
⚠️ **Compliance**: Ensure team understands handling real customer data  

---

## Technical Details

### What's NOT Anonymized Anymore:
- Customer emails (e.g., `sinduja.vel@gmail.com` stays as-is)
- Phone numbers  
- Stripe Customer IDs
- Razorpay Payment IDs
- Card last-four digits
- All other PII

### What Still Happens:
✅ Enrollment reference validation and fixing  
✅ Staging database is cleared before restore  
✅ Production database is never modified (read-only backup)  
✅ Real-time progress logging

---

## Deployment Status

| Component | Status | Details |
|-----------|--------|---------|
| `backend/backup-restore-db.js` | ✅ | Added clone-without-anonymize function |
| `scripts/backup-restore-db.js` | ✅ | Added clone-without-anonymize function |
| `.github/workflows/nightly-db-clone.yml` | ✅ | Updated to disable anonymization by default |
| GitHub Actions | ✅ | Will use new default on next nightly run |
| Testing | ⏳ | Manual clone can be tested anytime |

---

## Next: Test the New Flow

After merging, you can:

1. **Test Immediately**:
   ```bash
   node backend/backup-restore-db.js --action clone-without-anonymize
   ```

2. **Verify Staging**:
   ```bash
   curl -H "X-Customer-Email: sinduja.vel@gmail.com" \
     https://staging.specialistly.com/api/courses/enrollments/self-paced/my-courses
   ```

3. **See Real Courses**:
   - Should return actual customer enrollments
   - Emails match production
   - All data synchronized

---

## Rollback if Needed

If you ever need anonymization again:
```bash
node backend/backup-restore-db.js --action clone-with-anonymize
```

Or manually trigger workflow with anonymization flag enabled in GitHub UI.
