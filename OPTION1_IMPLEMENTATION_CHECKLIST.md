# Option 1 GitHub Actions Setup Checklist

**Start Date:** ________________  
**Completion Date:** ________________

---

## Phase 1: Git Branching (15 min)

- [ ] Create `develop` branch locally
  ```bash
  git checkout -b develop
  git push -u origin develop
  ```

- [ ] Verify branches exist
  ```bash
  git branch -a
  # Should show: develop, main, and remotes
  ```

- [ ] Protect `main` branch on GitHub
  - [ ] Go to GitHub → Settings → Branches
  - [ ] Add rule for `main`
  - [ ] ✅ Require PR before merge
  - [ ] ✅ Require 1 approval
  - [ ] ✅ Dismiss stale reviews
  - [ ] ✅ Require up to date branches

- [ ] Protect `develop` branch on GitHub
  - [ ] Go to GitHub → Settings → Branches
  - [ ] Add rule for `develop`
  - [ ] ✅ Require PR before merge
  - [ ] ✅ Require 1 approval

---

## Phase 2: GitHub Actions Workflows (5 min)

- [ ] Verify workflow files exist
  ```bash
  ls -la .github/workflows/
  ```
  Should contain:
  - [ ] ci.yml
  - [ ] deploy-staging.yml
  - [ ] deploy-production.yml
  - [ ] nightly-db-clone.yml

- [ ] Verify backup script exists
  ```bash
  ls -la scripts/backup-restore-db.js
  ```

- [ ] Test help command
  ```bash
  node scripts/backup-restore-db.js --help
  ```

---

## Phase 3: GitHub Actions Secrets (10 min)

Navigate to: **GitHub → Settings → Secrets and variables → Actions**

### 3.1 Production MongoDB URI

- [ ] Click **New repository secret**
- [ ] **Name:** `PROD_MONGODB_URI`
- [ ] **Value:** `mongodb+srv://...production...`
- [ ] Click **Add secret**
- [ ] Verify it appears with dot icon ●

### 3.2 Staging MongoDB URI

- [ ] Click **New repository secret**
- [ ] **Name:** `STAGING_MONGODB_URI`
- [ ] **Value:** `mongodb+srv://...staging...`
- [ ] Click **Add secret**
- [ ] Verify it appears with dot icon ●

### 3.3 Railway Token

- [ ] Go to **Railway.app → Account → API Tokens**
- [ ] Create new token (copy immediately)
- [ ] Go back to GitHub secrets
- [ ] Click **New repository secret**
- [ ] **Name:** `RAILWAY_TOKEN`
- [ ] **Value:** `[paste Railway token]`
- [ ] Click **Add secret**
- [ ] Verify it appears with dot icon ●

### 3.4 Verify All Secrets

- [ ] PROD_MONGODB_URI ●
- [ ] STAGING_MONGODB_URI ●
- [ ] RAILWAY_TOKEN ●

---

## Phase 4: MongoDB Staging Database (30 min)

### 4.1 Create MongoDB Atlas Staging Cluster

Go to **MongoDB Atlas:**

- [ ] Click **+ New Project**
- [ ] Project name: `specialistly-staging`
- [ ] Click **Create**

- [ ] Click **+ Create Deployment**
- [ ] Choose **M0 (Free)** or match production tier
- [ ] Cloud: **AWS**
- [ ] Region: **us-east-1** (or same as production)
- [ ] Cluster name: `cluster-staging`
- [ ] Click **Create**

### 4.2 Create Database User

- [ ] Wait for cluster to initialize (5-10 min)
- [ ] Click **Database Access**
- [ ] Click **+ Add New Database User**
- [ ] **Username:** `staging_user`
- [ ] **Password:** [generate strong password]
- [ ] **Role:** `readWriteAnyDatabase`
- [ ] Click **Add User**

### 4.3 Configure Network Access

- [ ] Click **Network Access**
- [ ] Click **+ Add IP Address**
- [ ] **IP Address:** `0.0.0.0/0` (allows GitHub Actions)
- [ ] **Comment:** `GitHub Actions CI/CD`
- [ ] Click **Confirm**

### 4.4 Get Connection String

- [ ] Click **Databases**
- [ ] Click **Connect** next to staging cluster
- [ ] Choose **Drivers**
- [ ] Copy connection string (Node.js)
- [ ] Replace `<password>` with actual password
- [ ] Verify URL looks like:
  ```
  mongodb+srv://staging_user:password@cluster-staging.mongodb.net/specialistly_staging?retryWrites=true&w=majority
  ```
- [ ] Save this for GitHub secret

---

## Phase 5: Railway Staging Project (20 min)

Go to **Railway.app Dashboard:**

### 5.1 Create Staging Project

- [ ] Click **New Project**
- [ ] Choose **Empty Project**
- [ ] Project name: `staging-specialistly`
- [ ] Create project

### 5.2 Add Node.js Service

- [ ] Click **Add Service**
- [ ] Choose **GitHub Repo**
- [ ] Select your `specialistly` repository
- [ ] Branch: `develop`
- [ ] Root directory: `backend`

### 5.3 Configure Auto-Deploy

- [ ] Service name: Change to `staging-specialistly`
- [ ] **Build command:** `npm ci`
- [ ] **Start command:** `node server.js`
- [ ] **Port:** `5001`
- [ ] Save

### 5.4 Add Environment Variables

- [ ] Click **Variables**
- [ ] Add each variable:

```
NODE_ENV=staging
PORT=5001
DATABASE_URL=mongodb+srv://staging_user:pass@cluster-staging...
FRONTEND_URL=https://nest.unearthoneearth.com
BACKEND_URL=https://nest.unearthoneearth.com/api
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
RAZORPAY_KEY_ID=rzp_test_...
GOOGLE_OAUTH_CLIENT_ID=...
GOOGLE_OAUTH_CLIENT_SECRET=...
JWT_SECRET=[random 32 char string]
```

### 5.5 Deploy Service

- [ ] Click **Deploy**
- [ ] Wait for deployment (2-5 min)
- [ ] Check build logs - should see ✅ success

### 5.6 Add Custom Domain

- [ ] Click **Settings** → **Custom Domains**
- [ ] Add custom domain: `nest.unearthoneearth.com`
- [ ] Copy CNAME record shown
- [ ] Go to **Wix.com → Manage DNS**
- [ ] Add CNAME record: 
  - **Name:** `nest`
  - **Target:** `[Railway CNAME from above]`
  - **TTL:** 3600
- [ ] Wait 15-30 min for propagation
- [ ] Test: https://nest.unearthoneearth.com

---

## Phase 6: Test CI/CD Pipeline (30 min)

### 6.1 Create Feature Branch

```bash
git checkout develop
git checkout -b feature/test-workflow
echo "# Test" >> README.md
git add README.md
git commit -m "test: verify CI/CD workflow"
git push -u origin feature/test-workflow
```

- [ ] Branch created and pushed

### 6.2 Watch GitHub Actions - CI

- [ ] Go to **GitHub → Actions**
- [ ] Find **CI - Tests & Lint**
- [ ] Watch workflow run (~2-3 min)
- [ ] All checks should ✅ pass:
  - [ ] Install dependencies
  - [ ] Build frontend
  - [ ] Build backend

### 6.3 Create Pull Request

- [ ] Go to **GitHub → Pull Requests**
- [ ] Click **New Pull Request**
- [ ] Base branch: `develop`
- [ ] Compare branch: `feature/test-workflow`
- [ ] Title: `test: verify CI/CD workflow`
- [ ] Create PR

### 6.4 Wait for CI Checks

- [ ] PR shows ✅ All checks passed
- [ ] Review section shows checks:
  - [ ] CI - Tests & Lint ✅

### 6.5 Merge PR to Develop

- [ ] Click **Merge pull request**
- [ ] Select **Create a merge commit**
- [ ] Confirm merge

### 6.6 Watch Staging Deploy

- [ ] Go to **GitHub → Actions**
- [ ] Find **Deploy to Staging**
- [ ] Watch workflow run (~5-10 min)
- [ ] All steps should pass:
  - [ ] Build frontend ✅
  - [ ] Build backend ✅
  - [ ] Deploy to Railway ✅
  - [ ] Run smoke tests ✅

### 6.7 Verify Staging Live

```bash
# Test staging is running
curl https://nest.unearthoneearth.com/

# Should return HTML (if root path)
# Or API response if hitting API endpoint
```

- [ ] Staging loads successfully

### 6.8 Cleanup Test Branch

```bash
git branch -d feature/test-workflow
git push origin --delete feature/test-workflow
```

- [ ] Local branch deleted
- [ ] Remote branch deleted

---

## Phase 7: Database Cloning Setup (45 min)

### 7.1 Install Backend Dependencies

```bash
cd backend
npm ci
cd ..
```

- [ ] Dependencies installed

### 7.2 Test Backup Script Locally

```bash
cd backend
cp ../.env.production ./..env.production.bak

node ../scripts/backup-restore-db.js --action backup
```

- [ ] Backup created in `backups/` folder
- [ ] File size shows (should be > 1 MB)
- [ ] No errors

### 7.3 Test List Backups

```bash
node ../scripts/backup-restore-db.js --action list
```

- [ ] Shows available backups
- [ ] Most recent listed first

### 7.4 Test Full Clone (Manual)

```bash
node ../scripts/backup-restore-db.js --action clone-with-anonymize
```

- [ ] Backup created ✅
- [ ] Anonymization runs ✅
- [ ] Restore to staging succeeds ✅
- [ ] Output shows: `✅ Clone complete!`

### 7.5 Verify Staging Data

Connect to staging MongoDB:

```bash
# Get connection string from .env.staging
# Use MongoDB Compass or command line

mongo "$STAGING_MONGODB_URI"
# Once connected:
db.User.countDocuments()
db.Customer.countDocuments()
db.Course.countDocuments()
```

- [ ] User count > 0
- [ ] Customer count > 0
- [ ] Course count > 0
- [ ] Data from production cloned

### 7.6 Verify Anonymization

```bash
# Check users don't have real emails
db.User.findOne()
# email should be: test.user.###@staging.test (NOT real)

# Check passwords are anonymized
# Should see dummy hash (NOT real bcrypt)
```

- [ ] No real emails in staging
- [ ] No real passwords in staging
- [ ] Passwordhash is dummy value

---

## Phase 8: Nightly Clone Automation (15 min)

### 8.1 Manual Trigger Test

- [ ] Go to **GitHub → Actions**
- [ ] Find **Nightly - Clone Production DB to Staging**
- [ ] Click **Run workflow**
- [ ] Keep **Anonymize data: true**
- [ ] Click **Run workflow**
- [ ] Watch it execute:
  - [ ] Backup production ✅
  - [ ] Anonymize data ✅
  - [ ] Restore to staging ✅
  - [ ] Verify staging ✅
- [ ] Takes 5-15 min depending on DB size

### 8.2 Verify Nightly Schedule

- [ ] Open `.github/workflows/nightly-db-clone.yml`
- [ ] Verify line: `- cron: '0 2 * * *'`
- [ ] This means: 2 AM UTC every day
- [ ] Convert to your timezone:
  - [ ] 2 AM UTC = 10 PM EST = 3:30 AM IST
- [ ] If different time needed, edit and change cron

### 8.3 Check First Scheduled Run

- [ ] Wait until 2 AM UTC tomorrow
- [ ] Go to **GitHub → Actions**
- [ ] Find **Nightly - Clone Production DB to Staging**
- [ ] Should see new run executed
- [ ] Review logs - should show ✅ success

---

## Phase 9: Production Deployment Dry-Run (20 min)

### 9.1 Test Deploy to Production

Create test commit on main:

```bash
git checkout main
git pull origin main
git checkout -b release/test-deploy
echo "# Test version" >> README.md
git add README.md
git commit -m "test: verify production deployment"
git checkout main
git merge release/test-deploy
git push origin main
git tag v1.0.0-test
git push origin v1.0.0-test
git branch -d release/test-deploy
```

- [ ] Commit and tag pushed to main

### 9.2 Watch Production Deploy

- [ ] Go to **GitHub → Actions**
- [ ] Find **Deploy to Production**
- [ ] Watch workflow:
  - [ ] Validate production ✅
  - [ ] Build frontend ✅
  - [ ] Build backend ✅
  - [ ] Deploy to Railway ✅
  - [ ] Run smoke tests ✅
- [ ] Takes 10-15 min

### 9.3 Verify Production Live

```bash
curl https://next.unearthoneearth.com/

# Should return something (API or HTML)
```

- [ ] Production responds
- [ ] Frontend loads (if testing web frontend)
- [ ] API responds (if hitting API endpoint)

### 9.4 Cleanup Test Tag

```bash
git tag -d v1.0.0-test
git push origin --delete v1.0.0-test
```

- [ ] Test tag removed

---

## Phase 10: Rollback Testing (20 min)

### 10.1 Test Git Revert Rollback

```bash
# Find commit to revert
git log --oneline main -5

# Revert the test commit
git revert -n abc123def  # Use commit hash

git commit -m "Revert: production test commit"
git push origin main
```

- [ ] Revert commit created
- [ ] Deploy to production automatically
- [ ] Production returns to previous version

### 10.2 Test Railway Rollback

- [ ] Go to **Railway → production-specialistly**
- [ ] Click **Deployments** section
- [ ] Find previous successful deployment
- [ ] Click **Rollback**
- [ ] Confirm
- [ ] Wait 30-60 sec for rollback
- [ ] Click **Deployments** to verify rolled back

- [ ] Previous version now deployed

---

## Phase 11: Documentation & Knowledge Transfer (30 min)

### 11.1 Documentation Files

- [ ] Read `OPTION1_SETUP_GUIDE.md` (what you just did)
- [ ] Read `DATABASE_CLONE_GUIDE.md` (cloning & anonymization)
- [ ] Bookmark both in browser or notes

### 11.2 Update Team Documentation

- [ ] Create WORKFLOW_README.md in repo:
  ```markdown
  # Development Workflow
  
  ## Quick Start
  
  1. Feature branches: `feature/name` from `develop`
  2. PR to `develop` 
  3. Auto-deploys to staging
  4. Release PR to `main`
  5. Auto-deploys to production
  
  See docs for details.
  ```

- [ ] Share with team

### 11.3 Create Team Checklist

- [ ] Document key contacts
- [ ] Document emergency procedures
- [ ] Document on-call rotation (if applicable)

---

## Phase 12: Final Verification (20 min)

### 12.1 Complete Feature → Staging → Production Flow

```bash
git checkout develop
git checkout -b feature/complete-test
echo "# Feature test" >> README.md
git add README.md
git commit -m "feat: complete workflow test"
git push -u origin feature/complete-test
```

- [ ] Feature branch created

**On GitHub:**
- [ ] Create PR to develop
- [ ] Verify CI passes ✅
- [ ] Merge to develop
- [ ] Wait for staging deploy ✅

```bash
git checkout develop
git pull origin develop
git checkout -b release/v0.1.0
git checkout main
git merge release/v0.1.0
git tag v0.1.0
git push origin main
git push origin v0.1.0
```

**On GitHub:**
- [ ] Verify deploy to production starts ✅
- [ ] Monitor logs ✅
- [ ] Verify production updated ✅

### 12.2 Verify Everything Works

- [ ] Staging running with `develop` code ✅
- [ ] Production running with `main` code ✅
- [ ] Nightly clone scheduled ✅
- [ ] Database backup script works ✅
- [ ] Rollback procedure documented ✅

---

## ✅ Project Complete!

All phases finished. Your complete CI/CD pipeline is ready:

✅ **Git Branching:** develop → staging, main → production  
✅ **GitHub Actions:** 4 workflows automated  
✅ **GitHub Secrets:** 3 secrets configured  
✅ **Staging Database:** Separate MongoDB instance  
✅ **Staging Deployment:** Auto-deploy from develop  
✅ **Production Deployment:** Auto-deploy from main  
✅ **Database Cloning:** Nightly automated with anonymization  
✅ **Rollback Strategy:** Git revert or Railway rollback  

---

## 📞 Support

If any step fails:

1. **Check logs:**
   - GitHub Actions logs for CI/deploy issues
   - Railway logs for runtime issues

2. **Verify configuration:**
   - GitHub secrets are set ✅
   - MongoDB URIs correct ✅
   - Railway variables configured ✅

3. **Common issues:**
   - See troubleshooting section of OPTION1_SETUP_GUIDE.md
   - DATABASE_CLONE_GUIDE.md for cloning issues

---

## 🎉 You're Done!

Your development workflow is production-ready. Happy coding! 🚀
