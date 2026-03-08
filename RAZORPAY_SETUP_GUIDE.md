# Razorpay Payment Gateway Setup Guide

## Overview
This guide explains how to set up and test Razorpay payments for course purchases. Razorpay is available alongside Stripe, allowing Indian customers to pay in INR with multiple payment methods (Card, UPI, NetBanking).

## Quick Start: Enable Test Payments

### Step 1: Create Razorpay Account
1. Visit [Razorpay](https://razorpay.com)
2. Click **Sign Up** and create an account
3. Complete basic business verification (takes minutes)

### Step 2: Get Test Credentials
1. Log in to [Razorpay Dashboard](https://dashboard.razorpay.com)
2. Click **Settings** → **API Keys** on the left sidebar
3. You'll see two sections: **Test Key** and **Live Key**
4. **Test Key** is what you need to start (live production payments)
5. Copy both values:
   - **Key ID** (starts with `rzp_test_`)
   - **Key Secret** (long string)

### Step 3: Configure Environment Variables

#### Local Development (.env)
```bash
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_secret_key_here
```

#### Railway Production
1. Go to [Railway Dashboard](https://railway.app)
2. Select your project
3. Click **Variables** tab
4. Add two new variables:
   - **RAZORPAY_KEY_ID**: `rzp_test_xxxxxxxxxxxxxxxxxxx`
   - **RAZORPAY_KEY_SECRET**: Your test secret key
5. Click **Deploy** to apply changes

### Step 4: Test Payment Flow
1. Start your application
2. Go to **Browse Courses** → Select a course
3. Click **Enroll Now**
4. In the payment modal, you should see **two options**:
   - Stripe (Credit/Debit Card, USD)
   - **Razorpay (Card, UPI, NetBanking, INR)** ← New!
5. Select **Razorpay**
6. Use test card details below

## Test Payment Methods

### Test Cards
Use these cards to test Razorpay payments in test mode:

| Card Type | Number | Expiry | CVV | Result |
|-----------|---------|--------|-----|--------|
| Visa | `4111 1111 1111 1111` | Any future date | Any 3 digits | **Success** ✅ |
| Mastercard | `5555 5555 5555 4444` | Any future date | Any 3 digits | **Success** ✅ |
| Visa (Fail) | `4000 0000 0000 0002` | Any future date | Any 3 digits | **Failure** ❌ |

**Example**: For a card expiring in December 2026:
- Date: `12/26`
- CVV: `123`

### Test UPI ID
```
success@razorpay
```
This will simulate a successful UPI payment.

### Alternative: Test OTP
When prompted, use any 6-digit OTP like `123456` to complete payments.

## What's Happening Behind the Scenes

### Test Mode Behavior
- **Mode**: Razorpay starts in **Test Mode** by default
- **Credentials**: Test credentials (starting with `rzp_test_`) work only in test mode
- **No Real Charges**: No actual money is charged during testing
- **Webhooks**: Test webhooks arrive at your endpoint for verification
- **Database**: Test payments create enrollment records but can be deleted

### Payment Flow
1. **User selects Razorpay** → Payment modal shows gateway selector
2. **Backend creates order** → `GET /api/marketplace/payments/create-intent` returns Razorpay Order ID
3. **Frontend opens modal** → Razorpay SDK displays payment options
4. **User chooses payment method**:
   - Card → Enter test card details
   - UPI → Enter UPI ID
   - NetBanking → Select bank (test available)
5. **Razorpay processes payment** → Calls webhook on completion
6. **Webhook handler** → Updates enrollment status + commission records
7. **User redirected** → Dashboard shows active enrollment

## Troubleshooting

### Issue: "Razorpay option not showing"
**Cause**: Environment variables not set in Railway
**Fix**: 
1. Set `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in Railway Variables
2. Redeploy the application
3. Refresh browser

### Issue: "Failed to create payment order"
**Cause**: Test payment not initiated correctly
**Solutions**:
1. Verify credentials are correct in `.env`
2. Restart the backend: `npm run dev`
3. Check browser console for detailed error
4. Ensure modal is opened and Razorpay is selected

### Issue: "Payment successful but enrollment not created"
**Cause**: Webhook not processed
**Fix**:
1. Check railway logs for webhook errors
2. Verify webhook endpoint is registered: `POST /api/webhooks/razorpay`
3. Ensure signature verification passes

### Issue: Test modal closes without payment
**Cause**: Usually clicking X or pressing ESC
**Note**: This triggers `payment.failed` webhook, creating failed record

## Payment Details & Breakdown

When you initiate a Razorpay payment:
- **Base Price**: Course price (displayed in INR)
- **Commission**: 15% deducted for platform
- **Specialist Payout**: 85% goes to course creator
- **Currency**: INR (₹)

**Example**:
- Course Price: ₹1,000
- Commission (15%): ₹150
- Specialist Gets: ₹850

## Switching to Live Payments

### ⚠️ Important: Production Setup

When you're ready for real payments:

1. **Get Live Credentials**:
   - Log into Razorpay Dashboard
   - Go to **Settings** → **API Keys**
   - Click the **Live Key** tab
   - Copy **Live Key ID** (starts with `rzp_live_`)
   - Copy **Live Key Secret**

2. **Update Environment**:
   ```bash
   # Railway Variables section
   RAZORPAY_KEY_ID=rzp_live_your_live_key_id
   RAZORPAY_KEY_SECRET=your_live_secret_key
   ```

3. **Verify in Railway Logs**:
   - Redeploy application
   - Check logs for successful initialization
   - You should NOT see: "Razorpay credentials not configured"

4. **Test First**:
   - Have specialists test payment flow
   - Verify commission calculations are correct
   - Check payout arrival timelines

5. **Enable Razorpay Payouts** (Optional):
   - Log into Razorpay Dashboard
   - Go to **Payouts** section
   - Configure bank details for automatic payouts to specialists
   - Set payout frequency (daily/weekly/monthly)

## Monitoring & Support

### Dashboard Monitoring
1. **Razorpay Dashboard**: https://dashboard.razorpay.com
   - View all transactions
   - Check payment status
   - Monitor refunds
   - Download statements

2. **Application Logs**:
   - Payment creation logs (in Railway)
   - Webhook processing logs
   - Signature verification logs

### Getting Help
1. **Razorpay Support**: https://razorpay.com/support
2. **Integration Issues**: Check webhook logs in Railway
3. **Test vs Live**: Verify you're using test credentials in test mode

## API Response Examples

### Successful Payment Intent Creation
```json
{
  "success": true,
  "paymentGateway": "razorpay",
  "orderId": "order_1234567890abcd",
  "amount": 1000,
  "currency": "INR",
  "commissionRecord": "MongoDB_ID",
  "commissionAmount": 150,
  "specialistPayout": 850,
  "keyId": "rzp_test_xxxxxxxxxxxxxxxxxxx"
}
```

### Webhook Event (Payment Success)
```json
{
  "event": "payment.authorized",
  "payload": {
    "payment": {
      "entity": {
        "id": "pay_1234567890abcd",
        "order_id": "order_1234567890abcd",
        "status": "authorized",
        "amount": 100000,
        "currency": "INR"
      }
    }
  }
}
```

## Next Steps

1. **Complete Setup**: Follow Step 1-4 above
2. **Test Payments**: Use test card numbers
3. **Verify Enrollments**: Check dashboard for active courses
4. **Review Commissions**: Check specialist commission records
5. **Switch to Live**: When ready for production

## FAQ

**Q: What's the difference between test and live credentials?**
A: Test credentials (rzp_test_*) work in sandbox mode with fake payments. Live credentials (rzp_live_*) charge real money. Both exist in the same Razorpay account.

**Q: Can I use test and live credentials at the same time?**
A: No. You can only have one set active. Applications using test credentials will accept test payments. Applications using live credentials will accept real payments.

**Q: What currencies does Razorpay support?**
A: Currently implemented: INR (₹). Can add USD, GBP, etc. by updating course price handling.

**Q: How long do test payments take?**
A: Webhooks trigger immediately in test mode (< 1 second).

**Q: Can specialists receive payouts in test mode?**
A: No. Test payments don't generate real payouts. Use live credentials for actual payouts.

**Q: Where do specialist payments go?**
A: Razorpay transfers 85% of revenue to specialist's connected bank account (configured in Razorpay Payouts).

