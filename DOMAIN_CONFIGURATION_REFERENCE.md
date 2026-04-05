# Domain Configuration Reference

**Your production domain:** specialistly.com  
**Your staging domain:** staging.specialistly.com  
**DNS Provider:** Cloudflare  

---

## 📋 Configuration Checklist

### Step 1: Cloudflare DNS Setup
- [ ] Read: [CLOUDFLARE_DNS_SETUP.md](CLOUDFLARE_DNS_SETUP.md)
- [ ] Add CNAME: `@` → Production Railway endpoint
- [ ] Add CNAME: `staging` → Staging Railway endpoint  
- [ ] Set SSL/TLS to **Full (Strict)**
- [ ] Wait 5-15 min for propagation

### Step 2: Railway Configuration
- [ ] **Production Project:** Add custom domain `specialistly.com`
- [ ] **Staging Project:** Add custom domain `staging.specialistly.com`
- [ ] Both should show ✅ verified

### Step 3: Environment Variables
- [ ] **Production (.env.production):**
  ```
  FRONTEND_URL=https://specialistly.com
  BACKEND_URL=https://specialistly.com/api
  ```

- [ ] **Staging (.env.staging):**
  ```
  FRONTEND_URL=https://staging.specialistly.com
  BACKEND_URL=https://staging.specialistly.com/api
  ```

### Step 4: OAuth Redirects
Update in Google Console, Zoom, etc.:
- [ ] Production: `specialistly.com/auth/google/callback`
- [ ] Staging: `staging.specialistly.com/auth/google/callback`

---

## 🔗 Domain Routing

```
┌─ specialistly.com ────────────┐
│  Frontend App                 │
│  API: /api/* endpoints        │
└─ Points to Railway Production ┘

┌─ staging.specialistly.com ────┐
│  Staging App                  │
│  API: /api/* endpoints        │
└─ Points to Railway Staging ───┘
```

---

## ✅ Testing

### Production
```bash
curl https://specialistly.com              # Frontend loads
curl https://specialistly.com/api/health   # API responds
```

### Staging
```bash
curl https://staging.specialistly.com              # Frontend loads
curl https://staging.specialistly.com/api/health   # API responds
```

---

## 📞 DNS Records in Cloudflare

| Type | Name | Target |
|------|------|--------|
| CNAME | @ | production-specialistly-production.up.railway.app |
| CNAME | staging | staging-specialistly-staging.up.railway.app |

Both proxied (orange cloud) in Cloudflare.

---

## 🚨 Troubleshooting

**Domains not loading?**
1. Check DNS propagated: `nslookup specialistly.com`
2. Verify CNAME records in Cloudflare
3. Verify custom domains in Railway
4. Wait a few minutes and retry

**SSL errors?**
1. Cloudflare → SSL/TLS → Set to **Full (Strict)**
2. Wait 5 minutes
3. Clear browser cache and retry

---

## 📚 Quick Links

- [Cloudflare Dashboard](https://dash.cloudflare.com)
- [Railway Dashboard](https://railway.app)
- [Implementation Guide](OPTION1_SETUP_GUIDE.md)
- [DNS Setup Details](CLOUDFLARE_DNS_SETUP.md)
