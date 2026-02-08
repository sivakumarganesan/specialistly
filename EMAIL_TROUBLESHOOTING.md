# Google Meet Invite Not Sending - Troubleshooting Guide

## Problem
When appointments are created, Google Meet invites are not being sent to customers and specialists.

## Root Cause
The Gmail credentials in `.env` file are invalid or incorrect. Backend shows this error during startup:

```
⚠️  Email service verification failed: Invalid login: 535-5.7.8 Username 
and Password not accepted.
```

## Solution

### Step 1: Understand Your Gmail Setup

First, check what type of Gmail account you have:

**Do you have 2-Factor Authentication (2FA) enabled?**
- If YES → Use Option A (App Password)
- If NO → Use Option B (Less Secure Apps) or Option A

### Step 2: Fix Gmail Authentication

**Option A: Use Gmail App Password (Recommended)**

1. Go to: https://myaccount.google.com/apppasswords
2. You may need to enable 2FA first if not already enabled:
   - Go to https://myaccount.google.com/security
   - Click "2-Step Verification"
   - Follow the setup
3. After 2FA is enabled, go back to apppasswords
4. Select "Mail" and "Windows Computer"
5. Google generates a 16-character password (looks like: `xxxx xxxx xxxx xxxx`)
6. Copy this password
7. Update `.env`:
   ```
   GMAIL_USER=your-email@gmail.com
   GMAIL_PASSWORD=xxxx xxxx xxxx xxxx
   ```
   (Note: Include spaces in the password)

**Option B: Enable "Less Secure Apps" (For accounts without 2FA)**

1. Go to: https://myaccount.google.com/lesssecureapps
2. Turn ON "Allow less secure app access"
3. Use your regular Gmail password in `.env`:
   ```
   GMAIL_USER=your-email@gmail.com
   GMAIL_PASSWORD=your-actual-gmail-password
   ```

### Step 3: Verify Configuration

After updating `.env`, stop the backend and restart it:

```bash
# Stop all Node processes
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force

# Wait 2 seconds
Start-Sleep -Seconds 2

# Restart backend
cd C:\Work\specialistly\backend
node server.js
```

**You should see:**
```
✓ Email service verified successfully (your-email@gmail.com)
```

Instead of:
```
⚠️  Email service verification failed: Invalid login
```

### Step 4: Test Appointment Booking with Emails

1. Open http://localhost:5173 in your browser
2. Log in or sign up as a customer
3. Go to Marketplace section
4. Find a specialist and click "View Profile"
5. Click "Book Appointment" on an available slot
6. Complete the booking

**Check backend terminal logs for email sending:**
```
📧 Calling sendBookingInviteEmail with:
  customerEmail: customer@example.com
  specialistEmail: specialist@example.com
  googleMeetLink: https://meet.google.com/xxx-xxxx-xxx

📧 Attempting to send booking invite email...
Email service configured: YES
GMAIL_USER: SET
GMAIL_PASSWORD: SET

📧 Sending email to customer: customer@example.com
✓ Customer email sent to customer@example.com

📧 Sending email to specialist: specialist@example.com
✓ Specialist email sent to specialist@example.com

✅ Booking confirmation emails sent successfully
```

### Step 5: Verify Emails in Inbox

**Customer should receive:**
- Subject: "✓ Booking Confirmed: [Service Name]"
- Contains: Google Meet link, date/time, specialist name

**Specialist should receive:**
- Subject: "📞 New Booking: [Customer Name] - [Service Name]"
- Contains: Customer email, Google Meet link, date/time

## Workaround: Continue Without Email

If you don't have valid Gmail credentials and want to test the system without emails:

1. Keep the invalid credentials in `.env` (backend will show warning but continue)
2. Appointments will still be created successfully
3. Google Meet links will still be generated
4. Only emails won't be sent
5. The appointment will show:

```
{
  "success": true,
  "message": "Slot booked successfully with Google Meet created",
  "data": {
    "googleMeetLink": "https://meet.google.com/xxx-xxxx-xxx",
    "status": "booked"
  }
}
```

## Email Configuration Reference

All email functionality is handled by: [backend/services/googleMeetService.js](backend/services/googleMeetService.js)

**Key functions:**
- `sendBookingInviteEmail()` - Sent when appointment is booked
- `sendReminderEmail()` - Sent 24 hours before appointment
- `sendRecordingEmail()` - Sent after meeting with recording link

**Required environment variables:**
```env
GMAIL_USER=your-email@gmail.com
GMAIL_PASSWORD=app-password-or-regular-password
```

If either variable is missing, email service will show warnings but won't block the application.

## Debugging Email Issues

### Test Email Configuration

Run the email test script:
```bash
cd backend
node test-email.js
```

Output indicates status:
```
✅ Email transporter verified successfully!
✅ Test email sent successfully!
```

or

```
❌ Email test failed: Invalid login
Troubleshooting:
1. Verify GMAIL_USER and GMAIL_PASSWORD in .env file
2. Enable "Less secure app access" or use App Password
```

## Common Email Problems

| Problem | Error Message | Solution |
|---------|---------------|----------|
| Wrong password | "Invalid login: 535-5.7.8" | Use App Password or correct Gmail password |
| 2FA enabled | "Invalid login" | Use App Password from https://myaccount.google.com/apppasswords |
| Less Secure Apps disabled | "Less secure app access is turned off" | Enable at https://myaccount.google.com/lesssecureapps |
| Missing credentials | "Email service not configured" | Add GMAIL_USER and GMAIL_PASSWORD to .env |
| Emails go to spam | Emails arrive in spam folder | Add specialistlyapp@gmail.com to your contacts |

## Related Files

- **Configuration:** [backend/.env](backend/.env)
- **Email Service:** [backend/services/googleMeetService.js](backend/services/googleMeetService.js)
- **Appointment Controller:** [backend/controllers/appointmentController.js](backend/controllers/appointmentController.js)
- **Test Script:** [backend/test-email.js](backend/test-email.js)

