# Option 1: GitHub Actions + Railway Setup Guide

Complete setup of CI/CD pipeline with automatic staging and production deployments.

---

## 📋 Quick Summary

| Environment | Branch | Deploy Trigger | Approval | Database |
|----------|--------|-----------------|----------|----------|
| **Staging** | `develop` | Auto on push | None | Separate (cloned nightly) |
| **Production** | `main` | Auto on push | GitHub required | Separate |

---

## ⚙️ Part 1: Git Branching Setup

### 1.1 Create Git Branches

```bash
cd c:\Work\specialistly

# Make sure you're on main
git checkout main
git pull origin main

# Create and push develop branch
git checkout -b develop
git push -u origin develop

# Verify branches exist
git branch -a
```

**Output:**
```
* develop
  main
  remotes/origin/develop
  remotes/origin/main
```

---

### 1.2 Protect Main Branch (GitHub)

**Steps:**
1. Go to **GitHub → Settings → Branches**
2. Add rule for `main`:
   - ✅ Require a pull request before merging
   - ✅ Require 1 approval
   - ✅ Dismiss stale pull request approvals
   - ✅ Require branches to be up to date
   - ✅ Include administrators

3. Add rule for `develop`:
   - ✅ Require a pull request before merging
   - ✅ Require 1 approval
   - ✅ Dismiss stale pull request approvals

**Result:** Can't force-push to `main`, protects production.

---

### 1.3 Feature Branch Naming

**For new features:**
```bash
git checkout develop
git checkout -b feature/hierarchical-offerings
# ... make changes ...
git push -u origin feature/hierarchical-offerings
```

**For bug fixes:**
```bash
git checkout develop
git checkout -b bugfix/enrollment-issue
# ... make changes ...
git push -u origin bugfix/enrollment-issue
```

**For hotfixes (critical prod issues):**
```bash
git checkout main
git checkout -b hotfix/payment-bug
# ... make critical fix ...
git push -u origin hotfix/payment-bug
git checkout main
git merge hotfix/payment-bug
git push origin main
```

---

## 🚀 Part 2: GitHub Actions Workflows Setup

### 2.1 Verify Workflow Files Created

The following workflow files have been created:

- ✅ `.github/workflows/ci.yml` - Runs tests on PRs
- ✅ `.github/workflows/deploy-staging.yml` - Deploys develop → staging
- ✅ `.github/workflows/deploy-production.yml` - Deploys main → production
- ✅ `.github/workflows/nightly-db-clone.yml` - Clones prod DB nightly

**Check they exist:**
```bash
ls -la .github/workflows/
```

---

### 2.2 Verify Scripts Exist

```bash
node scripts/backup-restore-db.js --help
```

**Output should show available actions:**
- `--action backup` - Backup production DB
- `--action restore` - Restore backup
- `--action clone-with-anonymize` - Full cycle
- `--action list` - List available backups

---

## 🔐 Part 3: GitHub Actions Secrets Setup

### 3.1 Add Production Database Secret

1. Go to **GitHub → Settings → Secrets and variables → Actions**
2. Click **New repository secret**
3. Add:
   ```
   Name: PROD_MONGODB_URI
   Value: mongodb+srv://user:pass@cluster-prod.mongodb.net/specialistly?retryWrites=true&w=majority
   ```

---

### 3.2 Add Staging Database Secret

1. Click **New repository secret**
2. Add:
   ```
   Name: STAGING_MONGODB_URI
   Value: mongodb+srv://user:pass@cluster-staging.mongodb.net/specialistly_staging?retryWrites=true&w=majority
   ```

---

### 3.3 Add Railway Token

1. Go to **Railway → Account → API Tokens**
2. Create new token
3. Go to **GitHub → Settings → Secrets → New repository secret**
4. Add:
   ```
   Name: RAILWAY_TOKEN
   Value: <paste Railway token>
   ```

---

### 3.4 Verify Secrets Created

**GitHub Settings → Secrets:**
- ✅ PROD_MONGODB_URI (with dot icon)
- ✅ STAGING_MONGODB_URI (with dot icon)
- ✅ RAILWAY_TOKEN (with dot icon)

---

## 🗄️ Part 4: Create Staging MongoDB Database

### 4.1 Create Staging Database Cluster

**If using MongoDB Atlas:**

1. Go to **MongoDB Atlas → Create Project → specialistly-staging**
2. Create cluster:
   - **Cluster name:** cluster-staging
   - **Cloud provider:** AWS
   - **Region:** Same as production (for consistency)
   - **Tier:** M0 Free (or match production)
3. Create database user:
   - **Username:** staging_user
   - **Password:** [strong password]
4. Whitelist IP: Allow any IP (0.0.0.0) for CI/CD
5. Copy connection string:
   ```
   mongodb+srv://staging_user:password@cluster-staging.mongodb.net/specialistly_staging?retryWrites=true&w=majority
   ```

---

### 4.2 Create Collections in Staging

The first clone will create all collections automatically. No manual setup needed.

---

## � Part 5: Cloudflare DNS Configuration (15 min)

**Follow comprehensive guide:** [CLOUDFLARE_DNS_SETUP.md](CLOUDFLARE_DNS_SETUP.md)

### Quick Setup

1. **Add CNAME Record for Production:**
   - Cloudflare DNS → Add record
   - Name: `@` (root)
   - Type: `CNAME`
   - Target: `production-specialistly-production.up.railway.app` (from Railway)

2. **Add CNAME Record for Staging:**
   - Cloudflare DNS → Add record
   - Name: `staging`
   - Type: `CNAME`
   - Target: `staging-specialistly-staging.up.railway.app` (from Railway)

3. **Enable SSL in Cloudflare:**
   - SSL/TLS → Set to **Full (Strict)**

4. **Wait 5-15 minutes** for DNS propagation

Then continue to Part 6 (Railway setup).

---

## 🌳 Part 6: Railway Staging Project Setup

### 5.1 Create Staging Project in Railway

**In Railway Dashboard:**

1. Click **New Project**
2. Choose **Empty Project**
3. Name: `staging-specialistly`
4. Add **Node.js** service
5. Configure:
   - **GitHub repo:** Your specialistly repo
   - **GitHub branch:** `develop`
   - **Root directory:** `backend`
   - **Build command:** `npm ci`
   - **Start command:** `node server.js`
   - **Port:** 5001

---

### 5.2 Add Environment Variables to Staging

**Railway → Staging Project → Variables:**

```
NODE_ENV=staging
DATABASE_URL=mongodb+srv://staging_user:pass@cluster-staging.mongodb.net/specialistly_staging?retryWrites=true&w=majority
FRONTEND_URL=https://staging.specialistly.com
BACKEND_URL=https://staging.specialistly.com/api

STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
RAZORPAY_KEY_ID=rzp_test_...

GOOGLE_OAUTH_CLIENT_ID=...
GOOGLE_OAUTH_CLIENT_SECRET=...

JWT_SECRET=[random 32 char string]
```

---

### 5.3 Add Custom Domain to Staging

**Railway → Staging Project → Settings:**

1. Click **Domain**
2. Add custom domain: `staging.specialistly.com`
3. Railway auto-configures (DNS already set in Cloudflare)
4. Shows ✅ Domain verified

**Note:** DNS is already configured in Cloudflare, so Railway should verify immediately.

---

## 🔄 Part 6: Test CI/CD Workflow

### 6.1 Create a Test Feature Branch

```bash
git checkout develop
git checkout -b feature/test-workflow

# Make a small change
echo "# Test workflow" >> README.md

git add -A
git commit -m "test: verify GitHub Actions workflow"
git push -u origin feature/test-workflow
```

---

### 6.2 Watch GitHub Actions Run

1. Go to **GitHub → Actions**
2. Find workflow: **CI - Tests & Lint**
3. Should show:
   ```
   ✅ Lint & Test
     ✅ Use Node.js 20.x
     ✅ Install frontend dependencies
     ✅ Build frontend
     ✅ Install backend dependencies
     ✅ Check for security vulnerabilities
   ```

---

### 6.3 Create Pull Request

1. Go to **GitHub → Pull requests → New**
2. Base: `develop`
3. Compare: `feature/test-workflow`
4. Create PR
5. Wait for checks to pass (should be green ✅)
6. Merge PR to develop

---

### 6.4 Watch Staging Deploy

1. Go to **GitHub → Actions**
2. Find workflow: **Deploy to Staging**
3. Should show:
   ```
   Deploy to Staging
     ✅ Checkout code
     ✅ Use Node.js
     ✅ Build frontend
     ✅ Build backend
     ✅ Deploy to Railway (Staging)
     ✅ Run smoke tests
   ```

---

### 6.5 Verify Staging is Live

```bash
# Test staging API
curl https://staging.specialistly.com/api/health

# Should return: 200 OK (or whatever your health endpoint returns)
```

---

## 🔒 Part 7: Setup Database Cloning

### 7.1 First Manual Clone

Test the backup/restore script locally first:

```bash
cd backend
npm ci

# Test backup
node ../scripts/backup-restore-db.js --action backup

# List backups
node ../scripts/backup-restore-db.js --action list

# Test restore (with proper URIs)
node ../scripts/backup-restore-db.js --action clone-with-anonymize
```

**Expected output:**
```
🔄 Starting production → staging clone with anonymization

📦 Creating production database backup...
✅ Connected to production database
  Backing up collection: User...
    ✓ 1,234 documents
  ... (all collections)

🔒 Anonymizing sensitive data...
  Processing User...
  Processing Customer...
  ... (all collections)
✅ Anonymized 4,567 sensitive fields

📥 Restoring to staging database...
✅ Connected to staging database
  ✅ Staging database restored successfully
  Restoring User...
    ✓ Inserted 1,234 documents
  ... (all collections)

✅ Clone complete!
   Production data (anonymized) is now in Staging
   Ready for QA testing
```

---

### 7.2 Verify GitHub Secrets are Set

The nightly workflow needs these secrets:

```bash
# Check secrets exist in GitHub
GitHub → Settings → Secrets and variables → Actions

Should see:
✅ PROD_MONGODB_URI
✅ STAGING_MONGODB_URI
```

---

### 7.3 Test Nightly Clone (Manual Trigger)

1. Go to **GitHub → Actions**
2. Find **Nightly - Clone Production DB to Staging**
3. Click **Run workflow**
4. Select:
   - **Anonymize data:** true
5. Click **Run workflow**
6. Watch it run (should take 5-15 min depending on DB size)

---

### 7.4 Schedule Nightly Clone

The workflow is already configured to run at **2 AM UTC** every night.

**To change schedule:**

1. Edit `.github/workflows/nightly-db-clone.yml`
2. Find line: `- cron: '0 2 * * *'`
3. Change to desired time (24-hour UTC format)
4. Examples:
   - `0 2 * * *` = 2 AM UTC (10 PM EST, 3:30 AM IST)
   - `0 10 * * *` = 10 AM UTC
   - `0 22 * * *` = 10 PM UTC

---

## 🚢 Part 8: Production Deployment

### 8.1 Release to Production

**When ready to release to production:**

```bash
# Make sure develop has all features tested
git checkout develop
git pull origin develop

# Create release branch
git checkout -b release/v1.0.0

# Update version in package.json if desired
# Update changelog
git add -A
git commit -m "chore: release v1.0.0"

# Merge to main
git checkout main
git merge --no-ff release/v1.0.0
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin main
git push origin v1.0.0

# Merge back to develop
git checkout develop
git merge main
git push origin develop

# Delete release branch
git branch -d release/v1.0.0
```

---

### 8.2 Monitor Production Deployment

1. Go to **GitHub → Actions**
2. Find **Deploy to Production**
3. Watch workflow:
   ```
   ✅ Validate production
   ✅ Build frontend
   ✅ Build backend
   ✅ Deploy to Railway (Production)
   ✅ Run smoke tests
   ```

---

### 8.3 Post-Deployment Checks

After deploy to production:

```bash
# Test production API
curl https://specialistly.com/api/health

# Check error logs
# Railway → production-specialistly → Logs

# Monitor metrics
# Track user signups, payments, enrollments
```

---

## 🔄 Part 9: Rollback Strategy

### 9.1 Rollback from Production

If critical issues found:

**Option A: Git Revert (Recommended)**

```bash
git checkout main
git log --oneline -5  # Find bad commit
git revert -n abc123def  # Create revert commit
git commit -m "Revert: revert bad commit"
git push origin main
# GitHub Actions auto-deploys revert to production
```

---

**Option B: Redeploy Previous Tag**

```bash
# Find previous working version
git tag -l | sort -V | tail -5

# Redeploy previous version
git checkout v1.0.0  # or whatever version
git push origin v1.0.0:main
```

---

**Option C: Manual - Rollback via Railway**

1. **Railway Dashboard → Production**
2. Find previous successful deployment
3. Click **Rollback**
4. Confirm
5. Dashboard shows previous version deploying

---

### 9.2 Rollback from Staging

Similar process - use `develop` branch instead of `main`.

---

## 📊 Part 10: Monitoring & Maintenance

### 10.1 Weekly Checklist

- [ ] Check GitHub Actions logs for failures
- [ ] Verify staging and production deployments successful
- [ ] Review error logs in Railway
- [ ] Confirm nightly database clone ran
- [ ] Test manual clone works
- [ ] Check payment processing
- [ ] Verify SSL certificates still valid

---

### 10.2 Monthly Checklist

- [ ] Review GitHub Actions secrets (still valid?)
- [ ] Check Railway token expiration
- [ ] Review branch protection rules
- [ ] Backup important GitHub Actions logs
- [ ] Update documentation
- [ ] Training team on new features

---

## 🎯 Success Criteria

✅ Setup complete when:

- [ ] Develop branch exists and protected
- [ ] All 4 GitHub Actions workflows created
- [ ] GitHub Actions secrets configured (3 secrets)
- [ ] Railway staging project created
- [ ] Custom domain `nest.unearthoneearth.com` points to staging
- [ ] Staging MongoDB cluster exists and accessible
- [ ] Database backup script works manually
- [ ] First automatic nightly clone scheduled (2 AM UTC)
- [ ] Test feature branch → develop → staging works end-to-end
- [ ] Production deployment tested (to `next.unearthoneearth.com`)
- [ ] Rollback procedure tested
- [ ] Team trained on process

---

## 🆘 Troubleshooting

### Issue: GitHub Actions CI fails

**Solution:**
```bash
# Run tests locally first
cd frontend && npm run build
cd ../backend && npm test
```

---

### Issue: Staging deployment hangs

**Solution:**
1. Check Railway logs
2. Verify database connection
3. Check custom domain DNS
4. Try manual redeploy

---

### Issue: Nightly clone fails

**Solution:**
1. Check MongoDB connection strings in secrets
2. Verify staging MongoDB is accessible
3. Check backup directory permissions
4. Run manual clone to debug

---

## 📚 Related Documentation

- [Git Branching Strategy](GIT_BRANCHING_STRATEGY.md) - detailed branching
- [Database Clone Guide](DATABASE_CLONE_GUIDE.md) - automatic cloning
- [Railway Deployment](RAILWAY_DEPLOYMENT_CHECKLIST.md) - deployment details
- [GitHub Actions Guide](GITHUB_ACTIONS_GUIDE.md) - workflows guide

---

## ✅ Next Steps

1. **Follow Part 1-3:** Set up Git branches and GitHub Actions secrets
2. **Follow Part 4-5:** Create staging MongoDB and Railway project
3. **Follow Part 6:** Test CI/CD workflow with feature branch
4. **Follow Part 7:** Set up nightly database cloning
5. **Follow Part 8-9:** Test production deployment and rollback
6. **Follow Part 10:** Monitor and maintain

---

## Questions?

Refer to:
- DATABASE_CLONE_GUIDE.md - for cloning & anonymization
- GitHub Actions logs - for deployment issues
- Railway dashboard - for runtime errors
