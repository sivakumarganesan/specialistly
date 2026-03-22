# Email System Verification Checklist

## Pre-Deployment Checklist

Before setting the credentials in Railway:

- [ ] `backend/credentials.json` exists locally
- [ ] `backend/services/gmailApiService.js` exists and is properly formatted
- [ ] `backend/deploy-credentials.ps1` or `backend/deploy-credentials.sh` exists
- [ ] `.env.example` includes `GOOGLE_CREDENTIALS_BASE64` instructions

## Deployment Steps

1. **Generate Base64 Credentials**
   ```powershell
   cd backend
   .\deploy-credentials.ps1
   ```
   Expected output should show the base64-encoded value and copy it to clipboard.

2. **Set Environment Variable in Railway**
   - Open Railway Dashboard: https://railway.app
   - Select your Specialistly project
   - Click on the Backend service
   - Go to **Variables** tab
   - Click **Add Variable**
   - Enter:
     - Name: `GOOGLE_CREDENTIALS_BASE64`
     - Value: Paste the base64 value from step 1
   - Click Save
   - **Wait for automatic redeploy** (usually 30-60 seconds)

3. **Verify Deployment Success**
   - Check Railway logs for this message:
   ```
   ✅ Gmail API service initialized successfully
   ```
   - If you see an error instead, scroll down to troubleshooting

## Testing Email Delivery

### Test 1: Create a Webinar Booking

1. Go to https://www.specialistly.com (or your production domain)
2. Book a webinar for a service with email notifications enabled
3. Check Railway logs for:
   ```
   ✓ Email sent via Gmail API to: [customer-email]
   ```

### Test 2: Verify Customer Receives Email

- Customer should receive a confirmation email with:
  - Zoom meeting link
  - Meeting date/time
  - Specialist name and bio
  - Cancellation instructions

- Subject should be similar to:
  ```
  Your Meeting Confirmation: [Service Name] with [Specialist Name]
  ```

### Test 3: Check Specialist Notification

- Specialist should also receive a notification with booking details
- Specialist notification usually goes to specialist's email address

## Railway Logs - What to Look For

### Success Messages

```
✅ Gmail API service initialized successfully
   Method: Service Account (no SMTP timeout issues)
   Scope: Gmail Send API
✓ Email sent via Gmail API to: customer@example.com
✓ Email sent via Gmail API to: specialist@example.com
```

### Error Messages and Solutions

| Error | Solution |
|-------|----------|
| `❌ Google credentials file not found` | Set `GOOGLE_CREDENTIALS_BASE64` environment variable in Railway |
| `❌ Invalid GOOGLE_CREDENTIALS_BASE64 format` | Re-run deploy script, ensure no extra spaces when pasting |
| `Error: Invalid client (requires subdomain)` | Check credentials.json is valid Google service account JSON |
| `Gmail API service not initialized` | Check Railway logs, wait for full deployment to complete |

## Manual Testing (Local Development)

If you want to test locally before Railway deployment:

```bash
cd backend
node -e "import('./services/gmailApiService.js').then(m => console.log(m.verifyGmailAPI?.()))"
```

Or in your backend console:

```javascript
const gmailApiService = require('./services/gmailApiService.js');
gmailApiService.verifyGmailAPI().then(result => console.log(result));
```

## Rollback Instructions

If Gmail API isn't working:

1. Go to Railway Dashboard
2. Find the `GOOGLE_CREDENTIALS_BASE64` variable
3. Click the **Delete** button
4. Railway will redeploy without the variable
5. Check logs for `SMTP` email attempts (fallback to SMTP if available)

## FAQ

**Q: How long does Railway take to redeploy?**
A: Usually 30-60 seconds after you save a variable.

**Q: Do I need to manually restart the backend?**
A: No, Railway automatically redeploys when you add/modify environment variables.

**Q: How can I test if the credentials are loaded?**
A: Check Railway logs after deployment. You should see:
```
✅ Gmail API service initialized successfully
```

**Q: What if I accidentally set the wrong base64 value?**
A: Simply go back to Railway Variables, edit the value, and paste the correct one. Railway will redeploy.

**Q: Can I test from a different machine?**
A: Once deployed to Railway, it works for all machines. You just need to test by booking a webinar.

## Contact Points for Emails

These email functions now use Gmail API:

1. **Webinar Booking Confirmation** - `zoomService.sendMeetingInvitation()`
2. **Recording Available Notification** - `zoomService.sendRecordingLink()`
3. **Meeting Reminder** - `zoomService.sendMeetingReminder()`
4. **Google Meet Booking** - `googleMeetService.sendBookingInviteEmail()`
5. **Google Meet Reminder** - `googleMeetService.sendReminderEmail()`
6. **Recording Notification** - `googleMeetService.sendRecordingEmail()`

All of these will send via Gmail API once credentials are deployed.

## Success Indicators

✅ System is working correctly if:
- Railway logs show no Gmail API errors
- Customer receives confirmation email ~1 second after booking
- Email includes correct Zoom/Google Meet link
- Email is not in spam folder
- Specialist receives notification simultaneously

## Next Steps After Verification

1. Test multiple bookings to ensure consistency
2. Monitor Railway logs for errors during peak usage
3. Set up alerts for mail delivery failures (optional)
4. Update team that email system is fully operational

---

**Last Updated:** After Gmail API implementation (Commit 79abc91)  
**Email System:** Gmail API (no SMTP timeouts)  
**Production Status:** Ready for credentials deployment
