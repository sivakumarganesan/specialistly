# Cloudflare DNS Configuration Guide for Subdomains

## Overview
This guide walks you through setting up Cloudflare DNS to enable subdomain support for `https://{subdomain}.specialistly.com`.

---

## Prerequisites
- Cloudflare account
- Your domain (e.g., specialistly.com) already added to Cloudflare
- Your server's IP address or domain

---

## Step 1: Get Your Server Information

### Find Your Server's IP or Domain
You need the **outbound IP** or domain where your application is hosted.

For Railway deployments:
- Domain: `specialistly-production.up.railway.app`
- OR get the IP from your Railway app settings

For your backend, you can check:
```bash
curl http://localhost:5001/api/test/outbound-ip
```

---

## Step 2: Configure Cloudflare DNS Records

### Log in to Cloudflare
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Select your domain (e.g., specialistly.com)
3. Go to **DNS** section

### Add Root Domain (if not exists)
1. Click **Add record**
2. Select **CNAME**
3. Name: `@` (or `specialistly.com`)
4. Target: Your server domain (e.g., `specialistly-production.up.railway.app`)
5. TTL: Auto
6. Proxy status: **Proxied** (orange cloud)
7. Click **Save**

### Add Wildcard DNS Record for Subdomains

This is the MOST IMPORTANT step that enables all subdomains.

1. Click **Add record**
2. Select **CNAME**
3. Name: `*` (wildcard - this matches ANY subdomain)
4. Target: Your server domain/IP
   - If using Railway: `specialistly-production.up.railway.app`
   - If using custom domain: your-domain.com
   - If using IP: your-server-ip
5. TTL: Auto
6. Proxy status: **Proxied** (orange cloud)
7. Click **Save**

### DNS Records Should Look Like:
```
| Type | Name         | Target                              | Proxy  |
|------|--------------|-------------------------------------|--------|
| CNAME| @            | specialistly-production.up.railway | ✓ On   |
| CNAME| *            | specialistly-production.up.railway | ✓ On   |
| NS   | ...          | (Cloudflare nameservers)            | -      |
```

---

## Step 3: Configure SSL/TLS Settings

### Enable SSL Certificate for Subdomains

1. In Cloudflare Dashboard, go to **SSL/TLS**
2. Click **Edge Certificates**
3. Ensure **Automatic HTTPS Rewrites** is **ON**
4. Ensure **Always Use HTTPS** is **ON**

### Add Wildcard Certificate
Cloudflare will automatically handle SSL for wildcard subdomains, but you can add custom certificates:

1. Go to **Custom SSL/TLS**
2. Click **Add certificate**
3. Upload or generate a wildcard certificate for `*.specialistly.com`
   - Alternative: Let Cloudflare auto-generate via **Add certificate**

---

## Step 4: Update Cloudflare Page Rules (Optional but Recommended)

### Cache Settings
1. Go to **Rules** → **Page Rules**
2. Click **Create Page Rule**
3. URL pattern: `*.specialistly.com/*`
4. Settings:
   - **Cache Level**: Cache Everything
   - **Browser Cache Expiration**: 4 hours
5. Save

### Security Headers
1. Go to **Rules** → **Transform Rules**
2. Modify Request Header:
   - Header name: `X-Forwarded-Proto`
   - Value: `https`

---

## Step 5: Configure Your Application

### Backend (Node.js/Express)
The subdomain middleware is already configured:
- ✅ CORS allows any `*.specialistly.com` subdomain
- ✅ Middleware extracts subdomain from hostname
- ✅ API endpoint `/api/page-builder/public/websites/{subdomain}` exists

### Frontend (React)
When accessing `https://{subdomain}.specialistly.com`:
1. App detects subdomain automatically
2. Routes to `PublicWebsite` component
3. Fetches website data via API
4. Renders published pages

---

## Step 6: Test Your Setup

### Test DNS Resolution
```bash
# Check if wildcard DNS resolves
nslookup test-subdomain.specialistly.com
nslookup another-subdomain.specialistly.com

# Should resolve to your Cloudflare proxy IP
```

### Test HTTPS
```bash
# Test SSL certificate
curl -I https://test-subdomain.specialistly.com

# Should return 200 with SSL certificate
```

### Test Your Application
1. Create a website with subdomain: `my-site`
2. Create a page and publish it
3. Visit: `https://my-site.specialistly.com`
4. You should see your published website

---

## Step 7: Troubleshooting

### DNS not resolving
- Wait 24-48 hours for DNS propagation
- Clear your local DNS cache:
  ```bash
  # macOS
  sudo dscacheutil -flushcache
  
  # Windows
  ipconfig /flushdns
  
  # Linux
  sudo systemctl restart systemd-resolved
  ```

### SSL Certificate Errors
- Ensure Cloudflare Edge Certificate is active
- Check if certificate covers `*.specialistly.com`
- Toggle proxy status OFF then ON in Cloudflare

### Data not loading
- Check browser console (F12)
- Verify `/api/page-builder/public/websites/{subdomain}` returns data
- Ensure website is published
- Check if subdomain matches exactly (case-sensitive)

### CORS errors
- Backend CORS is configured to allow `*.specialistly.com`
- Ensure request headers include correct origin

---

## Step 8: Scale to Multiple Subdomains

Once configured, you can create unlimited subdomains:

1. Create website with subdomain in page builder
2. Add pages and publish
3. Automatically accessible at `https://{subdomain}.specialistly.com`

Example:
- `https://alice.specialistly.com` - Alice's website
- `https://bob.specialistly.com` - Bob's website  
- `https://company-name.specialistly.com` - Company website

---

## Configuration Checklist

- [ ] Cloudflare account set up with domain
- [ ] Root domain CNAME added
- [ ] Wildcard CNAME record `*` added
- [ ] SSL/TLS set to "Full" or "Full (strict)"
- [ ] HTTPS rewriting enabled
- [ ] Always Use HTTPS enabled
- [ ] Backend running with subdomain middleware
- [ ] Frontend routing to PublicWebsite for subdomains
- [ ] Test subdomain DNS resolution
- [ ] Test HTTPS certificate
- [ ] Create test website with published page
- [ ] Visit test subdomain URL and verify display

---

## Reference Architecture

```
User visits: https://my-site.specialistly.com
    ↓
DNS resolves to Cloudflare
    ↓
Cloudflare routes to your server (Railway/Self-hosted)
    ↓
Frontend App (React)
    ↓
App detects subdomain: "my-site"
    ↓
API Request: GET /api/page-builder/public/websites/my-site
    ↓
Backend returns website + pages data
    ↓
Frontend renders PublicWebsite component
    ↓
Displays published pages to user
```

---

## Support

If you need additional help:
1. Check Cloudflare logs under **Analytics** → **Web Traffic**
2. Check your server logs for API requests
3. Check browser console (F12) for frontend errors
4. Verify subdomain case matches exactly

---

## Next Steps

After basic setup works:

1. **Customize domain**: Allow users to use custom domains (e.g., alice.com → Cloudflare CNAME)
2. **Branding**: Set site name, logo, colors per website
3. **Analytics**: Track page views, users per subdomain
4. **Performance**: Optimize images, cache static assets
5. **Security**: Set up DDoS protection, WAF rules

