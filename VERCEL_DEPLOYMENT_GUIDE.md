# Deploy to Vercel - Production Frontend Deployment Guide

## What is Vercel?
- **Vercel** = Hosting platform for React/Next.js apps
- **Auto-deploys** from GitHub whenever you push code
- **Free tier** available
- **SSL/HTTPS** automatic
- **CDN** included

---

## Step 1: Create Vercel Account

1. Go to [vercel.com](https://vercel.com)
2. Click **"Sign Up"**
3. Choose **"Continue with GitHub"**
4. Authorize Vercel to access your GitHub repos
5. Complete signup

---

## Step 2: Create New Project in Vercel

1. **After login, click "New Project"**
2. **Select GitHub repository:**
   - Search for: `specialistly`
   - Click your repo: `sivakumarganesan/specialistly`
3. **Click "Import"**

---

## Step 3: Configure Project Settings

### Framework Detection
- Vercel should auto-detect: **Vite** (or React)
- Root directory: `.` (root of repo)
- Framework: **Vite**

### Build Settings
Leave as default:
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`

### Environment Variables

**Add these variables in Vercel dashboard:**

1. **Click "Environment Variables"**
2. **Add variable:**
   - Name: `VITE_API_URL`
   - Value: `https://your-railway-domain.up.railway.app/api`
   
   Replace `your-railway-domain` with actual Railway domain (e.g., `specialistly-prod.up.railway.app`)

3. **Click "Add"**
4. **Click "Deploy"**

---

## Step 4: Verify Deployment

**After clicking Deploy:**

1. **Watch deployment progress:**
   - Building: Shows build logs
   - Optimizing: Compressing assets
   - Finalizing: Setting up CDN
   - Live: ✅ Deployment complete

2. **Deployment takes 2-5 minutes**

3. **After completion, you get:**
   - **Vercel URL**: `https://specialistly.vercel.app`
   - **Production domain**: Ready for custom domain

---

## Step 5: Add Custom Domain (www.specialistly.com)

### In Vercel Dashboard:

1. **Go to "Settings" → "Domains"**
2. **Click "Add Domain"**
3. **Enter:** `www.specialistly.com`
4. **Vercel shows:**
   - DNS records needed
   - Or: "Add nameserver" option
5. **For GoDaddy users, add DNS records (see Step 6)**

---

## Step 6: Configure GoDaddy DNS Records

**After adding domain in Vercel, add DNS records in GoDaddy:**

### Login to GoDaddy:
1. Go to [godaddy.com](https://godaddy.com)
2. Click "My Products"
3. Find `specialistly.com`
4. Click **"Manage"**
5. Go to **"Advanced DNS"** tab

### Add These Records:

**Record 1 - Root Domain (A Record):**
```
Type: A
Host: @ (or blank)
Points To: 76.76.19.132
TTL: 1 hour
```
Click "Save"

**Record 2 - www Subdomain (CNAME):**
```
Type: CNAME
Host: www
Points To: cname.vercel.com
TTL: 1 hour
```
Click "Save"

**Record 3 - Wildcard for Branded Pages (CNAME):**
```
Type: CNAME
Host: *
Points To: cname.vercel.com
TTL: 1 hour
```
Click "Save"

---

## Step 7: Verify Domain in Vercel

1. **Go back to Vercel Domains**
2. **Click the domain:** `www.specialistly.com`
3. **Vercel checks DNS propagation**
4. **Status should show:** "Valid Configuration" ✅
5. **SSL Certificate** auto-generates (5-10 mins)

---

## Step 8: Test Production Deployment

### Test 1: Frontend Loads
```
Open: https://www.specialistly.com
```
Should load your Specialistly app ✅

### Test 2: Check API Connection
Open browser console (F12) and run:
```javascript
fetch('https://www.specialistly.com/api/users')
  .then(r => r.json())
  .then(d => console.log(d))
```
Should return data or connect (no CORS errors) ✅

### Test 3: Check CORS Headers
1. Open DevTools (F12)
2. Go to Network tab
3. Make API call
4. Check Response Headers:
   ```
   access-control-allow-origin: https://www.specialistly.com
   ```

### Test 4: Login Flow
1. Try to login
2. Should work without errors ✅

### Test 5: Navigate App
1. Create course/service
2. Access branded page builder
3. View specialist pages
4. Should all work ✅

---

## Complete Deployment Checklist

- [ ] Vercel account created
- [ ] GitHub repo imported to Vercel
- [ ] Build settings configured (Vite)
- [ ] VITE_API_URL environment variable set
- [ ] First deployment complete
- [ ] Vercel domain provided (specialistly.vercel.app)
- [ ] Custom domain added (www.specialistly.com)
- [ ] GoDaddy DNS records added (3 records)
- [ ] DNS propagation verified (15-30 mins)
- [ ] Vercel shows "Valid Configuration"
- [ ] SSL certificate generated
- [ ] Frontend loads at https://www.specialistly.com
- [ ] API connectivity verified (no CORS errors)
- [ ] Login flow tested
- [ ] App navigation tested
- [ ] Production ready! 🚀

---

## Auto-Deployment Setup

After initial deployment, Vercel automatically deploys when you:

1. **Push code to main branch**
   ```bash
   git push origin main
   ```

2. **Vercel detects push**
3. **Auto-builds and deploys**
4. **New version live in 2-5 minutes**

No manual deployment needed after first setup! ✨

---

## Troubleshooting

### "Build Failed" in Vercel?
- Check build logs for errors
- Common: Missing dependencies in package.json
- Fix: `npm install` then push to main again

### "Domain Invalid Configuration"?
- DNS records not propagated yet (wait 30 mins)
- Check GoDaddy records match Vercel requirements
- Run: `nslookup www.specialistly.com`

### "CORS Error in console"?
- Railway CORS_ORIGIN doesn't match domain
- Update in Railway: `CORS_ORIGIN=https://www.specialistly.com`
- Railway auto-redeploys
- Hard refresh browser (Ctrl+Shift+R)

### "Cannot connect to API"?
- Check Railway domain in .env
- Verify Railway is running/deployed
- Check MongoDB Atlas IP whitelist

### "Page not found (404)"?
- DNS propagation issue (wait 30 mins)
- Or: Vercel domain setup incomplete
- Check Vercel Domains tab for "Valid Configuration"

---

## Deployment Architecture (After Vercel)

```
GoDaddy DNS
    ↓
www.specialistly.com (DNS Records: A + CNAME + Wildcard)
    ↓
Vercel CDN (Global)
    ↓
Your React App (specialistly.vercel.app)
    ↓ (API calls)
Railway Backend (your-railway-domain.up.railway.app)
    ↓
MongoDB Atlas (specialistlydb_prod)
```

---

## Summary: 10-Minute Deployment

1. Create Vercel account (2 mins)
2. Import GitHub repo (1 min)
3. Set VITE_API_URL (1 min)
4. Deploy (3 mins)
5. Add GoDaddy DNS records (2 mins)
6. Wait for DNS propagation (15-30 mins)
7. Test in browser ✅

**Total: ~30 minutes from start to production live!**

---

**Status: Ready to deploy to Vercel! 🚀**

Next: After Vercel is live, deploy backend to Railway
