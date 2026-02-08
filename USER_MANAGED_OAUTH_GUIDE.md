# User-Managed OAuth 2.0 Integration Guide

## Overview

This guide explains how to implement **User-Managed OAuth 2.0** for Zoom integration. Unlike Server-to-Server OAuth (where the app authenticates as itself), User-Managed OAuth allows individual users to authorize the application to access their Zoom accounts.

## Key Differences

| Aspect | Server-to-Server OAuth | User-Managed OAuth |
|--------|------------------------|-------------------|
| **Authentication** | App authenticates as itself | Individual users authorize the app |
| **Scope** | App-level permissions | User-level permissions |
| **Token Owner** | Application | Individual user |
| **Best For** | Backend automation, admin tasks | User-controlled meetings, personal calendars |
| **User Involvement** | None required | Required (OAuth consent screen) |
| **Token Lifetime** | Typically longer-lived | Shorter-lived with refresh tokens |

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Specialistly Platform                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           User-Managed OAuth Service                 │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │ • generateAuthorizationUrl()                          │  │
│  │ • exchangeCodeForToken()                             │  │
│  │ • refreshAccessToken()                               │  │
│  │ • getValidAccessToken()                              │  │
│  │ • revokeUserToken()                                  │  │
│  └──────────────────────────────────────────────────────┘  │
│                           ↓                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         UserOAuthToken Model (MongoDB)               │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │ • zoomAccessToken                                    │  │
│  │ • zoomRefreshToken                                   │  │
│  │ • zoomAccessTokenExpiry                              │  │
│  │ • zoomUserId, zoomEmail                              │  │
│  │ • isActive, isRevoked status                         │  │
│  │ • Audit trail (authorizedAt, lastUsedAt)             │  │
│  └──────────────────────────────────────────────────────┘  │
│                           ↓                                  │
└─────────────────────────────────────────────────────────────┘
                           ↓
                ┌──────────────────────┐
                │    Zoom OAuth        │
                │   Authorization      │
                │     Endpoint         │
                └──────────────────────┘
                           ↓
                    ┌─────────────┐
                    │ User Grants │
                    │ Permissions │
                    └─────────────┘
```

## Setup Instructions

### Step 1: Create Zoom OAuth App (User-Managed)

1. Go to [Zoom App Marketplace](https://marketplace.zoom.us/develop/create)
2. Click **Create** → **OAuth App**
3. Select **User-managed app** (NOT Server-to-Server)
4. Fill in app details:
   - **App Name**: Specialistly User Integration
   - **Company**: Your company name
   - **Developer Name**: Your name
   - **Support Email**: Your email

### Step 2: Configure OAuth Credentials

1. In app settings, find **OAuth Credentials**:
   - Copy **Client ID**
   - Copy **Client Secret**
   - Add **Redirect URL**: `http://localhost:5001/api/zoom/oauth/user-callback` (development)
   - For production: `https://yourdomain.com/api/zoom/oauth/user-callback`

2. Save to `.env`:
```env
# User-Managed OAuth (User-Level)
ZOOM_USER_MANAGED_CLIENT_ID=your_client_id_here
ZOOM_USER_MANAGED_CLIENT_SECRET=your_client_secret_here
ZOOM_REDIRECT_URI=http://localhost:5001/api/zoom/oauth/user-callback
```

### Step 3: Configure Required Scopes

In Zoom App Marketplace → App Credentials → Scopes, enable:
- `meeting:read` - Read meeting details
- `meeting:write` - Create and update meetings
- `recording:read` - Access recordings
- `user:read` - Read user profile
- `user:write` - Update user profile

## Implementation

### New Files Created

1. **`backend/models/UserOAuthToken.js`**
   - MongoDB schema for storing user OAuth tokens
   - Tracks token lifecycle, scopes, and usage

2. **`backend/services/userManagedOAuthService.js`**
   - Core OAuth logic
   - Token management (obtain, refresh, revoke)
   - Token validation

3. **`backend/controllers/userOAuthController.js`**
   - Express route handlers
   - OAuth flow endpoints
   - Zoom resource access endpoints

4. **`backend/routes/zoomRoutes.js`** (Updated)
   - New user-managed OAuth routes
   - Maintains backward compatibility

## API Endpoints

### 1. Initiate Authorization
```http
GET /api/zoom/oauth/user/authorize?userId=USER_ID
```

**Response:**
```json
{
  "success": true,
  "authUrl": "https://zoom.us/oauth/authorize?client_id=...",
  "message": "Redirect user to this URL to authorize Zoom access"
}
```

**Frontend Implementation:**
```javascript
// Frontend: Get auth URL
const response = await fetch(
  `/api/zoom/oauth/user/authorize?userId=${userId}`
);
const data = await response.json();

// Redirect user to Zoom
window.location.href = data.authUrl;
```

### 2. OAuth Callback (Zoom Redirect)
```http
GET /api/zoom/oauth/user-callback?code=AUTH_CODE&state=STATE
```

- Backend automatically handles code exchange
- Redirects to dashboard with success/error message

### 3. Check Authorization Status
```http
GET /api/zoom/oauth/user/status?userId=USER_ID
```

**Response (Authorized):**
```json
{
  "success": true,
  "authorized": true,
  "tokenInfo": {
    "zoomUserId": "123456789",
    "zoomEmail": "user@example.com",
    "isActive": true,
    "isRevoked": false,
    "authorizedAt": "2024-01-29T10:00:00Z",
    "lastUsedAt": "2024-01-29T15:30:00Z",
    "expiresAt": "2024-01-30T10:00:00Z",
    "grantedScopes": ["meeting:read", "meeting:write", "recording:read", "user:read"]
  }
}
```

### 4. Get Zoom Profile
```http
GET /api/zoom/oauth/user/profile?userId=USER_ID
```

**Response:**
```json
{
  "success": true,
  "profile": {
    "id": "123456789",
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@example.com",
    "type": 2,
    "pmi": 1234567890,
    "timezone": "America/New_York",
    "verified": 1,
    "created_at": "2020-01-01T00:00:00Z"
  }
}
```

### 5. List User's Meetings
```http
GET /api/zoom/oauth/user/meetings?userId=USER_ID&type=live&page_size=30&page_number=1
```

**Query Parameters:**
- `userId` (required): User ID
- `type`: Meeting type - `live`, `upcoming`, `previous`, `all` (default: `live`)
- `page_size`: Results per page, 1-300 (default: 30)
- `page_number`: Page number (default: 1)

**Response:**
```json
{
  "success": true,
  "meetings": [
    {
      "uuid": "meeting_uuid",
      "id": 123456789,
      "host_id": "abc123",
      "topic": "Team Standup",
      "type": 2,
      "start_time": "2024-01-30T10:00:00Z",
      "duration": 30,
      "timezone": "America/New_York",
      "join_url": "https://zoom.us/j/123456789"
    }
  ],
  "totalRecords": 1,
  "pageCount": 1
}
```

### 6. Refresh Access Token
```http
POST /api/zoom/oauth/user/refresh
Content-Type: application/json

{
  "userId": "USER_ID"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Access token refreshed successfully",
  "expiresIn": 3600
}
```

### 7. Revoke Token (Disconnect)
```http
POST /api/zoom/oauth/user/revoke
Content-Type: application/json

{
  "userId": "USER_ID"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Token revoked successfully"
}
```

## Usage Examples

### Example 1: Complete Authorization Flow

**Frontend:**
```javascript
// Button click handler
async function connectZoom() {
  const userId = getCurrentUserId();
  
  try {
    const response = await fetch(
      `/api/zoom/oauth/user/authorize?userId=${userId}`
    );
    const data = await response.json();
    
    if (data.success) {
      // Redirect to Zoom OAuth
      window.location.href = data.authUrl;
    } else {
      alert(`Error: ${data.error}`);
    }
  } catch (error) {
    console.error('Error connecting Zoom:', error);
  }
}

// After redirect back from Zoom
function handleOAuthCallback() {
  const params = new URLSearchParams(window.location.search);
  
  if (params.get('oauth_success')) {
    alert('Zoom connected successfully!');
    // Refresh user settings
    loadUserSettings();
  } else if (params.get('oauth_error')) {
    alert(`OAuth failed: ${params.get('oauth_error')}`);
  }
}
```

### Example 2: Check Authorization Status

```javascript
async function checkZoomConnection() {
  const userId = getCurrentUserId();
  
  const response = await fetch(
    `/api/zoom/oauth/user/status?userId=${userId}`
  );
  const data = await response.json();
  
  if (data.authorized) {
    console.log(`Connected as: ${data.tokenInfo.zoomEmail}`);
    console.log(`Authorized: ${data.tokenInfo.authorizedAt}`);
    console.log(`Scopes: ${data.tokenInfo.grantedScopes.join(', ')}`);
  } else {
    console.log('User has not connected their Zoom account');
  }
}
```

### Example 3: Get User's Zoom Meetings

```javascript
async function listUserMeetings() {
  const userId = getCurrentUserId();
  
  const response = await fetch(
    `/api/zoom/oauth/user/meetings?userId=${userId}&type=upcoming&page_size=10`
  );
  const data = await response.json();
  
  if (data.success) {
    data.meetings.forEach(meeting => {
      console.log(`Meeting: ${meeting.topic}`);
      console.log(`Start: ${meeting.start_time}`);
      console.log(`Join: ${meeting.join_url}`);
    });
  }
}
```

### Example 4: Disconnect Zoom

```javascript
async function disconnectZoom() {
  const userId = getCurrentUserId();
  
  if (confirm('Disconnect your Zoom account? You can reconnect anytime.')) {
    const response = await fetch('/api/zoom/oauth/user/revoke', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    });
    
    const data = await response.json();
    if (data.success) {
      alert('Zoom disconnected successfully');
      loadUserSettings();
    }
  }
}
```

## Token Management

### Auto-Refresh Logic

The service automatically refreshes tokens when:
- Token expires within 5 minutes
- `getValidAccessToken()` is called

**Implementation:**
```javascript
// Automatic refresh (within 5 min of expiry)
const accessToken = await userManagedOAuthService.getValidAccessToken(userId);

// Token is valid and fresh, or was just refreshed
// Ready to use: accessToken
```

### Manual Refresh

```javascript
// Force manual refresh (useful for settings page)
const result = await userManagedOAuthService.refreshAccessToken(userId);

if (result.success) {
  console.log(`Token refreshed, valid for ${result.expiresIn} seconds`);
}
```

### Token Revocation

When user disconnects their Zoom account:
1. Local token marked as revoked in database
2. Refresh token sent to Zoom for remote revocation
3. User must re-authorize to use Zoom features

## Error Handling

### Common Errors

| Error | Cause | Resolution |
|-------|-------|-----------|
| `ZOOM_USER_MANAGED_CLIENT_ID not configured` | Missing env variable | Add to `.env` |
| `Invalid state token` | State mismatch (security) | User must restart auth flow |
| `State token expired` | State older than 10 minutes | User must restart auth flow |
| `User not authorized` | No valid token | User must authorize first |
| `Token refresh failed` | Invalid refresh token | User must re-authorize |
| `Token has been revoked` | User disconnected account | User must re-authorize |

### Error Response Example

```json
{
  "success": false,
  "error": "User not authorized or token expired"
}
```

## Database Schema

### UserOAuthToken Collection

```javascript
{
  _id: ObjectId,
  userId: ObjectId,                    // Link to User document
  
  // OAuth Tokens
  zoomAccessToken: String,             // Current access token
  zoomRefreshToken: String,            // Used to get new access token
  zoomAccessTokenExpiry: Date,         // When access token expires
  
  // Zoom User Info
  zoomUserId: String,                  // Zoom user ID
  zoomEmail: String,                   // Connected Zoom email
  zoomAccountId: String,               // Zoom account ID
  
  // State Management
  oauthState: String,                  // Temporary state during auth flow
  stateExpiresAt: Date,                // State expires after 10 minutes
  
  // Token Refresh Tracking
  lastRefreshAttempt: Date,            // Last refresh attempt
  refreshErrorCount: Number,           // Count of failed refreshes
  
  // Revocation Status
  isActive: Boolean,                   // Whether token is usable
  isRevoked: Boolean,                  // Whether user disconnected
  revokedAt: Date,                     // When token was revoked
  
  // Scopes and Metadata
  grantedScopes: [String],             // Authorized scopes
  authorizedAt: Date,                  // When user authorized
  lastUsedAt: Date,                    // Last time token was used
  
  // Device Information
  deviceInfo: {
    userAgent: String,
    ipAddress: String
  },
  
  createdAt: Date,                     // Record creation time
  updatedAt: Date                      // Last update time
}
```

## Security Considerations

### 1. State Token Validation
- State tokens expire after 10 minutes
- Prevents CSRF attacks
- Must match between request and callback

### 2. Token Storage
- Stored encrypted in MongoDB
- Never exposed in API responses
- Only server uses tokens internally

### 3. Automatic Refresh
- Refreshes 5 minutes before expiry
- Prevents expired token errors
- Reduces manual token management

### 4. Revocation Tracking
- Marks tokens as revoked
- Prevents reuse of revoked tokens
- Audit trail of disconnections

### 5. Device Tracking
- Records user agent and IP
- Can detect suspicious authorization
- Useful for security audits

### 6. Rate Limiting Recommendations
```javascript
// Protect refresh endpoint with rate limiting
const rateLimit = require('express-rate-limit');

const refreshLimiter = rateLimit({
  windowMs: 60 * 1000,  // 1 minute
  max: 5                // 5 requests per minute
});

router.post('/oauth/user/refresh', refreshLimiter, refreshUserAccessToken);
```

## Testing

### Test Authorization Flow

```bash
# 1. Get authorization URL
curl "http://localhost:5001/api/zoom/oauth/user/authorize?userId=USER_ID_HERE"

# 2. Open the returned authUrl in browser
# 3. Grant permissions when Zoom asks
# 4. Check token was saved
curl "http://localhost:5001/api/zoom/oauth/user/status?userId=USER_ID_HERE"
```

### Test Token Refresh

```bash
# Manually refresh token (useful for testing)
curl -X POST http://localhost:5001/api/zoom/oauth/user/refresh \
  -H "Content-Type: application/json" \
  -d '{"userId": "USER_ID_HERE"}'
```

### Test Profile Access

```bash
# Get Zoom profile (requires valid token)
curl "http://localhost:5001/api/zoom/oauth/user/profile?userId=USER_ID_HERE"

# List meetings
curl "http://localhost:5001/api/zoom/oauth/user/meetings?userId=USER_ID_HERE&type=upcoming"
```

## Troubleshooting

### Issue: "OAuth app is not installed"
- Ensure app is created in Zoom Marketplace
- Verify Client ID matches `.env`

### Issue: "Redirect URI doesn't match"
- Verify redirect URI in Zoom app settings
- Matches `ZOOM_REDIRECT_URI` in `.env`
- Includes full path: `/api/zoom/oauth/user-callback`

### Issue: Token keeps expiring
- Tokens expire after 1 hour by default
- Service auto-refreshes, but verify logs
- Check `zoomRefreshToken` is saved correctly

### Issue: User profile endpoint returns 401
- Token might be revoked or expired
- Verify token status with `/status` endpoint
- User may need to re-authorize

### Issue: Meetings endpoint returns empty
- Verify scopes include `meeting:read`
- Check Zoom account has meetings scheduled
- Verify correct page parameters

## Comparison with Server-to-Server OAuth

### Use Server-to-Server OAuth When:
- ✅ Creating meetings on behalf of multiple specialists
- ✅ Automating Zoom operations without user input
- ✅ Managing Zoom resources at application level
- ✅ No per-user authentication needed

### Use User-Managed OAuth When:
- ✅ Users control their own Zoom integrations
- ✅ Accessing user's personal Zoom account
- ✅ Listing user's existing meetings/recordings
- ✅ Recording meetings to user's Zoom cloud
- ✅ Implementing "Connect Your Zoom" feature

### Both Together:
- Use Server-to-Server for app-level operations
- Use User-Managed for user-personal operations
- Fallback chain: User token → Server token → Local storage

## Next Steps

1. **Configure OAuth Credentials**: Add to `.env`
2. **Test Authorization**: Run authorization flow test
3. **Implement Frontend UI**: Add "Connect Zoom" button
4. **Add Error Handling**: Handle token expiry gracefully
5. **Monitor Token Health**: Track refresh errors
6. **Document User Flow**: Create user guide

## Additional Resources

- [Zoom OAuth Documentation](https://developers.zoom.us/docs/internal-apps/oauth/)
- [Zoom API Reference](https://developers.zoom.us/docs/api/rest/)
- [OAuth 2.0 Standards](https://tools.ietf.org/html/rfc6749)
