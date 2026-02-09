# Debug OAuth Issue - Step-by-Step

## What We Know
- ✅ Redirect URL is now being reached (token record is created)
- ❌ Token exchange is failing (tokens show as "pending")
- Need to capture the exact error message from Zoom

## What to Do Now

### Step 1: Check Your Zoom App Configuration
Go to https://marketplace.zoom.us/develop/apps and verify:

1. **App Type**: Should be "User-Managed OAuth App" (NOT "Server-to-Server")
2. **Client ID**: `T0rMIOs5Quu2sGFeTAn2Tw` (matches .env)
3. **Client Secret**: Should match last part of `bVM4Mvm...` in .env
4. **Redirect URLs**: MUST include EXACTLY: `http://localhost:5001/api/zoom/oauth/user-callback`
5. **Scopes**: Check if these are enabled in your app:
   - `meeting:update:meeting`
   - `user:read:user`

### Step 2: Try Authorization Again
1. Go to http://localhost:5173
2. Login as specialist: `sivakumarganeshm@gmail.com` / `password123`
3. Settings → Zoom Integration
4. Click "Connect Zoom Account"
5. Complete the Zoom OAuth flow
6. Let it redirect back

### Step 3: Check Server Logs
After step 2, look at the backend server output for detailed error messages.
Expected log lines should show:
```
📝 OAuth Callback received:
  State token: ...
  Code: ...
✅ Found token record for userId: ...
🔄 Exchanging authorization code for tokens...
```

If there's an error, it will show:
```
❌ Zoom token exchange failed:
   Status: [HTTP status code]
   Error: [error type]
   Reason: [error reason]
```

### Step 4: Report the Error

Please copy the error message from the server output and tell me what it says.

Common errors and fixes:
- **"redirect_uri_mismatch"** → Redirect URL doesn't match. Check it's EXACTLY `http://localhost:5001/api/zoom/oauth/user-callback` (no trailing slash, exact case)
- **"invalid_client"** → Client ID/Secret wrong. Verify they match the .env
- **"invalid_scope"** → App doesn't have permission for those scopes. Add them in Zoom App settings
- **"access_denied"** → User rejected permission. Try again

## Current Status
- Backend: Running on http://localhost:5001 (with enhanced logging)
- Frontend: Running on http://localhost:5173
- Ready for testing!
