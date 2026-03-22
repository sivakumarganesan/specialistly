/**
 * Server Integration Guide for Stripe Payment System
 * 
 * This file shows how to integrate all Stripe payment components
 * into your existing Express server.
 */

// ==========================================
// STEP 1: Update server.js/app.js
// ==========================================

import express from 'express';
import dotenv from 'dotenv';
import paymentRoutes from './backend/routes/paymentRoutes.js';
import authMiddleware from './backend/middleware/auth.js';

// Load environment variables
dotenv.config();

const app = express();

// ✅ IMPORTANT: Webhook middleware MUST be before express.json()
// Webhook endpoint requires raw body (not JSON parsed)
app.post(
  '/api/webhooks/stripe',
  express.raw({ type: 'application/json' }),
  require('./backend/routes/paymentRoutes.js').handleStripeWebhook
);

// ✅ Regular JSON parsing for other routes
app.use(express.json());

// ✅ CORS configuration (update with your domains)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', process.env.FRONTEND_URL || 'http://localhost:3000');
  res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// ✅ Rate limiting (prevent payment endpoint abuse)
import rateLimit from 'express-rate-limit';

const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many payment requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// ✅ Mount payment routes with rate limiting
app.use('/api/payments', paymentLimiter, paymentRoutes);

// ✅ Other existing routes...
app.use('/api/courses', courseRoutes);
app.use('/api/services', serviceRoutes);
// ... other routes ...

// ✅ Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  
  // Special handling for Stripe errors
  if (err.type === 'StripeSignatureVerificationError') {
    return res.status(400).json({
      success: false,
      message: 'Webhook signature verification failed'
    });
  }
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
});

// ✅ Start server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`API URL: ${process.env.API_BASE_URL || `http://localhost:${PORT}/api`}`);
  console.log(`Webhook endpoint: /api/webhooks/stripe`);
});

// ==========================================
// STEP 2: Verify Environment Variables
// ==========================================

/*
Before running server, verify these are set in your .env file:

❌ Missing variables will cause errors:

STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_PUBLIC_KEY=pk_test_xxxxx (for frontend)
STRIPE_WEBHOOK_SECRET=whsec_test_xxxxx

DATABASE_URL=mongodb+srv://...
NODE_ENV=development
API_BASE_URL=http://localhost:5001/api
FRONTEND_URL=http://localhost:3000

Optional:
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
*/

// ==========================================
// STEP 3: Database Connection (if needed)
// ==========================================

import mongoose from 'mongoose';

async function connectDB() {
  try {
    await mongoose.connect(process.env.DATABASE_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connected');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

connectDB();

// ==========================================
// STEP 4: Testing Endpoints (Development)
// ==========================================

/*
Test the payment endpoints locally:

1. Create Payment Intent
   POST /api/payments/create-intent
   Headers: Authorization: Bearer YOUR_TOKEN
   Body: {
     "serviceId": "course123",
     "serviceType": "course"
   }
   Response: {
     "clientSecret": "pi_xxx_secret_xxx",
     "paymentIntentId": "pi_xxx"
   }

2. Confirm Payment
   POST /api/payments/confirm-payment
   Headers: Authorization: Bearer YOUR_TOKEN
   Body: {
     "paymentIntentId": "pi_xxx"
   }
   Response: {
     "success": true,
     "enrollmentId": "enrollment123"
   }

3. Get Payment History
   GET /api/payments/history/customer?limit=10&skip=0
   Headers: Authorization: Bearer YOUR_TOKEN
   Response: {
     "data": [ ... ],
     "total": 5
   }

4. Webhook Health Check
   GET /api/webhooks/health
   Response: {
     "success": true,
     "message": "Webhook handler is healthy"
   }

5. Test Webhook (dev only)
   POST /api/webhooks/test
   Headers: Authorization: Bearer YOUR_TOKEN
   Response: {
     "success": true,
     "event": { ... }
   }
*/

// ==========================================
// STEP 5: Logging Setup (Recommended)
// ==========================================

import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'payment-service' },
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }));
}

// Use in route handlers:
// logger.info('Payment created', { paymentId: xxx });
// logger.error('Payment failed', { error: xxx });

// ==========================================
// STEP 6: Middleware Setup
// ==========================================

// Authentication middleware (if not already created)
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    // Verify JWT token (adjust based on your auth system)
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// ==========================================
// STEP 7: Startup Verification
// ==========================================

/*
After server starts, verify:

1. Check Stripe connection
   curl http://localhost:5001/api/webhooks/health
   Should return: { "success": true, "message": "Webhook handler is healthy" }

2. Check environment variables
   curl -X POST http://localhost:5001/api/payments/test \
     -H "Authorization: Bearer test-token"
   Should return event data

3. Check database connection
   Should see: "✅ MongoDB connected"

4. Check logs
   tail -f logs/combined.log
   Should show startup messages
*/

// ==========================================
// STEP 8: Production Checklist
// ==========================================

/*
Before deploying to production:

Security:
- [ ] HTTPS is enabled
- [ ] All secret keys are in environment variables
- [ ] CORS is properly configured
- [ ] Rate limiting is enabled
- [ ] Error details are not exposed to frontend

Monitoring:
- [ ] Error logging is configured
- [ ] Payment metrics tracking is setup
- [ ] Webhook delivery logs are monitored
- [ ] Database connections are pooled

Testing:
- [ ] Full payment flow tested end-to-end
- [ ] Webhook delivery tested
- [ ] Error scenarios tested
- [ ] Database recovery plan tested

Deployment:
- [ ] Database backups enabled
- [ ] Stripe live keys obtained
- [ ] Webhook configured in Stripe Dashboard
- [ ] Rollback plan prepared
*/

// ==========================================
// STEP 9: Common Issues & Debugging
// ==========================================

/*
Issue: Webhook not receiving events
- Check webhook secret in .env
- Verify endpoint URL in Stripe Dashboard
- Use Stripe CLI to test: stripe listen

Issue: Payment Intent creation fails
- Check Stripe API key
- Verify user is authenticated
- Check amount is valid (>= 100)

Issue: Enrollment not created after payment
- Check webhook logs
- Verify Payment.findOrCreate() logic
- Check enrollment creation in webhook handler
- Look for database transaction errors

Debug with:
- app.set('json spaces', 2); // Pretty print JSON responses
- logger.debug() calls throughout code
- MongoDB aggregation pipeline testing
- Stripe CLI webhook testing
*/

// ==========================================
// STEP 10: Frontend Integration
// ==========================================

/*
In your frontend (src/main.tsx or App.tsx):

import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLIC_KEY
);

function App() {
  return (
    <Elements stripe={stripePromise}>
      {/* Your app components */}
      <YourPaymentComponent />
    </Elements>
  );
}

Then use in components:
import { StripePaymentForm } from '@/app/components/StripePaymentForm';

<StripePaymentForm 
  serviceId={courseId}
  serviceType="course"
  serviceName={courseName}
  amount={price * 100}
  onSuccess={handleSuccess}
  onError={handleError}
/>
*/

export default app;
