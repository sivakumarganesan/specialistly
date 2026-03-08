# Zoom Re-Authorization Workflow

## Overview

This document explains how specialists can easily re-authorize their Zoom account when customers attempt to book appointments and encounter Zoom token expiration issues.

## The Problem

Previously, when a specialist's Zoom OAuth token expired:
- Customers would see a generic error: "Failed to create Zoom meeting"
- No notification was sent to the specialist
- The specialist had to manually discover the issue and navigate to Settings to fix it
- The poor user experience led to lost bookings and customer confusion

## The Solution

We've implemented a **proactive re-authorization system** that:

### 1. **Automatic Email Notification** 📧
When a customer tries to book and encounters a Zoom authorization issue:
- The system automatically sends an email to the specialist
- Email includes a clear explanation of what happened
- Email contains direct instructions and a re-authorization link
- The specialist knows immediately about the problem

### 2. **Customer-Friendly Modal Dialog** 💬
When a customer sees a booking error due to Zoom issues:
- A helpful modal appears (not just a generic alert)
- Modal explains the situation clearly
- Modal provides step-by-step instructions for the customer to communicate with specialist
- Modal confirms email has been sent to specialist

### 3. **Quick Re-Authorization Path** ⚡
The specialist can re-authorize by:
- **Option A (Fastest)**: Click the link in the email notification
- **Option B**: Go to Settings → Zoom Integration → "Re-authorize" button
- Both paths are quick and straightforward

## Implementation Details

### Frontend Changes

**SpecialistProfile.tsx:**
- Added state for `showZoomReAuthModal` and `zoomReAuthMessage`
- Updated `handleBookAppointment()` to show modal on Zoom errors
- Updated `handleConfirmServiceBooking()` to show modal on Zoom errors
- New modal component displays helpful information and instructions

```tsx
{showZoomReAuthModal && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <Card className="w-full max-w-md mx-4">
      <CardHeader>
        <CardTitle className="text-lg">🔄 Zoom Authorization Required</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Modal content with instructions */}
      </CardContent>
    </Card>
  </div>
)}
```

### Backend Changes

**appointmentController.js:**
- Enhanced error handling in `bookSlot()` function
- Now sends re-auth notification email on Zoom errors
- Returns `requiresReAuth: true` flag so frontend shows proper modal
- Handles three scenarios:
  1. No Zoom token found
  2. Zoom token incomplete/invalid
  3. Zoom meeting creation fails

```javascript
catch (zoomError) {
  // Send notification email to specialist
  try {
    await zoomService.sendZoomReAuthNotification(
      specialistEmail,
      specialistName,
      customerName,
      serviceTitle
    );
  } catch (emailError) {
    console.error('❌ Failed to send re-auth notification:', emailError.message);
  }
  
  return res.status(400).json({
    success: false,
    message: `❌ Failed to create Zoom meeting: ${zoomError.message}...`,
    requiresReAuth: true,
  });
}
```

**zoomService.js:**
- New function: `sendZoomReAuthNotification()`
- Sends professional HTML email to specialist
- Email includes:
  - Clear explanation of the problem
  - Step-by-step re-authorization instructions
  - Direct link to Settings page
  - Which customer and service were affected

```javascript
export const sendZoomReAuthNotification = async (
  specialistEmail, 
  specialistName, 
  customerName, 
  serviceTitle
) => {
  // Sends professional HTML email with re-auth instructions
}
```

## Workflow Diagram

```
Customer Attempts Booking
        ↓
Appointment API Checks Zoom Token
        ↓
    ┌───────────────────────────┐
    │  Zoom Token Invalid?      │
    └───────────────────────────┘
        ↓ YES                ↓ NO
        ├─────────────────────→ Create Zoom Meeting
        │                              ↓
        │                          Success → Email Invites
        │
        └→ Send Re-Auth Email ←──── Zoom Error
                   ↓
           Specialist Receives Email
           with Re-Auth Link/Instructions
                   ↓
           Specialist Clicks Link
           or Navigates to Settings
                   ↓
           Click "Re-authorize" Button
                   ↓
           Complete Zoom OAuth Flow
                   ↓
           Token Updated & Saved
                   ↓
        Customer Can Now Book! ✓
```

## Customer Experience

### When Booking Fails Due to Zoom

1. **Customer sees modal:**
   - "🔄 Zoom Authorization Required"
   - Clear explanation of why booking failed
   - Step-by-step instructions to ask specialist
   - Confirmation that specialist was notified

2. **Customer communicates with specialist** (if needed)

3. **Specialist receives email** with:
   - Subject: "⚠️ Action Required: Re-authorize Your Zoom Account"
   - Explanation of what happened
   - Customer name and service affected
   - Direct instructions and link

4. **Specialist clicks email link** (or navigates to Settings manually)

5. **Specialist clicks "Re-authorize"** in Settings

6. **Zoom OAuth flow completes**

7. **Token is saved**

8. **Customer can now book successfully!** ✓

## Specialist Experience

### When Zoom Token Expires

1. **During next booking attempt:**
   - Receives email notification immediately
   - Email is clear and actionable
   - No confusion about what's wrong

2. **Options to fix:**
   - **Option A (Recommended):** Click "Re-authorize" link in email
   - **Option B:** Navigate to Settings → Zoom Integration → "Re-authorize"

3. **Quick process:**
   - ~2 clicks to start OAuth flow
   - ~30 seconds to complete authorization
   - Token is immediately usable

## Email Template

The re-authorization email includes:

```
Subject: ⚠️ Action Required: Re-authorize Your Zoom Account

Content:
- Greeting with specialist name
- Explanation: "A customer tried to book [service] but Zoom is not authorized"
- Warning box: "Your Zoom integration needs to be re-authorized immediately"
- Clear action: "Re-authorize Your Zoom Account" (button)
- Step-by-step instructions
- Reassurance: "Once re-authorized, customers will be able to book again"
- Footer note: "The specialist has been sent an email notification..."
```

## Benefits

✅ **For Customers:**
- Clear explanation of issues
- Doesn't blame them
- Step-by-step guidance
- Confirmation action was taken

✅ **For Specialists:**
- Immediate notification when Zoom expires
- Easy re-authorization process
- Direct link from email
- No confusion about what to do

✅ **For System:**
- Reduced support burden
- Automatic troubleshooting
- Better error tracking
- Improved conversion (fewer lost bookings)

## Error Response Format

When Zoom authorization fails, the API now returns:

```json
{
  "success": false,
  "message": "❌ Failed to create Zoom meeting: [specific error]...",
  "requiresReAuth": true
}
```

The `requiresReAuth: true` flag tells the frontend:
- Use modal instead of simple alert
- Show helpful instructions
- Remind customer that specialist was notified

## Testing the System

To test Zoom re-authorization:

1. **As a Specialist:**
   - Go to Settings → Zoom Integration
   - Note your Zoom authorization status
   - If token is valid, you can test by:
     - Waiting for token to expire (if you have test tokens)
     - OR deliberately removing authorization to test error flow

2. **As a Customer:**
   - Try to book an appointment with a specialist
   - If specialist has no valid Zoom token:
     - You'll see the re-auth modal
     - Specialist will receive email
     - Test the "Got it, Thanks" button to close modal

3. **Check Specialist Email:**
   - Confirm re-auth notification was received
   - Verify the email is readable and actionable
   - Test the re-authorization link if provided

## Configuration

The system uses these environment variables:

- `GMAIL_USER` - Email account to send notifications from
- `GMAIL_PASSWORD` - Email account password
- `EMAIL_SERVICE` - Email service (gmail or yahoo)
- `FRONTEND_URL` - URL for Settings link in email

## API Endpoints Involved

- **POST /api/appointments/book/:slotId**
  - Now returns `requiresReAuth` flag
  - Triggers email notification on Zoom errors

- **GET /api/appointments/available**
  - Fetches available slots (unchanged)

## Models Updated

- **UserOAuthToken**
  - Used to validate specialist Zoom authorization
  - Automatically expires and refreshes as needed

- **AppointmentSlot**
  - Status field: "available", "booked", etc.
  - Stores Zoom meeting details when created

## Future Enhancements

Potential improvements:

1. **Proactive Token Checking**
   - Check token expiry before displaying book button
   - Show warning if token about to expire

2. **Dashboard Widget**
   - Show Zoom connection status on specialist dashboard
   - Quick re-auth button from dashboard

3. **Automatic Token Refresh**
   - Implement automatic refresh before token expires
   - Reduce manual re-auth needs

4. **SMS Notifications**
   - In addition to email, send SMS alert
   - For urgent/time-sensitive bookings

5. **Zoom Status Indicator**
   - Visual indicator on specialist profile showing Zoom status
   - Customers can see if Zoom is properly configured

## Summary

The new Zoom Re-Authorization Workflow ensures:

- ✅ Immediate notification when Zoom token issues occur
- ✅ Clear, user-friendly error messages
- ✅ Easy re-authorization process for specialists
- ✅ Better customer experience with helpful guidance
- ✅ Automatic email notifications reduce support burden
- ✅ Fewer lost bookings due to Zoom issues
