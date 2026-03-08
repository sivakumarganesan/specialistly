# Quick Reference - End-to-End Testing

## 🚀 Quick Start (5 Minutes)

### 1. Specialist Authorizes Zoom (3 minutes)
```
1. Go to: http://localhost:5174
2. Login: sivakumarganeshm@gmail.com / password123
3. Settings → Zoom Integration → Connect Zoom
4. Authorize on Zoom's page
5. Verify: Green "✓ Zoom Connected" appears
```

### 2. Test Booking (2 minutes)
```
1. Logout and login as: sinduja.vel@gmail.com / password123
2. Find specialist: Sivakumar Ganeshm
3. Click: Book Appointment (from available slots)
4. Should see: "✓ Appointment booked successfully!"
```

### 3. Verify Success (Automatic)
```
✅ Customer gets email with "Join Zoom Meeting" link
✅ Specialist gets email with "Start Zoom Meeting" link
✅ Meeting appears in specialist's Zoom calendar
✅ Both can click links and join meeting
```

---

## 📋 Test Credentials

| Role | Email | Password |
|------|-------|----------|
| Specialist | sivakumarganeshm@gmail.com | password123 |
| Customer | sinduja.vel@gmail.com | password123 |

---

## 🔗 URLs

| Purpose | URL |
|---------|-----|
| Frontend App | http://localhost:5174 |
| Backend API | http://localhost:5001 |
| Zoom Calendar | https://zoom.us/signin |
| Gmail (Emails) | https://mail.google.com |

---

## 📂 What Was Created

| Item | Details |
|------|---------|
| **Specialist** | sivakumarganeshm@gmail.com, Role: Specialist |
| **Customer** | sinduja.vel@gmail.com, Role: Customer |
| **Appointments** | 14 slots (Jan 31 - Feb 6, 10 AM & 2 PM daily) |
| **Service** | Technology Consulting Session ($100, 60 min) |
| **Email** | specialistlyapp@gmail.com (configured & working) |
| **Zoom** | OAuth configured (authorization pending) |

---

## ✅ Verification Status

```
✅ Environment Config    (MONGODB_URI, Zoom credentials, Gmail)
✅ Email Service        (SMTP tested and working)
✅ Specialist User      (Created and ready)
✅ Customer User        (Created and ready)
✅ Appointment Slots    (14 created, all available)
✅ Services            (1 created and active)
⏳ Zoom Authorization  (Pending specialist action)
```

---

## 🧪 Verification Script

Run anytime to check all components:

```bash
cd C:\Work\specialistly\backend
node verify-workflow.js
```

Expected after specialist authorization: **7/7 ✅**

---

## 📧 Email Check

**After booking, check for 2 emails**:

| Email To | From | Subject Pattern |
|----------|------|---|
| Customer (sinduja.vel) | specialistlyapp@gmail.com | Zoom Meeting Invitation |
| Specialist (sivakumar) | specialistlyapp@gmail.com | Your Zoom Meeting |

**Both emails should have**:
- Meeting date & time
- **Clickable "Zoom Meeting" button/link**
- Zoom Meeting ID
- Join or Start URL

---

## 🔗 Zoom Calendar Check

After booking, check specialist's calendar:

1. Go to: https://zoom.us/signin
2. Login with specialist's Zoom account
3. Look for: "Technology Consulting Session - Sinduja Vel"
4. Should match: Date & time of booking

---

## 🎯 Complete Flow

```
Specialist Authorizes Zoom
         ↓
Customer Books Appointment
         ↓
Zoom Meeting Created (automatic)
         ↓
Email Sent (both specialist & customer)
         ↓
Meeting in Zoom Calendar
         ↓
Both Can Join via Email Links
         ↓
✅ END-TO-END WORKFLOW WORKS
```

---

## 🐛 If Something Goes Wrong

| Problem | Solution |
|---------|----------|
| Can't book appointment | Verify specialist authorized Zoom first |
| No emails received | Check spam folder, verify GMAIL config in .env |
| Meeting not in calendar | Refresh page, wait 1-2 mins, verify booking succeeded |
| Can't join meeting | Use Zoom.us calendar instead of email link |

---

## 📊 Expected Results

✅ **Frontend**: "Appointment booked successfully!"  
✅ **Customer Email**: "Join Zoom Meeting" button works  
✅ **Specialist Email**: "Start Zoom Meeting" button works  
✅ **Zoom Calendar**: Meeting shows up  
✅ **Video Call**: Both can see and hear each other  

---

## 📞 Key Files

| File | Purpose |
|------|---------|
| COMPLETE_TESTING_GUIDE.md | Full 7-step guide with troubleshooting |
| WORKFLOW_SETUP_COMPLETE.md | Setup summary & status |
| verify-workflow.js | Check all components |
| backend/.env | Configuration (email, Zoom, DB) |

---

**Status**: ✅ Ready - Just authorize Zoom and test!  
**Date**: January 30, 2026
