# Railway Deployment Checklist

## Pre-Deployment (Complete Before Going Live)

### Code Preparation
- [ ] All code committed to GitHub
- [ ] `.env.production` is in `.gitignore` (won't be committed)
- [ ] `backend/.env.production` has all production values
- [ ] No hardcoded secrets in code
- [ ] Frontend compiled and ready (Vite build works locally)

### Database Ready
- [ ] ✅ MongoDB Atlas cluster created
- [ ] ✅ `specialistlydb_prod` database created
- [ ] ✅ Data migrated from development
- [ ] ✅ Collections verified (11 collections with 12+ documents)
- [ ] ✅ MongoDB user created (specialistly_user)
- [ ] ✅ IP Whitelist configured in MongoDB Atlas

### Environment Variables Ready
```
✅ NODE_ENV=production
✅ PORT=8080
✅ MONGODB_URI=mongodb+srv://specialistly_user:SpeciXlistly01@cluster0.jseized.mongodb.net/specialistlydb_prod?appName=Cluster0
✅ GMAIL_USER=specialistlyapp@gmail.com
✅ GMAIL_PASSWORD=lykm hzzy qchk icsx
✅ ZOOM_USER_MANAGED_CLIENT_ID=T0rMIOs5Quu2sGFeTAn2Tw
✅ ZOOM_USER_MANAGED_CLIENT_SECRET=bVM4MvvGPxvMVE1tnNEQWiGJkKPxkBHN
✅ ZOOM_REDIRECT_URI=https://myspecialistly.com/api/zoom/oauth/user-callback
✅ CORS_ORIGIN=https://myspecialistly.com
✅ JWT_SECRET=your-super-secret-jwt-key-change-this-in-railway
✅ GOOGLE_APPLICATION_CREDENTIALS=./credentials.json
```

## Railway Deployment (NEXT STEPS)

### Step 1: Create Railway Account
- [ ] Go to [railway.app](https://railway.app)
- [ ] Sign up / Login with GitHub
- [ ] Authorize Railway to access your repositories

### Step 2: Connect Repository
- [ ] Create new project
- [ ] Select "Deploy from GitHub repo"
- [ ] Choose `specialistly` repository
- [ ] Authorize Railway access

### Step 3: Configure Environment Variables
- [ ] Open Railway project dashboard
- [ ] Click "Variables" tab
- [ ] Add all environment variables from above
- [ ] Click "Save" (Railway auto-redeploys)

### Step 4: Monitor Deployment
- [ ] Watch "Deployments" tab
- [ ] Check build logs for errors
- [ ] Wait for "SUCCESS" status
- [ ] Verify no failed builds

### Step 5: Get Railway Domain
- [ ] Go to "Settings" tab
- [ ] Scroll to "Domains"
- [ ] Copy generated domain (e.g., `specialistly-prod.up.railway.app`)
- [ ] Save for frontend configuration

### Step 6: Test Backend
```powershell
# Test API is running
curl -X GET "https://your-railway-domain.up.railway.app/api/users"

# Should return data (or 401 if auth required, but at least connected)
```

## Post-Deployment

### Frontend Setup (After Railway Works)
- [ ] Update `.env.production` with Railway domain
- [ ] Commit to GitHub
- [ ] Setup Vercel (separate guide)

### Domain Configuration
- [ ] Purchase domain (myspecialistly.com)
- [ ] Configure DNS records
- [ ] Update CORS_ORIGIN to production domain
- [ ] Update Zoom redirect URIs

### Testing Checklist
- [ ] Backend API responds
- [ ] MongoDB connections working
- [ ] Authentication endpoints functional
- [ ] API routes returning data
- [ ] No 500 errors in logs
- [ ] CORS headers correct

### Monitoring
- [ ] Check Railway dashboard daily first week
- [ ] Monitor CPU/Memory usage
- [ ] Set up error alerts
- [ ] Review deployment logs

## Quick Reference

**Railway Costs:**
- Free tier: First month free
- Standard: $5-20/month depending on usage

**If Something Goes Wrong:**
1. Check "View Logs" in Deployments
2. Verify all environment variables are set
3. Check MongoDB connection string
4. Verify GitHub repo is public (or Railway has access)
5. Rollback to previous version if needed

**Useful Commands:**
```bash
# View current status
# Go to Railway dashboard → Select project → View logs

# Redeploy
# Make change to code, push to GitHub, Railway auto-redeploys
```

---

## Status

- ✅ MongoDB Atlas: READY
- ⏳ Railway: SETUP IN PROGRESS
- ⏳ Vercel: PENDING
- ⏳ Domain: PENDING

**Next:** Follow RAILWAY_SETUP_GUIDE.md for step-by-step instructions
