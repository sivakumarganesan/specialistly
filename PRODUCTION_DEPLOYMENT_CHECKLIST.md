# Production Deployment - Domain Setup Checklist

## Domain Purchased ✅
- Domain: **www.specialistly.com**
- Registrar: Namecheap

## Step 1: DNS Configuration (Namecheap) ⏳

### Add DNS Records in Namecheap

Go to: Domain List → www.specialistly.com → Manage → Advanced DNS

**Add these records:**

```
1. CNAME Record (for www subdomain)
   Host: www
   Value: cname.vercel.com
   TTL: Automatic

2. A Record (for root domain)
   Host: @
   Value: 76.76.19.132
   TTL: Automatic

3. CNAME Record (for wildcard subdomains)
   Host: *
   Value: cname.vercel.com
   TTL: Automatic
```

**After adding:** Click "Save DNS Records"
⏱️ **Wait 15-30 minutes for DNS propagation**

## Step 2: Deploy Frontend to Vercel ⏳

### Create Vercel Project

1. Go to [vercel.com](https://vercel.com)
2. Login with GitHub
3. Create new project
4. Select `specialistly` repository
5. Click "Deploy"
6. Wait for deployment to complete

### Add Domain to Vercel

1. In Vercel project → Go to "Settings" → "Domains"
2. Click "Add Domain"
3. Enter: `www.specialistly.com`
4. Vercel will show "Valid Configuration"
5. Add root domain: `specialistly.com`
6. SSL certificate auto-generates (takes 5-10 mins)

### Set Environment Variable

In Vercel Settings → Environment Variables:
```
VITE_API_URL=https://your-railway-domain.up.railway.app/api
```
Replace with actual Railway domain

## Step 3: Deploy Backend to Railway ⏳

### Railway Configuration

1. Go to Railway project dashboard
2. Click "Variables" tab
3. Update environment variables:

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
JWT_SECRET=your-super-secret-jwt-key-generate-random-string
GOOGLE_APPLICATION_CREDENTIALS=./credentials.json
```

4. Click "Save"
5. Railway auto-redeploys with new variables
6. Copy Railway domain: `specialistly-prod.up.railway.app`

## Step 4: Update Zoom OAuth Settings ⏳

1. Go to [Zoom App Marketplace](https://marketplace.zoom.us)
2. Select your OAuth app
3. Update "Redirect URL":
   - Change to: `https://www.specialistly.com/api/zoom/oauth/user-callback`
4. Save changes

## Step 5: Verify Production Setup

### Test Frontend
```
Open browser: https://www.specialistly.com
```
✅ Should load your application

### Test API
```
https://www.specialistly.com/api/users
```
✅ Should connect to Railway backend

### Test in Browser Console
```javascript
// Check if API URL is correct
console.log(import.meta.env.VITE_API_URL)
// Should show: https://your-railway-domain.up.railway.app/api
```

### Verify CORS
Open DevTools (F12) → Network tab
- API calls should NOT show CORS errors
- Response headers should include:
  - `access-control-allow-origin: https://www.specialistly.com`

### Test Authentication
1. Try to login
2. Should work without CORS errors
3. Check Network tab for successful auth endpoints

### Test Zoom Integration
1. Navigate to Zoom connection page
2. Click "Connect Zoom"
3. Should redirect to Zoom OAuth
4. After approval, should redirect back to: `https://www.specialistly.com/api/zoom/oauth/user-callback`
5. Connection should complete successfully

## Environment Variables Updated ✅

### Backend (.env.production)
```
✅ CORS_ORIGIN=https://www.specialistly.com
✅ ZOOM_REDIRECT_URI=https://www.specialistly.com/api/zoom/oauth/user-callback
```

### Frontend (.env.production)
```
✅ VITE_API_URL=https://your-railway-domain.up.railway.app/api
```

## Production Status

| Component | Status | Notes |
|-----------|--------|-------|
| Domain | ✅ Purchased | www.specialistly.com |
| DNS Records | ⏳ Pending | Add to Namecheap |
| Frontend (Vercel) | ⏳ Pending | Deploy & add domain |
| Backend (Railway) | ⏳ Pending | Set environment variables |
| MongoDB Atlas | ✅ Ready | specialistlydb_prod configured |
| Zoom OAuth | ⏳ Pending | Update redirect URI |

## Quick Reference

**DNS Records to Add (Namecheap):**
- `www CNAME cname.vercel.com`
- `@ A 76.76.19.132`
- `* CNAME cname.vercel.com`

**Vercel Domain Setup:**
- Add `www.specialistly.com` in Vercel Domains
- Add `specialistly.com` for root domain
- Auto-redirects configured

**Railway Environment Variables:**
- Update CORS_ORIGIN
- Update ZOOM_REDIRECT_URI
- All others stay same

**Testing Endpoints:**
- Frontend: `https://www.specialistly.com`
- API: `https://www.specialistly.com/api/users`
- Zoom callback: `https://www.specialistly.com/api/zoom/oauth/user-callback`

## Complete Checklist

- [ ] DNS records added to Namecheap (wait 30 mins)
- [ ] Vercel project created
- [ ] Domain added to Vercel
- [ ] VITE_API_URL set in Vercel
- [ ] Frontend deployed at https://www.specialistly.com
- [ ] Railway environment variables updated
- [ ] Backend deployed with new CORS_ORIGIN
- [ ] Zoom OAuth redirect URI updated
- [ ] Production frontend loads without errors
- [ ] API calls working (Network tab check)
- [ ] CORS headers present in API responses
- [ ] Zoom OAuth flow working
- [ ] Production ready for go-live! 🚀

---

**Estimated Time: 45-60 minutes from DNS setup to full production deployment**

See: DOMAIN_CONFIGURATION_GUIDE.md for detailed instructions
