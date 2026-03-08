# Production Main Branch Setup - Git Instructions

## Current Status
- ✅ MongoDB Atlas configured (specialistlydb_prod)
- ✅ Database migrated (12 documents, 11 collections)
- ✅ Backend .env.production ready with correct domain
- ✅ Frontend .env.production ready
- ✅ Domain configured (www.specialistly.com)
- ⏳ Git main branch needs to be setup and pushed

## Step 1: Check Current Git Status

```powershell
cd c:\Work\specialistly
git status
```

This shows:
- Current branch (likely `develop` or `feature/branded-subdomain`)
- Untracked files (.env.production files)
- Modified files to commit

## Step 2: Stage Production Configuration Files

```powershell
# Add production environment files (but NOT secrets)
git add backend/.env.production
git add .env.production
git add .gitignore

# Add migration scripts
git add migrate-atlas.js
git add migrate-db.js

# Add documentation
git add MONGODB_PRODUCTION_SETUP.md
git add RAILWAY_SETUP_GUIDE.md
git add RAILWAY_DEPLOYMENT_CHECKLIST.md
git add DOMAIN_CONFIGURATION_GUIDE.md
git add GODADDY_DNS_SETUP_GUIDE.md
git add PRODUCTION_DEPLOYMENT_CHECKLIST.md
```

## Step 3: Create Commit Message

```powershell
git commit -m "chore: setup production configuration

- Add production MongoDB Atlas connection (specialistlydb_prod)
- Configure environment variables for production domain
- Setup production .env files for backend and frontend
- Add database migration scripts
- Add comprehensive deployment guides for MongoDB, Railway, Vercel, and GoDaddy DNS
- Update .gitignore to protect sensitive environment files
- Production ready for deployment to Railway and Vercel"
```

## Step 4: Switch to Main Branch

```powershell
# Check if main branch exists locally
git branch -a

# If main doesn't exist locally, create it from current branch
git checkout -b main

# If main exists but you're on different branch
git checkout main
git pull origin main
```

## Step 5: Merge Production Changes into Main

If you're on a feature branch:

```powershell
# Make sure you're on develop or feature branch
git branch

# Merge your changes into main
git checkout main
git merge develop
# Or if on feature branch:
git merge feature/branded-subdomain
```

## Step 6: Push Main to GitHub

```powershell
# Push main branch to GitHub
git push origin main

# If it says branch doesn't exist on remote
git push -u origin main
```

## Step 7: Verify on GitHub

1. Go to [github.com](https://github.com)
2. Open your `specialistly` repository
3. Check "Branches" tab
4. Should see:
   - ✅ main (latest commit with production config)
   - develop (previous branch)
   - feature/branded-subdomain (feature branch)

## Git Workflow Summary

```
Current State:
develop/feature → add production files → commit

Desired State:
main (production) ← merged from develop
↑
pushed to GitHub
```

## Complete Commands (Copy & Paste)

Run these in PowerShell in `c:\Work\specialistly`:

```powershell
# 1. Check status
git status

# 2. Stage all production files
git add backend/.env.production
git add .env.production
git add .gitignore
git add migrate-atlas.js
git add migrate-db.js
git add MONGODB_PRODUCTION_SETUP.md
git add RAILWAY_SETUP_GUIDE.md
git add RAILWAY_DEPLOYMENT_CHECKLIST.md
git add DOMAIN_CONFIGURATION_GUIDE.md
git add GODADDY_DNS_SETUP_GUIDE.md
git add PRODUCTION_DEPLOYMENT_CHECKLIST.md

# 3. Commit with message
git commit -m "chore: setup production configuration - ready for Railway & Vercel deployment"

# 4. Switch to main branch
git checkout -b main

# 5. Push to GitHub
git push -u origin main

# 6. Verify
git log --oneline -5
git branch -a
```

## What Gets Committed

✅ **Will Commit (safe):**
- Production configuration files
- Migration scripts
- Documentation guides
- Updated .gitignore

❌ **Will NOT Commit (protected by .gitignore):**
- `.env` (local development)
- `.env.local`
- Credentials/secrets
- node_modules/
- dist/
- build/

## After Pushing to GitHub

Your repository on GitHub will have:

```
main branch
├── backend/
│   ├── .env.production (production config - NO SECRETS)
│   ├── server.js
│   ├── controllers/
│   ├── models/
│   └── ... (all backend code)
├── src/
│   ├── (frontend code)
│   └── ...
├── .env.production (frontend - NO SECRETS)
├── .gitignore (updated)
├── migrate-atlas.js (migration script)
├── MONGODB_PRODUCTION_SETUP.md
├── RAILWAY_SETUP_GUIDE.md
├── RAILWAY_DEPLOYMENT_CHECKLIST.md
├── DOMAIN_CONFIGURATION_GUIDE.md
├── GODADDY_DNS_SETUP_GUIDE.md
├── PRODUCTION_DEPLOYMENT_CHECKLIST.md
├── package.json
├── tsconfig.json
└── (other project files)
```

## Next Steps After Pushing

1. ✅ Main branch pushed to GitHub
2. ⏳ Deploy frontend to Vercel (connects to GitHub)
3. ⏳ Deploy backend to Railway (connects to GitHub)
4. ⏳ Configure DNS in GoDaddy
5. ⏳ Test production deployment

## Important Notes

- **Don't commit actual secrets** (only template files)
- **Railway will read environment variables from Railway dashboard**, not from .env.production in repo
- **Vercel will read environment variables from Vercel dashboard**, not from .env.production in repo
- The `.env.production` files are just templates/references
- Actual secrets are set in Railway and Vercel dashboards

## Troubleshooting

**"fatal: not a git repository"?**
```powershell
cd c:\Work\specialistly
git init
```

**"Please tell me who you are"?**
```powershell
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

**"Permission denied"?**
- Make sure GitHub authentication is configured
- Use SSH key or personal access token

**"Main branch already exists"?**
```powershell
git checkout main
git pull origin main
# Then merge your changes
```

---

**Status**: Ready to push main branch to GitHub 🚀
