# Complete End-to-End Testing Guide

## ✅ Current Status

### Verification Results (6/7 Checks Passed)

| Component | Status | Details |
|-----------|--------|---------|
| **Environment** | ✅ | All config variables set |
| **Email Service** | ✅ | Gmail SMTP connected and working |
| **Specialist User** | ✅ | sivakumarganeshm@gmail.com created |
| **Customer User** | ✅ | sinduja.vel@gmail.com created |
| **Appointment Slots** | ✅ | 14 slots created (next 7 days) |
| **Services** | ✅ | 1 service created (Technology Consulting) |
| **Zoom OAuth Token** | ⏳ | **Waiting for specialist authorization** |

---

## 🎯 Step 1: Specialist Authorizes Zoom

This is the CRITICAL step that must be completed first.

### Instructions for Specialist (sivakumarganeshm@gmail.com)

#### 1. Login to the Application
- Go to: http://localhost:5174 (Frontend) or your production URL
- Email: **sivakumarganeshm@gmail.com**
- Password: **password123**
- Click **Login**

#### 2. Navigate to Settings
- After login, click on your **Profile** or **Settings** icon (usually top-right)
- Look for **Settings** or **User Profile** section
- Scroll down to find **"Zoom Integration"**

#### 3. Connect Zoom Account
- You should see a button: **"Connect Zoom Account"** or **"Connect Zoom"**
- Click this button
- You will be redirected to **Zoom's OAuth authorization page**
- **Important**: Make sure you're logged into your Zoom account (sivakumarganeshm@gmail.com)
- Click **"Allow"** or **"Authorize"** on Zoom's page
- You will be redirected back to the application

#### 4. Verify Connection
- You should see a **green checkmark** or **"✓ Zoom Account Connected"** message
- The status should show as **Active**
- If you see an error, try again or check the troubleshooting section below

### Troubleshooting Authorization Issues

**Issue**: Redirected to login page after authorization
- **Fix**: Make sure you're logged in to the correct Zoom account in your browser
- Try logging out of Zoom first, then clicking "Connect Zoom" again

**Issue**: "Invalid redirect URI" error
- **Fix**: Check that ZOOM_REDIRECT_URI in backend/.env is: `http://localhost:5001/api/zoom/oauth/user-callback`
- Restart backend server after updating

**Issue**: "Authorization failed" message
- **Fix**: Check backend logs for OAuth errors
- Verify ZOOM_USER_MANAGED_CLIENT_ID and ZOOM_USER_MANAGED_CLIENT_SECRET are correct in .env

---

## 🎯 Step 2: Customer Books an Appointment

Once specialist has authorized Zoom, the customer can book.

### Instructions for Customer (sinduja.vel@gmail.com)

#### 1. Login to the Application
- Go to: http://localhost:5174
- Email: **sinduja.vel@gmail.com**
- Password: **password123**
- Click **Login**

#### 2. Find the Specialist's Offerings
- Navigate to **Marketplace** or **Services** section
- Search for specialist: **Sivakumar Ganeshm**
- Or click on their profile if you see it listed

#### 3. View Available Slots or Services
- Click on specialist's name or profile
- You should see:
  - **Services** tab: Shows "Technology Consulting Session" ($100, 60 min)
  - **Appointments** tab: Shows available time slots

#### 4. Book an Appointment
- Choose one of the available time slots (any slot with status "Available")
- Click **"Book Appointment"** or **"Book Slot"**
- You should see loading state (might take 3-5 seconds)

#### 5. Expected Success Message
You should see:
```
✓ Appointment booked successfully!
Check your email for Zoom meeting link.
```

If you see an error instead:
- Note the exact error message
- Check troubleshooting section below

---

## 🎯 Step 3: Verify Emails Received

After successful booking, check for emails within 2-3 minutes.

### Email 1: Customer's Email (sinduja.vel@gmail.com)

**From**: specialistlyapp@gmail.com  
**Subject**: Should contain "Zoom Meeting Invitation" or "Appointment Confirmed"

**Email content should include**:
- Your name: Sinduja Vel
- Specialist name: Sivakumar Ganeshm
- Meeting date and time (matches booking)
- Meeting topic/title
- **"Join Zoom Meeting"** button or link
- Zoom Meeting ID
- Join URL: Should look like `https://zoom.us/wc/join/[meeting_id]`

**Action**: Click the "Join Zoom Meeting" button to test it works

---

### Email 2: Specialist's Email (sivakumarganeshm@gmail.com)

**From**: specialistlyapp@gmail.com  
**Subject**: Should contain "Your Zoom Meeting" or "New Booking"

**Email content should include**:
- Customer name: Sinduja Vel
- Appointment details: Date, time, service/appointment type
- **"Start Zoom Meeting"** button or link
- Zoom Meeting ID
- Start URL: Should look like `https://zoom.us/wc/join/[meeting_id]?pwd=[password]`
- Customer contact info (email)

**Action**: Click the "Start Zoom Meeting" button to test hosting

---

### Troubleshooting Missing Emails

**Issue**: No email received after 5 minutes
1. **Check spam/junk folder** in Gmail
2. **Verify GMAIL_USER is correct** in backend/.env (should be: specialistlyapp@gmail.com)
3. **Verify GMAIL_PASSWORD is correct** in backend/.env
4. **Check backend logs** for email errors:
   - Stop backend: `Ctrl+C`
   - Run: `cd C:\Work\specialistly\backend && node server.js`
   - Look for email-related errors
5. **Test email service**: Run `node diagnostic.js` in backend folder

**Issue**: Email received but links don't work
1. Check that Zoom meeting was actually created
2. Copy the Zoom Meeting ID from email
3. Go to: https://zoom.us and search for that meeting ID
4. If meeting doesn't exist, check backend logs for Zoom API errors

**Issue**: Email links go to wrong URL
1. Check that ZOOM_REDIRECT_URI is correct in .env
2. Check that meeting creation returned correct URLs
3. Verify URLs contain valid Zoom meeting IDs

---

## 🎯 Step 4: Verify Zoom Meeting Created

Check that the meeting appears in specialist's Zoom calendar and can be joined.

### Check in Zoom Calendar

#### 1. Login to Zoom
- Go to: https://zoom.us
- Login with: **sivakumarganeshm@gmail.com**
- Your password (the one registered with Zoom, not the app password)

#### 2. Navigate to Meetings/Calendar
- Look for **"Meetings"** or **"Upcoming"** section
- Or go to: https://zoom.us/meeting/upcoming

#### 3. Find the New Meeting
- You should see a meeting titled something like:
  - **"[Service Title] - [Customer Name]"**
  - Example: **"Technology Consulting Session - Sinduja Vel"**
- Date and time should match the booked appointment
- Status should show: **"Upcoming"** or **"Not started"**

#### 4. Verify Meeting Details
Click on the meeting to see details:
- ✅ **Date**: Matches booking date
- ✅ **Time**: Matches booking time (in your timezone)
- ✅ **Participants**: Should show customer email
- ✅ **Recording**: Should be enabled
- ✅ **Waiting Room**: Should be enabled
- ✅ **Join URL**: Should match the URL in your email

---

## 🎯 Step 5: Join Meeting from Both Sides

Test that both customer and specialist can join via the email links.

### Customer Joins as Participant

#### 1. Open Customer's Email
- Check sinduja.vel@gmail.com inbox
- Find the "Zoom Meeting Invitation" email
- Click the **"Join Zoom Meeting"** button or link

#### 2. Expected Behavior
- Zoom should open (or redirect to Zoom web app)
- You should enter the meeting as a participant
- Show "Waiting for host to start meeting" (specialist hasn't started yet)

---

### Specialist Joins as Host

#### 1. Open Specialist's Email
- Check sivakumarganeshm@gmail.com inbox
- Find the meeting email
- Click the **"Start Zoom Meeting"** button or link

#### 2. Expected Behavior
- Zoom should open with you as **HOST**
- You should see participant (customer) waiting in waiting room
- You can click **"Admit"** to let them in

#### 3. Meeting Started
- Both should be visible in the call
- You can see each other's video
- You can hear each other's audio

---

## 📋 Complete Testing Checklist

### Before Starting (Prerequisites)
- [ ] Specialist account created: sivakumarganeshm@gmail.com
- [ ] Customer account created: sinduja.vel@gmail.com
- [ ] Appointment slots created: 14 slots available
- [ ] Service created: Technology Consulting Session ($100)
- [ ] Backend running: `node server.js` in backend folder
- [ ] Frontend running: `npm run dev` or already built

### Specialist Zoom Authorization
- [ ] Specialist logs in to app
- [ ] Specialist navigates to Settings → Zoom Integration
- [ ] Specialist clicks "Connect Zoom Account"
- [ ] Specialist authorizes on Zoom's OAuth page
- [ ] Status shows green checkmark: "✓ Zoom Connected"
- [ ] Can see Zoom user ID in settings (optional)

### Customer Booking
- [ ] Customer logs in to app
- [ ] Customer finds specialist in marketplace
- [ ] Customer views available appointment slots
- [ ] Customer clicks "Book Appointment"
- [ ] No errors appear
- [ ] Success message shows: "✓ Appointment booked!"

### Email Verification
- [ ] Customer receives email within 3 minutes
- [ ] Email from specialistlyapp@gmail.com
- [ ] Email has "Join Zoom Meeting" button
- [ ] Specialist receives email within 3 minutes
- [ ] Email has "Start Zoom Meeting" button
- [ ] Both emails have correct date/time
- [ ] Both emails have Zoom meeting ID

### Zoom Calendar Verification
- [ ] Specialist logs into zoom.us
- [ ] New meeting appears in Upcoming Meetings
- [ ] Meeting title matches appointment
- [ ] Meeting date/time correct
- [ ] Customer email listed as participant

### Join Meeting Test
- [ ] Customer can click email link and join
- [ ] Customer sees "Waiting for host"
- [ ] Specialist can click email link and start
- [ ] Specialist sees customer in waiting room
- [ ] Specialist can admit customer
- [ ] Both can see/hear each other

---

## 🔍 Diagnostic Commands

### Verify Setup in Database
```bash
# Check specialist user
db.users.findOne({ email: "sivakumarganeshm@gmail.com" })

# Check customer user
db.users.findOne({ email: "sinduja.vel@gmail.com" })

# Check appointment slots
db.appointmentslots.find({}).limit(5)

# Check specialist's Zoom token (after authorization)
db.useroauthtokens.findOne({ userId: ObjectId("[specialist_id]") })
```

### Run Verification Script
```bash
cd C:\Work\specialistly\backend
node verify-workflow.js
```

Expected output after specialist authorization:
```
✅ Environment Configuration
✅ Email Service
✅ Specialist Authorization  <-- Should change from ❌ to ✅
✅ Appointment Slots
✅ Services
✅ Customer User
✅ Workflow Components

Results: 7/7 checks passed ✓
```

---

## 🚨 Common Issues and Solutions

### Issue: Booking fails with "Specialist has not authorized Zoom"
**Cause**: Specialist hasn't completed OAuth authorization  
**Solution**: 
1. Specialist must go to Settings → Zoom Integration
2. Click "Connect Zoom Account"
3. Complete Zoom authorization
4. Verify green status appears

### Issue: Emails not received
**Cause**: Email service not configured or booking failed  
**Solution**:
1. Check backend logs for errors
2. Verify GMAIL_USER and GMAIL_PASSWORD in .env
3. Make sure Zoom meeting creation succeeded
4. Wait 3-5 minutes (email can be slow)
5. Check spam folder

### Issue: Zoom meeting doesn't appear in calendar
**Cause**: Meeting creation failed despite success message  
**Solution**:
1. Check backend logs for Zoom API errors
2. Verify Zoom access token is valid
3. Try booking another appointment
4. Refresh Zoom calendar (F5)

### Issue: Can't join meeting from email link
**Cause**: Invalid or expired join URL  
**Solution**:
1. Get Zoom meeting ID from email
2. Go to zoom.us/signin and search for meeting ID
3. Join from Zoom directly instead of email link
4. Check that meeting hasn't ended

---

## 📞 Support Information

**Test Credentials**:
- Specialist: sivakumarganeshm@gmail.com / password123
- Customer: sinduja.vel@gmail.com / password123

**Backend URL**: http://localhost:5001  
**Frontend URL**: http://localhost:5174

**Key APIs for Testing**:
- Verify workflow: `node verify-workflow.js`
- Diagnose system: `node diagnostic.js`
- Check email config: Look at backend/.env file

**Logs to Check**:
- Backend console output (when running `node server.js`)
- Browser console (F12 in Chrome/Firefox)
- Gmail account (check both inbox and sent folders)
- Zoom calendar (zoom.us/meeting/upcoming)

---

## ✅ Success Indicators

When everything is working correctly, you should see:

1. **Frontend**: "✓ Appointment booked successfully!"
2. **Specialist Email**: "Start Zoom Meeting" button works
3. **Customer Email**: "Join Zoom Meeting" button works
4. **Zoom Calendar**: Meeting appears with correct title and time
5. **Zoom Meeting**: Both can see and hear each other

**Congratulations!** The end-to-end workflow is complete! 🎉

---

## 📊 Workflow Overview

```
STEP 1: Specialist Authorization
    ↓
STEP 2: Customer Books Appointment
    ↓
STEP 3: System Creates Zoom Meeting (via API)
    ↓
STEP 4: Email Sent to Specialist (with Start URL)
    ↓
STEP 5: Email Sent to Customer (with Join URL)
    ↓
STEP 6: Meeting Appears in Zoom Calendar
    ↓
STEP 7: Both Can Join via Email Links
    ↓
✅ END-TO-END WORKFLOW COMPLETE
```

---

**Created**: January 30, 2026  
**Status**: Ready for Testing
