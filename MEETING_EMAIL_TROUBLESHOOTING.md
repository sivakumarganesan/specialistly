# Meeting Creation & Email Troubleshooting Guide

## ❌ Issue: Zoom meetings not created and emails not sent after booking

### Root Causes & Solutions

---

## 🎯 PRIMARY CAUSE: Specialist hasn't authorized Zoom

### What's Happening
When a customer books an appointment slot:
1. System tries to create a Zoom meeting
2. System needs specialist's Zoom access token
3. If specialist hasn't authorized → **Zoom meeting fails**
4. If Zoom meeting fails → **Emails are NOT sent**

### Solution: Specialist Must Authorize Zoom

**Step 1: Login as Specialist**
- Make sure you're logged in with the specialist account

**Step 2: Go to Settings**
- Click "Settings" in the left sidebar

**Step 3: Navigate to Zoom Integration**
- You're on "User Profile" tab by default
- Scroll down to "Zoom Integration" section

**Step 4: Connect Your Zoom Account**
- Click the blue **"Connect Zoom Account"** button
- You'll be redirected to Zoom's authorization page
- Click **"Authorize"** to give Specialistly permission
- You'll return to Settings automatically
- See ✓ Green status: "Zoom Account Connected"

**Step 5: Now bookings will create Zoom meetings!**

---

## 🔧 SECONDARY CAUSE: Email not configured

### What's Happening
- Email service requires Gmail credentials in `.env`
- Without email, system can't send meeting invitations

### Solution: Configure Email

**In `backend/.env` file, add:**
```
GMAIL_USER=your-email@gmail.com
GMAIL_PASSWORD=your-app-password
EMAIL_SERVICE=gmail
```

### Important: Use Gmail App Password
- Regular Gmail passwords won't work
- You need a 16-character **App Password**

**Get Gmail App Password:**
1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable 2-Factor Authentication (if not already done)
3. Find "App passwords" option
4. Select "Mail" and "Windows Computer"
5. Google will generate a 16-character password
6. Copy this as `GMAIL_PASSWORD` in `.env`

---

## 🧪 Test Your Configuration

### Run Diagnostic Check
```bash
cd backend
node diagnostic.js
```

**You should see:**
```
✅ GMAIL_USER: your-email@gmail.com
✅ GMAIL_PASSWORD: ***
✅ Email Service Connected Successfully
✅ ZOOM_CLIENT_ID: SET
✅ ZOOM_CLIENT_SECRET: SET
```

### Check Specialist Authorization
The diagnostic script also shows:
```
👥 SPECIALIST ZOOM AUTHORIZATIONS
─────────────────────────────────
User ID: [specialist-id]
  • Zoom Access Token: ✅ SET
  • Zoom User ID: ✅ SET
```

If you see `❌ NOT SET`, specialist hasn't authorized yet.

---

## 📊 Complete Booking Flow (Correct Flow)

```
1. Customer Books Appointment
         ↓
2. Backend Checks: Is Specialist Authorized? 
         ↓
   ✅ YES → Continue
   ❌ NO → Return Error: "Specialist must authorize Zoom"
         ↓
3. Create Zoom Meeting
         ↓
   ✅ Success → Zoom meeting ID received
   ❌ Failed → Return Error: "Zoom meeting creation failed"
         ↓
4. Update Appointment Slot
   • Set status = "booked"
   • Store Zoom meeting ID
   • Store Zoom join URL
         ↓
5. Send Emails
   ✅ Email to Customer: "Join Zoom Meeting" button
   ✅ Email to Specialist: "Start Zoom Meeting" button
         ↓
6. Return Success Response
   • Customer sees: "✓ Appointment booked successfully!"
   • Customer checks email for Zoom link
```

---

## ⚠️ Common Issues & Fixes

### Issue 1: "Specialist has not authorized Zoom"
**Cause:** Specialist hasn't clicked "Connect Zoom" in Settings  
**Fix:** Follow "Specialist Must Authorize Zoom" section above

### Issue 2: "Email service not configured"
**Cause:** GMAIL_USER or GMAIL_PASSWORD not in `.env`  
**Fix:** Follow "Email not configured" section above  
**Verify:** Run `node diagnostic.js`

### Issue 3: Emails sent but Zoom link is empty
**Cause:** Zoom meeting creation partially failed  
**Fix:** Check that specialist's Zoom account is active (not expired/banned)

### Issue 4: Booking succeeds but no email received
**Cause:** Gmail spam filter or wrong email address  
**Fix:**
- Check spam/junk folder
- Verify customer email is correct in system
- Check `backend/.env` GMAIL_USER is correct

### Issue 5: "Permission denied" when creating meeting
**Cause:** Specialist's Zoom OAuth scope is missing  
**Fix:** 
1. Go to Settings → Zoom Integration
2. Click "Disconnect Zoom"
3. Click "Re-authorize" 
4. Approve all permissions requested

---

## 🔍 Debug Steps

### Step 1: Check Backend Logs
When booking, look for logs like:
```
✅ Checking Zoom authorization for specialist...
✅ Using specialist's Zoom token for user ID: [id]
✅ Zoom meeting created: [meeting-id]
✅ Sending Zoom meeting invitations...
✓ Participant email sent to customer@example.com
✓ Host email sent to specialist@example.com
✅ Zoom meeting invitations sent successfully
```

### Step 2: If You See Errors
```
❌ No Zoom OAuth token found for specialist
→ Specialist needs to authorize Zoom

❌ Zoom access token not available
→ Specialist's token might be expired/revoked

❌ Error sending meeting invitation
→ Email service not configured or email sending failed
```

### Step 3: Verify Specialist Authorization
1. Login as specialist
2. Go to Settings → Zoom Integration
3. Look for green status: "✓ Zoom Account Connected"
4. If not connected, click "Connect Zoom Account"

---

## 🚀 Verification Checklist

- [ ] Specialist has authorized Zoom (Settings → Zoom Integration → Green status)
- [ ] Backend `.env` has `GMAIL_USER` and `GMAIL_PASSWORD`
- [ ] Gmail App Password is being used (not regular password)
- [ ] Email service verified (run `node diagnostic.js`)
- [ ] Test appointment booked and Zoom meeting created
- [ ] Test customer and specialist both received emails
- [ ] Zoom join URLs are clickable and work

---

## 📞 Quick Reference

**Specialist Authorizing Zoom:**
- Settings → User Profile (tab)
- Scroll to Zoom Integration
- Click "Connect Zoom Account"
- Authorize when redirected to Zoom
- See green status

**Customer Booking Appointment:**
- Browse specialists
- Select specialist
- Click "Book Appointment" on available slot
- Should see: "✓ Appointment booked! Check email for Zoom link"
- Email should arrive within seconds with Zoom meeting link

**Emails Are Not Sent When:**
- Specialist hasn't authorized Zoom
- Email service not configured
- Both customer and specialist email addresses are invalid

---

## 🛠️ Configuration Files

### `.env` (Backend)
```bash
# MongoDB
MONGO_URI=mongodb://localhost:27017/specialistdb

# Email (Gmail)
GMAIL_USER=your-email@gmail.com
GMAIL_PASSWORD=your-app-password
EMAIL_SERVICE=gmail

# Zoom OAuth
ZOOM_CLIENT_ID=your_zoom_client_id
ZOOM_CLIENT_SECRET=your_zoom_client_secret
ZOOM_REDIRECT_URI=http://localhost:5001/api/zoom/oauth/user-callback

# Server
NODE_ENV=development
PORT=5001
```

---

## 📝 Summary

**For Zoom meetings + emails to work:**

1. ✅ **Specialist authorizes Zoom** in Settings (REQUIRED)
2. ✅ **Email configured** with Gmail credentials (REQUIRED)
3. ✅ **Gmail App Password used** not regular password (REQUIRED)
4. ✅ **Zoom OAuth credentials** in `.env` (REQUIRED)

**Without specialist Zoom authorization = No Zoom meetings = No emails sent**

---

**Last Updated:** January 30, 2026  
**Status:** Troubleshooting Guide Complete

