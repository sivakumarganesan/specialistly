# ⚡ QUICK FIX: Zoom Emails Not Sending

## 🎯 The Issue
Customer can't book → No Zoom meetings created → No emails sent

## ❌ Root Cause
Specialist's Zoom token is "pending" (not valid)

## ✅ The Fix (3 Steps)

### 1️⃣ Verify Zoom App (5 min)
Go to: https://marketplace.zoom.us/develop/apps
- Edit your app
- Check Redirect URI = `http://localhost:5001/api/zoom/oauth/user-callback` (exactly!)
- Check Scopes: ✓ `meeting:update:meeting`, ✓ `user:read:user`
- Save changes

### 2️⃣ Specialist Authorizes (5 min)
1. Login to app as: `sivakumarganeshm@gmail.com`
2. Settings → Zoom Integration
3. Click "Connect Zoom Account"
4. Complete Zoom authorization (click "Allow")
5. Wait for success message

### 3️⃣ Verify It Worked (2 min)
Run in terminal:
```bash
cd C:\Work\specialistly\backend
node diagnose-zoom-auth.js
```

Look for:
```
✓ Zoom User ID: [actual ID, NOT "pending"]
✓ Zoom Email: [actual email, NOT "pending"]
✓ Access Token: [stored, NOT "pending"]
```

## 🧪 Then Test
```bash
node test-booking-now.js
```

Should show: ✓ Zoom meeting created

## 📧 Final Check
- Customer books appointment
- Check email: `sinduja.vel@gmail.com`
- Should receive meeting invitation with Zoom link!

## 🎉 Done!
Emails now send automatically with every booking

---

**Stuck?** See: `ZOOM_BOOKING_EMAIL_ISSUE_SOLUTION.md` for detailed troubleshooting
