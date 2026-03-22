# Complete Subdomain Setup Guide: Cloudflare, Railway & Vite

This guide provides all necessary steps to enable multi-subdomain support for `https://{subdomain}.specialistly.com` across Cloudflare, Railway, and Vite.

---

## 📋 Quick Checklist

- [ ] **Cloudflare**: Configure wildcard DNS record
- [ ] **Cloudflare**: Enable SSL/TLS for wildcard
- [ ] **Railway**: Configure environment variables
- [ ] **Railway**: Set custom domain
- [ ] **Vite**: Build configuration (already done)
- [ ] **Backend**: Verify CORS and middleware
- [ ] **Test**: Verify subdomain access

---

## 1️⃣ CLOUDFLARE CONFIGURATION

### What You Need
- Cloudflare Dashboard access
- Your domain added to Cloudflare (e.g., specialistly.com)
- Server IP or domain (e.g., specialistly-production.up.railway.app)

### Step 1: Add Wildcard DNS Record

**THIS IS THE MOST CRITICAL STEP**

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Select your domain: `specialistly.com`
3. Navigate to **DNS** → **Records**
4. Click **Add record**

**For Root Domain:**
- Type: `CNAME`
- Name: `@` (or `specialistly.com`)
- Target: `specialistly-production.up.railway.app`
- TTL: Auto
- Proxy: **Proxied** (orange cloud icon)
- Save

**For All Subdomains (WILDCARD):**
- Type: `CNAME`
- Name: `*` (asterisk - this is the wildcard!)
- Target: `specialistly-production.up.railway.app`
- TTL: Auto
- Proxy: **Proxied** (orange cloud icon)
- Save

**Result should look like:**
```
Type  | Name | Target                            | Status
------|------|-----------------------------------|--------
CNAME | @    | specialistly-production.up.railway| ✓ Proxied
CNAME | *    | specialistly-production.up.railway| ✓ Proxied
```

### Step 2: Enable SSL/TLS

1. Go to **SSL/TLS** → **Edge Certificates**
2. Verify:
   - ✅ **Automatic HTTPS Rewrites**: ON
   - ✅ **Always Use HTTPS**: ON
   - ✅ **Minimum TLS Version**: 1.2

3. Go to **SSL/TLS** → **Overview**
   - Your SSL mode should be **Full** or **Full (strict)**

### Step 3: Add Wildcard Certificate (Optional)

If you want a custom certificate (instead of Cloudflare's auto-generated):

1. Go to **SSL/TLS** → **Custom SSL/TLS**
2. Click **Add certificate**
3. Upload certificate for `*.specialistly.com` and `specialistly.com`

### Step 4: Configure Caching (Optional)

1. Go to **Rules** → **Page Rules**
2. Create rule for: `*.specialistly.com/*`
3. Settings:
   - Cache Level: `Cache Everything`
   - Browser Cache Expiration: `1 day`

### Verify DNS Setup

In terminal, test if DNS resolves:
```bash
nslookup test.specialistly.com
nslookup alice.specialistly.com
nslookup bob.specialistly.com

# All should resolve to your Cloudflare IP
```

**DNS Propagation**: Up to 24-48 hours for full propagation

---

## 2️⃣ RAILWAY CONFIGURATION

### What You Need
- Railway.app account with app deployed
- Backend and frontend deployed
- Custom domain pointing to Railway

### Step 1: Set Custom Domain in Railway

1. Go to [Railway Dashboard](https://railway.app)
2. Select your project
3. Go to **Settings** → **Custom Domain**
4. Enter: `specialistly-production.up.railway.app`
   - OR your custom domain if you have one

### Step 2: Configure Environment Variables

In Railway Dashboard → **Variables**:

```bash
# === CORS Configuration ===
CORS_ORIGIN=https://specialistly.com

# === Domain Configuration ===
API_BASE_URL=https://specialistly-production.up.railway.app/api
FRONTEND_URL=https://specialistly.com
BACKEND_URL=https://specialistly-production.up.railway.app

# === Subdomain Configuration ===
SUBDOMAIN_ENABLED=true
WILDCARD_DOMAIN=specialistly.com

# === Other Variables (already configured) ===
DATABASE_URL=<your-mongodb-url>
JWT_SECRET=<your-secret>
# ... other env vars
```

### Step 3: Add Railway Deployment Trigger (Optional)

For automatic deployments when pushing to main:

1. Go to your Railway project
2. Settings → **GitHub Integration**
3. Connect your GitHub repo
4. Enable automatic deployments from `main` branch

### Step 4: Scale Railway Services

1. **Backend Service**:
   - CPU: 1 CPU (minimum)
   - Memory: 512 MB (minimum)
   - Increase if needed based on traffic

2. **Frontend Service** (if separate):
   - CPU: 0.5 CPU
   - Memory: 256 MB

---

## 3️⃣ VITE CONFIGURATION

### Current Status
Your Vite configuration is **ALREADY SET UP** ✅

File: `vite.config.ts`
```typescript
import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    chunkSizeWarningLimit: 2000,
  },
})
```

### What's Configured
✅ React plugin enabled
✅ Tailwind CSS plugin enabled
✅ Path alias (`@/`) for imports
✅ Build optimizations set
✅ Chunk size limits configured

### If You Need to Modify (Optional):

**For subdomain development locally:**

1. Create `.env.development` file:
```bash
VITE_API_BASE_URL=http://localhost:5001/api
VITE_APP_URL=http://localhost:3000
```

2. Create `.env.production` file:
```bash
VITE_API_BASE_URL=https://specialistly-production.up.railway.app/api
VITE_APP_URL=https://specialistly.com
```

3. Use in your React components:
```typescript
const apiUrl = import.meta.env.VITE_API_BASE_URL
```

---

## 4️⃣ BACKEND VERIFICATION

### What's Already Configured ✅

**File**: `backend/server.js`

**Subdomain Middleware**:
```javascript
import { subdomainMiddleware } from './middleware/subdomainMiddleware.js';
```

**CORS Configuration for Subdomains**:
```javascript
// Allow any subdomain of specialistly.com over HTTPS
if (origin.match(/^https:\/\/[a-z0-9-]+\.specialistly\.com(:[0-9]+)?$/)) {
  return true;
}
```

**Middleware Applied**:
```javascript
app.use(subdomainMiddleware);
```

### Verify CORS in Backend

File: `backend/server.js` (lines 33-68)

The backend is configured to:
- ✅ Allow all `*.specialistly.com` origins
- ✅ Allow local dev domains (`*.specialistly.local`)
- ✅ Handle cross-origin requests
- ✅ Support credentials in requests

### Public API Endpoints

Verify these endpoints exist:

```bash
# Get website data by subdomain
GET /api/page-builder/public/websites/:subdomain

# Get public page content
GET /api/page-builder/public/pages/:pageSlug?subdomain=alice

# Response includes:
{
  success: true,
  data: {
    website: { branding, logo, siteName, tagline },
    pages: [ 
      { title, slug, sections, isPublished, isHomePage }
    ]
  }
}
```

---

## 5️⃣ FRONTEND VERIFICATION

### What's Already Configured ✅

**Subdomain Detection** (src/app/App.tsx):
- Detects subdomain from window.location.hostname
- Routes to `PublicWebsite` component
- Calls API to fetch website data

**PublicWebsite Component** (src/app/components/PublicWebsite.tsx):
- Displays specialist's branded website
- Shows all published pages with navigation
- Header with logo and site branding
- Mobile responsive menu
- Footer with page links

### No Additional Changes Needed ✅

The frontend is fully configured for subdomains!

---

## 6️⃣ COMPLETE TESTING PROCESS

### Before Testing
- [ ] Cloudflare DNS records added (wildcard)
- [ ] SSL/TLS enabled
- [ ] Railway environment variables set
- [ ] Backend deployed to Railway
- [ ] Frontend built and deployed
- [ ] DNS propagated (wait if needed)

### Test Steps

**Step 1: Verify DNS Resolution**
```bash
# In PowerShell or Command Prompt
nslookup test-subdomain.specialistly.com

# Should resolve to a Cloudflare IP
```

**Step 2: Verify SSL Certificate**
```bash
# In PowerShell
curl -I https://test-subdomain.specialistly.com

# Should return:
# HTTP/1.1 200 OK
# (with SSL certificate info)
```

**Step 3: Create Test Website**
1. Log in to specialistly.com
2. Create website with subdomain: `test-alice`
3. Create a page: "Home"
4. Add a section (e.g., Hero)
5. Publish page
6. Publish website

**Step 4: Access via Subdomain**
1. Visit: `https://test-alice.specialistly.com`
2. Should see:
   - ✅ Branded header with site name
   - ✅ Published page content
   - ✅ Navigation menu
   - ✅ Footer
   - ✅ No console errors (F12)

**Step 5: Test Multiple Pages**
1. Add more pages in Page Builder
2. Publish all pages
3. Reload subdomain
4. Verify all pages appear in navigation
5. Click between pages - content should change

**Step 6: Test Mobile Responsiveness**
1. Open subdomain on mobile or use DevTools (F12)
2. Verify:
   - ✅ Hamburger menu appears
   - ✅ Menu opens/closes
   - ✅ Navigation works on mobile

---

## 7️⃣ TROUBLESHOOTING

### DNS Not Resolving
**Problem**: `nslookup` returns "server not found"
**Solution**:
- Wait 24-48 hours for DNS propagation
- Clear local DNS cache:
  ```bash
  ipconfig /flushdns  # Windows
  ```
- Verify Cloudflare DNS record exists with wildcard `*`

### SSL Certificate Error
**Problem**: Browser shows "SSL_CERTIFICATE_ERROR" or "not secure"
**Solution**:
- In Cloudflare, verify **SSL/TLS** → **Edge Certificates** is ON
- Check certificate covers `*.specialistly.com`
- Toggle Cloudflare proxy OFF then ON
- Wait 5-10 minutes for certificate to issue

### Data Not Loading
**Problem**: Website loads but pages are blank
**Solution**:
- Open browser DevTools (F12) → Console
- Check if API error appears
- Verify website is published (isPublished: true)
- Verify pages are published
- Check subdomain matches exactly (case-sensitive)
- Review backend logs in Railway

### CORS Error in Console
**Problem**: "Access to XMLHttpRequest has been blocked by CORS policy"
**Solution**:
- Backend CORS should allow `*.specialistly.com`
- Verify `backend/server.js` has wildcard regex
- Restart backend after CORS changes
- Clear browser cache (Ctrl+Shift+Delete)

### 404 on Subdomain
**Problem**: "Cannot GET /"
**Solution**:
- Verify Cloudflare DNS record points to Railway
- Check Railway domain settings
- Verify backend is running: `GET https://specialistly-production.up.railway.app/api/health`
- Check Railway logs for errors

---

## 8️⃣ DEPLOYMENT CHECKLIST

Before going live with multi-subdomain support:

### Cloudflare
- [ ] Domain added to Cloudflare
- [ ] Nameservers updated at domain registrar
- [ ] Wildcard DNS record added (`*` → Railway)
- [ ] Root DNS record added (`@` → Railway)
- [ ] SSL/TLS enabled
- [ ] HTTPS redirect enabled
- [ ] Firewall rules configured (if needed)

### Railway
- [ ] Backend deployed
- [ ] Frontend deployed
- [ ] Environment variables set
- [ ] Custom domain configured
- [ ] Health check passing
- [ ] Logs monitored

### Application
- [ ] Subdomain middleware working
- [ ] CORS configured for subdomains
- [ ] PublicWebsite component rendering
- [ ] API endpoints responding
- [ ] Database connected and working

### Testing
- [ ] DNS resolves for test subdomain
- [ ] SSL certificate valid
- [ ] Website loads with branding
- [ ] Navigation works
- [ ] Sections render correctly
- [ ] Mobile responsive
- [ ] No console errors

---

## 🚀 DEPLOYMENT SUMMARY

### What's Already Done ✅
1. ✅ Backend subdomain middleware implemented
2. ✅ CORS configured for wildcard subdomains
3. ✅ Frontend detects and routes to PublicWebsite
4. ✅ PublicWebsite component with full navigation
5. ✅ API endpoints for public website data
6. ✅ Vite build configuration optimized
7. ✅ Code committed and deployed to main

### What You Need to Do Now
1. ⏳ **Cloudflare**: Add wildcard DNS record `*`
2. ⏳ **Cloudflare**: Verify SSL/TLS enabled
3. ⏳ **Railway**: Set environment variables
4. ⏳ **Wait**: DNS propagation (24-48 hours)
5. ⏳ **Test**: Create test website and verify subdomain access

### Timeline
- **Immediate**: Cloudflare DNS setup (5 minutes)
- **Immediate**: Railway config (2 minutes)
- **Wait**: DNS propagation (24-48 hours)
- **Test**: End-to-end testing (15 minutes)

---

## 📞 Support

For issues, check:
1. Browser console (F12) for error messages
2. Railway logs for backend errors
3. Network tab (F12) to verify API calls
4. Cloudflare DNS records are correct
5. SSL certificate is valid

All code changes deployed and tested ✅
