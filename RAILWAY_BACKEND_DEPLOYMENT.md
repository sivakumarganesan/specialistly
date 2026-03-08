# Deploy to Railway - Production Backend Deployment Guide

## What is Railway?
- **Railway** = Hosting platform for Node.js/Express backends
- **Auto-deploys** from GitHub whenever you push code
- **Starter plan** = $5-20/month
- **Database** connections included
- **Easy environment variables** management

---

## Step 1: Create Railway Account

1. Go to [railway.app](https://railway.app)
2. Click **"Login"** → **"Login with GitHub"**
3. Authorize Railway to access your GitHub repos
4. Complete signup
5. You're ready to deploy!

---

## Step 2: Create New Railway Project

### Option A: Deploy from Dashboard (Recommended)

1. **In Railway dashboard, click "New Project"**
2. **Select "GitHub Repo"**
3. **Search and select:** `specialistly`
4. **Click "Connect GitHub Repo"**
5. **Authorize Railway to access your repo**

### Option B: Deploy with Railway CLI

```bash
# Install Railway CLI (optional)
npm install -g @railway/cli

# Login
railway login

# Create project
railway init
```

---

## Step 3: Configure Environment Variables

### In Railway Dashboard:

1. **Click your project**
2. **Click "Variables" tab** (or Environment)
3. **Add these variables:**

```
NODE_ENV=production
PORT=8080
MONGODB_URI=mongodb+srv://specialistly_user:SpeciXlistly01@cluster0.jseized.mongodb.net/specialistlydb_prod?appName=Cluster0
GMAIL_USER=specialistlyapp@gmail.com
GMAIL_PASSWORD=lykm hzzy qchk icsx
ZOOM_USER_MANAGED_CLIENT_ID=T0rMIOs5Quu2sGFeTAn2Tw
ZOOM_USER_MANAGED_CLIENT_SECRET=bVM4MvvGPxvMVE1tnNEQWiGJkKPxkBHN
ZOOM_REDIRECT_URI=https://www.specialistly.com/api/zoom/oauth/user-callback
CORS_ORIGIN=https://www.specialistly.com
JWT_SECRET=your-super-secret-jwt-key-change-this-in-railway
GOOGLE_APPLICATION_CREDENTIALS=./credentials.json
```

### How to Add Each Variable:

1. Click **"New Variable"**
2. **Name:** (e.g., `NODE_ENV`)
3. **Value:** (e.g., `production`)
4. Click **"Add"**
5. Repeat for all variables above

### Important: Generate JWT Secret

For `JWT_SECRET`, generate a random string:

```bash
# Option 1: Use online generator
# Go to: https://www.uuidgenerator.net/

# Option 2: PowerShell
$([System.Guid]::NewGuid().ToString())

# Option 3: Use any random string
# Example: your-super-secret-jwt-key-change-this-in-railway
```

Use something like:
```
JWT_SECRET=sk_prod_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0
```

---

## Step 4: Build & Deployment Settings

### Build Command

Railway auto-detects Node.js and should use default:
```
npm install && npm run build
```

If it doesn't auto-detect, set manually:

1. Click **"Settings"** tab
2. Scroll to **"Build"**
3. **Build Command:** `npm install`
4. **Start Command:** `node backend/server.js`

### Deployment

After setting environment variables:

1. **Railway auto-builds** (watch the logs)
2. **Shows "Build Successful"** ✅
3. **Auto-deploys** to production
4. **Shows "Deployment Live"** ✅

---

## Step 5: Get Railway Domain

1. **Go to "Settings" tab**
2. **Scroll to "Domains"**
3. **Copy the generated domain**
   - Format: `specialistly-prod.up.railway.app`
   - Or similar
4. **Save this domain** - you'll need it for:
   - Frontend API URL
   - Zoom OAuth redirect
   - CORS configuration

---

## Step 6: Update Frontend with Railway Domain

### In `.env.production` (root directory):

```
VITE_API_URL=https://your-railway-domain.up.railway.app/api
```

Replace `your-railway-domain` with actual domain from Step 5.

### Then commit and push:

```bash
git add .env.production
git commit -m "chore: update Railway backend URL"
git push origin main
```

**Vercel auto-redeploys** when you push to main! ✅

---

## Step 7: Test Railway Backend

### Test 1: API Responds
```bash
# Replace with your Railway domain
curl -X GET "https://your-railway-domain.up.railway.app/api/users"
```

Should return data or auth error (not "connection refused") ✅

### Test 2: Check Logs
1. In Railway dashboard
2. Click **"Logs"** tab
3. Should show server running:
   ```
   Server running on port 8080
   Connected to MongoDB
   ```

### Test 3: From Vercel Frontend
1. Go to https://www.specialistly.com
2. Open DevTools (F12)
3. Go to **Network** tab
4. Make API call (login, fetch data)
5. Should see requests to your Railway domain
6. No CORS errors ✅

---

## Step 8: Verify MongoDB Connection

In Railway Logs, should see:
```
Connected to MongoDB
CORS configured for: https://www.specialistly.com
Server running on port 8080
```

If not, check:
1. MongoDB URI is correct
2. MongoDB Atlas whitelist includes Railway IP
3. Database name is `specialistlydb_prod`

---

## Step 9: Auto-Redeploy on Push

After initial setup, Railway **auto-deploys** when you:

```bash
git push origin main
```

Railway automatically:
1. Detects push
2. Rebuilds code
3. Updates environment
4. Deploys new version
5. Restarts server

**No manual deployment needed!** ✨

---

## Complete Deployment Checklist

- [ ] Railway account created
- [ ] GitHub repo connected to Railway
- [ ] All 10 environment variables added:
  - [ ] NODE_ENV=production
  - [ ] PORT=8080
  - [ ] MONGODB_URI (production database)
  - [ ] GMAIL_USER & GMAIL_PASSWORD
  - [ ] ZOOM_CLIENT_ID & ZOOM_CLIENT_SECRET
  - [ ] ZOOM_REDIRECT_URI (production domain)
  - [ ] CORS_ORIGIN (production domain)
  - [ ] JWT_SECRET (generated random string)
  - [ ] GOOGLE_APPLICATION_CREDENTIALS
- [ ] Build command set correctly
- [ ] Deployment successful (logs show "Live")
- [ ] Railway domain obtained (e.g., specialistly-prod.up.railway.app)
- [ ] Frontend .env.production updated with Railway domain
- [ ] Frontend redeployed to Vercel
- [ ] API test successful (curl or browser)
- [ ] MongoDB connection verified in logs
- [ ] No CORS errors in frontend console
- [ ] Backend ready for production! 🚀

---

## Troubleshooting

### Build Failed
**Error in logs:**
```
Error: Cannot find module 'express'
```
**Solution:**
- Check `backend/package.json` has all dependencies
- Railway should run: `npm install`
- Push to GitHub again: `git push origin main`

### MongoDB Connection Error
**Error in logs:**
```
MongoNetworkError: connection refused
```
**Solution:**
1. Check MongoDB URI is correct (copy from MongoDB Atlas)
2. Verify database name: `specialistlydb_prod`
3. Check MongoDB Atlas IP whitelist:
   - Go to MongoDB Atlas
   - Network Access → IP Whitelist
   - Add Railway IP (usually auto-detected)
   - Or add: `0.0.0.0/0` (allow all, less secure)
4. Restart Railway deployment

### CORS Errors in Frontend
**Browser console:**
```
Access to XMLHttpRequest blocked by CORS policy
```
**Solution:**
1. Check Railway CORS_ORIGIN matches domain
2. Verify: `CORS_ORIGIN=https://www.specialistly.com`
3. Redeploy Railway (push to main)
4. Hard refresh frontend: `Ctrl+Shift+R`

### Railway Domain Not Working
**Error:**
```
Can't reach this page
```
**Solution:**
1. Check logs show deployment successful
2. Verify NODE_ENV=production
3. Check PORT=8080
4. Test: `curl https://your-domain.up.railway.app/api/users`

### Cannot Connect to Railway from Vercel
**Error in frontend:**
```
ERR_CONNECTION_REFUSED
```
**Solution:**
1. Verify Railway domain in `.env.production`
2. Check Railway is running (green status in dashboard)
3. Verify CORS_ORIGIN in Railway config
4. Test endpoint directly: `curl https://your-domain.up.railway.app/api/users`

---

## Production Architecture After Railway

```
www.specialistly.com (Vercel - Frontend)
    ↓ (API calls)
your-railway-domain.up.railway.app (Railway - Backend)
    ↓ (Database)
MongoDB Atlas (specialistlydb_prod)
```

All connections:
- ✅ Frontend → Backend (via VITE_API_URL)
- ✅ Backend → MongoDB (via MONGODB_URI)
- ✅ Auto-scaling with traffic
- ✅24/7 monitoring

---

## Environment Variables Reference

| Variable | Value | Where Used |
|----------|-------|-----------|
| NODE_ENV | production | Express app mode |
| PORT | 8080 | Railway port |
| MONGODB_URI | mongodb+srv://... | Database connection |
| GMAIL_USER | specialistlyapp@gmail.com | Email sending |
| GMAIL_PASSWORD | lykm hzzy qchk icsx | Email authentication |
| ZOOM_CLIENT_ID | T0rMIOs5Quu2sGFeTAn2Tw | Zoom OAuth |
| ZOOM_CLIENT_SECRET | bVM4MvvGPxvMVE1tnNEQWiGJkKPxkBHN | Zoom OAuth |
| ZOOM_REDIRECT_URI | https://www.specialistly.com/api/zoom/oauth/user-callback | Zoom OAuth callback |
| CORS_ORIGIN | https://www.specialistly.com | Frontend origin |
| JWT_SECRET | your-random-key | JWT signing |

---

## Cost

- **Railway Free Tier**: $5/month included
- **Usage**: Scales with traffic ($0.10/hr overages)
- **Estimate**: $5-20/month for typical usage
- **MongoDB**: Separate (MongoDB Atlas)

---

## Summary: 10-Minute Railway Deployment

1. Create Railway account (2 mins)
2. Connect GitHub repo (1 min)
3. Add 10 environment variables (4 mins)
4. Wait for build/deploy (2 mins)
5. Get Railway domain (1 min)
6. Test API (1 min)

**Total: ~15 minutes from start to production backend live!** 🚀

---

## After Railway is Live

- ✅ Backend deployed
- ⏳ Update Vercel with Railway domain
- ⏳ Test full integration
- ⏳ Update Zoom OAuth settings
- ⏳ Final production testing
- ⏳ Go live! 🎉

---

**Status: Ready to deploy backend to Railway!**

See VERCEL_DEPLOYMENT_GUIDE.md for frontend deployment
