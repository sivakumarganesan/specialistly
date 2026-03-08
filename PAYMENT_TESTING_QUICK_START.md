# Payment System - Quick Start Testing Guide

## 5-Minute Setup & Testing

### Step 1: Update Environment Variables (1 min)

**Backend Development** (`backend/.env`):
```env
# Ensure these exist (should already be there):
STRIPE_SECRET_KEY=sk_test_51PaKf3CZAo2TqE7Pq8M1K4N2L3O4P5Q6R7S8T9U0V1W2X3Y4Z5A6B7C8D9E0
STRIPE_PUBLIC_KEY=pk_test_51PaKf3CZAo2TqE7PqM4N5O6P7Q8R9S0T1U2V3W4X5Y6Z7A8B9C0D1E2F3G4H5I6J7K8L9
STRIPE_WEBHOOK_SECRET=whsec_test_TGYqK6QnJ0K9L0M1N2O3P4Q5R6S7T8U9V0W1X2Y3Z4A5B6C7D8E9F0G1H2I3J4K5L6
PAYMENT_ENABLED=true
```

**Frontend Development** (`.env` or `vite.config.ts` if using environment variables):
```
REACT_APP_STRIPE_PUBLIC_KEY=pk_test_51PaKf3CZAo2TqE7PqM4N5O6P7Q8R9S0T1U2V3W4X5Y6Z7A8B9C0D1E2F3G4H5I6J7K8L9
REACT_APP_API_BASE_URL=http://localhost:5001/api
```

### Step 2: Create a Test Course (1 min)

1. Login as specialist
2. Go to "Courses"
3. Create a course with:
   - Title: "Payment Test Course"
   - Price: $10 (or 1000 cents)
   - Type: "Self-paced"
   - Add some lessons with files

### Step 3: Start Backend (1 min)

```bash
cd backend
npm run dev
# Should see: "Server running on port 5001"
```

### Step 4: Start Frontend (1 min)

```bash
# In new terminal
npm run dev
# Should see: "Local: http://localhost:5173"
```

### Step 5: Test Payment Flow (1 min)

1. **Login as customer** (different account than specialist who created course)
2. **Go to "Explore Courses"**
3. **Find the test course and click "Enroll Now"**
4. **PaymentModal should open** with:
   - Course name
   - Price ($10.00)
   - Card input field

4. **Enter test card**: `4242 4242 4242 4242`
5. **Expiry**: Any future date (e.g., 12/25)
6. **CVC**: Any 3 digits (e.g., 123)
7. **Click "Pay Now"**

### Expected Results

✅ **Success Flow**:
```
Card processed → "Payment successful" message → Modal closes
→ Check "My Learning & Bookings" → Course appears in list
```

❌ **Failure Flow** (using 4000 0000 0000 0002):
```
Card declined → Error message → Modal stays open → Can retry
```

## Verification Checklist

After successful payment, verify:

### 1. Frontend Verification
- [ ] Success message displays
- [ ] Modal closes automatically
- [ ] Course appears in "My Learning & Bookings"
- [ ] No console errors (F12 → Console)

### 2. Backend Verification
```bash
# Check backend logs for:
# "✅ Payment confirmed" message
# "📧 Enrollment confirmation email sent"
```

### 3. Database Verification (MongoDB)

**Payment Document**:
```javascript
db.payments.findOne({
  customerId: ObjectId("<customer_id>")
}).pretty()

// Should show:
{
  _id: ObjectId(...),
  customerId: ObjectId(...),
  serviceId: "<course_id>",
  serviceType: "course",
  amount: 1000,
  currency: "usd",
  status: "completed",
  stripePaymentStatus: "succeeded",
  createdAt: ISODate(...)
}
```

**Enrollment Document**:
```javascript
db.selfpacedenrollments.findOne({
  customerId: ObjectId("<customer_id>"),
  courseId: ObjectId("<course_id>")
}).pretty()

// Should show:
{
  _id: ObjectId(...),
  customerId: ObjectId(...),
  courseId: ObjectId(...),
  paymentStatus: "completed",
  paymentId: ObjectId("<payment_id>"),
  paymentDate: ISODate(...),
  webhookVerified: true,
  status: "active"
}
```

## Common Issues During Testing

### Issue 1: "Cannot GET /api/payments/create-intent"
**Solution**: 
- Verify backend is running (`npm run dev`)
- Check backend/server.js has payment routes mounted
- Check browser network tab (F12 → Network tab)

### Issue 2: "stripePromise is undefined" 
**Solution**:
- Ensure REACT_APP_STRIPE_PUBLIC_KEY is set correctly
- Restart frontend after changing env vars
- Check browser console for missing env var warning

### Issue 3: Modal doesn't appear on "Enroll Now"
**Solution**:
- Verify course price > 0
- Check browser console for errors
- Verify PaymentProvider wraps the app in main.tsx
- Check that usePaymentContext hook is imported correctly

### Issue 4: "Payment intent creation failed"
**Solution**:
- Verify STRIPE_SECRET_KEY is correct in backend/.env
- Ensure Stripe account is active
- Check backend logs: `npm run dev` shows errors
- Verify auth token is sent in request header

### Issue 5: Webhook not processing
**Solution** (Local Development):
```bash
# Install Stripe CLI: https://stripe.com/docs/stripe-cli
stripe login
stripe listen --forward-to localhost:5001/api/payments/webhooks/stripe

# Copy the webhook signing secret and add to .env:
STRIPE_WEBHOOK_SECRET=whsec_...

# Restart backend
```

## Test Scenarios

### Scenario 1: Free Course (No Payment)
1. Create course with price = 0
2. Click "Enroll Now"
3. Should directly enroll WITHOUT opening payment modal
4. Should see success message immediately

### Scenario 2: Paid Course (With Payment)
1. Create course with price > 0
2. Click "Enroll Now"
3. PaymentModal opens
4. Enter card details
5. Payment processes
6. Enrollment activates

### Scenario 3: Failed Payment
1. Use declined test card: 4000 0000 0000 0002
2. Enter card details
3. See error message
4. Modal stays open for retry
5. Try again with valid card

### Scenario 4: Multiple Enrollments
1. Enroll in course as customer1
2. Logout and login as customer2
3. Enroll same course
4. Both students should have separate payment records
5. Both should see course in their "My Learning"

## Performance Testing

### Check Response Times
```bash
# Generate 10 payment requests
for i in {1..10}; do
  curl -X POST http://localhost:5001/api/payments/create-intent \
    -H "Content-Type: application/json" \
    -d '{...}' \
    -w "Time: %{time_total}s\n"
done
```

Target: < 500ms per request

## Production Readiness Checklist

Before deploying to production:

- [ ] Test payment flow locally (this guide)
- [ ] Get live Stripe API keys (https://stripe.com/keys)
- [ ] Update .env.production with live keys
- [ ] Set up webhook endpoint in Stripe dashboard
- [ ] Verify webhook signing secret
- [ ] Deploy to Railway
- [ ] Test payment on production domain
- [ ] Monitor webhook delivery (Stripe Dashboard)
- [ ] Set up error monitoring/logging
- [ ] Create runbook for common issues

## Useful Links

- Stripe Dashboard: https://dashboard.stripe.com
- Stripe Test Cards: https://stripe.com/docs/testing
- Stripe Events: https://dashboard.stripe.com/events
- Stripe CLI: https://stripe.com/docs/stripe-cli
- Webhook Testing: https://stripe.com/docs/webhooks/test

## Success Indicators

Once payment system is working, you should see:

1. **In Browser**:
   - PaymentModal appears on "Enroll Now" for paid courses
   - Payment confirmation message after successful payment
   - Course appears in "My Learning" after payment

2. **In Logs**:
   - Backend logs show payment processing
   - Webhook events are received and processed
   - Enrollment created after webhook confirmation

3. **In Database**:
   - Payment document created with "completed" status
   - Enrollment document created with "active" status
   - Payment and enrollment properly linked via paymentId

4. **In Stripe Dashboard**:
   - Payment appears in test mode
   - Webhook delivery shows successful (200 OK)
   - Events show payment completed

---

**Total Setup Time**: ~5-10 minutes
**Total Testing Time**: ~10-15 minutes

Ready to test! 🚀
