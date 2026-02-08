# 🔧 Zoom Email & Calendar Invite - Complete Troubleshooting Guide

## ❌ Problem

When customer (sinduja.vel@gmail.com) tries to book an appointment or service:
- ❌ No Zoom meeting is created
- ❌ No email notification is sent to customer
- ❌ No calendar invite is sent
- ❌ Booking may fail with error about Zoom authorization

---

## 🔍 Root Cause Analysis

The system requires 3 components to send booking emails:

```
Customer Books Appointment
        ↓
  Specialist has valid Zoom Token?
        ↓
    Create Zoom Meeting
        ↓
    Send Email with Zoom Link
```

**Current Status:**
- ❌ Specialist's Zoom OAuth token shows "pending" values
- ❌ This means token exchange failed during OAuth callback
- ❌ Without valid token, Zoom meeting creation fails
- ❌ Without Zoom meeting, email isn't sent (nothing to send!)

---

## 📋 Current Token Status

```
OAuth Token Record:
  ✓ Record exists: YES
  ✓ Is Active: YES
  ❌ Zoom User ID: "pending" (should be actual ID)
  ❌ Zoom Email: "pending" (should be actual email)
  ❌ Access Token: "pending" (should be real token)
  ❌ Refresh Token: "pending" (should be real token)
```

---

## 🛠️ How to Fix - Complete Steps

### Phase 1: Verify Zoom App Configuration (5 minutes)

1. **Go to Zoom Marketplace:**
   - URL: https://marketplace.zoom.us/develop/apps
   - Login with your Zoom account

2. **Select the Application:**
   - Find app: "Specialistly" (or similar)
   - Click to edit

3. **Verify App Settings:**
   ```
   ✓ App Type: "User-Managed OAuth App"
   ✓ App Name: Specialistly (or your app name)
   ```

4. **Verify OAuth Credentials Tab:**
   ```
   ✓ Client ID: T0rMIOs5Quu2sGFeTAn2Tw
   ✓ Client Secret: [hidden, but should be set]
   ✓ Redirect URL: EXACTLY: http://localhost:5001/api/zoom/oauth/user-callback
   ```
   
   **IMPORTANT:** The redirect URL must match EXACTLY, including:
   - Protocol: `http://` (not https for localhost)
   - Host: `localhost:5001`
   - Path: `/api/zoom/oauth/user-callback`
   - No trailing slash

5. **Verify Scopes Tab:**
   - Look for "Meeting scopes" section
   - Enable: ✓ `meeting:update:meeting`
   - Enable: ✓ `user:read:user`

### Phase 2: Re-authorize Zoom (5 minutes)

1. **Open Application:**
   - Go to: http://localhost:5173
   - Make sure both frontend and backend are running

2. **Login as Specialist:**
   - Email: `sivakumarganeshm@gmail.com`
   - Password: `password123`

3. **Navigate to Settings:**
   - Click: Settings (top right menu)
   - Look for: "Zoom Integration" section

4. **Disconnect (if button exists):**
   - If there's a "Disconnect Zoom" button, click it
   - This clears the pending token

5. **Authorize:**
   - Click: "Connect Zoom Account" or "Authorize Zoom"
   - A new window will open to Zoom
   - Zoom will ask for permissions
   - **IMPORTANT:** Click "Allow" or "Authorize"
   - Wait for redirect back to app
   - Should see: "✓ Zoom authorization successful"

### Phase 3: Verify Success (2 minutes)

After authorization completes:

1. **Check Database:**
   ```bash
   cd C:\Work\specialistly\backend
   node diagnose-zoom-auth.js
   ```
   
   **Success Indicators:**
   ```
   ✓ Zoom User ID: [actual Zoom ID, not "pending"]
   ✓ Zoom Email: [actual email, not "pending"]
   ✓ Access Token: [shows as stored, not "pending"]
   ✓ Refresh Token: [shows as stored, not "pending"]
   ```

2. **Test Booking:**
   ```bash
   node test-booking-now.js
   ```
   
   **Success Indicators:**
   ```
   ✓ Zoom meeting created
   ✓ Meeting ID shown
   ✓ Join URL shown
   ```

3. **Check Email:**
   - Login to email: sinduja.vel@gmail.com
   - Check inbox for meeting invitation email
   - Email should contain:
     - Zoom meeting details
     - Join URL
     - Meeting ID
     - Specialist name
     - Meeting time

### Phase 4: Troubleshoot if Still Failing

If authorization still shows "pending" values:

**Check Server Logs:**

Look at backend server terminal for error messages like:
```
❌ Zoom token exchange failed:
   Status: [error code]
   Error: [error description]
   Reason: [explanation]
```

**Common Errors & Fixes:**

| Error | Cause | Fix |
|-------|-------|-----|
| `redirect_uri_mismatch` | URL doesn't match | Ensure redirect URL in Zoom App matches EXACTLY: `http://localhost:5001/api/zoom/oauth/user-callback` |
| `invalid_client` | Client ID/Secret wrong | Verify Client ID is: `T0rMIOs5Quu2sGFeTAn2Tw` |
| `invalid_scope` | Scopes not enabled | Enable both scopes in Zoom App: `meeting:update:meeting` and `user:read:user` |
| `access_denied` | User rejected | When Zoom asks for permission, click "Allow" |
| `invalid_grant` | Authorization code expired | This shouldn't happen, but if it does, try authorizing again |

---

## 🧪 Testing the Complete Flow

Once Zoom authorization is successful:

### Test 1: Check Authorization
```bash
cd C:\Work\specialistly\backend
node diagnose-zoom-auth.js
```
Expected: All values should show actual data (not "pending")

### Test 2: Test Booking
```bash
node test-booking-now.js
```
Expected: Booking succeeds with Zoom meeting created

### Test 3: Manual Booking
1. Go to http://localhost:5173
2. Login as customer: `sinduja.vel@gmail.com` / `password123`
3. Find specialist: "Sivakumar Ganesan"
4. Click: "Book Appointment"
5. Select: Any available slot
6. Click: "Book Slot"
7. Check email inbox for invitation

---

## 📧 Email Notification Details

When booking succeeds, TWO emails are sent:

### Email 1: Customer Notification
- **To:** sinduja.vel@gmail.com
- **Subject:** 🎥 Zoom Meeting Invitation: [Service Name]
- **Contains:**
  - Meeting date and time
  - Zoom join link (clickable button)
  - Meeting ID
  - Host name (Sivakumar Ganesan)
  - Instructions to join 5 minutes early

### Email 2: Specialist Confirmation
- **To:** sivakumarganeshm@gmail.com
- **Subject:** 🎥 Your Zoom Meeting: [Customer Name] - [Service Name]
- **Contains:**
  - Meeting details
  - "Start Meeting" button
  - Participant email (customer)
  - Recording notification
  - Tips for successful meeting

---

## 🔄 Token Refresh (Advanced)

If token expires after use:
- System will attempt automatic refresh using refresh token
- If refresh fails, user must re-authorize
- Check: "Token expires in 1 hour" (typical Zoom tokens)

---

## 📞 Still Having Issues?

Check these in order:

1. **Backend running?**
   ```bash
   curl http://localhost:5001/api/health
   ```
   Should return: 200 OK

2. **Frontend running?**
   ```
   http://localhost:5173 loads?
   ```

3. **MongoDB connected?**
   - Check backend logs for "✓ MongoDB connected"

4. **Email service working?**
   - Check backend logs for "✓ Email service verified"

5. **Zoom config correct?**
   - Revisit Phase 1 verification steps

6. **Run diagnostic:**
   ```bash
   node debug-zoom-booking.js
   ```

---

## 🎯 Expected Final State

After successful Zoom authorization:

**System Flow:**
```
1. Customer books appointment
2. System creates Zoom meeting (using specialist's token)
3. Email sent to customer with Zoom join link
4. Email sent to specialist with meeting details
5. Both receive calendar invite
6. Meeting can be joined from email links
7. Meeting is recorded to cloud
8. Recording link sent after meeting
```

**Email Status:**
- ✓ Customer receives meeting invitation
- ✓ Specialist receives meeting confirmation  
- ✓ Both can join directly from email
- ✓ Recording available after meeting

---

## 📝 Implementation Summary

The complete flow now includes:

1. ✅ Zoom OAuth 2.0 User-Managed setup
2. ✅ Token storage with encryption
3. ✅ Automatic Zoom meeting creation
4. ✅ Email notifications with Zoom links
5. ✅ Calendar invites (via email)
6. ✅ Recording availability
7. ✅ Error handling and retry logic

**Status: Ready for Testing**

---

Generated: January 30, 2026
