# Booking Cancellation Feature Guide

## Overview

Specialists can now cancel booked consulting sessions with automatic customer notification and refund processing.

## API Endpoint

### Cancel a Booking

**URL:** `POST /api/consulting-slots/:slotId/booking/:bookingIndex/cancel`

**Authentication:** Required (Bearer token in Authorization header)

**Method:** POST

#### Request Parameters

**Path Parameters:**
- `slotId` (string, required) - MongoDB ID of the consulting slot
- `bookingIndex` (number, required) - Index position of the booking in the slot's bookings array (0-based)

**Request Body:**
```json
{
  "cancellationReason": "Specialist emergency - rescheduling available"
}
```

#### Validation Rules

The following conditions must be met to cancel a booking:

1. **Authentication** - User must be logged in as a specialist
2. **Ownership** - The logged-in specialist must own the slot
3. **Booking Status** - Booking must have status `"booked"`
4. **Timing** - Session must start at least 1 hour in the future
5. **Not Cancelled** - Booking cannot already be cancelled
6. **Not Completed** - Booking cannot be already completed

#### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Booking cancelled successfully. Customer has been notified.",
  "data": {
    "slotId": "69987958a2b6797592fac729",
    "bookingIndex": 0,
    "bookingStatus": "cancelled_by_specialist",
    "cancellation": {
      "cancelledBy": "5f6a8e4b9c1234567890abcd",
      "cancelledAt": "2026-02-20T14:30:00.000Z",
      "cancellationReason": "Specialist emergency - rescheduling available",
      "refundStatus": "pending",
      "refundAmount": 5000,
      "stripeRefundId": null
    }
  }
}
```

#### Error Responses

**401 Unauthorized** - User not authenticated
```json
{
  "success": false,
  "message": "Unauthorized. Please login as a specialist."
}
```

**403 Forbidden** - User doesn't own the slot or is not a specialist
```json
{
  "success": false,
  "message": "Forbidden. You can only cancel bookings for your own slots."
}
```

**404 Not Found** - Slot doesn't exist
```json
{
  "success": false,
  "message": "Slot not found"
}
```

**409 Conflict** - Booking cannot be cancelled due to business rules

Reasons:
- Wrong booking status:
```json
{
  "success": false,
  "message": "Cannot cancel booking. Current status: completed. Only \"booked\" bookings can be cancelled."
}
```

- Already cancelled:
```json
{
  "success": false,
  "message": "This booking has already been cancelled or completed."
}
```

- Session too close (less than 1 hour):
```json
{
  "success": false,
  "message": "Cannot cancel booking. Session must start at least 1 hour in the future. Current time to session: 0.45 hours."
}
```

## Database Changes

### ConsultingSlot Schema - Bookings Array Enhanced

```javascript
bookings: [
  {
    customerId: ObjectId,
    customerEmail: String,
    customerName: String,
    bookedAt: Date,
    status: {
      enum: ['booked', 'cancelled_by_specialist', 'cancelled_by_customer', 'completed'],
      default: 'booked'
    },
    zoomMeeting: {
      zoomMeetingId: String,
      joinUrl: String,
      startUrl: String,
      password: String,
      createdAt: Date
    },
    cancellation: {
      cancelledBy: ObjectId,           // Who cancelled it
      cancelledAt: Date,               // When it was cancelled
      cancellationReason: String,      // Why it was cancelled
      refundStatus: {                  // Refund tracking
        enum: ['pending', 'processed', 'failed'],
        default: null
      },
      refundAmount: Number,            // Amount to refund (in cents)
      stripeRefundId: String           // Stripe refund transaction ID
    }
  }
]
```

## Refund Processing

### Automatic Refund Flow

1. When a booking is cancelled, refund status is set to `"pending"`
2. Refund processing starts asynchronously (non-blocking)
3. If `booking.paymentIntentId` exists, refund is processed via Stripe
4. Refund status is updated to `"processed"` or `"failed"`
5. Database record is updated with refund transaction ID

### Mock Mode

If `STRIPE_SECRET_KEY` environment variable is not set:
- System runs in mock mode
- Refunds are simulated with mock transaction IDs
- Useful for development/testing
- No actual payment processing occurs

### Production Stripe Integration

To enable real Stripe refunds:

1. Set `STRIPE_SECRET_KEY` environment variable
2. Ensure `booking.paymentIntentId` is stored when booking is initially created
3. Refund service will automatically:
   - Call Stripe API with payment intent ID
   - Process actual refund to customer's original payment method
   - Track refund status in database
   - Handle refund failures gracefully

### Refund Status States

| Status | Meaning | Action |
|--------|---------|--------|
| `pending` | Refund initiated, processing | System will retry if connection lost |
| `processed` | Refund successfully sent to Stripe | Customer will see refund in 3-5 business days |
| `failed` | Refund failed (may need manual intervention) | Review error logs and retry manually |

## Customer Notification

### Cancellation Email

When a booking is cancelled, the customer receives an email with:

- Clear notification that their session has been cancelled
- Original session details (date, time, duration)
- Specialist name
- Refund status and timeline (3-5 business days)
- Cancellation reason (if provided)
- Contact information

Email is sent asynchronously and failure to send won't block the cancellation.

### Email Example

```
Subject: ❌ Your Session with [Specialist Name] Has Been Cancelled

Dear [Customer Name],

We regret to inform you that your consulting session with [Specialist Name] has been cancelled.

Session Details:
- Date: Monday, February 24, 2026
- Time: 14:00
- Duration: 60 minutes

Refund Status:
Your refund is being processed and will be returned to your original payment method within 3-5 business days.

Cancellation Reason:
[Reason provided by specialist]

Need help? Contact us or reach out to [Specialist Name] for more information.
```

## Implementation Notes

### Frontend Integration

To integrate cancellation into the UI:

```typescript
// Example: Call cancel booking endpoint
const cancelBooking = async (slotId: string, bookingIndex: number, reason: string) => {
  const response = await fetch(
    `${API_BASE_URL}/consulting-slots/${slotId}/booking/${bookingIndex}/cancel`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        cancellationReason: reason
      })
    }
  );
  
  const result = await response.json();
  
  if (!response.ok) {
    // Handle error (check error response structure above)
    console.error('Cancellation failed:', result.message);
    return;
  }
  
  // Success - update UI
  console.log('Booking cancelled successfully');
};
```

### Error Handling Checklist

- [ ] Check user is authenticated with valid token
- [ ] Verify specialist owns the slot
- [ ] Confirm booking exists at the given index
- [ ] Validate booking hasn't already been cancelled
- [ ] Check session is still in future (1+ hour away)
- [ ] Provide clear, actionable error messages to user
- [ ] Handle refund processing failures gracefully

### Testing Checklist

- [ ] Specialist can cancel own booking (1 hour in future)
- [ ] Specialist cannot cancel other specialist's booking
- [ ] Cancellation fails if session less than 1 hour away
- [ ] Cancellation fails if already cancelled
- [ ] Cancellation fails if already completed
- [ ] Refund status shows pending immediately
- [ ] Customer receives cancellation email
- [ ] In mock mode: refund succeeds with mock ID
- [ ] With Stripe configured: real refunds processed
- [ ] Refund failures don't break booking cancellation

## Future Enhancements

1. **Customer Cancellation** - Allow customers to cancel with different rules (e.g., 2 hour notice)
2. **Partial Refunds** - Support refund amounts less than full booking cost
3. **Cancellation Policies** - Implement configurable specialist refund policies
4. **Reschedule Offer** - Offer automatic rescheduling when cancelling
5. **Cancellation Analytics** - Track cancellation reasons and patterns
6. **Dispute Handling** - Support for refund disputes and resolutions
7. **Bulk Cancellations** - Cancel multiple bookings at once with reason

## Troubleshooting

### Issue: "Session must start at least 1 hour in the future"

**Cause:** Trying to cancel a session that's less than 1 hour away

**Solution:** Only allow cancellation if session is more than 1 hour in future. Check local timezone calculations.

### Issue: "No Zoom OAuth token found" followed by cancellation

**Cause:** This error is unrelated - it's from previous Zoom meeting creation

**Solution:** If cancellation succeeds but shows this error, refund will still process

### Issue: Refund shows "pending" but never updates to "processed"

**Cause:** 
- Stripe API key not configured
- Payment intent ID not stored with booking
- Stripe API failures

**Solution:**
1. Check `STRIPE_SECRET_KEY` is set in environment
2. Verify `booking.paymentIntentId` exists
3. Check server logs for Stripe API errors
4. Retry refund manually if needed

### Issue: Customer never receives cancellation email

**Cause:**
- Gmail API not configured
- Customer email is invalid
- Email service failure

**Solution:**
1. Check GMT API credentials are set
2. Verify customer email address
3. Check application logs for email service errors
4. Send email manually if needed

## Files Modified

- `backend/models/ConsultingSlot.js` - Enhanced bookings schema
- `backend/controllers/consultingSlotController.js` - Added cancelBooking method
- `backend/routes/consultingSlotRoutes.js` - Added cancellation route
- `backend/services/refundService.js` - New refund processing service (created)

## Related Features

- [Booking System](CONSULTING_SLOTS_API.md)
- [Zoom Meeting Integration](ON_DEMAND_ZOOM_IMPLEMENTATION.md)
- [Email Notifications](EMAIL_TROUBLESHOOTING.md)
- [Stripe Integration Setup](DEPLOYMENT_GUIDE.md)
