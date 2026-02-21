# Complete Payment Flow Implementation Guide

## Overview

The complete Stripe payment integration is now implemented across the entire application. Here's what was deployed and how to test it.

## Architecture

### Payment Flow Diagram
```
Customer → Browse Courses → Click "Enroll Now" 
  → PaymentModal Opens → StripePaymentForm 
  → Stripe Payment Processing 
  → Webhook Verification 
  → Enrollment Activation
```

## Completed Components

### 1. Context & State Management
**File**: `src/app/context/PaymentContext.tsx`
- Global payment state management
- Payment modal open/close control
- Payment configuration storage
- Two exports:
  - `PaymentProvider`: Wraps application
  - `usePaymentContext()`: Custom hook to access context

### 2. Custom Hook
**File**: `src/app/hooks/usePayment.ts`
- Simplifies payment flow initiation
- Methods:
  - `initiatePayment()`: Start payment process with config
  - `openPayment()`: Manually open payment modal
  - `closePayment()`: Close modal
  - `isPaymentOpen`: Boolean state
  - `paymentConfig`: Current payment configuration

### 3. Payment Modal Component
**File**: `src/app/components/PaymentModal.tsx`
- Modal wrapper for payment form
- Features:
  - Payment summary display
  - Client secret initialization
  - Loading states
  - Error handling
  - Stripe Elements integration

### 4. Payment Form Component
**File**: `src/app/components/StripePaymentForm.tsx`
- Stripe CardElement input
- Payment confirmation
- Error handling
- Success callbacks
- Test card support

### 5. Frontend API Client
**File**: `src/app/api/paymentAPI.ts`
- `createPaymentIntent()`: Create payment intent
- `confirmPayment()`: Confirm payment
- `getPaymentDetails()`: Fetch payment info
- `getPaymentHistory()`: Get customer history
- `processRefund()`: Request refund
- `getSpecialistStatistics()`: Revenue analytics

### 6. Backend Controllers
**Files**: 
- `backend/controllers/paymentController.js`: Payment endpoints
- `backend/controllers/webhookController.js`: Webhook processing

### 7. Database Models
**Files**:
- `backend/models/Payment.js`: Payment records (100+ lines)
- `backend/models/SelfPacedEnrollment.js`: Updated with payment fields

### 8. Routes & Services
**Files**:
- `backend/routes/paymentRoutes.js`: All payment API routes
- `backend/services/stripeService.js`: Stripe API wrapper

## Integration Points

### Main App Setup
**File**: `src/main.tsx`
```typescript
<AuthProvider>
  <PaymentProvider>
    <Router />
  </PaymentProvider>
</AuthProvider>
```

### App Component
**File**: `src/app/App.tsx`
```typescript
<PaymentModal isOpen={isPaymentOpen} onClose={closePayment} />
```

### Course Enrollment (CoursesBrowse)
**File**: `src/app/components/CoursesBrowse.tsx`
- Checks if course is FREE or PAID
- FREE → Direct enrollment
- PAID → Opens PaymentModal via `openPayment()`

### Specialist Profile Courses
**File**: `src/app/components/SpecialistProfile.tsx`
- Same logic as CoursesBrowse
- Handles paid and free courses

## Testing Checklist

### 1. Local Backend Testing
```bash
# Start backend
npm run dev

# Test payment endpoint
curl -X POST http://localhost:5001/api/payments/create-intent \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "serviceId": "course123",
    "serviceType": "course",
    "customerId": "user123",
    "customerEmail": "test@example.com"
  }'
```

### 2. Test Card Numbers (Stripe Test Mode)
- **Success**: 4242 4242 4242 4242 (any expiry, any CVC)
- **Requires 3D Secure**: 4000 0027 6000 3184
- **Declined**: 4000 0000 0000 0002
- **Insufficient Funds**: 4000 0000 0000 9995

### 3. Frontend Testing Steps
1. Start application: `npm run dev`
2. Login as customer
3. Go to "Explore Courses"
4. Click "Enroll Now" on a PAID course
5. PaymentModal should open
6. Enter test card: 4242 4242 4242 4242
7. Set any future expiry date
8. Set any CVC (e.g., 123)
9. Click "Pay Now"
10. Should see success message
11. Check "My Learning & Bookings" for enrolled course

### 4. Webhook Testing (Local)
```bash
# Use Stripe CLI to forward webhooks
stripe listen --forward-to localhost:5001/api/payments/webhooks/stripe

# Get signing secret from CLI output
# Add to .env: STRIPE_WEBHOOK_SECRET=<secret>
```

### 5. Database Verification
After successful payment, verify in MongoDB:
```javascript
// Check Payment document
db.payments.findOne({
  customerId: ObjectId("user123")
})

// Check SelfPacedEnrollment document
db.selfpacedenrollments.findOne({
  paymentStatus: "completed"
})
```

## Production Deployment

### 1. Get Live Stripe Keys
- Go to https://dashboard.stripe.com
- Switch to "Live" mode
- Copy keys (starts with pk_live_ and sk_live_)

### 2. Update Production Environment
**File**: `backend/.env.production`
```env
STRIPE_SECRET_KEY=sk_live_YOUR_LIVE_KEY
STRIPE_PUBLIC_KEY=pk_live_YOUR_LIVE_KEY
STRIPE_WEBHOOK_SECRET=whsec_YOUR_LIVE_WEBHOOK_SECRET
```

### 3. Register Webhook Endpoint
1. Go to Stripe Dashboard → Webhooks
2. Add endpoint: `https://yourdomain.com/api/payments/webhooks/stripe`
3. Listen for events:
   - payment_intent.succeeded
   - payment_intent.payment_failed
   - charge.refunded
   - charge.dispute.created
4. Copy signing secret
5. Add to .env.production: `STRIPE_WEBHOOK_SECRET=<secret>`

### 4. Deploy to Production
```bash
git add .
git commit -m "feat: Complete Stripe payment integration"
git push origin main
# Railway auto-deploys
```

### 5. Post-Deploy Verification
1. Test with live Stripe card (if available)
2. Check webhook delivery in Stripe Dashboard
3. Monitor logs for webhook processing
4. Test refund flow

## Configuration

### Environment Variables
```env
# Development
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_test_...
REACT_APP_STRIPE_PUBLIC_KEY=pk_test_...
REACT_APP_API_BASE_URL=http://localhost:5001/api
PAYMENT_ENABLED=true

# Production
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLIC_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_live_...
REACT_APP_STRIPE_PUBLIC_KEY=pk_live_...
REACT_APP_API_BASE_URL=https://yourdomain.com/api
PAYMENT_ENABLED=true
```

## API Endpoints

### Payment Endpoints
```
POST   /api/payments/webhooks/stripe        - Stripe webhooks
GET    /api/webhooks/health                 - Health check
POST   /api/payments/create-intent          - Create payment intent
POST   /api/payments/confirm-payment        - Confirm payment + enroll
GET    /api/payments/:paymentId             - Get payment info
GET    /api/payments/history/customer       - Payment history
POST   /api/payments/:paymentId/refund      - Process refund
GET    /api/payments/specialist/statistics  - Revenue stats
```

## Error Handling

### Common Issues & Solutions

**Issue**: Webhook secret not working
```
Solution: Ensure webhook middleware is BEFORE express.json()
Check: backend/server.js lines 47-53
```

**Issue**: Payment modal doesn't open
```
Solution: Verify PaymentProvider wraps Router in main.tsx
Check: src/main.tsx
```

**Issue**: "Cannot find module @stripe/stripe-js"
```
Solution: npm install
npm ci --force (if npm install fails)
```

**Issue**: Payment intent creation fails
```
Solution: Check backend logs for Stripe API errors
Verify STRIPE_SECRET_KEY is valid
Confirm user is authenticated (Bearer token in header)
```

## Security Considerations

1. **Never log sensitive data**: Payment details, tokens, secrets
2. **Webhook verification**: Always verify webhook signature
3. **Client secret**: Never expose full client secret unencrypted
4. **PCI compliance**: Stripe Elements handles PCI compliance
5. **HTTPS only**: Enable HTTPS in production
6. **Environment variables**: Never commit .env files

## Monitoring

### Logs to Monitor
```bash
# Backend logs
tail -f backend/logs/webhooks.log
tail -f backend/logs/payments.log

# Stripe Dashboard
https://dashboard.stripe.com → Events (for webhook delivery)

# Application monitoring
Check error tracking (Sentry, etc.)
Monitor failed payment attempts
```

### Key Metrics
- Payment success rate
- Failed payment attempts
- Refund rate
- Customer enrollment conversion
- Average payment processing time

## Files Modified/Created

### Created Files
- src/app/context/PaymentContext.tsx
- src/app/hooks/usePayment.ts
- src/app/components/PaymentModal.tsx
- src/app/api/paymentAPI.ts (updated)
- backend/controllers/paymentController.js
- backend/controllers/webhookController.js
- backend/routes/paymentRoutes.js
- backend/services/stripeService.js
- backend/models/Payment.js

### Modified Files
- src/main.tsx (added PaymentProvider)
- src/app/App.tsx (imported PaymentModal, usePaymentContext)
- src/app/components/CoursesBrowse.tsx (payment integration)
- src/app/components/SpecialistProfile.tsx (payment integration)
- backend/models/SelfPacedEnrollment.js (payment fields)
- backend/server.js (payment routes, webhook middleware)
- package.json (Stripe dependencies)
- .env (test keys)
- .env.production (placeholder keys)

## Next Steps

1. ✅ Backend infrastructure complete
2. ✅ Frontend integration complete
3. ✅ Payment context and hooks complete
4. ⏳ Local testing → Run `npm run dev` and test with 4242 4242 4242 4242
5. ⏳ Get live Stripe keys
6. ⏳ Configure production webhook
7. ⏳ Deploy to production
8. ⏳ Monitor in production

## Support

For issues or questions:
1. Check Stripe Dashboard for webhook delivery failures
2. Review backend logs for payment processing errors
3. Verify environment variables are set correctly
4. Test with Stripe's test cards
5. Check browser console for frontend errors

---

**Implementation Status**: 90% Complete
- **Backend**: ✅ Complete
- **Frontend**: ✅ Complete
- **Testing**: 🔄 Ready for local testing
- **Production**: ⏳ Awaiting live keys
