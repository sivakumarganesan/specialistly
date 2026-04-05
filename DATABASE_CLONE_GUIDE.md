# Database Management Guide: Production Clone to Staging

## Overview

This guide explains how to safely clone production data to staging for testing, with automatic PII anonymization to protect sensitive information.

**Important Safety Notes:**
- ✅ Production database is NEVER modified
- ✅ Read-only backup approach
- ✅ All sensitive data is anonymized before staging restore
- ✅ Fully automated nightly clone
- ✅ Manual restore available on-demand

---

## What Gets Cloned?

All MongoDB collections are cloned:
- User accounts and profiles
- Customer data and preferences
- Course enrollments and progress
- Cohort sessions and attendance
- Certificates and completions
- Payments and subscriptions
- And all other collections

---

## What Gets Anonymized?

Before restoring to staging, the following PII is replaced:

| Field | Original | Anonymized |
|-------|----------|------------|
| `email` | real@user.com | test.user.123@staging.test |
| `password` | bcrypt-hash | dummy hash (test pwd) |
| `phone` | +1-555-1234 | 9999999999 |
| `stripeCustomerId` | cus_ABC123XYZ | cus_STAGING_random |
| `stripeSubscriptionId` | sub_ABC123XYZ | sub_STAGING_random |
| `razorpayPaymentId` | pay_ABC123XYZ | pay_STAGING_random |
| `cardLastFour` | actual last 4 | 4242 |

---

## How It Works

### Option 1: Automatic Nightly Clone (Recommended)

**Runs automatically every night at 2 AM UTC**

```
GitHub Actions Workflow: nightly-db-clone.yml
↓
Triggers daily at 2:00 AM UTC
↓
Backs up production MongoDB (read-only)
↓
Anonymizes sensitive data
↓
Restores to staging MongoDB (clears old data)
↓
Ready for QA at morning standup
```

**No user action required.** Staging is always fresh with anonymized prod data.

---

### Option 2: Manual Clone (On-Demand)

Run anytime you need to refresh staging:

```bash
# From project root
node scripts/backup-restore-db.js --action clone-with-anonymize
```

**Prerequisites:**
```bash
cd backend
npm ci
```

**Environment variables needed:**
- `.env.production` (for prod DB URI)
- `.env.staging` (for staging DB URI)

---

## When to Use

| Scenario | Action |
|----------|--------|
| Testing new feature with real data | Manual clone |
| QA needs fresh data after fixes | Automatic morning clone |
| Debugging enrollment issues | Manual clone |
| Before major release | Manual clone |
| Daily development | Automatic nightly |

---

## Integration with Deployment Workflow

```
1. Developer commits to feature branch
   ↓
2. PR with tests (CI checks pass)
   ↓
3. Merge to develop
   ↓
4. Auto-deploy to staging
   ↓
5. ⭐ Staging DB already has fresh prod data (nightly)
   ↓
6. QA tests with realistic data
   ↓
7. Release to main
   ↓
8. Auto-deploy to production
   ↓
9. Production unaffected ✅
```

---

## Detailed CLI Commands

### 1. Create Backup Only (Don't Restore)

```bash
node scripts/backup-restore-db.js --action backup
```

**Output:**
```
📦 Creating production database backup...
✅ Connected to production database
  Backing up collection: User...
    ✓ 1,234 documents
  Backing up collection: Customer...
    ✓ 567 documents
  ... (all collections)
✅ Backup saved: backups/backup-prod-2026-04-04T14-30-45-123Z.json
   Size: 45.67 MB
```

**File saved to:** `backups/backup-prod-TIMESTAMP.json`

---

### 2. List Available Backups

```bash
node scripts/backup-restore-db.js --action list
```

**Output:**
```
📦 Available backups:

  1. backup-prod-2026-04-04T14-30-45-123Z-anonymized.json
     Size: 45.67 MB
     Date: 4/4/2026, 2:30:45 PM

  2. backup-prod-2026-04-03T02-00-00-000Z-anonymized.json
     Size: 44.23 MB
     Date: 4/3/2026, 2:00:00 AM
```

---

### 3. Restore Specific Backup to Staging

```bash
node scripts/backup-restore-db.js --action restore backups/backup-prod-2026-04-04T14-30-45-123Z-anonymized.json
```

**⚠️ WARNING:** This will **clear all data in staging** and restore the specified backup.

---

### 4. Full Clone (Backup → Anonymize → Restore)

```bash
node scripts/backup-restore-db.js --action clone-with-anonymize
```

**This is the standard flow:**

```
1. Connects to production DB
2. Backs up all collections
3. Anonymizes sensitive data
4. Saves anonymized backup
5. Connects to staging DB
6. Clears all existing data
7. Restores anonymized backup
8. Verifies success
```

---

## GitHub Actions: Manual Trigger

You can manually trigger the nightly clone from GitHub:

1. Go to: **GitHub → Actions → Nightly - Clone Production DB to Staging**
2. Click **Run workflow**
3. Select options:
   - **Anonymize data:** `true` (recommended)
4. Click **Run workflow**

Watch the run progress in real-time.

---

## Environment Configuration

### Production (.env.production)

```env
MONGODB_URI=mongodb+srv://user:pass@cluster-prod.mongodb.net/specialistly?retryWrites=true&w=majority
```

### Staging (.env.staging)

```env
MONGODB_URI=mongodb+srv://user:pass@cluster-staging.mongodb.net/specialistly_staging?retryWrites=true&w=majority
```

### GitHub Secrets

For GitHub Actions automation, add these secrets:

**Settings → Secrets and variables → Actions → New repository secret**

```
PROD_MONGODB_URI = mongodb+srv://...production...
STAGING_MONGODB_URI = mongodb+srv://...staging...
```

---

## Monitoring & Logging

### Check that nightly clone ran:

1. **GitHub Actions Dashboard:**
   - Go to Actions tab
   - Find "Nightly - Clone Production DB to Staging"
   - View latest run

2. **Verify staging has data:**

```bash
# Connect to staging MongoDB
mongo "$STAGING_MONGODB_URI"

# Check collections
db.getCollectionNames()

# Sample data
db.User.findOne()
db.Customer.findOne()
```

---

## Troubleshooting

### Issue: Backup fails with connection error

**Cause:** MongoDB connection string invalid

**Solution:**
```bash
# Test connection
mongo "$PROD_MONGODB_URI" --eval "db.version()"

# Check .env.production file
cat .env.production | grep MONGODB_URI
```

---

### Issue: Restore fails - staging DB not accessible

**Cause:** Staging MongoDB credentials wrong

**Solution:**
```bash
# Verify staging connection
mongo "$STAGING_MONGODB_URI" --eval "db.version()"

# Update .env.staging with correct credentials
nano .env.staging
```

---

### Issue: Clone didn't finish

**Cause:** Database too large, timeout

**Solution:**
- Try smaller backup first
- Manual backup on local machine:
  ```bash
  mongodump --uri="$PROD_MONGODB_URI" --out=./backup
  mongorestore --uri="$STAGING_MONGODB_URI" --drop ./backup
  ```

---

## Backup Retention Policy

- **Automatic backups:** Kept for 7 days
- **After 7 days:** Automatically deleted
- **For long-term storage:** Download and archive manually

**List available backups:**
```bash
ls -lh backups/
```

---

## Data Integrity Checklist

After cloning, verify:

- [ ] User count in staging = prod count
- [ ] Customer count in staging = prod count
- [ ] No real email addresses in staging
- [ ] No real passwords visible
- [ ] No real Stripe/Razorpay IDs
- [ ] Test users have anonymized data
- [ ] All collections present
- [ ] Indexes intact
- [ ] No duplicate records

**Quick verification script:**
```bash
# Count documents in key collections
mongo "$STAGING_MONGODB_URI" << EOF
db.User.count()
db.Customer.count()
db.Course.count()
db.SelfPacedEnrollment.count()
EOF
```

---

## FAQs

### Q: What if production data changes after backup?

**A:** Staging has point-in-time snapshot. New prod data not in staging until next clone.

---

### Q: Can I modify staging data without affecting production?

**A:** Yes, completely isolated. Staging = test environment only.

---

### Q: How long does the backup/restore take?

**A:** Depends on database size:
- Small (< 100 MB): 2-3 minutes
- Medium (100-500 MB): 5-10 minutes
- Large (> 500 MB): 15+ minutes

---

### Q: Can I restore a specific collection only?

**A:** Currently no, but you can:
1. Edit the backup JSON file
2. Keep only desired collection
3. Use `--action restore`

---

### Q: How is anonymized data safe?

**A:** Passwords use dummy hash (not real), emails are fake addresses, and all payment IDs are replaced with test values. **Safe for QA testing.**

---

## Success Criteria

✅ Setup is complete when:

1. [ ] `.env.staging` has staging MongoDB URI
2. [ ] GitHub Actions secrets configured (`PROD_MONGODB_URI`, `STAGING_MONGODB_URI`)
3. [ ] First automatic nightly clone runs successfully
4. [ ] Staging database has anonymized prod data
5. [ ] Manual clone works on-demand
6. [ ] QA can test with realistic data
7. [ ] Production completely untouched

---

## Next Steps

1. **Configure MongoDB URIs:**
   ```bash
   # Get staging MongoDB URI from your provider
   # Add to .env.staging and GitHub Secrets
   ```

2. **Test manual clone:**
   ```bash
   node scripts/backup-restore-db.js --action clone-with-anonymize
   ```

3. **Verify nightly automation:**
   - Wait for next 2 AM UTC run
   - Or manually trigger from Actions tab

4. **Train team:**
   - How to trigger manual clone
   - What data is anonymized
   - Where to report issues

---

## Questions?

For issues with database cloning:
1. Check GitHub Actions logs
2. Verify MongoDB connection strings
3. Ensure both databases are accessible
4. Try manual restore from backup
5. Contact DevOps team
