# Stripe Marketplace Setup Guide for Specialistly

Complete step-by-step guide to set up Stripe for Specialistly's marketplace model where customers pay specialists directly and Specialistly takes a commission.

---

## Part 1: Set Up Specialistly's Main Stripe Account

### Step 1: Create Specialistly Stripe Account

1. Go to **[stripe.com/register](https://stripe.com/register)**
2. Click **"Start now"** → **"Create a business account"**
3. Enter:
   - **Business name**: Specialistly
   - **Business email**: your-email@specialistly.com
   - **Country**: Your country
   - **Website**: https://specialistly.com
4. Complete verification (email + phone)
5. Set up bank account for receiving commission payouts

### Step 2: Get Specialistly's API Keys (Test Mode First)

1. Log in to **Stripe Dashboard**: https://dashboard.stripe.com
2. Dashboard should show **"Test Mode"** toggle in top-right
3. Click **Developers** (left sidebar) → **API keys**
4. You'll see two keys:

```
VITE_STRIPE_PUBLIC_KEY=pk_test_XXXXXXXXXXXXXXX
STRIPE_SECRET_KEY=sk_test_XXXXXXXXXXXXXXX
```

5. Copy both keys (you'll need them in Step 6)

### Step 3: Create Webhook Endpoint

1. Go to **Developers** → **Webhooks** (left sidebar)
2. Click **"Add endpoint"**
3. Enter endpoint URL:
   - **Development**: `http://localhost:5001/api/webhooks/stripe`
   - **Production**: `https://specialistly-production.up.railway.app/api/webhooks/stripe`
4. Select events to listen for:
   - ✅ `payment_intent.succeeded`
   - ✅ `payment_intent.payment_failed`
   - ✅ `charge.refunded`
   - ✅ `charge.dispute.created`
5. Click **"Add endpoint"**
6. Copy the **Signing Secret** (starts with `whsec_test_` or `whsec_`)

```
STRIPE_WEBHOOK_SECRET=whsec_test_XXXXXXXXXXXXXXX
```

### Step 4: Configure Environment Variables in Railway

1. Go to **Railway.app** → Your Project
2. Click **Backend service** → **Variables**
3. Add these environment variables:

```
VITE_STRIPE_PUBLIC_KEY=pk_test_YOUR_PUBLISHABLE_KEY
STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY
STRIPE_WEBHOOK_SECRET=whsec_test_YOUR_WEBHOOK_SECRET
STRIPE_MARKETPLACE_MODE=true
STRIPE_COMMISSION_PERCENTAGE=15
FRONTEND_URL=https://specialistly-production.up.railway.app
```

4. Click **Deploy** to apply changes

### Step 5: Verify Webhook Setup

```bash
# In your terminal, run:
curl -X POST http://localhost:5001/api/webhooks/stripe \
  -H "Content-Type: application/json" \
  -H "Stripe-Signature: test_signature" \
  -d '{"type":"charge.succeeded"}'
```

Should return: `✅ Webhook received successfully`

---

## Part 2: Specialist Onboarding Flow

### How It Works

1. **Specialist** logs into Specialistly dashboard
2. Goes to **Settings** → **Earnings** → **Connect Stripe Account**
3. Specialist clicks **"Connect with Stripe"**
4. Gets redirected to Stripe to create Express account
5. Completes quick onboarding (personal info, bank account)
6. Returns to Specialistly with account connected
7. Can now receive payments from course enrollments

### Step 1: Enable Specialist to Onboard

Specialists can access the onboarding link via:

**API Endpoint:**
```
POST /api/marketplace/specialist/onboarding-link
Headers: Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "onboardingUrl": "https://connect.stripe.com/onboarding/...",
  "expiresAt": "2026-02-27T12:00:00Z",
  "accountId": "acct_1234567890"
}
```

### Step 2: Specialist Completes Onboarding

1. **Specialist** clicks the onboarding link
2. **Stripe Express** form appears with:
   - Full name
   - Email
   - Phone
   - Date of birth
   - Business details
   - Bank account info
3. **Specialist** submits and waits for verification (usually instant)
4. **Specialist** is redirected back to Specialistly
5. Status shows **"Connected and ready to receive payments"**

### Step 3: Verify Specialist Account Status

**API Endpoint:**
```
GET /api/marketplace/specialist/status
Headers: Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "status": "active",
  "accountId": "acct_1234567890",
  "accountStatus": {
    "accountId": "acct_1234567890",
    "chargesEnabled": true,
    "payoutsEnabled": true,
    "verified": true,
    "requirements": {
      "pending": [],
      "past_due": []
    }
  }
}
```

---

## Part 3: Test the Payment Flow

### Step 1: Create Test Specialist

1. Sign up as "Test Specialist" on your platform
2. Go to **Settings** → **Earnings**
3. Click **"Connect Stripe Account"**
4. Complete Stripe Express onboarding with **test data**

### Step 2: Create Test Course

1. Log in as specialist
2. Go to **My Courses** → **Create Course**
3. Set price: **$19.99**
4. Add lesson and publish

### Step 3: Test Customer Payment

**Test Card Details:**
```
Card Number: 4242 4242 4242 4242
Expiry: 12/25 (any future date)
CVC: 123 (any 3 digits)
```

**Flow:**
1. Log out
2. Log in as **different customer**
3. Go to **Marketplace** → Find specialist's course
4. Click **"Enroll Now"**
5. Enter test card above
6. Submit payment
7. Should see **"Payment successful"**

### Step 4: Verify Payment in Stripe Dashboard

1. Go to **Stripe Dashboard** → **Payments**
2. Find the payment (should show $19.99)
3. Click it to see details:
   - **Customer**: Your test customer
   - **Amount**: $19.99 full amount
   - **Status**: Succeeded
   - **Application Fee**: $2.99 (15% commission to Specialistly)
   - **Transfer**: $16.99 sent to specialist's account

### Step 5: Check Specialist Earnings

**API Endpoint:**
```
GET /api/marketplace/specialist/earnings
Headers: Authorization: Bearer {specialist_token}
```

**Response:**
```json
{
  "success": true,
  "earnings": {
    "totalPayouts": 16.99,
    "totalCommissionsPaid": 2.99,
    "totalTransactions": 1,
    "lastPayoutDate": null
  }
}
```

---

## Part 4: Set Up Production (Live Mode)

### Step 1: Switch Stripe to Live Mode

1. Go to Stripe Dashboard
2. Click **Live Mode** toggle (top-right)
3. You'll now see live keys (not test keys)

### Step 2: Get Live API Keys

1. Click **Developers** → **API keys** (should show live keys now)
2. Copy live keys:

```
VITE_STRIPE_PUBLIC_KEY=pk_live_XXXXXXXXXXXXXXX
STRIPE_SECRET_KEY=sk_live_XXXXXXXXXXXXXXX
```

### Step 3: Create Production Webhook

1. Go to **Developers** → **Webhooks**
2. Click **"Add endpoint"** (create a NEW one for production)
3. Enter:
   - **URL**: `https://specialistly-production.up.railway.app/api/webhooks/stripe`
   - **Events**: Same as before (payment_intent.succeeded, etc.)
4. Copy the **live** webhook secret:

```
STRIPE_WEBHOOK_SECRET=whsec_XXXXXXXXXXXXXXX (live version)
```

### Step 4: Update Railway Environment Variables

1. Go to Railway → Backend service → **Variables**
2. Update these to LIVE keys:

```
VITE_STRIPE_PUBLIC_KEY=pk_live_YOUR_LIVE_PUBLISHABLE_KEY
STRIPE_SECRET_KEY=sk_live_YOUR_LIVE_SECRET_KEY
STRIPE_WEBHOOK_SECRET=whsec_YOUR_LIVE_WEBHOOK_SECRET
```

3. Click **Deploy**

### Step 5: Test with Real Payment

1. Use a real credit card (will actually charge)
2. Or continue using test cards (test mode still works on live account)

---

## Part 5: Specialist Features

### Check Specialist Dashboard Login Link

**API Endpoint:**
```
POST /api/marketplace/specialist/dashboard-link
Headers: Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "dashboardUrl": "https://dashboard.stripe.com/a/ACCOUNT_ID/merchants",
  "expiresIn": "30 minutes"
}
```

### Get Specialist Commission History

**API Endpoint:**
```
GET /api/marketplace/specialist/commissions?status=completed&limit=10&page=1
Headers: Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "commissions": [
    {
      "_id": "...",
      "paymentIntentId": "pi_...",
      "customerId": "...",
      "grossAmount": 1999,           // $19.99 in cents
      "commissionAmount": 299,       // $2.99 (15%)
      "specialistPayout": 1700,      // $17.00
      "status": "completed",
      "payoutStatus": "paid",
      "createdAt": "2026-02-27T10:00:00Z"
    }
  ],
  "pagination": {
    "total": 1,
    "page": 1,
    "limit": 10
  }
}
```

---

## Part 6: Troubleshooting

### Issue: "Specialist has not set up Stripe account"

**Solution:**
- Specialist needs to complete onboarding first
- Send them the onboarding link: `POST /api/marketplace/specialist/onboarding-link`
- They should click the link and complete Stripe Express form

### Issue: "Specialist account is not fully set up"

**Solution:**
- Specialist account status is still "pending"
- Check: `GET /api/marketplace/specialist/status`
- Requirements might be pending (ask for additional documents)
- Usually takes a few minutes to a few hours for approval

### Issue: Webhook not receiving events

**Solution:**
- Verify webhook URL is correct in Stripe Dashboard
- Check that STRIPE_WEBHOOK_SECRET matches webhook signing secret
- Restart backend: `npm run dev` (for local)
- In production, check Railway logs

### Issue: Payment failed with "Application error"

**Solution:**
- Check backend logs for errors
- Verify specialist's Stripe account is active
- Try test card again: 4242 4242 4242 4242

---

## Part 7: Commission Settings

### How Commission Works

**Example:**
- Course price: **$100**
- Commission percentage: **15%**
- Specialistly receives: **$15**
- Specialist receives: **$85**

### Change Commission Percentage

**Per Specialist:**
Update in MongoDB:
```javascript
db.creatorprofiles.updateOne(
  { _id: specialistId },
  { $set: { commissionPercentage: 20 } }  // 20% instead of 15%
)
```

**Global Default:**
Environment variable:
```
STRIPE_COMMISSION_PERCENTAGE=15
```

---

## Part 8: Quick Reference

### Key API Endpoints

```
# Marketplace Payments
POST   /api/marketplace/payments/create-intent
GET    /api/marketplace/payments/{paymentIntentId}

# Specialist Onboarding
POST   /api/marketplace/specialist/onboarding-link
GET    /api/marketplace/specialist/status
POST   /api/marketplace/specialist/dashboard-link

# Specialist Earnings
GET    /api/marketplace/specialist/earnings
GET    /api/marketplace/specialist/commissions
```

### Test Card Numbers

| Scenario | Card | Expiry | CVC |
|----------|------|--------|-----|
| Success | 4242 4242 4242 4242 | Any future | Any 3 |
| Decline | 4000 0000 0000 0002 | Any future | Any 3 |
| 3D Secure | 4000 0025 0000 3155 | Any future | Any 3 |

### Environment Variables

```bash
# Specialistly Main Account
VITE_STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_test_...

# Marketplace Config
STRIPE_MARKETPLACE_MODE=true
STRIPE_COMMISSION_PERCENTAGE=15
FRONTEND_URL=https://specialistly.com
```

---

## Part 9: Security Checklist

- [ ] STRIPE_SECRET_KEY is only in backend (never in frontend)
- [ ] VITE_STRIPE_PUBLIC_KEY can be in frontend (it's public)
- [ ] Webhook secret is correct and not exposed
- [ ] HTTPS enabled (required for webhooks)
- [ ] Returned URL uses HTTPS only
- [ ] Database backups enabled
- [ ] Monitor webhook delivery logs weekly
- [ ] Set up Stripe email alerts for high-risk transactions
- [ ] Test refund process monthly

---

## Summary

**Phase 1: Setup (Today)**
1. ✅ Create Specialistly Stripe account
2. ✅ Get test API keys
3. ✅ Set up webhook endpoint
4. ✅ Add environment variables to Railway
5. ✅ Deploy and test

**Phase 2: Specialist Onboarding (Ongoing)**
1. Specialist accesses `/dashboard/earnings`
2. Clicks "Connect Stripe"
3. Completes Express onboarding
4. Returns connected and ready to receive payments

**Phase 3: Production (When Ready)**
1. Switch Stripe to live mode
2. Get live API keys
3. Create production webhook
4. Update Railway variables with live keys
5. Deploy

**Phase 4: Monitor & Maintain**
1. Monitor webhook delivery
2. Track specialist payouts
3. Handle disputes and refunds
4. Quarterly key rotation
