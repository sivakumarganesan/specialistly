# Stripe Payment Integration Architecture

## 1. Overview

This document outlines the complete payment integration architecture for the Specialistly platform using Stripe as the payment processor.

### Payment Flow
```
Customer Initiates Purchase
    ↓
Create Payment Intent (Backend)
    ↓
Customer completes payment (Frontend - Stripe UI)
    ↓
Stripe sends webhook (Payment Success/Failure)
    ↓
Backend verifies webhook signature
    ↓
Update Enrollment Status to "Active"
    ↓
Create/Update Payment Record
    ↓
Send confirmation emails
```

---

## 2. Folder Structure

```
backend/
├── models/
│   ├── Payment.js          (NEW - Payment records)
│   ├── Enrollment.js       (UPDATED - Add payment status)
│   ├── Service.js          (UPDATED - Add pricing info)
│   └── Course.js           (UPDATED - Add pricing info)
├── controllers/
│   ├── paymentController.js (NEW)
│   └── enrollmentController.js (UPDATED)
├── routes/
│   ├── paymentRoutes.js    (NEW)
│   └── enrollmentRoutes.js (UPDATED)
├── services/
│   ├── stripeService.js    (NEW - Stripe API calls)
│   └── webhookService.js   (NEW - Webhook verification)
├── middleware/
│   ├── webhookMiddleware.js (NEW - Webhook verification)
│   └── stripe-webhook.log  (For error tracking)
├── config/
│   └── stripe.js           (NEW - Stripe configuration)
└── utils/
    ├── idempotencyKey.js   (NEW - Idempotency handling)
    └── errorHandler.js     (UPDATED)

frontend/
├── components/
│   ├── PaymentModal.tsx    (NEW)
│   ├── StripePaymentForm.tsx (NEW)
│   ├── PaymentSuccess.tsx  (NEW)
│   └── ServiceDetail.tsx   (UPDATED)
├── context/
│   └── PaymentContext.tsx  (NEW)
├── hooks/
│   └── usePayment.ts       (NEW)
├── pages/
│   └── Checkout.tsx        (NEW)
└── api/
    ├── paymentAPI.ts       (NEW)
    └── apiClient.ts        (UPDATED)

environment/
├── .env.production         (UPDATED - Stripe keys)
├── .env.development        (UPDATED - Stripe test keys)
└── .env.example            (UPDATED)
```

---

## 3. MongoDB Schema Updates

### 3.1 Payment Schema (NEW)
```javascript
{
  _id: ObjectId,
  
  // Payment Identifiers
  paymentId: String,        // Stripe Payment Intent ID
  sessionId: String,        // Checkout Session ID (if using Stripe Checkout)
  
  // Parties Involved
  customerId: ObjectId,     // Reference to Customer
  customerEmail: String,
  specialistId: ObjectId,   // Reference to Specialist
  specialistEmail: String,
  
  // Product Information
  serviceId: ObjectId,      // Reference to Service/Course
  serviceType: Enum(['course', 'service']),
  serviceName: String,
  
  // Payment Details
  amount: Number,           // Amount in smallest currency unit (cents)
  currency: String,         // USD, INR, etc.
  
  // Status
  status: Enum([
    'pending',              // Payment initiated
    'processing',           // Webhook received
    'completed',            // Payment successful
    'failed',               // Payment failed
    'refunded'              // Payment refunded
  ]),
  
  // Stripe Event Data
  stripeEventId: String,    // Stripe event ID (for idempotency)
  stripePaymentStatus: String, // succeeded, requires_action, processing, etc.
  
  // Timestamps
  createdAt: Date,
  updatedAt: Date,
  webhookReceivedAt: Date,
  
  // Idempotency
  idempotencyKey: String,   // Unique key for idempotent requests
  
  // Metadata
  metadata: {
    orderId: String,
    invoiceNumber: String,
    notes: String
  },
  
  // Raw Stripe Response
  stripeResponse: {
    object: JSON  // Store full payment object for audit
  }
}
```

### 3.2 Enrollment Schema (UPDATED)
```javascript
{
  // ... existing fields ...
  
  paymentStatus: Enum([
    'pending',       // Awaiting payment
    'completed',     // Payment successful
    'failed',        // Payment failed
    'refunded'       // Payment refunded
  ]),
  
  paymentId: ObjectId,     // Reference to Payment document
  paymentDate: Date,
  
  // Webhook verification
  webhookVerified: Boolean,
  webhookVerifyAt: Date,
  
  // Status flow
  status: Enum([
    'inactive',     // Before payment
    'active',       // After payment completed
    'cancelled',    // User cancelled
    'refunded'      // Refund processed
  ])
}
```

### 3.3 Service Schema (UPDATED)
```javascript
{
  // ... existing fields ...
  
  pricing: {
    amount: Number,        // In cents
    currency: String,      // Default: INR
    stripePriceId: String  // For Stripe Product Database
  },
  
  stripeProductId: String, // For managing products in Stripe
}
```

### 3.4 Course Schema (UPDATED)
```javascript
{
  // ... existing fields ...
  
  pricing: {
    amount: Number,        // In cents
    currency: String,      // Default: INR
    stripePriceId: String
  },
  
  stripeProductId: String,
}
```

---

## 4. Backend Architecture

### 4.1 Stripe Configuration
```javascript
// backend/config/stripe.js
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
  maxNetworkRetries: 2,
  timeout: 60000,
});

export default stripe;
```

### 4.2 Payment Endpoints

#### POST /api/payments/create-intent
- Creates Stripe Payment Intent
- Request: `{ serviceId, serviceType, customerId, customerEmail }`
- Response: `{ clientSecret, paymentIntentId }`

#### POST /api/payments/confirm-payment
- Client confirms payment in frontend
- Verifies payment with Stripe
- Updates enrollment if successful
- Request: `{ paymentIntentId }`
- Response: `{ success, enrollmentId }`

#### POST /api/webhooks/stripe
- Webhook endpoint for Stripe events
- Raw body required (not JSON parsed)
- Verifies signature using `stripe.webhooks.constructEvent()`
- Handles: `payment_intent.succeeded`, `payment_intent.payment_failed`

#### GET /api/payments/:paymentId
- Fetch payment details
- User must own or be specialist for the payment

#### POST /api/payments/:paymentId/refund
- Process refund
- Only specialist can initiate
- Updates payment status to 'refunded'
- Updates enrollment status

---

## 5. Security Measures

### 5.1 Webhook Verification
```javascript
// Prevent webhook spoofing
const event = stripe.webhooks.constructEvent(
  req.rawBody,  // Raw body, not parsed JSON
  req.headers['stripe-signature'],
  process.env.STRIPE_WEBHOOK_SECRET
);
```

### 5.2 Idempotency Handling
```javascript
// Prevent duplicate charges for same transaction
const idempotencyKey = `${customerId}-${serviceId}-${timestamp}`;
const existingPayment = await Payment.findOne({ idempotencyKey });
if (existingPayment) return existingPayment; // Return existing
```

### 5.3 Environment Variables
```
# .env.production
STRIPE_PUBLIC_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# .env.development
STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_test_...
```

### 5.4 Authentication
- All payment endpoints require authentication
- Webhook endpoint does NOT require auth (uses signature verification)
- Rate limiting on payment creation endpoint
- CSRF protection enabled

---

## 6. Payment Flow (Detailed)

### Step 1: Customer Initiates Payment
```
Frontend: Click "Enroll" or "Book Service"
         → Open Payment Modal
         → Display enrollment details
```

### Step 2: Create Payment Intent (Backend)
```
Backend receives: POST /api/payments/create-intent
1. Validate user authentication
2. Check service/course details
3. Verify service exists and is active
4. Check for existing pending payment (prevent duplicates)
5. Generate idempotency key: ${customerId}-${serviceId}-${timestamp}
6. Check if payment with this key already exists
7. Create Stripe Payment Intent
8. Create Payment record in MongoDB (status: 'pending')
9. Return clientSecret to frontend
```

### Step 3: Customer Pays (Stripe)
```
Frontend:
1. Initialize Stripe Elements
2. Display card input
3. Call: stripe.confirmCardPayment(clientSecret)
4. Stripe processes payment
5. Returns result: { status: 'succeeded' | 'requires_action' | 'error' }
```

### Step 4: Webhook Processing (Backend)
```
Stripe sends webhook_event:
1. Middleware verifies signature
2. Extract event type and payment intent
3. If event_type = "payment_intent.succeeded":
   a. Update Payment record: status = 'completed'
   b. Fetch Enrollment record
   c. Change Enrollment: status = 'active', paymentStatus = 'completed'
   d. Link payments: Save paymentId in Enrollment
   e. Send confirmation emails
   f. Create order/invoice
   g. Notify specialist via email/dashboard
```

### Step 5: Confirmation to Customer
```
Frontend:
1. Poll backend for payment status (or use WebSocket)
2. On completion: Show success screen
3. Redirect to course/service
4. Send email confirmation
```

---

## 7. Idempotency & Duplicate Prevention

### Issue: What if customer clicks "Pay" twice?

### Solution:
```javascript
// Generate unique key
const idempotencyKey = `${customerId}-${serviceId}-${Date.now()}`;

// Check for existing pending/completed payment
const existing = await Payment.findOne({ 
  customerId, 
  serviceId, 
  status: { $in: ['pending', 'completed'] },
  createdAt: { $gt: new Date(Date.now() - 5*60*1000) } // Last 5 minutes
});

if (existing && existing.status === 'completed') {
  return { error: 'Already enrolled', enrollmentId: existing.enrollmentId };
}

if (existing) {
  // Return existing payment to complete it
  return existing.clientSecret;
}

// Create new payment
```

---

## 8. Error Handling

### Payment Intent Creation Failures
- Invalid amount (too small)
- Service not found
- User not authenticated
- Stripe API unavailable

### Webhook Processing Failures
- Invalid signature (reject)
- Duplicate event (idempotent, safe to retry)
- Database transaction failure (log and retry)
- Email service failure (log, queue for retry)

### Retry Logic
```javascript
// Exponential backoff for webhook processing
try {
  await updateEnrollment();
} catch (error) {
  if (error.isRetryable) {
    // Queue for retry after 30s, 5m, 30m
    await queueForRetry(webhook, error);
  } else {
    // Log permanent failure
    logger.error('Permanent webhook failure', error);
  }
}
```

---

## 9. Enrollment Status Lifecycle

```
┌─────────────┐
│   INACTIVE  │ ← Customer created enrollment form
└──────┬──────┘
       │ (Payment Initiated)
       ↓
┌─────────────┐
│   PENDING   │ ← Payment created, awaiting customer payment
└──────┬──────┘
       │ (Customer pays)
       ↓
┌─────────────┐
│   ACTIVE    │ ← Payment webhook received & verified
└──────┬──────┘
       │
       ├─→ Specialist can see enrollment
       ├─→ Customer can access course/service
       └─→ Confirmation emails sent

       │ (Customer wants to cancel)
       ↓
┌─────────────┐
│ CANCELLED   │
└─────────────┘

       │ (Payment refunded)
       ↓
┌─────────────┐
│  REFUNDED   │
└─────────────┘
```

---

## 10. Production Deployment Checklist

### Stripe Setup
- [ ] Create Stripe account (Production)
- [ ] Create API keys (Publishable & Secret)
- [ ] Configure webhook endpoint
- [ ] Test webhook delivery
- [ ] Enable 3D Secure for card payments
- [ ] Set up SCA (Strong Customer Authentication) handling

### Backend Deployment
- [ ] Add Stripe environment variables to production server
- [ ] Set webhook secret on server
- [ ] Enable rate limiting on payment endpoints
- [ ] Configure CORS for Stripe requests
- [ ] Set up error logging and alerts
- [ ] Test payment flow in staging
- [ ] Monitor webhook processing logs
- [ ] Set up database backups
- [ ] Configure database indexes for Payment/Enrollment collections

### Frontend Deployment
- [ ] Load Stripe.js from CDN (production key)
- [ ] Implement error boundaries for payment components
- [ ] Add payment state management
- [ ] Implement retry logic for failed payments
- [ ] Set up analytics for payment funnel
- [ ] Test on multiple browsers
- [ ] Implement SSL/TLS (HTTPS only)
- [ ] Set up Content Security Policy headers

### Monitoring & Alerts
- [ ] Monitor webhook delivery success rate
- [ ] Alert on failed payments
- [ ] Alert on webhook processing errors
- [ ] Monitor Stripe API rate limits
- [ ] Set up payment reconciliation job (daily)
- [ ] Monitor for duplicate charges
- [ ] Track payment latency

### Security Hardening
- [ ] Rotate Stripe API keys quarterly
- [ ] Use IP whitelisting for webhook endpoint
- [ ] Implement request signing for sensitive operations
- [ ] Enable API key rotation alerts
- [ ] Regular security audits
- [ ] PCI compliance validation
- [ ] Implement payment encryption at rest

### Testing
- [ ] Unit tests for payment service
- [ ] Integration tests for payment flow
- [ ] Webhook signature verification tests
- [ ] Idempotency tests
- [ ] Test card numbers provided by Stripe
  - Success: `4242 4242 4242 4242`
  - Decline: `4000 0000 0000 0002`
  - 3D Secure: `4000 0025 0000 3155`
- [ ] End-to-end payment tests
- [ ] Load testing for payment endpoints

---

## 11. Key Dependencies

```json
{
  "stripe": "^13.0.0",
  "stripe-js": "^1.47.0",
  "@stripe/react-stripe-js": "^2.0.0",
  "dotenv": "^16.0.0"
}
```

---

## 12. Best Practices

### 1. Never Store Full Card Details
- Stripe handles card storage
- Store only Stripe payment ID
- Use tokenization

### 2. Always Verify Webhooks
```javascript
const event = stripe.webhooks.constructEvent(...);
// Never trust webhook without signature verification
```

### 3. Handle Rate Limiting
- Stripe limits: 100 requests/second
- Implement exponential backoff
- Queue heavy operations

### 4. Audit Trail
- Log all payment events
- Store Stripe response for reconciliation
- Track webhook processing
- Monitor for fraud patterns

### 5. Testing Strategy
- Use Stripe test credentials in staging
- Test both success and failure scenarios
- Test webhook retry logic
- Test idempotency

### 6. User Experience
- Show loading states during payment
- Handle errors gracefully
- Provide clear success/failure messages
- Allow retry for failed payments
- Implement payment history view

### 7. Compliance
- Keep PCI compliance by not storing cards
- Implement CSP headers
- Use HTTPS everywhere
- Implement CORS properly
- Log sensitive compliance events

---

## 13. Disaster Recovery

### Webhook Processing Fails
- Stripe will retry for 3 days
- Implement manual reconciliation job
- Compare Stripe records with database
- Auto-recover missing enrollments

### Database Corruption
- Payment records are immutable after webhook processing
- Stripe is source of truth
- Can rebuild Payment records from Stripe API
- Implement daily reconciliation

### Duplicate Enrollment
- Use idempotency keys
- Check existing active enrollment before creating new
- Webhook processing is idempotent

---

## 14. Cost Optimization

- Stripe pricing: 2.2% + $0.30 per transaction
- For $100 course: $2.50 + $0.30 = $2.80 fee
- Batch operations to reduce API calls
- Use Stripe's built-in retry logic
- Monitor for failed payment patterns

---

## Next Steps

1. Create MongoDB schemas
2. Implement Stripe service layer
3. Build payment API endpoints
4. Implement webhook handler
5. Create React payment components
6. Integrate payment flow with existing enrollment system
7. Comprehensive testing
8. Staging deployment
9. Production deployment

