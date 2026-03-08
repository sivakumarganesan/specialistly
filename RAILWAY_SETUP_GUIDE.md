# Railway Deployment Setup Guide

## Step 1: Create Railway Account & Connect GitHub

1. **Go to [railway.app](https://railway.app)**
2. **Click "Login with GitHub"**
   - Authorize Railway to access your GitHub repositories
3. **Create a new project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your `specialistly` repository
   - Authorize Railway to access your repo

## Step 2: Configure Backend Variables

After Railway deploys your repo:

1. **Go to your Railway project dashboard**
2. **Click "Variables" tab**
3. **Add these environment variables:**

```
NODE_ENV=production
PORT=8080
MONGODB_URI=mongodb+srv://specialistly_user:SpeciXlistly01@cluster0.jseized.mongodb.net/specialistlydb_prod?appName=Cluster0
GMAIL_USER=specialistlyapp@gmail.com
GMAIL_PASSWORD=lykm hzzy qchk icsx
JWT_SECRET=your-super-secret-jwt-key-change-this
CORS_ORIGIN=https://myspecialistly.com
ZOOM_USER_MANAGED_CLIENT_ID=T0rMIOs5Quu2sGFeTAn2Tw
ZOOM_USER_MANAGED_CLIENT_SECRET=bVM4MvvGPxvMVE1tnNEQWiGJkKPxkBHN
GOOGLE_APPLICATION_CREDENTIALS=./credentials.json
```

4. **Click "Save"**
5. **Railway automatically redeploys with new variables**

## Step 3: Get Railway Domain

1. **Wait for deployment to complete** (watch the deployment log)
2. **Go to "Settings" tab**
3. **Scroll to "Domains"**
4. **Copy the generated domain** (format: `specialistly-prod.up.railway.app`)
5. **Save this domain** - you'll need it for frontend configuration

## Step 4: Test Backend API

Test if Railway backend is working:

```powershell
# Replace with your Railway domain
$domain = "specialistly-prod.up.railway.app"

# Test API health
curl -X GET "https://$domain/api/users"
```

Expected: Should return data (or auth error if protected)

## Step 5: Update Frontend Configuration

1. **Update `.env.production` in root directory:**
   ```
   VITE_API_URL=https://your-railway-domain.up.railway.app/api
   ```

2. **Commit and push to GitHub:**
   ```bash
   git add .env.production
   git commit -m "chore: update railway backend URL"
   git push origin main
   ```

## Railway Dashboard Features

**Deployment Logs:**
- Click on your project
- View real-time deployment logs
- Check for errors

**Monitoring:**
- CPU/Memory usage
- Request counts
- Error rates

**Rollback:**
- If deployment fails, Railway keeps previous version
- Can manually rollback in "Deployments" tab

## Troubleshooting

**Deployment Failed?**
- Check logs: `Deployments` → view build logs
- Common issues:
  - Missing environment variables
  - Node.js version mismatch
  - Missing dependencies in package.json

**Backend not responding?**
- Verify `PORT=8080` in environment variables
- Check MongoDB connection with your IP whitelisted
- Ensure CORS_ORIGIN matches your frontend domain

**Environment Variables Not Working?**
- Make sure to click "Save" after adding variables
- Railway might take 30 seconds to redeploy
- Check "View Logs" to confirm variables loaded

## Next Steps

1. ✅ Setup Railway (this guide)
2. Setup Vercel for frontend
3. Purchase domain and configure DNS
4. Test production deployment
5. Go live!

## Cost

- **Railway**: $5-20/month for backend
- Free tier available for first month
- Scales with usage

---

**Status**: Ready to deploy to Railway 🚀
