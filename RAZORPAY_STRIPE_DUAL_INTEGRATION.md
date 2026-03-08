# Dual Payment Gateway Implementation (Stripe + Razorpay)

## Overview
Implemented Option 1: Dual Payment Gateway support allowing customers to choose between **Stripe** (USD, International) and **Razorpay** (INR, India-focused) during course checkout.

## Environment Variables Required

### Backend (.env)
```bash
# Existing Stripe configuration
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_PUBLIC_KEY=pk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# New Razorpay configuration
RAZORPAY_KEY_ID=rzp_test_xxx
RAZORPAY_KEY_SECRET=your_secret_key
```

### Frontend (.env)
```bash
# Existing Stripe configuration
VITE_STRIPE_PUBLIC_KEY=pk_test_xxx

# Razorpay configuration (already sent from backend in payment response)
# No need to add to frontend - keyId is returned in the payment intent response
```

## Backend Implementation

### 1. New Razorpay Service
**File**: `backend/services/razorpayService.js`
- `createOrder()` - Creates Razorpay order (returns orderId)
- `verifyPaymentSignature()` - Validates webhook signature using HMAC-SHA256
- `retrievePayment()` - Fetches payment details from Razorpay
- `retrieveOrder()` - Fetches order details
- `processRefund()` - Handles refunds

### 2. Updated Models

**Payment Model** (`backend/models/Payment.js`)
- Added `paymentGateway` field: 'stripe' | 'razorpay'
- Added Razorpay fields: `razorpayOrderId`, `razorpayPaymentId`, `razorpaySignature`
- Added indexes for Razorpay lookups

**MarketplaceCommission Model** (`backend/models/MarketplaceCommission.js`)
- Added `paymentGateway` field for tracking which gateway was used
- Made `stripeAccountId` optional (only for Stripe)
- Added Razorpay fields: `razorpayOrderId`, `razorpayPaymentId`

**SelfPacedEnrollment Model** (`backend/models/SelfPacedEnrollment.js`)
- Added `paymentGateway` field
- Added Razorpay fields: `razorpayOrderId`, `razorpayPaymentId`
- Added `failureReason` field for better error tracking

### 3. Updated Controllers

**Marketplace Payment Controller** (`backend/controllers/marketplaceController.js`)
- Updated `createMarketplacePaymentIntent()` to accept `paymentGateway` parameter
- Routes requests to `createStripePaymentIntent()` or `createRazorpayPaymentIntent()` helper functions
- Both helpers calculate commission the same way
- Returns appropriate response format for each gateway:
  - **Stripe**: `clientSecret`, `paymentIntentId`
  - **Razorpay**: `orderId`, `keyId`, `currency`

### 4. Webhook Handlers

**Webhook Controller** (`backend/controllers/webhookController.js`)
- New `handleRazorpayWebhook()` exported function
- Handles events:
  - `payment.authorized` - Activates enrollment
  - `payment.captured` - Confirms payment
  - `payment.failed` - Marks as failed
  - `refund.created` - Processes refunds

### 5. Updated Routes

**Payment Routes** (`backend/routes/paymentRoutes.js`)
- Added route: `POST /api/webhooks/razorpay` for Razorpay notifications
- Route is unauthenticated (webhook endpoint)

## Frontend Implementation

### 1. New RazorpayPaymentForm Component
**File**: `src/app/components/RazorpayPaymentForm.tsx`
- Loads Razorpay SDK dynamically from CDN
- Opens Razorpay checkout modal
- Handles payment success/failure
- Shows payment details and security information

### 2. Updated PaymentModal Component
**File**: `src/app/components/PaymentModal.tsx`
- Added payment gateway selector (radio buttons)
- Displays: Stripe (Card, USD) vs Razorpay (Card/UPI/NetBanking, INR)
- Conditionally renders appropriate payment form
- Passes `paymentGateway` parameter to backend API
- Handles different response structures for each gateway

## Payment Flow

### Option 1: Stripe Payment
```
User clicks "Buy Course"
  ↓
PaymentModal opens with gateway selector
  ↓
User selects "Stripe"
  ↓
Frontend calls POST /api/marketplace/payments/create-intent with paymentGateway='stripe'
  ↓
Backend creates Stripe PaymentIntent, returns clientSecret
  ↓
StripePaymentForm renders with Elements
  ↓
User completes card payment
  ↓
Stripe webhook confirms payment
  ↓
Backend activates SelfPacedEnrollment
  ↓
Success: User enrolled in course
```

### Option 2: Razorpay Payment
```
User clicks "Buy Course"
  ↓
PaymentModal opens with gateway selector
  ↓
User selects "Razorpay"
  ↓
Frontend calls POST /api/marketplace/payments/create-intent with paymentGateway='razorpay'
  ↓
Backend creates Razorpay Order, returns orderId + keyId
  ↓
RazorpayPaymentForm opens Razorpay checkout modal
  ↓
User selects payment method (Card/UPI/NetBanking) and pays
  ↓
Razorpay webhook confirms payment
  ↓
Backend activates SelfPacedEnrollment
  ↓
Success: User enrolled in course
```

## Key Differences

| Aspect | Stripe | Razorpay |
|--------|--------|----------|
| **Currency** | USD (cents) | INR (paise) |
| **Primary Market** | Global/International | India-focused |
| **Payment Methods** | Card primarily | Card, UPI, NetBanking, Wallet |
| **Amount Calculation** | 1 cent = 0.01 USD | 1 paise = 0.01 INR |
| **Customer Setup** | Requires Stripe account | None required (platform-wide) |
| **SDK** | Stripe.js (elements) | Razorpay Checkout modal |
| **Webhook Event** | `payment_intent.succeeded` | `payment.authorized`/`payment.captured` |

## Backward Compatibility

- Existing Stripe payments continue to work
- Default payment gateway is `'stripe'` for backward compatibility
- Old API calls without `paymentGateway` parameter will use Stripe
- Both gateways share the same enrollment/commission logic

## Testing

### Test Razorpay Payment
1. Go to course purchase page
2. Select "Razorpay" as payment method
3. Proceed with payment
4. Use Razorpay test credentials (available at https://dashboard.razorpay.com/)

### Test Webhook (Development)
```bash
POST /api/webhooks/razorpay
Content-Type: application/x-www-form-urlencoded

event=payment.authorized&payload[payment][order_id]=order_xxx&payload[payment][id]=pay_xxx
```

## Production Checklist

- [ ] Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to production .env
- [ ] Configure Razorpay webhook endpoint in Razorpay dashboard (https://dashboard.razorpay.com/app/webhooks)
- [ ] Add webhook URL: `https://specialistly.com/api/webhooks/razorpay`
- [ ] Enable payment events: payment.authorized, payment.failed, refund.created
- [ ] Test with live credentials in staging environment
- [ ] Monitor webhook logs in both Stripe and Razorpay dashboards
- [ ] Update payment documentation for users

## Future Enhancements

1. **PayPal Integration** - Add PayPal as third gateway
2. **Payment Analytics** - Track payment method preference by region
3. **Currency Conversion** - Support multiple currencies within each gateway
4. **Automated Refunds** - Full refund automation for both gateways
5. **Payment History UI** - Show customer transaction history with gateway info
6. **Admin Dashboard** - View payment gateway statistics and performance
7. **Regional Optimization** - Auto-select best gateway based on user location

## Support & Documentation

- **Stripe Docs**: https://stripe.com/docs
- **Razorpay Docs**: https://razorpay.com/docs/
- **Webhook Reference**: See paymentRoutes.js for all webhook endpoints
- **Test Cards**: https://razorpay.com/docs/payments/test-and-debug/test-cards/

## Troubleshooting

### Razorpay Order Creation Fails
- Check RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are correct
- Verify webhook signature implementation
- Check order amount (must be >= 100 paise)

### Webhook Not Triggering
- Verify webhook URL is publicly accessible
- Check Razorpay dashboard webhook logs
- Ensure POST endpoint is accessible without authentication

### Payment Modal Not Showing Razorpay
- Verify paymentGateway parameter is being sent
- Check browser console for errors
- Ensure Razorpay SDK loads from CDN

---
**Last Updated**: March 5, 2026
**Implementation Status**: ✅ Complete (Option 1 - Dual Gateway)
