# Zoom Authorization Issue - Root Cause & Fix

## Problem Identified ❌

**Specialist completed Zoom authorization in the browser, but the OAuth token was NEVER SAVED to the database.**

Database diagnostic shows:
- ✅ Specialist user account exists
- ❌ No UserOAuthToken record in database (0 records total)
- ❌ zoomConnected flag is FALSE

## Root Cause 🔍

The Zoom OAuth callback endpoint (`http://localhost:5001/api/zoom/oauth/user-callback`) is **NOT BEING CALLED** by Zoom after the user authorizes.

This indicates that the **Zoom App's redirect URI whitelist doesn't include our localhost callback URL.**

### Why This Happens

When you create a User-Managed OAuth App in the Zoom App Marketplace, you must explicitly whitelist all redirect URLs. If a Zoom user completes authorization and clicks "Allow", Zoom attempts to redirect back to the registered redirect_uri. If that URL is NOT in the whitelist, Zoom silently drops the request instead of redirecting.

## Solution 🛠️

### Step 1: Get Your Zoom App Redirect URI Whitelist

1. Log in to **Zoom App Marketplace**: https://marketplace.zoom.us/develop/apps
2. Find your app: **specialistly** (or similar)
3. Go to **App Credentials** tab
4. Scroll to **Redirect URLs for OAuth**
5. Check if `http://localhost:5001/api/zoom/oauth/user-callback` is listed

### Step 2: Add the Redirect URL

If NOT listed:
1. Click **Add** next to the redirect URLs
2. Enter: `http://localhost:5001/api/zoom/oauth/user-callback`
3. Click **Add** to confirm
4. **SAVE** the changes (there's usually a Save button at the bottom)

**IMPORTANT**: You might also need:
- `http://localhost:3000/api/zoom/oauth/user-callback` (if using different frontend port)
- Production URL when deploying

### Step 3: Retry Authorization

After adding the redirect URL:
1. **Clear browser cache/cookies** to clear old OAuth state
2. Go to http://localhost:5173
3. Login as specialist
4. Settings → Zoom Integration → "Connect Zoom Account"
5. Complete the Zoom OAuth flow
6. **CHECK**: You should see "✓ Zoom Connected" status
7. Check server logs for: `✅ Updated Zoom status for user`

## Verification ✓

After successful authorization, you should see:

**In Server Logs:**
```
📝 OAuth Callback received:
  State token: 6716bd7...
  Code: eyJhbGc...
✅ Found token record for userId: 697cce4d3bb262478fd88832
✅ Updated Zoom status for user: sivakumarganeshm@gmail.com
```

**In Database:**
```
db.userOAuthTokens.findOne()
{
  userId: ObjectId("697cce4d3bb262478fd88832"),
  zoomAccessToken: "eyJhbGci...",
  zoomRefreshToken: "eyJhbGci...",
  zoomUserId: "abc123...",
  zoomEmail: "sivakumar@zoom-account.com",
  isActive: true
}
```

**In Frontend (Settings):**
- Green checkmark: "✓ Zoom Connected"
- Email shown: "Connected to: sivakumar@zoom-account.com"
- "Disconnect Zoom" button appears

## Then Test Booking

Once `✓ Zoom Connected` appears:

1. Logout
2. Login as **customer** (sinduja.vel@gmail.com / password123)
3. Find specialist in marketplace
4. Click "Book Appointment"
5. Select a time slot
6. Click "Book Slot"
7. Should see: "✓ Appointment booked successfully! Check your email for Zoom meeting link."
8. Check both emails (specialist + customer) for Zoom meeting invitation

## Current Status 📊

- ✅ Backend OAuth endpoints working
- ✅ Token model and database ready
- ❌ Redirect URL whitelisting issue (TO FIX)
- ⏳ Awaiting: Specialist Zoom app redirect URL update

## Commands to Test After Fix

```bash
# Verify the token was saved
node C:\Work\specialistly\backend\diagnose-zoom-auth.js

# Test booking workflow
node C:\Work\specialistly\backend\test-booking-now.js
```

## If Still Not Working

1. **Check Zoom App credentials:**
   - Are ZOOM_USER_MANAGED_CLIENT_ID and ZOOM_USER_MANAGED_CLIENT_SECRET correct?
   - Command to verify: `$env:ZOOM_USER_MANAGED_CLIENT_ID`

2. **Check network:**
   - Is port 5001 accessible?
   - Test: `curl http://localhost:5001/api/health`

3. **Check server logs:**
   - Look for "OAuth Callback received" message
   - If not present, Zoom isn't calling our endpoint

4. **Check Zoom logs:**
   - Login to Zoom App Marketplace
   - Check App activity/logs for errors

5. **Try production URL temporarily:**
   - If localhost doesn't work, try ngrok to expose localhost with a public URL
   - Add that URL to Zoom redirect whitelist
   - This helps diagnose if it's a localhost-specific issue
