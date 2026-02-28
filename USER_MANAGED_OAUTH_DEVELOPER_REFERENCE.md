# User-Managed OAuth - Developer Reference

## File Structure

```
backend/
├── models/
│   ├── UserOAuthToken.js           [NEW] - Token storage schema
│   └── User.js                      (unchanged)
├── services/
│   ├── userManagedOAuthService.js   [NEW] - OAuth logic
│   ├── zoomService.js               (existing Server-to-Server)
│   └── googleMeetService.js         (existing)
├── controllers/
│   ├── userOAuthController.js       [NEW] - Route handlers
│   ├── zoomController.js            (existing)
│   └── appointmentController.js     (existing)
├── routes/
│   └── zoomRoutes.js                [UPDATED] - Added OAuth routes
└── server.js                        (existing, no changes)
```

## Service API Reference

### userManagedOAuthService.js

#### generateAuthorizationUrl(userId)
```javascript
// Get OAuth URL for user authorization
const result = await generateAuthorizationUrl('user_id_123');

if (result.success) {
  // Direct browser to this URL
  console.log(result.authUrl);  // Zoom OAuth URL
  console.log(result.state);    // For reference
} else {
  console.error(result.error);  // Error message
}

// Response format
{
  success: true,
  authUrl: 'https://zoom.us/oauth/authorize?client_id=...',
  state: 'random_hex_string'
}
```

#### exchangeCodeForToken(code, state, userId)
```javascript
// Called when user returns from Zoom with authorization code
// Usually called from controller, not directly

const result = await exchangeCodeForToken(
  'authorization_code_from_zoom',
  'state_token_123',
  'user_id_123'
);

if (result.success) {
  console.log(result.zoomUserId);   // Zoom user ID
  console.log(result.zoomEmail);    // Connected email
  console.log(result.scopes);       // Granted permissions
} else {
  console.error(result.error);
}

// Response format
{
  success: true,
  zoomUserId: '123456789',
  zoomEmail: 'user@example.com',
  scopes: ['meeting:read', 'meeting:write', ...],
  expiresIn: 3600
}
```

#### getValidAccessToken(userId)
```javascript
// Get a valid, fresh access token for API calls
// Auto-refreshes if expiring within 5 minutes

const accessToken = await getValidAccessToken('user_id_123');

if (accessToken) {
  // Use token for Zoom API calls
  const profile = await axios.get('https://api.zoom.us/v2/users/me', {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
} else {
  // Token invalid or user not authorized
  console.error('No valid token available');
}
```

#### refreshAccessToken(userId)
```javascript
// Manually refresh access token
// Usually not needed (auto-refresh happens)

const result = await refreshAccessToken('user_id_123');

if (result.success) {
  console.log(result.accessToken);  // New token
  console.log(result.expiresIn);    // Seconds until expiry
} else {
  console.error(result.error);
  // May need user to re-authorize
}

// Response format
{
  success: true,
  accessToken: 'new_access_token',
  expiresIn: 3600
}
```

#### revokeUserToken(userId)
```javascript
// Revoke user's authorization (disconnect)
// Tells Zoom to invalidate tokens
// Marks record as revoked locally

const result = await revokeUserToken('user_id_123');

if (result.success) {
  console.log(result.message);  // "Token revoked successfully"
  // User must re-authorize to use Zoom
} else {
  console.error(result.error);
}

// Response format
{
  success: true,
  message: 'Token revoked successfully'
}
```

#### getUserTokenInfo(userId)
```javascript
// Get token metadata (safe for frontend)
// Does not return actual tokens

const info = await getUserTokenInfo('user_id_123');

if (info) {
  console.log(info.zoomUserId);      // Zoom user ID
  console.log(info.zoomEmail);       // Connected email
  console.log(info.isActive);        // Boolean
  console.log(info.isRevoked);       // Boolean
  console.log(info.authorizedAt);    // ISO date
  console.log(info.lastUsedAt);      // ISO date
  console.log(info.expiresAt);       // ISO date
  console.log(info.grantedScopes);   // Array of scopes
} else {
  // No token for this user
}

// Response format
{
  zoomUserId: '123456789',
  zoomEmail: 'user@example.com',
  isActive: true,
  isRevoked: false,
  authorizedAt: '2024-01-29T10:00:00Z',
  lastUsedAt: '2024-01-29T15:30:00Z',
  expiresAt: '2024-01-30T10:00:00Z',
  grantedScopes: ['meeting:read', 'meeting:write', ...]
}
```

#### hasValidToken(userId)
```javascript
// Quick check: does user have valid token?
// Returns boolean

const isValid = await hasValidToken('user_id_123');

if (isValid) {
  // User can use Zoom features
  // Token is active and not revoked
} else {
  // User needs to authorize
}
```

## Controller Usage Examples

### In appointmentController.js

```javascript
import userManagedOAuthService from '../services/userManagedOAuthService.js';

// When booking appointment
export async function bookSlot(req, res) {
  const { specialistId, customerId, slotDate } = req.body;
  
  // Check if specialist has authorized their Zoom
  const hasToken = await userManagedOAuthService.hasValidToken(specialistId);
  
  if (hasToken) {
    // Use specialist's Zoom account
    // Meeting will be recorded to their cloud storage
    const token = await userManagedOAuthService.getValidAccessToken(specialistId);
    
    const meeting = await createZoomMeetingWithUserToken(
      token,
      slotDate,
      customerId
    );
  } else {
    // Fallback to server token or Google Meet
    const meeting = await createZoomMeetingWithAppToken(slotDate, customerId);
  }
}

// Helper to create meeting with user's token
async function createZoomMeetingWithUserToken(token, date, customerId) {
  const response = await axios.post('https://api.zoom.us/v2/users/me/meetings', {
    topic: 'Specialist Session',
    type: 2, // Scheduled meeting
    start_time: date.toISOString(),
    duration: 60,
    settings: {
      host_video: true,
      participant_video: true,
      join_before_host: false,
      waiting_room: true,
      auto_recording: 'cloud'
    }
  }, {
    headers: { Authorization: `Bearer ${token}` }
  });
  
  return response.data;
}
```

## API Endpoint Reference

### Authorization

#### GET /api/zoom/oauth/user/authorize
Initiate OAuth authorization flow.

**Query Parameters:**
- `userId` (required): User ID from database

**Response:**
```json
{
  "success": true,
  "authUrl": "https://zoom.us/oauth/authorize?client_id=...",
  "message": "Redirect user to this URL"
}
```

**Example:**
```bash
curl "http://localhost:5001/api/zoom/oauth/user/authorize?userId=507f1f77bcf86cd799439011"
```

#### GET /api/zoom/oauth/user-callback
Zoom OAuth callback (automatic).

**Query Parameters:**
- `code`: Authorization code from Zoom
- `state`: State token for verification
- `error` (optional): Error from Zoom

**Behavior:**
- Exchanges code for token
- Stores in database
- Redirects to dashboard with success/error

### Status & Management

#### GET /api/zoom/oauth/user/status
Check user's authorization status.

**Query Parameters:**
- `userId` (required): User ID

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
    "grantedScopes": ["meeting:read", "meeting:write", ...]
  }
}
```

**Response (Not Authorized):**
```json
{
  "success": true,
  "authorized": false,
  "message": "User has not authorized Zoom access"
}
```

#### POST /api/zoom/oauth/user/revoke
Disconnect user's Zoom account.

**Request:**
```json
{
  "userId": "user_id_123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Token revoked successfully"
}
```

#### POST /api/zoom/oauth/user/refresh
Manually refresh access token.

**Request:**
```json
{
  "userId": "user_id_123"
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

### Zoom Resources (Requires Valid Token)

#### GET /api/zoom/oauth/user/profile
Get user's Zoom profile.

**Query Parameters:**
- `userId` (required): User ID

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

#### GET /api/zoom/oauth/user/meetings
List user's Zoom meetings.

**Query Parameters:**
- `userId` (required): User ID
- `type` (optional): `live`, `upcoming`, `previous`, `all` (default: `live`)
- `page_size` (optional): 1-300 (default: 30)
- `page_number` (optional): Page number (default: 1)

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

## Error Handling

### Common Error Responses

```javascript
// Missing required parameter
{
  "success": false,
  "error": "userId is required"
}

// User not found
{
  "success": false,
  "error": "User not found"
}

// Invalid state token
{
  "success": false,
  "error": "Invalid state token"
}

// State expired
{
  "success": false,
  "error": "State token expired"
}

// No authorization
{
  "success": false,
  "error": "User not authorized or token expired"
}

// Token refresh failed
{
  "success": false,
  "error": "Token refresh failed: invalid_grant"
}

// Zoom API error
{
  "success": false,
  "error": "Invalid request"
}
```

### Error Handling Pattern

```javascript
try {
  const result = await userManagedOAuthService.method(args);
  
  if (!result.success) {
    // Expected error (validation, auth, etc.)
    return res.status(400).json({ 
      success: false, 
      error: result.error 
    });
  }
  
  // Success
  res.json(result);
} catch (error) {
  // Unexpected error (network, database, etc.)
  console.error('Error:', error.message);
  res.status(500).json({ 
    success: false, 
    error: error.message 
  });
}
```

## Database Query Examples

### Find user's token
```javascript
const token = await UserOAuthToken.findOne({ userId: 'user_id_123' });
```

### Find by Zoom email
```javascript
const token = await UserOAuthToken.findOne({ zoomEmail: 'user@example.com' });
```

### Find active tokens
```javascript
const tokens = await UserOAuthToken.find({ 
  isActive: true, 
  isRevoked: false 
});
```

### Find tokens expiring soon
```javascript
const expiring = await UserOAuthToken.find({
  zoomAccessTokenExpiry: { 
    $lt: new Date(Date.now() + 60 * 60 * 1000)  // Within 1 hour
  }
});
```

### Find revoked tokens (audit)
```javascript
const revoked = await UserOAuthToken.find({ 
  isRevoked: true 
}).sort({ revokedAt: -1 });
```

### Find tokens with refresh errors
```javascript
const problematic = await UserOAuthToken.find({
  refreshErrorCount: { $gt: 3 }
});
```

## Testing Examples

### Test with curl

```bash
# 1. Get authorization URL
curl -X GET "http://localhost:5001/api/zoom/oauth/user/authorize?userId=USER_ID" \
  -H "Accept: application/json"

# 2. Manual token refresh
curl -X POST "http://localhost:5001/api/zoom/oauth/user/refresh" \
  -H "Content-Type: application/json" \
  -d '{"userId":"USER_ID"}'

# 3. Check status
curl -X GET "http://localhost:5001/api/zoom/oauth/user/status?userId=USER_ID"

# 4. Get profile
curl -X GET "http://localhost:5001/api/zoom/oauth/user/profile?userId=USER_ID"

# 5. List meetings
curl -X GET "http://localhost:5001/api/zoom/oauth/user/meetings?userId=USER_ID&type=upcoming"

# 6. Revoke token
curl -X POST "http://localhost:5001/api/zoom/oauth/user/revoke" \
  -H "Content-Type: application/json" \
  -d '{"userId":"USER_ID"}'
```

### Test with JavaScript

```javascript
// Frontend test
async function testOAuth() {
  const userId = 'test_user_id';
  
  try {
    // 1. Get auth URL
    let res = await fetch(`/api/zoom/oauth/user/authorize?userId=${userId}`);
    let data = await res.json();
    console.log('1. Auth URL:', data.authUrl);
    
    // 2. Status check
    res = await fetch(`/api/zoom/oauth/user/status?userId=${userId}`);
    data = await res.json();
    console.log('2. Status:', data);
    
    // 3. Profile
    res = await fetch(`/api/zoom/oauth/user/profile?userId=${userId}`);
    data = await res.json();
    console.log('3. Profile:', data.profile);
    
    // 4. Meetings
    res = await fetch(`/api/zoom/oauth/user/meetings?userId=${userId}`);
    data = await res.json();
    console.log('4. Meetings:', data.meetings);
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}
```

## Debugging Checklist

- [ ] Verify `.env` has `ZOOM_USER_MANAGED_CLIENT_ID` and `ZOOM_USER_MANAGED_CLIENT_SECRET`
- [ ] Check Zoom app exists at https://marketplace.zoom.us/develop
- [ ] Verify redirect URI matches in Zoom app settings
- [ ] Test authorization URL returns valid Zoom OAuth URL
- [ ] Check state token is stored in database
- [ ] Verify code exchange succeeds after Zoom redirect
- [ ] Confirm tokens are saved in UserOAuthToken collection
- [ ] Test token refresh works
- [ ] Verify access token is used correctly in Zoom API calls
- [ ] Check Zoom profile endpoint returns data
- [ ] Verify revocation marks token as inactive

## Performance Optimization Tips

1. **Cache token expiry check:**
   ```javascript
   // Instead of checking every call, cache for 1 minute
   if (Date.now() - lastCheck > 60000) {
     const token = await getValidAccessToken(userId);
     lastCheck = Date.now();
   }
   ```

2. **Batch token refresh:**
   ```javascript
   // Refresh multiple users' tokens in one job
   const expiring = await UserOAuthToken.find({
     zoomAccessTokenExpiry: { $lt: new Date(Date.now() + 5*60*1000) }
   });
   await Promise.all(expiring.map(t => refreshAccessToken(t.userId)));
   ```

3. **Use database indexes:**
   - Already created on `userId`, `zoomUserId`, `oauthState`, `isActive+isRevoked`

4. **Minimize Zoom API calls:**
   - Cache profile info with 1-hour TTL
   - Batch meetings list requests
   - Use appropriate pagination

## Security Reminders

- ❌ Never expose `zoomAccessToken` or `zoomRefreshToken` to frontend
- ❌ Never log tokens (even in debug)
- ❌ Never store in cookies or localStorage
- ✅ Always validate state token
- ✅ Always check token expiry
- ✅ Always use HTTPS for OAuth callback
- ✅ Implement rate limiting on token endpoints
- ✅ Monitor refresh error counts

---

**Questions?** Check `USER_MANAGED_OAUTH_GUIDE.md` for detailed documentation.
