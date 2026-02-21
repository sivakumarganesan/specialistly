# Production Deployment Guide: Stripe Payment Integration

## 1. Pre-Deployment Checklist

### Code Readiness
- [ ] All payment endpoints tested locally
- [ ] Webhook handler tested with Stripe CLI
- [ ] Error handling implemented for all scenarios
- [ ] Logging configured for debugging
- [ ] Rate limiting implemented
- [ ] CORS properly configured
- [ ] HTTPS enforced for all endpoints

### Database
- [ ] Payment collection created with indexes
- [ ] Enrollment schema updated with payment fields
- [ ] Database backups configured
- [ ] Migration scripts prepared
- [ ] Rollback procedures documented

### Stripe Account Setup
- [ ] Live Stripe account created and verified
- [ ] Security review completed by Stripe
- [ ] Live API keys obtained
- [ ] Webhook endpoint configured
- [ ] Event filtering configured
- [ ] Email notifications enabled for security alerts

### Environment Configuration
- [ ] Production `.env` file prepared (NOT in Git)
- [ ] All Stripe keys updated to live keys
- [ ] Database connection string verified
- [ ] Email service credentials configured
- [ ] Logging service configured
- [ ] Monitoring/alerts configured

### Security & Compliance
- [ ] PCI compliance validated (using Stripe, not storing cards)
- [ ] SSL/TLS certificate obtained (auto with Railway/Vercel)
- [ ] API request signing implemented where needed
- [ ] IP whitelisting for sensitive endpoints considered
- [ ] API rate limiting configured
- [ ] CSRF protection enabled

---

## 2. Deployment Strategy

### Phase 1: Staging Deployment (1-2 days)

#### Deploy Code to Staging
```bash
# Build application
npm run build

# For Railway: Push to staging branch
git push staging main

# For Vercel: Deploy preview
vercel deploy

# For other platforms: Deploy using their CLI
```

#### Configure Staging Environment
1. Use Stripe **test keys** for safety
2. Configure webhook endpoint to staging domain
3. Set up test database or copy from production (sanitized)
4. Configure logging and monitoring

#### Run Staging Tests
```bash
# Test payment flow
1. Create test enrollment
2. Initiate payment with test card 4242 4242 4242 4242
3. Verify payment success
4. Confirm enrollment activated
5. Verify emails sent
6. Confirm specialist sees enrollment

# Test webhook
1. Use Stripe CLI to trigger webhook
2. Verify enrollment status updated
3. Check logs for processing

# Test error scenarios
1. Using 4000 0000 0000 0002 (decline)
2. Using 4000 0025 0000 3155 (3D Secure)
3. Cancel payment mid-process
4. Retry payment after failure
```

#### Monitoring Setup
- Set up alerts for payment failures
- Configure error logging (e.g., Sentry, LogRocket)
- Set up uptime monitoring
- Test alert notifications

### Phase 2: Production Deployment (approval required)

#### Pre-Deployment (Day Before)
1. Schedule maintenance window (optional)
2. Notify users of potential payment downtime (if applicable)
3. Prepare rollback plan
4. Have team available for monitoring

#### Deploy Code
```bash
# For Railway
git push main

# For Vercel
vercel deploy --prod

# For Other Platforms
# Use platform-specific deployment command
```

#### Configure Production Environment
1. Set production environment variables:
   ```
   STRIPE_PUBLIC_KEY=pk_live_...
   STRIPE_SECRET_KEY=sk_live_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   NODE_ENV=production
   API_BASE_URL=https://api.specialistly.com/api
   ```

2. Update Stripe webhook endpoint:
   - Developers → Webhooks → Add Endpoint
   - URL: `https://api.specialistly.com/api/webhooks/stripe`
   - Events: payment_intent.succeeded, payment_intent.payment_failed, charge.refunded

3. Verify production database is configured correctly

#### Initial Monitoring (First Hours)
1. Monitor payment success rate
2. Check webhook delivery logs
3. Monitor error rates
4. Alert team to any issues
5. Have quick rollback plan ready

---

## 3. Production Configuration Examples

### Railway Deployment

#### Step 1: Configure Environment Variables
```
In Railway Dashboard → Project → Environment Variables:

STRIPE_PUBLIC_KEY: pk_live_xxx
STRIPE_SECRET_KEY: sk_live_xxx
STRIPE_WEBHOOK_SECRET: whsec_xxx
NODE_ENV: production
DATABASE_URL: mongodb+srv://user:pass@cluster.mongodb.net/specialistly
API_BASE_URL: https://specialistly-production.up.railway.app/api
```

#### Step 2: Configure Webhook
```
In Stripe Dashboard → Developers → Webhooks:
- Add Endpoint
- URL: https://specialistly-production.up.railway.app/api/webhooks/stripe
- Events to send:
  ✓ payment_intent.succeeded
  ✓ payment_intent.payment_failed
  ✓ charge.refunded
  ✓ charge.dispute.created
```

#### Step 3: Deploy
```bash
# Push to main branch
git add -A
git commit -m "Deploy: Stripe payment integration production"
git push main

# Railway auto-deploys on push
# Monitor deployment in Railway Dashboard
```

### Vercel Deployment (Frontend + Serverless API)

#### Step 1: Configure Environment Variables
```
In Vercel Dashboard → Project → Settings → Environment Variables:

VITE_STRIPE_PUBLIC_KEY: pk_live_xxx
STRIPE_SECRET_KEY: sk_live_xxx (Production only)
STRIPE_WEBHOOK_SECRET: whsec_xxx (Production only)
```

#### Step 2: Deploy
```bash
vercel deploy --prod
```

#### Step 3: Configure Webhook
- Same as above in Stripe Dashboard
- Webhook URL: `https://yourdomain.vercel.app/api/webhooks/stripe`

### Docker/Kubernetes Deployment

#### Step 1: Create Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application
COPY . .

# Build frontend
RUN npm run build

# Expose port
EXPOSE 5001

# Start server
CMD ["node", "backend/server.js"]
```

#### Step 2: Deploy to Kubernetes
```bash
# Create secrets
kubectl create secret generic stripe-keys \
  --from-literal=STRIPE_SECRET_KEY=sk_live_xxx \
  --from-literal=STRIPE_WEBHOOK_SECRET=whsec_xxx

# Deploy using kubectl or Helm
kubectl apply -f deployment.yaml
```

---

## 4. Monitoring & Observability

### Set Up Logging

#### Option 1: Cloud Logging (Recommended)
```bash
# For Google Cloud
npm install @google-cloud/logging

# For AWS
npm install aws-sdk
```

#### Option 2: Third-Party Service
```bash
# Sentry (error tracking)
npm install @sentry/node

# LogRocket (session replay)
npm install logrocket

# Datadog (monitoring & analytics)
npm install dd-trace
```

### Set Up Alerts

#### Webhook Monitoring
```
Alert when:
- Webhook failure rate > 1%
- Webhook response time > 10 seconds
- No webhooks received in 1 hour
```

#### Payment Monitoring
```
Alert when:
- Payment success rate < 95%
- More than 10 failed payments in 1 hour
- Refund rate > 5%
- Unusual spike in payment amounts
```

#### Infrastructure Monitoring
```
Alert when:
- API latency > 1 second
- Database connections >> normal
- Memory usage > 80%
- Error rate > 1%
```

### Sample Monitoring Dashboard

```
Key Metrics to Track:
├── Payments
│   ├── Total Revenue (today/week/month)
│   ├── Success Rate (target: >98%)
│   ├── Average Transaction Value
│   ├── Failed Payments (last 24h)
│   └── Refund Rate (target: <2%)
├── Webhooks
│   ├── Events Received (last 24h)
│   ├── Processing Time (avg/p95)
│   ├── Failure Rate
│   └── Latest Events
├── Enrollments
│   ├── New Enrollments (today)
│   ├── Conversion Rate
│   ├── Pending Payments
│   └── Refunded Enrollments
└── System Health
    ├── API Latency
    ├── Error Rate
    ├── Database Connections
    └── Disk Usage
```

---

## 5. Runbooks & Procedures

### Emergency Response: Payment Processing Down

1. **Assess Situation**
   - Check Stripe status: https://status.stripe.com/
   - Check API logs for errors
   - Check webhook delivery logs

2. **Notify Users**
   - Post incident update on status page
   - Send email to affected users
   - Update in-app notification

3. **Investigation Steps**
   ```bash
   # Check server logs
   tail -f logs/stripe-webhooks.log
   tail -f logs/payment-errors.log
   
   # Check database
   db.payments.find({ status: "processing" }).count()
   
   # Check Stripe API
   curl -H "Authorization: Bearer sk_test_..." \
        https://api.stripe.com/v1/payment_intents
   ```

4. **Recovery**
   - If code issue: Deploy fix
   - If webhook issue: Reconfigure endpoint
   - If database issue: Check connections, restart if needed
   - Retry failed payments manually if needed

### Runbook: Process Refund Manually

```bash
# 1. Find payment
db.payments.findOne({ customerEmail: "user@example.com" })

# 2. Get payment intent ID
const paymentIntentId = "pi_xxxxx"

# 3. Process refund via Stripe API
curl https://api.stripe.com/v1/refunds \
  -d payment_intent=pi_xxxxx \
  -H "Authorization: Bearer sk_live_..." \
  -X POST

# 4. Update payment record
db.payments.updateOne(
  { paymentId: "pi_xxxxx" },
  { $set: { 
      status: "refunded",
      refundedAt: new Date()
    }
  }
)

# 5. Update enrollment
db.enrollments.updateOne(
  { paymentId: ObjectId("...") },
  { $set: { 
      status: "refunded",
      paymentStatus: "refunded"
    }
  }
)

# 6. Send notification
# (Through your email service)
```

### Runbook: Reconciliation After Outage

```javascript
// reconcile-payments.js
// Run after extended downtime to fix missing records

import Stripe from 'stripe';
import Payment from './models/Payment.js';
import Enrollment from './models/Enrollment.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function reconcilePayments() {
  console.log('Starting payment reconciliation...');
  
  // Fetch all completed payments from Stripe (last 24 hours)
  const now = Math.floor(Date.now() / 1000);
  const yesterday = now - 86400;
  
  const stripePayments = await stripe.paymentIntents.list({
    status: 'succeeded',
    created: { gte: yesterday },
    limit: 100,
  });
  
  let matched = 0;
  let updated = 0;
  
  for (const pi of stripePayments.data) {
    // Check if we have this payment in DB
    const dbPayment = await Payment.findOne({
      paymentId: pi.id,
    });
    
    if (!dbPayment) {
      console.log(`⚠️  Missing payment in DB: ${pi.id}`);
      // Create missing payment record
      const payment = await Payment.create({
        paymentId: pi.id,
        amount: pi.amount,
        currency: pi.currency,
        status: 'completed',
        stripeResponse: pi,
      });
      updated++;
    } else if (dbPayment.status !== 'completed') {
      console.log(`📝 Updating payment status: ${pi.id}`);
      dbPayment.status = 'completed';
      await dbPayment.save();
      updated++;
    } else {
      matched++;
    }
  }
  
  console.log(`✓ Reconciliation complete`);
  console.log(`  Matched: ${matched}`);
  console.log(`  Updated: ${updated}`);
  console.log(`  Total: ${matched + updated}`);
}

reconcilePayments();
```

---

## 6. Performance Optimization

### Optimize Payment Creation
- Cache service/course details to reduce DB queries
- Use connection pooling for database
- Implement rate limiting: 10 payment intents per user per minute

### Optimize Webhook Processing
- Use message queue (Redis, RabbitMQ) for async processing
- Batch email sending
- Use database transactions to prevent partial updates

### Database Optimization
```javascript
// Create indexes for common queries
db.payments.createIndex({ customerId: 1, status: 1 })
db.payments.createIndex({ specialistId: 1, createdAt: -1 })
db.payments.createIndex({ stripeEventId: 1 }, { unique: true })
db.enrollments.createIndex({ paymentId: 1 })
```

---

## 7. Compliance & Security

### PCI DSS Compliance
✓ Using Stripe: No need to store card details  
✓ Implement tokenization: Card data never touches your servers  
✓ Use HTTPS only: All data in transit encrypted  
✓ Implement logging: Audit trail for all payment events  

### Data Retention Policy
```
- Payment records: Keep for 7 years (tax/legal requirement)
- Customer card tokenization: Stripe handles (not needed)
- Logs: Keep for 90 days (compliance)
- Webhook events: Keep for 1 year (audit trail)
```

### Security Best Practices Production
```
✓ Rotate API keys every 3 months
✓ Monitor API key usage
✓ Enable webhooks signature verification
✓ Implement rate limiting (prevent brute force)
✓ Use firewall rules to restrict payment API access
✓ Enable audit logging for all operations
✓ Implement break-glass procedures for emergencies
✓ Regular security audits and penetration testing
```

---

## 8. Rollback Plan

### If Serious Issue Detected

```bash
# Step 1: Stop accepting new payments
# (Deploy hotfix that disables payment endpoints)
git revert HEAD~1  # Revert last commit
npm run build
git push main

# Step 2: Disable Stripe webhook (temporary)
# (In Stripe Dashboard: Developers → Webhooks → Disable)

# Step 3: Notify users
# (Update status page, send email)

# Step 4: Investigate root cause

# Step 5: Apply fix and test in staging thoroughly

# Step 6: Re-enable and redeploy when confident
```

### Data Recovery
```bash
# If payments or enrollments corrupted:

# 1. Stop application
systemctl stop wor-app

# 2. Restore database from backup
mongorestore --archive=/backup/mongo-backup-20240221.archive

# 3. Reconcile with Stripe (see reconciliation script above)

# 4. Restart application
systemctl start special-app
```

---

## 9. Post-Deployment (First Week)

### Daily Checks
- [ ] Monitor payment success rate (should be >98%)
- [ ] Check webhook delivery logs
- [ ] Review error logs
- [ ] Verify enrollments being created correctly
- [ ] Monitor database growth

### Weekly Review
- [ ] Generate payment statistics report
- [ ] Review all failed payments for patterns
- [ ] Check system performance metrics
- [ ] Review customer support tickets related to payments
- [ ] Verify backups are working

### Monthly Review
- [ ] Full payment reconciliation (Stripe vs. Database)
- [ ] Review fraud patterns and suspicious transactions
- [ ] Update security patches
- [ ] Review and optimize database queries
- [ ] Generate financial reports

---

## 10. Support & Contact

### Stripe Support
- Dashboard: https://dashboard.stripe.com/
- Documentation: https://stripe.com/docs
- API Reference: https://stripe.com/docs/api/
- Support Portal: https://support.stripe.com/

### Emergency Contacts
```
Stripe Status: https://status.stripe.com/
Stripe Support: support@stripe.com (priority: account@company.com)
```

---

## Success Metrics

After successful deployment, you should see:

✓ Payment success rate > 98%  
✓ Webhook delivery success > 99%  
✓ Average payment processing time < 2 seconds  
✓ Enrollment activation within 2 seconds of payment success  
✓ All confirmation emails sent within 5 seconds  
✓ Zero duplicate enrollments  
✓ All refunds processed successfully  
✓ Support tickets related to payments < 1% of transactions  

If you're not seeing these metrics, investigate and optimize further.

