# Railway Unified Deployment: Frontend + Backend

Deploy both React frontend and Express backend from a single Railway project.

---

## 📋 Prerequisites

✅ Frontend and backend unified (this is done)
✅ Code committed to GitHub
✅ Railway project created
✅ MongoDB connected
✅ Environment variables configured

---

## 🚀 Step 1: Deploy to Railway

### Option A: Connect GitHub (Automated)

1. **Go to [Railway.app Dashboard](https://railway.app)**
2. **Create New Project** → **GitHub Repo**
3. **Select your repository**: `sivakumarganesan/specialistly`
4. **Railway automatically detects**:
   - `railway.json` for build/deploy commands
   - Builds frontend (`npm run build`)
   - Installs backend deps
   - Starts backend with `cd backend && node server.js`
5. **Wait for deployment** (~5-10 minutes)
6. **Check deployment status** → Should show ✅ Deployed

### Option B: Manual Deployment

```bash
# Install Railway CLI
npm install -g @railway/cli

# Log in to Railway
railway login

# Link to project
railway link

# Deploy to Railway
railway up

# View logs
railway logs
```

---

## 🔧 Step 2: Configure Railway Environment

### In Railway Dashboard:

1. **Go to your Project** → **Variables**
2. **Add these variables**:

```bash
# === Node Environment ===
NODE_ENV=production

# === Server Configuration ===
PORT=8080

# === Database Connection ===
DATABASE_URL=<your-mongodb-connection-string>

# === JWT & Security ===
JWT_SECRET=<your-jwt-secret>
JWT_EXPIRE=7d

# === CORS Configuration ===
CORS_ORIGIN=https://specialistly.com

# === Domain Configuration ===
API_BASE_URL=https://specialistly-production.up.railway.app/api
FRONTEND_URL=https://specialistly.com
BACKEND_URL=https://specialistly-production.up.railway.app

# === Subdomain Configuration ===
SUBDOMAIN_ENABLED=true
WILDCARD_DOMAIN=specialistly.com

# === Third-party Services ===
# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...

# Razorpay
RAZORPAY_KEY_ID=...
RAZORPAY_KEY_SECRET=...

# Gmail/Email
GMAIL_USER=...
GMAIL_APP_PASSWORD=...

# Zoom
ZOOM_CLIENT_ID=...
ZOOM_CLIENT_SECRET=...

# Cloudflare (if using)
CLOUDFLARE_API_TOKEN=...
CLOUDFLARE_ACCOUNT_ID=...

# Add any other variables from your .env.production file
```

3. **Save all variables**
4. **Railway automatically redeploys** with new variables

---

## 📝 Step 3: Set Custom Domain

### Connect specialistly-production.up.railway.app to your domain:

1. In Railway Dashboard → **Settings** → **Domain**
2. Link custom domain (if you have one)
3. OR use Railway's subdomain: `specialistly-production.up.railway.app`

---

## ✅ Step 4: Verify Deployment

### Health Check Endpoint:
```bash
curl https://specialistly-production.up.railway.app/api/health
```

Response should be:
```json
{
  "success": true,
  "message": "Backend server is running"
}
```

### Frontend Check:
```bash
curl https://specialistly-production.up.railway.app
```

Should return HTML (React app) - Check for `<!DOCTYPE html>` in response

---

## 🔄 Step 5: Enable Automatic Deployments

### In Railway:

1. **Settings** → **GitHub Integration**
2. **Connect your GitHub account**
3. **Select repository**: `sivakumarganesan/specialistly`
4. **Enable automatic deployments from `main` branch**

Now, every time you push to GitHub, Railway automatically deploys! 

---

## 🌐 Step 6: Update Cloudflare DNS

### Cloudflare DNS Settings:

**Record 1: Root Domain**
- Type: `CNAME`
- Name: `@` (or `specialistly.com`)
- Target: `specialistly-production.up.railway.app`
- Proxy: **Proxied** (orange cloud)

**Record 2: Wildcard Subdomains**
- Type: `CNAME`
- Name: `*`
- Target: `specialistly-production.up.railway.app`
- Proxy: **Proxied** (orange cloud)

**SSL/TLS Settings:**
- Go to **SSL/TLS** → **Edge Certificates**
- ✅ **Automatic HTTPS Rewrites**: ON
- ✅ **Always Use HTTPS**: ON

---

## 📱 How It Works Now

```
1. User visits: https://alice.specialistly.com
   ↓
2. Cloudflare DNS resolves to: specialistly-production.up.railway.app
   ↓
3. Railway Express Backend receives request
   ↓
4. Subdomain middleware extracts "alice" from hostname
   ↓
5. API Route OR React Route?
   ├─ API (starts with /api) → Express API handler
   └─ Frontend (everything else) → React index.html
   ↓
6. React app loads, detects subdomain, shows PublicWebsite component
   ↓
7. React makes API call to: /api/page-builder/public/websites/alice
   ↓
8. Backend returns website data with all published pages
   ↓
9. Frontend displays specialist's branded website
```

---

## 🔍 Monitor Deployment

### View Logs in Railway:
1. **Go to your Project**
2. **Deployment** → Select latest
3. **Logs** tab shows build & runtime logs
4. Watch for errors or warnings

### Monitor in Real-Time:
```bash
railway logs --follow
```

---

## 📊 Expected Build Output

```
Building with nixpacks...
→ Installing dependencies
  npm install in root
  npm install in backend
→ Building frontend
  npm run build
  ✓ Built successfully (dist/ created)
→ Preparing to deploy
→ Starting application
  cd backend && node server.js
  ✓ Backend listening on port 8080
```

---

## ✅ Testing Checklist

After deployment, verify:

- [ ] Health endpoint responds: `https://specialistly-production.up.railway.app/api/health`
- [ ] Main site loads: `https://specialistly.com`
- [ ] Subdomain loads: `https://test.specialistly.com`
- [ ] React app renders (no blank page)
- [ ] API calls work (Network tab in DevTools)
- [ ] No console errors (F12 → Console)
- [ ] Mobile responsive (F12 → Device Toolbar)
- [ ] Page navigation works (click between pages)
- [ ] Sections render correctly
- [ ] Branding displays (logo, colors)

---

## 🐛 Troubleshooting

### Build Fails
**Check logs**: `railway logs --follow`
**Common issues**:
- Missing dependencies: Add to package.json
- Node version mismatch: Specify in package.json
- Environment variables missing: Add in Railway dashboard

### App Starts but Shows Blank
**Check**:
- Frontend build succeeded (look for dist/ folder)
- No console errors (F12)
- API endpoint responds

### API Returns 404
**Check**:
- Routes are mounted correctly
- Middleware order is correct (API routes before static files)
- Subdomain is extracted correctly

### Subdomains Don't Work
**Check**:
- Cloudflare DNS updated (both @ and * records)
- DNS propagated (wait 5-10 minutes)
- Browser cache cleared
- SSL certificate valid

### Performance Issues
**In Railway Settings**:
- Increase RAM: 512MB → 1GB
- Increase CPU: 1 CPU (if needed)
- Check database connection limits

---

## 🔐 Security Best Practices

1. **Environment Variables**: Never commit secrets to GitHub
   - Set in Railway dashboard only
   - Use `.env.example` as template

2. **CORS**: Configured for specialistly.com and subdomains
   - Update if adding new domains

3. **SSL/TLS**: Automatically managed by Cloudflare
   - Keep HTTPS enforcement ON

4. **Database**: Use strong password for MongoDB
   - Restrict IP access in MongoDB Atlas

5. **Logs**: Monitor for errors
   - Set up alerts in Railway settings

---

## 📈 Performance Optimization

### Frontend (React):
- ✅ Vite build optimizations already configured
- ✅ Chunk size warnings will alert if bundles get too large
- ✅ Static files cached by Cloudflare

### Backend (Express):
- ✅ CORS configured efficiently
- ✅ Static file serving optimized
- ✅ API routes use pagination for large datasets

### Railway:
- Minimum recommended: 512MB RAM, 1 CPU
- Scale up if seeing performance issues
- Monitor metrics in Railway dashboard

---

## 🚀 Next Steps

1. **Deploy to Railway** (github integration or CLI)
2. **Set environment variables** in Railway dashboard
3. **Verify health endpoint** works
4. **Update Cloudflare DNS** (if not already done)
5. **Test subdomains** (create test website, visit subdomain)
6. **Monitor logs** for any errors

---

## 📞 Quick Reference

| Item | Value |
|------|-------|
| **Railway Project** | specialistly-production |
| **Build Command** | `npm run build && cd backend && npm install` |
| **Start Command** | `cd backend && node server.js` |
| **Main Domain** | specialistly.com |
| **API Base** | specialistly-production.up.railway.app/api |
| **Subdomains** | *.specialistly.com → railway |
| **Database** | MongoDB Atlas |
| **CDN** | Cloudflare |
| **SSL** | Cloudflare Edge Certificates |

---

## ✨ What's Included

With this setup, you now have:

✅ **Unified Deployment**: Frontend + Backend in single Railway project
✅ **Automatic Builds**: Railway builds React on every push
✅ **Subdomain Support**: Unlimited specialists at *.specialistly.com
✅ **SPA Routing**: Client-side routing works seamlessly
✅ **API + Static Files**: Express serves both simultaneously
✅ **Zero Downtime**: Seamless deployments
✅ **Easy Scaling**: Increase Railway resources if needed
✅ **Automatic SSL**: Cloudflare handles HTTPS
✅ **CI/CD**: GitHub push → Railway deploy automatically

---

**🎉 Deployment Complete!** Your platform is now ready for specialists to create branded websites on their custom subdomains.
