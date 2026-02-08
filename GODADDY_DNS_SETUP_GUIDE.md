# GoDaddy DNS Configuration Guide

## Domain Info
- **Domain**: www.specialistly.com
- **Registrar**: GoDaddy
- **Target**: Vercel (Frontend)

## Step 1: Access GoDaddy DNS Settings

1. **Login to [GoDaddy](https://www.godaddy.com)**
2. **Go to "My Products"**
3. **Find your domain** `specialistly.com`
4. **Click the domain** to open details
5. **Click "Manage DNS"** (or "DNS Management")

## Step 2: Add DNS Records in GoDaddy

You need to add 3 records for Vercel:

### Record 1: CNAME for www subdomain

1. **Click "Add Record"** button
2. **Set these values:**
   - **Type**: CNAME
   - **Host**: www
   - **Points to**: cname.vercel.com
   - **TTL**: 1 hour (or default)
3. **Click "Save"**

### Record 2: A Record for root domain

1. **Click "Add Record"** button
2. **Set these values:**
   - **Type**: A
   - **Host**: @ (or leave blank for root)
   - **Points to**: 76.76.19.132
   - **TTL**: 1 hour (or default)
3. **Click "Save"**

### Record 3: CNAME for wildcard (subdomains)

1. **Click "Add Record"** button
2. **Set these values:**
   - **Type**: CNAME
   - **Host**: *
   - **Points to**: cname.vercel.com
   - **TTL**: 1 hour (or default)
3. **Click "Save"**

## Step 3: Verify DNS Records

After adding all 3 records, your DNS tab should show:

```
Type   | Host | Points To
-------|------|------------------
CNAME  | www  | cname.vercel.com
A      | @    | 76.76.19.132
CNAME  | *    | cname.vercel.com
```

⏱️ **Wait 15-30 minutes for DNS propagation**

## Step 4: Check DNS Propagation

### Option A: Online DNS Checker
Go to [https://dnschecker.org](https://dnschecker.org)
- Enter: `specialistly.com`
- Select: A Record
- Should show: 76.76.19.132

### Option B: PowerShell Command
```powershell
nslookup specialistly.com
nslookup www.specialistly.com
```
Should show GoDaddy's nameservers or Vercel's A record.

## Step 5: Add Domain to Vercel

Once DNS is propagated:

1. **Go to [vercel.com](https://vercel.com)**
2. **Login with GitHub**
3. **Go to your project settings**
4. **Click "Domains"**
5. **Add custom domain:**
   - Enter: `specialistly.com`
   - Vercel checks DNS configuration
   - Should show: "Valid Configuration"
6. **Add www variant:**
   - Enter: `www.specialistly.com`
   - Should auto-redirect to root

### Vercel will provide:
- SSL certificate (auto-generated)
- CDN endpoints
- Production URL

## Step 6: Deploy Frontend to Vercel

1. **In Vercel dashboard**, create new project
2. **Select `specialistly` GitHub repository**
3. **Click "Deploy"**
4. **Set Environment Variables:**
   ```
   VITE_API_URL=https://your-railway-domain.up.railway.app/api
   ```
5. **Wait for deployment to complete**

## Step 7: Configure Backend (Railway)

### Update Railway Environment Variables:

1. **Go to Railway dashboard**
2. **Select your project**
3. **Click "Variables" tab**
4. **Update these values:**

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

5. **Click "Save"**
6. **Railway auto-redeploys**
7. **Copy Railway domain** (format: `specialistly-prod.up.railway.app`)

## Step 8: Update Frontend API URL

### Update .env.production:

```
VITE_API_URL=https://your-railway-domain.up.railway.app/api
```

Replace `your-railway-domain` with actual Railway domain from Step 7.

## Step 9: Update Zoom OAuth

1. **Go to [Zoom Marketplace](https://marketplace.zoom.us)**
2. **Select your OAuth app**
3. **Update "Redirect URL":**
   - Change from: `http://localhost:5001/api/zoom/oauth/user-callback`
   - Change to: `https://www.specialistly.com/api/zoom/oauth/user-callback`
4. **Save changes**

## Step 10: Test Production Setup

### Test 1: Frontend Loads
```
Open: https://www.specialistly.com
```
✅ Should load your app without errors

### Test 2: API Connectivity
Open browser console (F12) and check:
```javascript
fetch('https://www.specialistly.com/api/users')
  .then(r => r.json())
  .then(d => console.log(d))
```
✅ Should get response (no CORS errors)

### Test 3: Check CORS Headers
1. Open DevTools (F12)
2. Go to Network tab
3. Make an API call
4. Check response headers:
   ```
   access-control-allow-origin: https://www.specialistly.com
   ```

### Test 4: Zoom Integration
1. Go to Zoom connection page
2. Click "Connect Zoom"
3. Should redirect to Zoom OAuth
4. After auth, should return to: `https://www.specialistly.com/api/zoom/oauth/user-callback`

## GoDaddy DNS Summary

| Record | Host | Type | Value |
|--------|------|------|-------|
| www | www | CNAME | cname.vercel.com |
| Root | @ | A | 76.76.19.132 |
| Wildcard | * | CNAME | cname.vercel.com |

## Environment Variables Updated ✅

**Backend (.env.production):**
```
✅ CORS_ORIGIN=https://www.specialistly.com
✅ ZOOM_REDIRECT_URI=https://www.specialistly.com/api/zoom/oauth/user-callback
```

**Frontend (.env.production):**
```
✅ VITE_API_URL=https://your-railway-domain.up.railway.app/api
```

## Production Deployment Checklist

- [ ] GoDaddy DNS records added (3 records)
- [ ] DNS propagation verified (wait 30 mins)
- [ ] Vercel project created
- [ ] Domain added to Vercel (www.specialistly.com)
- [ ] Root domain added to Vercel (specialistly.com)
- [ ] Frontend deployed
- [ ] VITE_API_URL set in Vercel
- [ ] Railway environment variables updated
- [ ] Backend deployed with new CORS_ORIGIN
- [ ] Zoom OAuth redirect URI updated
- [ ] Frontend loads: https://www.specialistly.com ✅
- [ ] API calls working (F12 Network tab check)
- [ ] CORS headers present
- [ ] Zoom OAuth flow working
- [ ] Production ready! 🚀

## Troubleshooting

**Domain shows "Not Found"?**
- DNS propagation takes 15-30 minutes
- Run: `nslookup specialistly.com`
- Verify records in GoDaddy match above

**CORS Errors in Console?**
- Verify CORS_ORIGIN in Railway matches domain
- Railway redeploys automatically when variables change
- Clear browser cache and retry

**Zoom OAuth Not Working?**
- Check redirect URI in Zoom marketplace
- Must match exactly: `https://www.specialistly.com/api/zoom/oauth/user-callback`
- Clear cookies and try again

**API Returns 404?**
- Verify Railway domain in .env.production
- Check Railway deployment is running
- View Railway logs for errors

---

**Estimated Time: 45-60 minutes from DNS setup to full production**

Need help with any step? Check PRODUCTION_DEPLOYMENT_CHECKLIST.md
