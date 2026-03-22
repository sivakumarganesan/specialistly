# End-to-End Workflow Verification Guide

## 🎯 Complete Flow Test

### Participants
- **Specialist**: sivakumarganeshm@gmail.com (authorizes Zoom, creates appointments)
- **Customer**: sinduja.vel@gmail.com (books appointments)

### Expected Workflow

```
SPECIALIST SETUP
├─ Login as: sivakumarganeshm@gmail.com
├─ Settings → Zoom Integration → Connect Zoom ✅
├─ Create appointment slots OR services ✅
└─ Ready for bookings

CUSTOMER BOOKING
├─ Login as: sinduja.vel@gmail.com
├─ Browse specialists/services
├─ Click "Book Appointment" or "Book Service"
├─ Booking submitted
└─ System processes...

BACKEND PROCESSING
├─ Check specialist's Zoom token (should find it)
├─ Create Zoom meeting in specialist's account
├─ Get Zoom meeting ID and join URLs
├─ Update appointment/service with meeting details
├─ Send email to specialist with start_url
├─ Send email to customer with join_url
└─ Return success to frontend

RESULTS
├─ Customer sees: "✓ Appointment booked! Check your email"
├─ Specialist's email: "Start Zoom Meeting" button
├─ Customer's email: "Join Zoom Meeting" button
├─ Specialist's Zoom Calendar: New meeting appears
└─ Both can join meeting via links
```

---

## ✅ Step 1: Verify Specialist Setup

### Specialist Authorization Check
1. **Login as sivakumarganeshm@gmail.com**
2. **Go to Settings**
3. **Look for Zoom Integration section**
4. **Should see**: Green status "✓ Zoom Account Connected"

**If NOT connected:**
- Click "Connect Zoom Account"
- Authorize when redirected to Zoom
- Return to Settings
- Verify green status appears

### Specialist Appointment/Service Creation Check
1. **Stay in Settings or go to your dashboard**
2. **Look for "Allotment Slots" or "Services" section**
3. **Verify at least ONE appointment slot or service exists**

**If NOT created yet:**
- Create a test appointment slot:
  - Date: Tomorrow or next available
  - Start Time: 10:00 AM
  - End Time: 11:00 AM
  - Status: Available
- OR create a test service:
  - Title: "Test Consultation"
  - Price: Any amount
  - Duration: 60 minutes

---

## ✅ Step 2: Verify Customer Booking

### Customer Login & Browse
1. **Logout from specialist account (if needed)**
2. **Login as sinduja.vel@gmail.com**
3. **Navigate to Marketplace or Services**
4. **Find sivakumarganeshm@gmail.com's offerings**

### Customer Books Appointment/Service
1. **Click on specialist or service**
2. **Look for available appointment slot OR "Book Service" button**
3. **Click "Book Appointment" or "Book Service"**
4. **Should see loading state**
5. **Expected result**: 
   - ✅ "Appointment booked successfully!"
   - ✅ "Check your email for Zoom meeting link"

**If error message appears:**
- Note the exact error
- Check backend logs for details
- Review troubleshooting section below

---

## ✅ Step 3: Verify Email Sending

### Check Customer's Email (sinduja.vel@gmail.com)
1. **Open Gmail inbox**
2. **Look for email from**: specialistlyapp@gmail.com
3. **Subject should contain**: "Zoom Meeting Invitation" or "Service Booking"
4. **Email should have**:
   - Meeting date and time
   - "Join Zoom Meeting" button (clickable link)
   - Zoom Meeting ID
   - Join URL

### Check Specialist's Email (sivakumarganeshm@gmail.com)
1. **Open Gmail inbox**
2. **Look for email from**: specialistlyapp@gmail.com
3. **Subject should contain**: "Your Zoom Meeting" or "Service Confirmation"
4. **Email should have**:
   - Customer name
   - Meeting date and time
   - "Start Zoom Meeting" button (clickable link)
   - Zoom Meeting ID
   - Start URL (for hosting)

---

## ✅ Step 4: Verify Zoom Meeting Creation

### Check Specialist's Zoom Calendar
1. **Login to Zoom account**: sivakumarganeshm@gmail.com
2. **Go to Zoom Calendar** (usually in dashboard or meetings)
3. **Look for new meeting**
4. **Meeting details should show**:
   - Title: "[Service Title] - [Customer Name]"
   - Date & Time: Matches booking
   - Participants: Customer email should be listed
   - Recording: Enabled
   - Waiting Room: Enabled

### Check Meeting Join Links
1. **From Zoom calendar**: Copy the join link
2. **Should match** the link in specialist's email
3. **Should match** the link sent to customer

---

## 🧪 Testing Checklist

### Phase 1: Specialist Setup ✅
- [ ] Specialist can login to sivakumarganeshm@gmail.com
- [ ] Settings → Zoom Integration shows green status
- [ ] Specialist has at least one appointment slot OR service created
- [ ] Specialist's Zoom account is authorized

### Phase 2: Customer Booking ✅
- [ ] Customer can login to sinduja.vel@gmail.com
- [ ] Customer can view specialist's offerings
- [ ] Customer can click "Book Appointment" or "Book Service"
- [ ] Booking doesn't produce an error
- [ ] Success message appears: "✓ Appointment booked!"

### Phase 3: Email Verification ✅
- [ ] Customer receives email within 2 minutes
- [ ] Email is from specialistlyapp@gmail.com
- [ ] Email contains "Join Zoom Meeting" link
- [ ] Specialist receives email within 2 minutes
- [ ] Specialist's email contains "Start Zoom Meeting" link
- [ ] Both emails show correct meeting date/time

### Phase 4: Zoom Calendar ✅
- [ ] Meeting appears in specialist's Zoom calendar
- [ ] Meeting title is correct: "[Service] - [Customer Name]"
- [ ] Meeting date/time matches booking
- [ ] Zoom join links in calendar match email links

### Phase 5: Join Meeting ✅
- [ ] Customer can click email link and join meeting
- [ ] Specialist can click email link and start meeting
- [ ] Both can see each other in Zoom
- [ ] Meeting recording is enabled

---

## 🔍 Troubleshooting Guide

### Issue: Error during booking

**Possible Causes:**
1. Specialist hasn't authorized Zoom
   - Fix: Settings → Zoom Integration → Connect Zoom Account

2. Appointment slot status is "booked" not "available"
   - Fix: Create new appointment slot with status "available"

3. Specialist ID not passed correctly
   - Fix: Verify customer sees specialist name/profile before booking

**How to Check:**
- Look at browser console (F12 → Console)
- Check error message shown to user
- Check backend logs for exact error

### Issue: Email not received

**Possible Causes:**
1. Email service not configured in backend/.env
   - Fix: Add GMAIL_USER and GMAIL_PASSWORD

2. Wrong email addresses in database
   - Fix: Verify specialist/customer emails are correct

3. Email went to spam folder
   - Fix: Check spam/junk folder in Gmail

**How to Check:**
- Wait 2-3 minutes (email delivery can be slow)
- Check spam folder
- Check if email appears in gmail sent folder on backend account

### Issue: Zoom meeting not in calendar

**Possible Causes:**
1. Zoom meeting creation failed (but customer doesn't see error)
   - Fix: Check backend logs for Zoom API errors

2. Meeting created but not showing in calendar view
   - Fix: Refresh Zoom calendar or wait 1-2 minutes

3. Wrong Zoom account authenticated
   - Fix: Verify specialist is logged in to correct Zoom account

**How to Check:**
- Check specialist's email for Zoom Meeting ID
- Login to Zoom and search for meeting ID
- Check Zoom API logs for errors

---

## 📝 Verification Commands

### Check Database for Booking
```bash
# In MongoDB:
db.appointmentslots.findOne({ status: "booked" })
# Should show:
# - zoomMeetingId: [id]
# - zoomJoinUrl: [url]
# - zoomStartUrl: [url]
# - customerEmail: sinduja.vel@gmail.com
```

### Check OAuth Token in Database
```bash
# In MongoDB:
db.useroauthtokens.findOne({ userId: [specialist_id] })
# Should show:
# - zoomAccessToken: [token]
# - zoomUserId: [id]
# - isActive: true
# - isRevoked: false
```

---

## 📊 Success Criteria

| Step | Criterion | Status |
|------|-----------|--------|
| **1. Setup** | Specialist can authorize Zoom | ✅ DONE |
| **2. Create** | Specialist has appointment/service | ⏳ TO VERIFY |
| **3. Browse** | Customer can view offerings | ⏳ TO VERIFY |
| **4. Book** | Customer books without errors | ⏳ TO VERIFY |
| **5. Email** | Both receive emails with links | ⏳ TO VERIFY |
| **6. Zoom** | Meeting appears in Zoom calendar | ⏳ TO VERIFY |
| **7. Join** | Both can join via links | ⏳ TO VERIFY |

---

## 🚀 Next Steps

1. **Verify Specialist Setup**
   - Confirm Zoom connected
   - Confirm appointment/service exists

2. **Perform Test Booking**
   - Customer books appointment/service
   - Note any errors

3. **Check Emails**
   - Verify both parties receive emails
   - Note any email issues

4. **Check Zoom Calendar**
   - Verify meeting appears
   - Check meeting details

5. **Join Meeting**
   - Test joining from both sides
   - Verify connection works

---

## 📞 Quick Reference

**Specialist**: sivakumarganeshm@gmail.com
- Login to: Settings → Zoom Integration
- Action: Check "✓ Zoom Account Connected"

**Customer**: sinduja.vel@gmail.com
- Login to: Marketplace or Services page
- Action: Book appointment/service
- Expected: Email within 2 minutes

**Emails from**: specialistlyapp@gmail.com
**Zoom Account**: sivakumarganeshm@gmail.com

---

**Test Date**: January 30, 2026
**Status**: Ready for verification

