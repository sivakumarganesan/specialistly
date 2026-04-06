# Branded Subdomain Architecture - Staging vs Production

## Current System Architecture

```
Frontend Request
    ↓
┌─────────────────────────────────────────┐
│ Browser: https://siva.specialistly.com  │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ Step 1: DNS Lookup                      │
│ siva.specialistly.com → 1.2.3.4         │ (IP Address)
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ Step 2: HTTPS Connection                │
│ TLS Certificate: *.specialistly.com     │ (Wildcard)
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ Step 3: Request reaches Backend         │
│ Host header: siva.specialistly.com      │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ Step 4: Subdomain Middleware            │
│ req.subdomain = "siva"                  │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ Step 5: Lookup Website in Database      │
│ Find({ subdomain: "siva" })             │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ Step 6: Serve Branded Page              │
│ Load branding, content, pages           │
└─────────────────────────────────────────┘
```

---

## Staging vs Production Comparison

### STAGING ENVIRONMENT

```
Domain:              staging.specialistly.com
Wildcard Cert:       *.staging.specialistly.com
Cloudflare Zone:     staging.specialistly.com
DNS Record:          *.staging → API Server
Example URL:         https://siva.staging.specialistly.com
```

**Current Status:** ⚠️ NOT FULLY CONFIGURED
- Subdomains created in database
- Subdomain middleware working
- BUT: Need wildcard DNS for staging.specialistly.com


### PRODUCTION ENVIRONMENT

```
Domain:              specialistly.com
Wildcard Cert:       *.specialistly.com
Cloudflare Zone:     specialistly.com
DNS Record:          *.specialistly → API Server
Example URL:         https://siva.specialistly.com
```

**Status:** ✅ READY (infrastructure is there)

---

## What Needs to Be Configured

### 1. DNS Setup (Cloudflare)

**For Staging:**
```
Zone: staging.specialistly.com

DNS Records:
┌──────────────────────────────────────┐
│ Type   | Name   | Value              │
├────────┼────────┼────────────────────┤
│ CNAME  | *      | staging-backend.   │
│        |        | railwayapp.io      │
│────────┼────────┼────────────────────┤
│ CNAME  | @      | staging-backend.   │
│        |        | railwayapp.io      │
└──────────────────────────────────────┘
```

**For Production:**
```
Zone: specialistly.com

DNS Records:
┌──────────────────────────────────────┐
│ Type   | Name   | Value              │
├────────┼────────┼────────────────────┤
│ CNAME  | *      | specialistly.      │
│        |        | railwayapp.io      │
│────────┼────────┼────────────────────┤
│ CNAME  | @      | specialistly-prod..│
│        |        | railwayapp.io      │
└──────────────────────────────────────┘
```

### 2. SSL Certificates (Cloudflare)

✅ Wildcard certificates are needed:
```
Staging:           *.staging.specialistly.com
Production:        *.specialistly.com
```

**Cloudflare Handles This Automatically:**
- Generates wildcard SSL for any subdomain
- Renews before expiry
- No action needed

### 3. Backend Configuration

✅ Already Configured:
```javascript
// subdomainMiddleware.js
const subdomain = extractSubdomain(hostname);
// siva.specialistly.com → "siva"

// pageBuilderController.js
const website = await Website.findOne({ subdomain });
// Find website by subdomain
```

---

## Expected User Flow

### For Specialist (Creating Branded Site)

```
1. Specialist creates website
   POST /api/page-builder/websites
   → System generates subdomain: "siva"
   → Stored in DB with branding
   
2. System ensures subdomain
   PUT /website/{id}/ensure-subdomain
   → Validates subdomain availability
   
3. Specialist publishes website
   PUT /website/{id}/publish
   → isPublished = true
   
4. Website goes live at:
   📍 Staging: https://siva.staging.specialistly.com
   📍 Production: https://siva.specialistly.com
```

### For Customer/Visitor (Accessing Branded Site)

```
1. Visit URL
   https://siva.specialistly.com
   
2. Browser → Cloudflare DNS
   Resolves to: API Server IP
   
3. TLS handshake
   Uses wildcard certificate
   ✅ Secure HTTPS connection
   
4. Backend receives request
   Host: siva.specialistly.com
   
5. Subdomain middleware extracts "siva"
   req.subdomain = "siva"
   
6. Find website by subdomain
   Website.findOne({ subdomain: "siva" })
   
7. Render branded site
   Use branding colors, logo, content
   ✅ Custom website loaded
```

---

## Will This Work? ✅ YES - If Configured Correctly

### ✅ System Design: Perfect
- Middleware extracts subdomains correctly
- Database lookups by subdomain work
- Branding system is ready
- Cloudflare integration ready

### ⚠️ Configuration Needed:

| Item | Staging | Production | Status |
|------|---------|-------------|--------|
| Wildcard DNS | *.staging.specialistly.com | *.specialistly.com | ❌ Needs setup |
| SSL Certificate | Auto (Cloudflare) | Auto (Cloudflare) | ✅ Ready |
| Subdomain Middleware | ✅ Working | ✅ Working | ✅ Ready |
| Database Storage | ✅ Ready | ✅ Ready | ✅ Ready |
| Backend Routing | ✅ Ready | ✅ Ready | ✅ Ready |

### 🔧 To Enable Branded Subdomains

1. **In Cloudflare - Staging:**
   - Add zone: staging.specialistly.com
   - Create DNS record: * → staging backend IP
   - Enable Universal SSL

2. **In Cloudflare - Production:**
   - Add zone: specialistly.com
   - Create DNS record: * → production backend IP
   - Enable Universal SSL

3. **Verify in Browser:**
   ```
   curl https://siva.staging.specialistly.com
   curl https://siva.specialistly.com
   ```

---

## Potential Issues & Solutions

### Issue 1: Wildcard SSL Certificate
**Problem:** * certificate doesn't exist for staging
**Solution:** Cloudflare auto-generates on first request

### Issue 2: DNS Not Resolving
**Problem:** siva.specialistly.com → times out
**Solution:** Add CNAME record with * wildcard

### Issue 3: CORS Issues
**Problem:** Frontend on www.specialistly.com can't access siva.specialistly.com
**Solution:** Already configured in server.js:
```javascript
const allowedOrigins = [
  'https://www.specialistly.com',
  'https://specialistly.com',
  // Add staging domains:
  'https://staging.specialistly.com',
  'https://www.staging.specialistly.com',
];
```

### Issue 4: Multiple Subdomains
**Problem:** What if 100 specialists create subdomains?
**Solution:** Wildcard DNS handles all at once
```
*.specialistly.com → API Server
siva.specialistly.com ✅
john.specialistly.com ✅
jane.specialistly.com ✅
... (unlimited)
```

---

## Current Test Status

```
✅ Working:
   • Subdomain extraction
   • Database lookups
   • Branding configuration
   • Website creation

⚠️ Not fully tested:
   • DNS resolution across domains
   • SSL certificate verification
   • Custom domain mapping
   • Multi-subdomain routing
```

---

## Next Steps

1. **Test in Staging:**
   ```bash
   curl -H "Host: siva.staging.specialistly.com" \
        https://localhost:5000/api/page-builder/websites
   ```

2. **Configure Cloudflare:**
   - Add wildcard DNS record
   - Verify SSL certificate
   - Test public access

3. **Test in Production:**
   - Same process as staging
   - Monitor DNS propagation (24-48 hours)
   - Test multiple subdomains

4. **Load Testing:**
   - Verify performance with many subdomains
   - Check database query speed
   - Monitor Cloudflare CDN

