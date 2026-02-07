# Specialistly Deployment Guide - Option 4: Hybrid Approach

## Overview
This guide walks you through deploying Specialistly with:
- **Frontend**: Vercel
- **Backend**: Railway
- **Database**: MongoDB Atlas
- **Domain**: Custom domain with wildcard DNS for subdomains

**Total Setup Time**: ~2-3 hours  
**Monthly Cost**: $20-40

---

## Part 1: Prepare Your GitHub Repository (15 minutes)

### 1.1 Initialize Git (if not done)
```bash
cd c:\Work\specialistly
git init
git add .
git commit -m "Initial commit - Specialistly marketplace"
```

### 1.2 Create GitHub Repository
1. Go to https://github.com/new
2. Create repository named `specialistly` (keep it public or private as you prefer)
3. Copy the repository URL

### 1.3 Push Your Code
```bash
git remote add origin https://github.com/YOUR_USERNAME/specialistly.git
git branch -M main
git push -u origin main
```

---

## Part 2: Set Up MongoDB Atlas (20 minutes)

### 2.1 Create MongoDB Account
1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up for free account
3. Create new project named "specialistly"

### 2.2 Create Database Cluster
1. Click "Create" → Choose "Free" tier
2. Select cloud provider: **AWS**
3. Region: Choose closest to your users
4. Cluster name: `specialistly-prod`
5. Click "Create Cluster" (takes 3-5 minutes)

### 2.3 Create Database User
1. Go to "Database Access"
2. Click "Add New Database User"
3. **Username**: `specialistly_user`
4. **Password**: Generate secure password (copy it!)
5. **Database User Privileges**: Read and Write to any database
6. Click "Add User"

### 2.4 Add Network Access
1. Go to "Network Access"
2. Click "Add IP Address"
3. Select "Allow Access from Anywhere" (for Railway)
4. Confirm

### 2.5 Get Connection String
1. Go to "Databases" → Click "Connect" on your cluster
2. Select "Drivers"
3. Copy connection string (it will look like):
```
mongodb+srv://specialistly_user:PASSWORD@cluster.mongodb.net/specialistdb?retryWrites=true&w=majority
```
4. Replace `PASSWORD` with your actual password
5. Save this for later!

---

## Part 3: Deploy Backend to Railway (30 minutes)

### 3.1 Create Railway Account
1. Go to https://railway.app
2. Sign in with GitHub
3. Create new project

### 3.2 Connect Your GitHub Repository
1. Click "Create New" → "GitHub Repo"
2. Select your `specialistly` repository
3. Click "Deploy Now"

### 3.3 Add Environment Variables
1. In Railway, go to your deployment
2. Click "Variables" tab
3. Add the following:

```
MONGODB_URI=mongodb+srv://specialistly_user:PASSWORD@cluster.mongodb.net/specialistdb?retryWrites=true&w=majority
NODE_ENV=production
JWT_SECRET=your_super_secret_jwt_key_change_this_randomly
ZOOM_CLIENT_ID=your_zoom_client_id
ZOOM_CLIENT_SECRET=your_zoom_client_secret
ZOOM_REDIRECT_URI=https://api.youromain.com/api/auth/zoom/callback
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
APP_URL=https://api.yourdomain.com
```

### 3.4 Configure Build Settings
1. Go to "Settings"
2. **Start Command**: `npm start`
3. **Build Command**: (leave empty - no build needed for backend)
4. Save

### 3.5 Get Your Backend URL
1. Go to "Deployments"
2. Look for "Railway Domain" (e.g., `specialistly-prod.up.railway.app`)
3. Save this URL - you'll need it for frontend!

### 3.6 Wait for Deployment
- Railway will automatically deploy when you push to GitHub
- You should see a green checkmark when deployment succeeds

---

## Part 4: Deploy Frontend to Vercel (20 minutes)

### 4.1 Create Vercel Account
1. Go to https://vercel.com
2. Sign up with GitHub
3. Click "Import Project"

### 4.2 Import Your Repository
1. Select your `specialistly` repository
2. Click "Import"

### 4.3 Configure Project Settings
1. **Framework Preset**: Vite
2. **Build Command**: `npm run build`
3. **Output Directory**: `dist`
4. **Environment Variables**: Add:
```
VITE_API_URL=https://api.yourdomain.com/api
```
(We'll update this after you get your domain)

### 4.4 Deploy
1. Click "Deploy"
2. Wait for deployment (2-3 minutes)
3. You'll get a URL like: `specialistly.vercel.app`

---

## Part 5: Set Up Custom Domain (20 minutes)

### 5.1 Buy Your Domain
1. Go to https://www.namecheap.com or https://www.godaddy.com
2. Search and buy your domain (e.g., `specialistly.com`)
3. Cost: $10-15/year

### 5.2 Connect Domain to Vercel
1. In Vercel dashboard, go to "Settings" → "Domains"
2. Add your custom domain (e.g., `specialistly.com`)
3. Vercel will show you nameservers to configure

### 5.3 Point Domain to Vercel (in Namecheap/GoDaddy)
1. Go to your domain registrar
2. Find "Nameservers" settings
3. Update to Vercel's nameservers:
   - ns1.vercel-dns.com
   - ns2.vercel-dns.com
4. Save changes (takes 24-48 hours to propagate)

### 5.4 Add Backend Subdomain
1. In Vercel, add another domain: `api.specialistly.com`
2. Point to your Railway URL

Or in DNS settings:
- Create `A` record: `api` → Railway's IP
- OR create `CNAME` record: `api` → your-railway-url.up.railway.app

### 5.5 Configure Wildcard Subdomain (for Specialist Branded Pages)
In your domain registrar's DNS settings, add:
```
*.specialistly.com  CNAME  specialistly.vercel.app
```

This allows:
- `john-smith.specialistly.com`
- `jane-doe.specialistly.com`
- etc.

---

## Part 6: Update Environment Variables (10 minutes)

### 6.1 Update Vercel Environment Variables
1. In Vercel dashboard → "Settings" → "Environment Variables"
2. Update `VITE_API_URL`:
```
VITE_API_URL=https://api.specialistly.com/api
```
3. Redeploy (click "Redeploy" in Deployments tab)

### 6.2 Update Railway Environment Variables
1. Update `APP_URL`:
```
APP_URL=https://api.specialistly.com
ZOOM_REDIRECT_URI=https://api.specialistly.com/api/auth/zoom/callback
```
2. Railway will auto-redeploy

---

## Part 7: Testing & Verification (15 minutes)

### 7.1 Test Frontend
1. Go to `https://specialistly.com`
2. Sign in and verify login works
3. Check browser console for errors

### 7.2 Test Backend API
```bash
curl https://api.specialistly.com/api/health
```
Should return: `{"status":"ok"}`

### 7.3 Test Branding Feature
1. Log in as specialist
2. Go to "Branded Page Builder"
3. Fill in details and save
4. Check your specialist page at `https://your-slug.specialistly.com`

### 7.4 Monitor Logs
- **Vercel**: Dashboard → "Deployments" → Select deployment → "Logs"
- **Railway**: Dashboard → "Logs" tab
- **MongoDB**: Atlas → "Logs" section

---

## Part 8: Post-Deployment Checklist

- [ ] Frontend loads without errors
- [ ] Can log in successfully
- [ ] API calls are working
- [ ] Database is saving data
- [ ] Specialist branded pages are accessible
- [ ] Zoom OAuth is working
- [ ] Email verification works
- [ ] All features functional

---

## Monitoring & Maintenance

### Set Up Uptime Monitoring
1. Go to https://uptimerobot.com (free)
2. Add monitor for:
   - `https://specialistly.com`
   - `https://api.specialistly.com/api/health`
3. Get alerts if site goes down

### Enable Error Tracking
1. Sign up for Sentry: https://sentry.io
2. Get your Sentry DSN
3. Add to Vercel env vars:
```
VITE_SENTRY_DSN=your_sentry_dsn
```

### Daily Backup
- MongoDB Atlas automatically backs up daily (included in free tier)
- Exports available in Atlas → "Backup" section

---

## Scaling Later

As you grow:
1. **Database**: Upgrade from free M0 to M1+ cluster ($57/month)
2. **Backend**: Railway auto-scales; pay only for what you use
3. **Frontend**: Vercel Pro ($20/month) for more builds/month
4. **CDN**: Already included in Vercel

---

## Troubleshooting

### Domain not working?
- Wait 24-48 hours for DNS propagation
- Check DNS settings in registrar
- Use https://www.whatsmydns.net/ to verify

### API errors?
- Check Railway logs for backend errors
- Verify MongoDB connection string in env vars
- Check firewall rules in MongoDB Atlas

### Frontend not updating?
- Vercel automatically redeploys on `git push`
- Clear browser cache or hard refresh (Ctrl+Shift+R)

### Specialist subdomains not working?
- Verify wildcard DNS is configured
- Test with `nslookup test-slug.specialistly.com`

---

## Questions?

Refer to:
- **Vercel Docs**: https://vercel.com/docs
- **Railway Docs**: https://docs.railway.app
- **MongoDB Docs**: https://docs.mongodb.com/atlas/

Good luck with your launch! 🚀
