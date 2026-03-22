# 🔧 Zoom Token Refresh Bug - Root Cause Analysis & Fix

## 🚨 The Problem You Were Experiencing

**Symptom:** Every hour, the specialist gets asked to re-authorize Zoom even though they already connected it.

**Why:** The token refresh logic was using the **WRONG OAuth credentials**. 

---

## 🔍 Root Cause Analysis

### The Bug

Your system has TWO different OAuth credential types:

| Type | For | Env Variable |
|------|-----|---|
| **User-Managed** | Specialist's own Zoom account | `ZOOM_USER_MANAGED_CLIENT_ID` |
| **Server-to-Server** | Platform's Zoom account | `ZOOM_CLIENT_ID` |

### Where The Bug Was

**File:** `backend/services/zoomService.js`

```javascript
// ❌ WRONG - Using server-to-server credentials
const auth = Buffer.from(
  `${process.env.ZOOM_CLIENT_ID}:${process.env.ZOOM_CLIENT_SECRET}`
).toString('base64');
```

This is in the `refreshZoomAccessToken()` function. The problem:

1. **Step 1: Specialist Authorizes**
   - Uses `userManagedOAuthService.js`
   - Uses `ZOOM_USER_MANAGED_CLIENT_ID` and `ZOOM_USER_MANAGED_CLIENT_SECRET` ✅
   - Stores refresh token in database

2. **Step 2: Token Expires (1 hour later)**
   - System tries to refresh token using `zoomService.js`
   - Uses `ZOOM_CLIENT_ID` and `ZOOM_CLIENT_SECRET` ❌ WRONG CREDENTIALS!
   - Zoom rejects the refresh request
   - System can't create meeting
   - Shows error: "Please re-authorize Zoom"

```
Example Timeline:
├─ 10:00 AM: Specialist authorizes with USER_MANAGED creds
│            Token stored: accessToken + refreshToken
│
├─ 11:00 AM: Token expires
│            System tries to refresh with SERVER-TO-SERVER creds
│            ❌ Zoom rejects it (doesn't recognize these credentials)
│
├─ Customer tries to book:
│            Cannot create meeting without valid token
│            Shows: "Authorization failed"
│
└─ Specialist sees: "Zoom authorization needed" (again!)
   Even though they just authorized!
```

---

## ✅ The Fix

### What Was Changed

**File:** `backend/services/zoomService.js`

**Before:**
```javascript
// Wrong - mixed credential types
const auth = Buffer.from(
  `${process.env.ZOOM_CLIENT_ID}:${process.env.ZOOM_CLIENT_SECRET}`
).toString('base64');
```

**After:**
```javascript
// Correct - consistent credential type
const ZOOM_USER_MANAGED_CLIENT_ID = process.env.ZOOM_USER_MANAGED_CLIENT_ID;
const ZOOM_USER_MANAGED_CLIENT_SECRET = process.env.ZOOM_USER_MANAGED_CLIENT_SECRET;

// In refreshZoomAccessToken():
const auth = Buffer.from(
  `${ZOOM_USER_MANAGED_CLIENT_ID}:${ZOOM_USER_MANAGED_CLIENT_SECRET}`
).toString('base64');
```

### Why This Works Now

```
Corrected Timeline:
├─ 10:00 AM: Specialist authorizes with USER_MANAGED creds ✅
│            Token stored: accessToken + refreshToken
│
├─ 11:00 AM: Token expires
│            System tries to refresh with USER_MANAGED creds ✅ CORRECT!
│            Zoom recognizes the credentials
│            Returns new accessToken ✅
│
├─ Customer books:
│            Meeting created successfully ✅
│            No authorization prompt ✅
│
└─ Repeats for 180 days without re-auth! 🎉
```

---

## 🛠️ Implementation Changes

### Changes Made:

1. **Added proper credentials at top of file:**
```javascript
const ZOOM_USER_MANAGED_CLIENT_ID = process.env.ZOOM_USER_MANAGED_CLIENT_ID;
const ZOOM_USER_MANAGED_CLIENT_SECRET = process.env.ZOOM_USER_MANAGED_CLIENT_SECRET;
```

2. **Fixed `refreshZoomAccessToken()` function:**
   - Now uses `ZOOM_USER_MANAGED_*` credentials
   - Added validation that credentials are configured
   - Added better error tracking (tracks refresh error count)
   - Added detailed console logging with timestamps

3. **Enhanced `getSpecialistZoomToken()` function:**
   - Better error messages explaining what went wrong
   - Shows time until token expiry
   - Logs proactive refresh success
   - Tracks token validation timing

### Code Example of the Fix:

```javascript
const refreshZoomAccessToken = async (specialistId) => {
  try {
    // ✅ Now uses correct credentials!
    if (!ZOOM_USER_MANAGED_CLIENT_ID || !ZOOM_USER_MANAGED_CLIENT_SECRET) {
      throw new Error(
        'ZOOM_USER_MANAGED_CLIENT_ID or ZOOM_USER_MANAGED_CLIENT_SECRET not configured'
      );
    }

    const auth = Buffer.from(
      `${ZOOM_USER_MANAGED_CLIENT_ID}:${ZOOM_USER_MANAGED_CLIENT_SECRET}`
    ).toString('base64');

    // ... rest of refresh logic
    return newAccessToken;
  } catch (error) {
    // ... error handling
  }
};
```

---

## 🔐 Environment Variables Checklist

For the fix to work, ensure your `.env` file has:

```bash
# ✅ User-Managed OAuth (for specialist's account)
ZOOM_USER_MANAGED_CLIENT_ID=your_user_managed_client_id
ZOOM_USER_MANAGED_CLIENT_SECRET=your_user_managed_client_secret
ZOOM_REDIRECT_URI=https://yourdomain.com/api/zoom/oauth/user-callback

# ✅ These can remain for fallback/other uses
ZOOM_CLIENT_ID=your_server_to_server_client_id
ZOOM_CLIENT_SECRET=your_server_to_server_client_secret
```

**Critical:** Make sure both sets of credentials are configured!

---

## ✨ After the Fix - Expected Behavior

### First Time (Specialist Authorizes)

```
Specialist clicks "Connect Zoom"
   ↓
Redirected to Zoom login
   ↓
Logs in and approves
   ↓
Redirected back to Specialistly
   ↓
Stored in database:
   - accessToken (1-hour validity)
   - refreshToken (6-month validity)
   ✅ "Zoom Connected!"
```

### Every Time Customer Books (Days 1-180)

```
Customer books slot
   ↓
System checks: Is access token valid?
   ├─ YES (< 1 hour old): Use existing token
   └─ NO (> 1 hour old): Refresh using refreshToken ✅
   ↓
Token is valid ✅
   ↓
Meeting created in Zoom
   ↓
Customer receives meeting link
   ↓
NO RE-AUTHORIZATION PROMPT! 🎉
```

### After 6 Months (Refresh Token Expires)

```
Customer books slot
   ↓
System tries to refresh token
   ↓
Zoom returns: "Refresh token expired"
   ↓
System notifies specialist:
   "Your Zoom needs to be reconnected"
   ↓
Specialist clicks "Re-connect Zoom"
   ↓
Same OAuth flow as first time
   ↓
✅ Authorization renewed for 6 more months!
```

---

## 🧪 Testing the Fix

### Test 1: Verify Credentials Are Set

```bash
# Check your .env file contains:
echo "USER_MANAGED_ID: $ZOOM_USER_MANAGED_CLIENT_ID"
echo "USER_MANAGED_SECRET: $ZOOM_USER_MANAGED_CLIENT_SECRET"

# Should show your credentials (not empty)
```

### Test 2: First Time Authorization

```
1. Go to specialist profile
2. Click "Connect Zoom" button
3. Log in with Zoom credentials
4. Approve the app
5. Get redirected back
6. See "Zoom Connected ✅" message
```

### Test 3: Verify Token Is Stored

```javascript
// In MongoDB, check UserOAuthToken collection:
db.useroauthtokens.findOne({ userId: "specialist_id" })

// Should show:
{
  userId: "...",
  zoomAccessToken: "eyJz...",  // Has value
  zoomRefreshToken: "oFd8...",  // Has value
  zoomAccessTokenExpiry: 2026-02-19T14:30:00.000Z
}
```

### Test 4: Create Meeting (Token Valid)

```
1. Customer books a slot
2. Check backend logs:
   "✅ Using valid Zoom token (expires in 59 minutes)"
3. Meeting created successfully
4. No auth prompts
```

### Test 5: Create Meeting After 1 Hour

```
1. Wait 1 hour (or manually advance time in test)
2. Customer books another slot
3. Check backend logs:
   "🔄 Zoom token expired, attempting automatic refresh..."
   "✅ Token refresh successful, using new token"
4. Meeting created successfully
5. No auth prompts ✅
```

### Test 6: Monitor Refresh Behavior

```javascript
// Add debug logging to see token refresh:
console.log('Token expiry:', tokenRecord.zoomAccessTokenExpiry);
console.log('Time now:', new Date());
console.log('Minutes left:', minutesUntilExpiry);

// Should show token being refreshed every hour on-demand
```

---

## 🚀 Deployment Checklist

Before deploying to production:

```bash
✅ Update .env with ZOOM_USER_MANAGED_* credentials
✅ Verify ZOOM_USER_MANAGED_CLIENT_ID is set
✅ Verify ZOOM_USER_MANAGED_CLIENT_SECRET is set
✅ Ensure credentials match the ones used in Zoom app settings
✅ Test token refresh locally before going live
✅ Monitor logs after deployment for refresh errors
✅ Send specialist notification about re-authorizing if needed
```

---

## 📊 What Changed

| Area | Before | After |
|------|--------|-------|
| Token Refresh Credentials | Mixed (wrong) | Unified (correct) |
| Error Messages | Generic | Specific with details |
| Logging | Minimal | Detailed with timestamps |
| Error Tracking | None | Tracks refresh failures |
| Token Expiry Display | Not shown | Shows minutes remaining |

---

## 🔍 How to Verify the Fix Works

### Look for these logs in your backend console:

**Good logs (working correctly):**
```
✅ Using valid Zoom token (expires in 59 minutes)
🔄 Zoom token expired, attempting automatic refresh...
✅ Zoom access token refreshed successfully
   New expiry: 2026-02-19T14:30:00.000Z
```

**Bad logs (something still wrong):**
```
❌ Failed to refresh Zoom token: ...
❌ No Zoom OAuth token found for specialist
ZOOM_USER_MANAGED_CLIENT_ID or ZOOM_USER_MANAGED_CLIENT_SECRET not configured
```

If you see bad logs, check:
1. Environment variables are set
2. Credentials match Zoom app configuration
3. Zoom app is authorized for the correct scopes

---

## 🎯 Summary of the Fix

### The Bug:
- Token refresh was using wrong OAuth credentials
- Caused "Authorization needed" prompt every hour
- Frustrated specialists who thought they already authorized

### The Fix:
- Changed token refresh to use `ZOOM_USER_MANAGED_*` credentials (matching authorization)
- Added validation and error tracking  
- Added detailed logging for debugging

### The Result:
- ✅ Persistent authentication for 180+ days
- ✅ Automatic token refresh (no user prompts)
- ✅ Reliable meeting creation for every booking
- ✅ Specialists must re-authorize only after 6 months

---

## 📞 If Issues Persist

### Problem: Still asking for re-auth after fix

**Check:**
1. Did you restart the backend server? (env variables need reload)
2. Is `.env` file updated with `ZOOM_USER_MANAGED_*` credentials?
3. Do credentials match your Zoom app settings?

### Problem: Token refresh still failing

**Check:**
1. Backend logs for specific error message
2. Are both `ZOOM_USER_MANAGED_CLIENT_ID` and `ZOOM_USER_MANAGED_CLIENT_SECRET` set?
3. Have refresh tokens expired (check database)?

### Problem: Meeting creation fails

**Check:**
1. Does specialist have Zoom connected? (Check UserOAuthToken in DB)
2. Is token valid? (Check zoomAccessTokenExpiry)
3. Are Zoom scopes correct? (Should include `meeting:write:meeting`)

---

## 🎉 Expected Outcome After Fix

Specialists will:
- ✅ Authorize Zoom **once** during setup
- ✅ Never see auth prompts again for 180 days
- ✅ Have meetings created automatically for every booking
- ✅ Only need to re-authorize after tokens expire (6 months)

This is the **production-ready behavior** your system should have! 

**Commit:** `e77118f` - Zoom token refresh fix deployed ✅
