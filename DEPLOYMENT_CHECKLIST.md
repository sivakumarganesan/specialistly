# Specialistly Deployment - Quick Checklist

## Pre-Deployment (Do This First)

### GitHub
- [ ] Create GitHub account (if needed) - https://github.com
- [ ] Create new repository named "specialistly"
- [ ] Push your code: `git push -u origin main`

### Accounts to Create
- [ ] MongoDB Atlas - https://www.mongodb.com/cloud/atlas
- [ ] Railway - https://railway.app
- [ ] Vercel - https://vercel.com
- [ ] Namecheap or GoDaddy (for domain)

---

## Phase 1: MongoDB Setup (20 min)

- [ ] Create MongoDB Atlas account
- [ ] Create free cluster "specialistly-prod"
- [ ] Create database user: `specialistly_user`
- [ ] Add network access (Allow from anywhere)
- [ ] Copy connection string
- [ ] Test connection

**Connection String Template:**
```
mongodb+srv://specialistly_user:PASSWORD@cluster.mongodb.net/specialistdb?retryWrites=true&w=majority
```

---

## Phase 2: Backend Deployment (30 min)

- [ ] Create Railway account
- [ ] Import GitHub repository
- [ ] Add environment variables (see below)
- [ ] Wait for deployment
- [ ] Get Railway domain (e.g., api.railway.app)
- [ ] Test health endpoint

**Required Env Vars for Railway:**
```
MONGODB_URI=[your_mongodb_connection_string]
NODE_ENV=production
JWT_SECRET=[generate_random_string]
ZOOM_CLIENT_ID=[your_zoom_id]
ZOOM_CLIENT_SECRET=[your_zoom_secret]
GOOGLE_CLIENT_ID=[your_google_id]
GOOGLE_CLIENT_SECRET=[your_google_secret]
EMAIL_USER=[your_email]
EMAIL_PASSWORD=[your_app_password]
APP_URL=https://api.yourdomain.com
```

---

## Phase 3: Frontend Deployment (20 min)

- [ ] Create Vercel account
- [ ] Import GitHub repository
- [ ] Set build command: `npm run build`
- [ ] Set output directory: `dist`
- [ ] Add env var: `VITE_API_URL=https://api.yourtempdomain.com/api`
- [ ] Deploy
- [ ] Get Vercel domain (e.g., specialistly.vercel.app)

---

## Phase 4: Domain Setup (20 min)

- [ ] Buy domain from Namecheap/GoDaddy (~$10-15/year)
- [ ] Add domain to Vercel
- [ ] Update nameservers in registrar to Vercel's:
  - ns1.vercel-dns.com
  - ns2.vercel-dns.com
- [ ] Wait 24-48 hours for DNS propagation
- [ ] Test domain access
- [ ] Add wildcard DNS record for specialist subdomains:
  ```
  *.yourdomain.com  CNAME  yourdomain.vercel.app
  ```
- [ ] Create API subdomain (api.yourdomain.com → Railway)

---

## Phase 5: Final Updates (10 min)

- [ ] Update Vercel env var: `VITE_API_URL=https://api.yourdomain.com/api`
- [ ] Update Railway env vars:
  - `APP_URL=https://api.yourdomain.com`
  - `ZOOM_REDIRECT_URI=https://api.yourdomain.com/api/auth/zoom/callback`
- [ ] Redeploy both frontend and backend

---

## Testing Checklist

- [ ] Frontend loads: `https://yourdomain.com`
- [ ] Can sign up and log in
- [ ] Dashboard loads without errors
- [ ] API health check: `https://api.yourdomain.com/api/health`
- [ ] Database saving data (check MongoDB Atlas)
- [ ] Zoom OAuth works (if integrated)
- [ ] Email verification works
- [ ] Specialist branded page loads: `https://testslug.yourdomain.com`
- [ ] Browser console has no errors
- [ ] Mobile responsive works

---

## Monitoring Setup (Optional but Recommended)

- [ ] Set up Sentry for error tracking - https://sentry.io
- [ ] Set up UptimeRobot for uptime monitoring - https://uptimerobot.com
- [ ] Configure MongoDB Atlas alerts

---

## Support Resources

| Issue | Help |
|-------|------|
| GitHub help | https://docs.github.com |
| MongoDB issues | https://docs.mongodb.com/atlas/ |
| Railway help | https://docs.railway.app |
| Vercel help | https://vercel.com/docs |
| DNS issues | https://www.whatsmydns.net/ |

---

## Cost Breakdown

| Service | Cost | Notes |
|---------|------|-------|
| MongoDB Atlas | Free | Free tier 512MB, upgrade later |
| Railway Backend | $7-20 | Pay-as-you-go, ~$7 minimum |
| Vercel Frontend | Free or $20 | Free tier good for starting |
| Domain | $10-15/year | One-time, then annual renewal |
| **TOTAL FIRST MONTH** | **$20-40** | Scales up with usage |

---

## Next Steps After Launch

1. Monitor performance and user feedback
2. Set up analytics (Vercel + Google Analytics)
3. Plan feature releases
4. Monitor MongoDB usage (upgrade if needed)
5. Set up continuous monitoring
6. Plan scaling strategy

---

**Ready to deploy? Start with Phase 1!** 🚀
