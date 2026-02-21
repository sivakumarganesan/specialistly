# Stripe Payment Integration Configuration

## Environment Variables Setup

### Production (.env.production)

```bash
# ===== STRIPE PRODUCTION KEYS =====
# Get these from https://dashboard.stripe.com/apikeys

# Public Key (safe to expose in frontend)
VITE_STRIPE_PUBLIC_KEY=pk_live_YOUR_PRODUCTION_PUBLIC_KEY_HERE

# Backend Environment
# Secret Key (NEVER expose in frontend)
STRIPE_SECRET_KEY=sk_live_YOUR_PRODUCTION_SECRET_KEY_HERE

# Webhook Secret (for webhook verification)
STRIPE_WEBHOOK_SECRET=whsec_YOUR_PRODUCTION_WEBHOOK_SECRET_HERE

# ===== APPLICATION SETTINGS =====
NODE_ENV=production

# API Configuration
API_BASE_URL=https://api.specialistly.com/api
FRONTEND_URL=https://specialistly.com

# ===== OPTIONAL: STRIPE CONFIGURATION =====
# Stripe API Version (default: 2023-10-16)
STRIPE_API_VERSION=2023-10-16

# Enable certain Stripe features
STRIPE_ENABLE_3D_SECURE=true
```

### Development (.env.development / .env.local)

```bash
# ===== STRIPE TEST KEYS =====
# Get these from https://dashboard.stripe.com/test/apikeys

# Public Key (test mode)
VITE_STRIPE_PUBLIC_KEY=pk_test_YOUR_TEST_PUBLIC_KEY_HERE

# Backend Environment
# Secret Key (test mode - safe to commit only to secure repos)
STRIPE_SECRET_KEY=sk_test_YOUR_TEST_SECRET_KEY_HERE

# Webhook Secret (test mode)
STRIPE_WEBHOOK_SECRET=whsec_test_YOUR_TEST_WEBHOOK_SECRET_HERE

# ===== APPLICATION SETTINGS =====
NODE_ENV=development

# API Configuration
API_BASE_URL=http://localhost:5001/api
FRONTEND_URL=http://localhost:3000

# ===== STRIPE TEST CARDS =====
# Success:        4242 4242 4242 4242
# Decline:        4000 0000 0000 0002
# 3D Secure:      4000 0025 0000 3155
# Expired:        4000 0000 0000 0069
# CVC Error:      4000 0000 0000 0127
# Use any future expiry date (MM/YY) and any 3-digit CVC
```

### Staging (.env.staging)

```bash
# ===== STRIPE TEST KEYS =====
# Use test keys as backup
VITE_STRIPE_PUBLIC_KEY=pk_test_YOUR_TEST_PUBLIC_KEY_HERE
STRIPE_SECRET_KEY=sk_test_YOUR_TEST_SECRET_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_test_YOUR_TEST_WEBHOOK_SECRET_HERE

NODE_ENV=staging
API_BASE_URL=https://staging-api.specialistly.com/api
FRONTEND_URL=https://staging.specialistly.com
```

---

## How to Get Stripe Keys

### Step 1: Create Stripe Account
1. Go to https://stripe.com/
2. Sign up and verify email
3. Complete account setup

### Step 2: Access API Keys
1. Log in to Stripe Dashboard
2. Go to Developers → API keys
3. You'll see:
   - **Publishable Key** (starts with `pk_`)
   - **Secret Key** (starts with `sk_`)

### Step 3: Copy Keys
- **Development/Test**: Use test keys (Dashboard is in "Test Mode" by default)
- **Production/Live**: Switch to "Live Mode" and copy live keys

### Step 4: Set Up Webhook

#### Create Webhook Endpoint
1. Go to Developers → Webhooks
2. Click "Add endpoint"
3. Enter your endpoint URL:
   - **Development**: `http://localhost:5001/api/webhooks/stripe`
   - **Production**: `https://api.specialistly.com/api/webhooks/stripe`
4. Select events to listen for:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
   - `charge.dispute.created`

#### Get Webhook Secret
1. After creating webhook, copy the "Signing secret"
2. Starts with `whsec_`
3. Store as `STRIPE_WEBHOOK_SECRET`

---

## Security Best Practices

### 1. Never Commit Secret Keys
```bash
# Add to .gitignore
.env.production
.env.production.local
.env.local (if contains secret keys)
```

### 2. Use Environment-Specific Keys
- **Development**: Test keys (safe to use for learning)
- **Staging**: Test keys (for final testing before production)
- **Production**: Live keys only

### 3. Rotate Keys Quarterly
1. Generate new key in Stripe Dashboard
2. Update environment variable
3. Redeploy application
4. Revoke old key

### 4. Store Keys Securely
- **Option 1**: Environment variables in hosting platform
  - Railway: Railway → Project Settings → Environment Variables
  - Vercel: Vercel → Project → Settings → Environment Variables
  - Heroku: Heroku Config Vars
- **Option 2**: Secrets management service (AWS Secrets Manager, HashiCorp Vault)
- **Option 3**: Container secrets (Kubernetes Secrets)

### 5. Monitor Key Usage
- Enable Stripe email notifications for key usage
- Review API logs regularly for unusual activity
- Set up alerts for failed payment attempts

---

## Frontend Configuration

### Load Stripe.js

```tsx
// src/main.tsx or App.tsx
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLIC_KEY
);

export default function App() {
  return (
    <Elements stripe={stripePromise}>
      {/* Your app components */}
    </Elements>
  );
}
```

### Use in Components

```tsx
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';

export function PaymentComponent() {
  const stripe = useStripe();
  const elements = useElements();
  
  // Use stripe and elements to process payments
}
```

---

## Backend Configuration

### Express Server Setup

```javascript
// server.js or app.js
import express from 'express';
import paymentRoutes from './backend/routes/paymentRoutes.js';

const app = express();

// IMPORTANT: Webhook route must use raw body (not JSON parsed)
app.post('/api/webhooks/stripe', 
  express.raw({ type: 'application/json' }), 
  webhookHandler
);

// Other routes use JSON
app.use(express.json());
app.use('/api/payments', paymentRoutes);

app.listen(5001, () => {
  console.log('Server running on port 5001');
});
```

### Initialize Stripe Service

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

---

## Testing Payment Flow

### 1. Test Card Numbers

| Scenario | Card Number | Expiry | CVC |
|----------|-------------|--------|-----|
| Success | 4242 4242 4242 4242 | Any future | Any 3 digits |
| Decline | 4000 0000 0000 0002 | Any future | Any 3 digits |
| 3D Secure | 4000 0025 0000 3155 | Any future | Any 3 digits |
| Expired | 4000 0000 0000 0069 | Past date | Any 3 digits |

### 2. Test Payment Flow
1. Start development server: `npm run dev`
2. Open course/service page
3. Click "Enroll" button
4. Enter 4242 4242 4242 4242 in card field
5. Use any future expiry (e.g., 12/25)
6. Use any 3-digit CVC (e.g., 123)
7. Submit payment
8. Should see success message

### 3. Test Webhook Locally

#### Option 1: Use Stripe CLI
```bash
# Install Stripe CLI: https://stripe.com/docs/stripe-cli

# Trigger test webhook
stripe trigger payment_intent.succeeded

# Listen for webhooks locally
stripe listen --forward-to localhost:5001/api/webhooks/stripe

# Get webhook signing secret
stripe listen # Shows signing secret in output
```

#### Option 2: Use Test Endpoint
```bash
# POST /api/webhooks/test (development only)
curl -X POST http://localhost:5001/api/webhooks/test \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN"
```

---

## Deployment Checklist

### Before Deploying to Production

- [ ] Switched to live Stripe keys
- [ ] Updated `.env.production` with live keys
- [ ] Webhook endpoint configured in Stripe Dashboard
- [ ] Webhook signing secret updated
- [ ] HTTPS enabled (required for webhooks)
- [ ] Rate limiting configured
- [ ] Error logging set up
- [ ] Monitoring and alerts configured
- [ ] Database backups enabled
- [ ] Payment reconciliation script created
- [ ] Tested full payment flow in staging
- [ ] Tested webhook delivery
- [ ] Tested refund process
- [ ] 3D Secure / SCA handling verified

### After Deploying to Production

- [ ] Monitor webhook delivery logs
- [ ] Check payment success rate
- [ ] Set up alerts for payment failures
- [ ] Review Stripe Dashboard for any issues
- [ ] Monitor database for payment records
- [ ] Test support flow (customer questions about payment)

---

## Troubleshooting

### Webhook Not Receiving Events

1. Check webhook secret is correct:
   ```bash
   # Verify in .env
   echo $STRIPE_WEBHOOK_SECRET
   ```

2. Verify endpoint is accessible:
   ```bash
   curl https://yourdomain.com/api/webhooks/stripe
   ```

3. Check Stripe Dashboard for webhook failures:
   - Developers → Webhooks
   - Click webhook endpoint
   - Check Recent Attempts

### Payment Intent Creation Fails

1. Check API key is valid
2. Verify amount is at least 100 (smallest unit)
3. Check customer email format
4. Review error message in response

### Payment Processing Timeout

1. Check network connectivity
2. Increase timeout in stripeService config
3. Implement retry logic for failed requests

### 3D Secure Not Triggering

1. Ensure Stripe account has SCA enabled
2. Use 3D Secure test card: 4000 0025 0000 3155
3. Check that `automatic_payment_methods` is enabled in Payment Intent

---

## References

- [Stripe Documentation](https://stripe.com/docs)
- [API Keys Guide](https://stripe.com/docs/keys)
- [Payment Intents API](https://stripe.com/docs/payments/payment-intents)
- [Webhooks Guide](https://stripe.com/docs/webhooks)
- [3D Secure](https://stripe.com/docs/payments/sca)
- [Test Cards](https://stripe.com/docs/testing)
