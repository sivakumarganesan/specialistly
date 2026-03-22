# Zoom Re-Authorization - Quick Implementation Guide

## What Was Added

### 1. Email Notification System
**File:** `backend/services/zoomService.js`

New function that sends automated emails to specialists when Zoom authorization fails:

```javascript
export const sendZoomReAuthNotification = async (
  specialistEmail, 
  specialistName, 
  customerName, 
  serviceTitle
) => {
  // Sends professional HTML email with:
  // - Explanation of what happened
  // - Step-by-step instructions
  // - Direct link to re-authorize
  // - Customer and service details
}
```

### 2. Enhanced Booking Error Handling
**File:** `backend/controllers/appointmentController.js`

Updated `bookSlot()` function to:
- Check for Zoom token validity upfront
- Send re-auth notification when Zoom fails
- Return `requiresReAuth: true` flag for frontend

Three error scenarios now trigger notifications:
1. No Zoom token found
2. Zoom token incomplete/invalid
3. Zoom meeting creation fails

### 3. Customer-Friendly Modal Dialog
**File:** `src/app/components/SpecialistProfile.tsx`

Added modal that displays when booking fails due to Zoom:
- Shows clear explanation
- Provides step-by-step instructions
- Confirms specialist was notified
- Can be dismissed with "Got it, Thanks" button

### 4. Updated Error Handling
**File:** `src/app/components/SpecialistProfile.tsx`

Enhanced both booking functions:
- `handleBookAppointment()` - For appointment slots
- `handleConfirmServiceBooking()` - For services

Now shows modal instead of generic alert on Zoom errors.

## Files Modified

| File | Changes |
|------|---------|
| `backend/services/zoomService.js` | Added `sendZoomReAuthNotification()` function |
| `backend/controllers/appointmentController.js` | Enhanced error handling, added email notifications |
| `src/app/components/SpecialistProfile.tsx` | Added modal state, updated error handlers, added modal component |

## How It Works in 3 Steps

### Step 1: Booking Attempt
Customer tries to book appointment/service with specialist

### Step 2: System Detects Issue
If specialist's Zoom token is invalid:
1. Appointment API detects the issue
2. Sends email to specialist with re-auth link
3. Returns error response with `requiresReAuth: true`

### Step 3: User Sees Modal
Frontend displays helpful modal:
1. Shows what happened
2. Provides step-by-step instructions
3. Confirms specialist was notified

## Key Features

✅ **Automatic Email Notifications**
- Sent immediately when Zoom fails
- Professional HTML format
- Includes customer name and service title
- Contains direct action link

✅ **Modal Dialog for Customers**
- Clear and helpful
- Guides customer on next steps
- Reduces confusion and support tickets

✅ **Easy Re-Authorization**
- Specialist can click link in email
- OR navigate to Settings → Zoom Integration → "Re-authorize"
- Quick Zoom OAuth flow
- Token immediately usable

✅ **Error Response Flag**
- API returns `requiresReAuth: true`
- Frontend knows to show modal
- Not triggered by generic errors

## Testing Checklist

- [ ] Zoom token is valid - booking works normally
- [ ] No Zoom token - email sent, modal shown
- [ ] Zoom token expired - email sent, modal shown
- [ ] Modal appears on booking error
- [ ] Modal can be dismissed
- [ ] Specialist email is readable
- [ ] Email link works (if configured)
- [ ] Re-authorize button in Settings works

## Configuration Required

Ensure these environment variables are set:

```bash
GMAIL_USER=your-email@gmail.com
GMAIL_PASSWORD=your-app-password
EMAIL_SERVICE=gmail
FRONTEND_URL=http://localhost:5173  # For email links
```

## Email Content

The system sends professional emails with:
- Clear subject: "⚠️ Action Required: Re-authorize Your Zoom Account"
- HTML formatted body
- Customer and service details
- Specific instructions
- Direct re-auth link
- Professional styling

## API Response Format

When Zoom authorization fails:

```json
{
  "success": false,
  "message": "❌ Failed to create Zoom meeting: [error details]...",
  "requiresReAuth": true
}
```

Frontend checks for `requiresReAuth` flag to determine modal vs alert.

## Benefits

| Stakeholder | Benefit |
|-------------|---------|
| **Customers** | Clear explanation, helpful guidance, confidence |
| **Specialists** | Immediate notification, easy fix, quick re-auth |
| **Support Team** | Fewer questions, self-service resolution, better data |
| **System** | Fewer lost bookings, better error tracking |

## Component Architecture

```
SpecialistProfile
├── State
│   ├── showZoomReAuthModal
│   └── zoomReAuthMessage
├── Handlers
│   ├── handleBookAppointment()
│   └── handleConfirmServiceBooking()
└── Render
    └── ZoomReAuthModal (when showZoomReAuthModal = true)
```

## Email Flow

```
Customer Books
    ↓
Booking API
    ↓
Check Zoom Token
    ↓
Token Invalid?
    ├─ YES → Send Email + Return Error
    └─ NO → Create Zoom Meeting
    
Email Sent to Specialist:
    ↓
Specialist Sees Email
    ↓
Clicks Re-auth Link
    ↓
Completes Zoom OAuth
    ↓
Token Updated
    ↓
Customer Can Book ✓
```

## Code Examples

### Triggering Modal (Frontend)

```tsx
if (error.response?.data?.requiresReAuth) {
  setZoomReAuthMessage(
    error.response?.data?.message || 
    "The specialist needs to re-authorize their Zoom account."
  );
  setShowZoomReAuthModal(true);
}
```

### Sending Notification (Backend)

```javascript
try {
  await zoomService.sendZoomReAuthNotification(
    specialistEmail,
    specialistName,
    customerName,
    serviceTitle
  );
} catch (emailError) {
  console.error('Failed to send notification:', emailError);
}
```

## Logging & Debugging

The system logs all key events:

```
✓ Email service verified
✓ Zoom re-auth notification sent to specialist@example.com
✅ Response includes requiresReAuth flag
❌ Failed to send re-auth notification: [error]
```

Check logs to verify:
- Email was sent successfully
- Error responses include `requiresReAuth` flag
- Modal appears on frontend

## Future Enhancements

Planned improvements:
1. Proactive token expiry warnings
2. Dashboard re-auth button
3. SMS notifications
4. Automatic token refresh
5. Zoom status indicator on specialist profile

## Support References

- Full workflow guide: [ZOOM_REAUTH_WORKFLOW.md](./ZOOM_REAUTH_WORKFLOW.md)
- Zoom OAuth docs: Settings → Zoom Integration
- Email configuration: .env file setup
- API testing: Use appointment booking endpoints
