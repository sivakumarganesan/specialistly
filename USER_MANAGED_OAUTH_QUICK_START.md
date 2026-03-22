# User-Managed OAuth Quick Setup

## ⚡ 5-Minute Setup

### Step 1: Configure Environment Variables
Add to `.env` in the `backend/` directory:

```env
# User-Managed OAuth Credentials
ZOOM_USER_MANAGED_CLIENT_ID=your_client_id_here
ZOOM_USER_MANAGED_CLIENT_SECRET=your_client_secret_here
ZOOM_REDIRECT_URI=http://localhost:5001/api/zoom/oauth/user-callback
```

**Get credentials from:**
1. Go to https://marketplace.zoom.us/develop/create
2. Create → OAuth App → User-managed app
3. Copy Client ID and Client Secret
4. Add Redirect URL: `http://localhost:5001/api/zoom/oauth/user-callback`

### Step 2: Restart Backend
```bash
cd backend
node server.js
```

### Step 3: Test Authorization Flow
```bash
# Get authorization URL
curl "http://localhost:5001/api/zoom/oauth/user/authorize?userId=USER_ID"

# Check status
curl "http://localhost:5001/api/zoom/oauth/user/status?userId=USER_ID"
```

## API Quick Reference

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/zoom/oauth/user/authorize?userId=ID` | GET | Get authorization URL |
| `/api/zoom/oauth/user-callback` | GET | OAuth callback (automatic) |
| `/api/zoom/oauth/user/status?userId=ID` | GET | Check if user authorized |
| `/api/zoom/oauth/user/profile?userId=ID` | GET | Get Zoom profile |
| `/api/zoom/oauth/user/meetings?userId=ID` | GET | List user's meetings |
| `/api/zoom/oauth/user/revoke` | POST | Disconnect Zoom |
| `/api/zoom/oauth/user/refresh` | POST | Manual token refresh |

## Frontend Integration

### Connect Button
```javascript
async function connectZoom() {
  const userId = getCurrentUserId();
  const res = await fetch(`/api/zoom/oauth/user/authorize?userId=${userId}`);
  const data = await res.json();
  window.location.href = data.authUrl;
}
```

### Check Connection Status
```javascript
async function checkZoomConnected() {
  const userId = getCurrentUserId();
  const res = await fetch(`/api/zoom/oauth/user/status?userId=${userId}`);
  const data = await res.json();
  return data.authorized;
}
```

### Disconnect
```javascript
async function disconnectZoom() {
  const userId = getCurrentUserId();
  await fetch(`/api/zoom/oauth/user/revoke`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId })
  });
}
```

## Testing Checklist

- [ ] `.env` configured with OAuth credentials
- [ ] Backend restarted
- [ ] Authorization URL works and redirects to Zoom
- [ ] Callback returns to dashboard
- [ ] Status endpoint shows authorized
- [ ] Can fetch user profile
- [ ] Can list meetings
- [ ] Token refresh works
- [ ] Revoke disconnects successfully

## Common Issues

**"OAuth app is not installed"**
- Verify app exists at https://marketplace.zoom.us/develop
- Check Client ID in `.env` matches app

**"Redirect URI mismatch"**
- Verify redirect URL in Zoom app settings matches `ZOOM_REDIRECT_URI`
- Must include `/api/zoom/oauth/user-callback`

**"Token invalid or expired"**
- Service auto-refreshes, check logs
- Manually refresh: `POST /api/zoom/oauth/user/refresh`

**401 on profile/meetings endpoints**
- User may not be authorized yet
- Check status with `/oauth/user/status`
- Authorization may be revoked

## Files Created/Modified

**New Files:**
- `backend/models/UserOAuthToken.js` - Token storage schema
- `backend/services/userManagedOAuthService.js` - OAuth logic
- `backend/controllers/userOAuthController.js` - API handlers

**Modified Files:**
- `backend/routes/zoomRoutes.js` - Added OAuth routes

## Next Steps

1. ✅ Set up environment variables
2. ✅ Restart backend
3. ✅ Test authorization flow
4. ✅ Add "Connect Zoom" button to Settings UI
5. ✅ Display connection status
6. ✅ Add disconnect option
7. ✅ Use tokens to access Zoom resources
8. ✅ Monitor token refresh health

## Full Documentation

See `USER_MANAGED_OAUTH_GUIDE.md` for complete reference including:
- Detailed architecture
- Token management
- Security considerations
- Error handling
- Database schema
- Advanced usage examples
