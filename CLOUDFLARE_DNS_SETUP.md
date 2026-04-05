# Cloudflare DNS Setup for specialistly.com

**This guide sets up your domains to point to Railway using Cloudflare DNS.**

---

## 📍 What You're Setting Up

| Domain | Purpose | Points To |
|--------|---------|-----------|
| **specialistly.com** | Production (Frontend + API) | Railway production service |
| **staging.specialistly.com** | Staging (Frontend + API) | Railway staging service |

---

## 🚀 Step 1: Get Railway Deployment URL

### For Production:

1. Go to **Railway.app Dashboard**
2. Open **production-specialistly** project
3. Click **Settings**
4. Find **Deployment URL** or **Custom Domain section**
5. Copy the Railway auto-generated domain:
   ```
   Example: https://production-specialistly-production.up.railway.app
   ```

### For Staging:

1. Go to **Railway.app Dashboard**
2. Open **staging-specialistly** project
3. Click **Settings**
4. Find deployment URL:
   ```
   Example: https://staging-specialistly-staging.up.railway.app
   ```

**Keep these handy - you'll need them in next step.**

---

## 🔧 Step 2: Add CNAME Records in Cloudflare

### Production Domain

1. Go to **https://dash.cloudflare.com**
2. Select **specialistly.com** domain
3. Go to **DNS** (left sidebar)
4. Click **Add record**

**Fill in:**
```
Type:     CNAME
Name:     @ (or specialistly.com)
Target:   production-specialistly-production.up.railway.app
TTL:      Auto
Proxy:    ☑ Proxied (orange cloud)
```

5. Click **Save**

---

### Staging Domain

1. In same **DNS** section
2. Click **Add record**

**Fill in:**
```
Type:     CNAME
Name:     staging
Target:   staging-specialistly-staging.up.railway.app
TTL:      Auto
Proxy:    ☑ Proxied (orange cloud)
```

3. Click **Save**

---

## ✅ Verify DNS Records

**After adding both:**

Go back to Cloudflare **DNS** tab and verify:

```
DNS Records (sorted by name)
───────────────────────────
@ (root)          CNAME  specialistly.com           → production Railway
staging           CNAME  staging.specialistly.com   → staging Railway
```

Both should show **orange cloud icon** (Proxied).

---

## ⏳ Wait for Propagation

New DNS records take **5-15 minutes** to propagate globally.

**In the meantime:**
- Do NOT add custom domains in Railway yet
- Let DNS propagate first

---

## 🔗 Step 3: Add Custom Domains in Railway

### Production:

1. Go to **Railway → production-specialistly**
2. Click **Settings**
3. Click **Domains**
4. Add custom domain:
   ```
   specialistly.com
   ```
5. Railway shows ✅ **Domain configuration verified**

### Staging:

1. Go to **Railway → staging-specialistly**
2. Click **Settings**
3. Click **Domains**
4. Add custom domain:
   ```
   staging.specialistly.com
   ```
5. Railway shows ✅ **Domain configuration verified**

**Both should be verified immediately** (since DNS is already set in Cloudflare).

---

## 🔒 Enable HTTPS (SSL/TLS)

### In Cloudflare:

1. Go to **SSL/TLS** (left sidebar)
2. **Encryption level:** Set to **Full (Strict)**
   - This ensures Cloudflare → Railway is encrypted
3. Let's Encrypt certificate auto-enabled

### In Railway:

Railway auto-generates SSL certificates via Let's Encrypt. No action needed.

---

## ✅ Test Your Setup

### Test Production:

```bash
# Should load your frontend
https://specialistly.com

# Should return API response
https://specialistly.com/api/health
```

### Test Staging:

```bash
# Should load staging frontend
https://staging.specialistly.com

# Should return API response
https://staging.specialistly.com/api/health
```

---

## 🆘 Troubleshooting

### Issue: Domain not resolving

**Check:**
1. DNS propagated? (wait 15 min)
   ```bash
   nslookup specialistly.com
   ```
2. Both CNAME records in Cloudflare?
3. Custom domain added in Railway?

---

### Issue: SSL certificate error

**Solution:**
1. Cloudflare **SSL/TLS** → Set to **Full (Strict)**
2. Wait 5 minutes for cert to activate
3. Try HTTPS again

---

### Issue: API endpoint returns 404

**Check:**
1. Railway backend deployed successfully
2. API routes accessible at `/api`
3. Check Railway logs for errors

---

## 📊 Final DNS Configuration Map

```
User Browser
    ↓
https://specialistly.com
    ↓
Cloudflare DNS (orange cloud)
    ↓
CNAME → production-specialistly-production.up.railway.app
    ↓
Railway Production Service
    ↓
Frontend + API running

────────────────────────────────────────

https://staging.specialistly.com
    ↓
Cloudflare DNS (orange cloud)
    ↓
CNAME → staging-specialistly-staging.up.railway.app
    ↓
Railway Staging Service
    ↓
Frontend (develop branch) + API running
```

---

## ✨ Success Checklist

- [ ] **specialistly.com** CNAME added in Cloudflare
- [ ] **staging.specialistly.com** CNAME added in Cloudflare
- [ ] Both proxied (orange cloud) in Cloudflare
- [ ] Custom domain added in Railway production
- [ ] Custom domain added in Railway staging
- [ ] Both domains show ✅ verified in Railway
- [ ] Cloudflare SSL/TLS set to **Full (Strict)**
- [ ] Can access https://specialistly.com ✅
- [ ] Can access https://staging.specialistly.com ✅
- [ ] API endpoints respond ✅

---

## 📝 Reference

**Cloudflare Dashboard:** https://dash.cloudflare.com  
**Railway Dashboard:** https://railway.app  
**DNS Propagation Check:** https://www.whatsmydns.net/

---

**Your domains are now live and ready for production! 🚀**
