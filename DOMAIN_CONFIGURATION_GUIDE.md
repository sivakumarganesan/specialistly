# Production Domain Configuration Guide

## Domain Info
- **Domain**: www.specialistly.com
- **Root Domain**: specialistly.com

## Step 1: Update Environment Variables

### Backend (.env.production)
Update CORS_ORIGIN and Zoom redirect URI with your domain:

```
CORS_ORIGIN=https://www.specialistly.com
ZOOM_REDIRECT_URI=https://www.specialistly.com/api/zoom/oauth/user-callback
```

### Frontend (.env.production)
```
VITE_API_URL=https://your-railway-domain.up.railway.app/api
```

## Step 2: Configure DNS Records (Namecheap)

### Option A: Point to Vercel (Recommended)

1. **Login to Namecheap**
2. **Go to Domain List → www.specialistly.com**
3. **Click "Manage"**
4. **Go to "Advanced DNS" tab**
5. **Add these records:**

**For www.specialistly.com (pointing to Vercel):**
```
Type: CNAME
Host: www
Value: cname.vercel.com
TTL: Automatic
```

**For root domain specialistly.com:**
```
Type: A
Host: @
Value: 76.76.19.132  (Vercel IP for root domains)
TTL: Automatic
```

**Add wildcard for subdomains (for branded pages):**
```
Type: CNAME
Host: *
Value: cname.vercel.com
TTL: Automatic
```

6. **Save DNS records** (takes 15-30 minutes to propagate)

### Option B: Alternative DNS Setup

If Vercel IPs change, use these Vercel nameservers:
```
NS1.VERCEL-DNS.COM
NS2.VERCEL-DNS.COM
```

Change Namecheap nameservers to point to Vercel:
1. Go to "Nameservers" section
2. Select "Custom DNS"
3. Add the 2 Vercel nameservers above

## Step 3: Setup Vercel (Frontend Deployment)

### Connect Domain in Vercel

1. **Go to [vercel.com](https://vercel.com)**
2. **Login with GitHub**
3. **Create new project** → Select `specialistly` repo
4. **After deployment, go to "Settings" → "Domains"**
5. **Add custom domain:**
   - Domain: `specialistly.com`
   - Vercel will verify with nameserver check
   - Takes 2-10 minutes
6. **Add www subdomain:**
   - Domain: `www.specialistly.com`
   - Should auto-redirect to root domain

### Vercel Configuration

Set environment variables in Vercel:
```
VITE_API_URL=https://your-railway-domain.up.railway.app/api
```

## Step 4: Configure Railway Backend

### Update Environment Variables

In Railway dashboard, update:

```
CORS_ORIGIN=https://www.specialistly.com
ZOOM_REDIRECT_URI=https://www.specialistly.com/api/zoom/oauth/user-callback
```

Railway will auto-redeploy with new variables.

## Step 5: Update Zoom OAuth Settings

1. **Go to [Zoom App Marketplace](https://marketplace.zoom.us)**
2. **Select your OAuth app**
3. **Update Redirect URL:**
   - Old: `http://localhost:5001/api/zoom/oauth/user-callback`
   - New: `https://www.specialistly.com/api/zoom/oauth/user-callback`
4. **Save changes**

## Step 6: DNS Propagation Verification

### Check if DNS is working:

```powershell
# Test if domain points to Vercel
nslookup www.specialistly.com
nslookup specialistly.com

# Should show Vercel's A record (76.76.19.132) or CNAME (cname.vercel.com)
```

Or use online tool: [DNS Checker](https://dnschecker.org)

## Step 7: Production Testing

### Test Frontend
```
https://www.specialistly.com
```
Should load your app

### Test API Connectivity
```powershell
# From browser console or curl
curl -X GET "https://www.specialistly.com/api/users"
```
Should connect to Railway backend

### Test Zoom Integration
1. Try to connect Zoom account
2. Should redirect to: `https://www.specialistly.com/api/zoom/oauth/user-callback`
3. Should complete without errors

### Test CORS
1. Open browser DevTools (F12)
2. Check Network tab
3. API calls should have proper CORS headers
4. Should NOT show CORS errors

## Full Deployment Architecture

```
www.specialistly.com
    ↓
Vercel (Frontend - React)
    ├─ VITE_API_URL=https://railway-backend.up.railway.app/api
    └─ Points to:
           ↓
       Railway (Backend - Node.js)
           ├─ CORS_ORIGIN=https://www.specialistly.com
           └─ Connects to:
                  ↓
              MongoDB Atlas
              └─ specialistlydb_prod
```

## Environment Variables Summary

### Frontend (.env.production in root)
```
VITE_API_URL=https://your-railway-domain.up.railway.app/api
```

### Backend (in Railway Dashboard)
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

## Troubleshooting

**Domain shows "Not Found"?**
- DNS might not have propagated yet (wait 30 mins)
- Check: `nslookup www.specialistly.com`
- Verify DNS records in Namecheap match Vercel settings

**CORS Errors?**
- Update CORS_ORIGIN in Railway to `https://www.specialistly.com`
- Verify it's exactly matching
- Railway redeploys changes automatically

**Zoom OAuth Not Working?**
- Update redirect URI in Zoom marketplace
- Verify: `https://www.specialistly.com/api/zoom/oauth/user-callback`
- Clear browser cache before testing

**SSL Certificate Issues?**
- Vercel auto-handles SSL/TLS
- Takes 5-10 minutes after domain verified
- Check Vercel Domains tab for "Valid Configuration"

## Checklist

- [ ] Domain purchased: www.specialistly.com
- [ ] DNS records configured (CNAME + A record)
- [ ] Vercel project created and domain added
- [ ] Frontend deployed with new domain
- [ ] Railway environment variables updated
- [ ] Backend redeployed with new CORS_ORIGIN
- [ ] Zoom OAuth redirect URI updated
- [ ] DNS propagation verified (15-30 mins)
- [ ] Frontend loads at https://www.specialistly.com
- [ ] API connectivity working
- [ ] Zoom OAuth integration tested
- [ ] No CORS errors in console
- [ ] Production ready! 🚀

---

**Status**: Domain configured and ready for deployment
