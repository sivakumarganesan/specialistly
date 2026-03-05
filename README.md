# Specialistly Platform

A comprehensive online course and consulting platform with dual payment gateway support (Stripe + Razorpay).

## Key Features

- 📚 **Self-Paced Courses**: Create and sell courses with video lessons
- 💬 **Live Consulting**: Schedule one-on-one consulting sessions  
- 💳 **Dual Payments**: Accept payments via Stripe (USD) and Razorpay (INR)
- 👥 **Specialist Payouts**: Automatic commission calculations and payouts
- 🎥 **Video Integration**: Stream video content via Cloudflare
- 📧 **Email Notifications**: Automated emails via Resend API
- 🔐 **Authentication**: JWT-based secure authentication
- 📱 **Responsive Design**: Works on desktop, tablet, and mobile

## Quick Start

### Prerequisites
- Node.js 16+ 
- MongoDB Atlas account
- Environment variables configured (see sections below)

### Installation

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../src
npm install
```

### Development

```bash
# Terminal 1: Start backend (from backend/)
npm run dev

# Terminal 2: Start frontend (from src/)
npm run dev
```

Backend runs on `http://localhost:5001`  
Frontend runs on `http://localhost:5173`

## Payment Gateway Setup

### ⚡ Quick Setup

Choose one or both payment methods:

#### Option 1: Stripe (International, USD)
**Perfect for:** Global customers, USD payments  
[📖 View Stripe Setup Guide](./STRIPE_MARKETPLACE_SETUP_GUIDE.md)

Steps:
1. Create account at [Stripe](https://stripe.com)
2. Get test API keys from dashboard
3. Add to `.env`: `STRIPE_SECRET_KEY`, `STRIPE_PUBLIC_KEY`
4. Test with card `4242 4242 4242 4242`

#### Option 2: Razorpay (India-Focused, INR)
**Perfect for:** Indian customers, local payment methods (UPI, NetBanking, Cards)  
[📖 View Razorpay Setup Guide](./RAZORPAY_SETUP_GUIDE.md) ← **START HERE FOR NEW PAYMENTS**

Steps:
1. Create account at [Razorpay](https://razorpay.com)
2. Get test API keys from dashboard
3. Add to `.env`: `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`
4. Test with card `4111 1111 1111 1111`

#### Both Gateways
If both are configured, customers see a payment method selector:
- **Stripe** (Credit/Debit Card, USD)
- **Razorpay** (Card/UPI/NetBanking, INR)

## Environment Variables

### Backend (.env)

```bash
# Database
MONGODB_URI=mongodb+srv://username:password@cluster0.xyz.mongodb.net/specialistdb

# Environment
NODE_ENV=development
PORT=5001
FRONTEND_URL=http://localhost:5173

# Payments - Choose one or both
# Stripe (International)
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_PUBLIC_KEY=pk_test_xxx

# Razorpay (India)
RAZORPAY_KEY_ID=rzp_test_xxx
RAZORPAY_KEY_SECRET=xxx

# Email
RESEND_API_KEY=re-xxx

# JWT
JWT_SECRET=your-secret-key

# See .env.example for complete list
```

### Frontend (.env)

```bash
VITE_API_URL=http://localhost:5001/api
VITE_STRIPE_PUBLIC_KEY=pk_test_xxx
```

## Deployment

### Railway Deployment

```bash
# 1. Push to GitHub (Railway auto-deploys)
git push origin main

# 2. Set environment variables in Railway dashboard
# Required: MONGODB_URI, FRONTEND_URL, JWT_SECRET
# Payments: STRIPE_SECRET_KEY or RAZORPAY_KEY_ID (or both)

# 3. Railway auto-redeploys on git push
```

[📖 View Complete Deployment Guide](./DEPLOYMENT_GUIDE.md)

## Architecture

```
frontend/                 # React + TypeScript + Vite
  └── src/components/    # Reusable components
      ├── PaymentModal   # Payment gateway selector
      ├── StripePaymentForm
      └── RazorpayPaymentForm

backend/                  # Express.js + MongoDB
  ├── controllers/        # Route handlers
  ├── models/            # MongoDB schemas
  ├── services/          # Business logic
  │   ├── stripeService.js
  │   └── razorpayService.js
  └── routes/            # API endpoints
```

## API Endpoints

### Payments
- `POST /api/marketplace/payments/create-intent` - Create payment order
- `POST /api/marketplace/payments/confirm-payment` - Confirm payment
- `GET /api/marketplace/payments/gateways` - Check available payment gateways

### Courses  
- `GET /api/courses` - List courses
- `POST /api/courses` - Create course (specialist only)
- `PUT /api/courses/:id` - Update course
- `DELETE /api/courses/:id` - Delete course

### Consulting
- `GET /api/consulting-slots` - List available slots
- `POST /api/bookings` - Book a session
- `GET /api/bookings` - Get your bookings

## Troubleshooting

### Payment Issues

**Issue: "Payment gateway not showing"**
- Solution: Check `VITE_API_URL` in frontend `.env`
- Verify backend is running and reachable

**Issue: "Failed to create payment order"**
- Check browser console for detailed error
- Verify payment credentials in backend `.env`
- Restart backend: `npm run dev`

**Issue: "Razorpay option not showing"**
- Razorpay needs credentials to be available
- See [Razorpay Setup Guide](./RAZORPAY_SETUP_GUIDE.md) for test credentials

### Database Issues

**Issue: "Cannot connect to MongoDB"**
- Verify `MONGODB_URI` is correct
- Check MongoDB Atlas IP whitelist includes your IP (or 0.0.0.0 for testing)
- Run: `mongodb-check` command in terminal

## Documentation

- [Razorpay Setup Guide](./RAZORPAY_SETUP_GUIDE.md) - Complete Razorpay test/live payment setup
- [Stripe Setup Guide](./STRIPE_MARKETPLACE_SETUP_GUIDE.md) - Stripe payment setup  
- [Deployment Guide](./DEPLOYMENT_GUIDE.md) - Deploy to Railway
- [Database Schema](./COMPLETE_DATABASE_SCHEMA.md) - MongoDB collections
- [API Reference](./COMPLETE_API_REFERENCE.md) - All endpoints
- [Dual Payment Integration](./RAZORPAY_STRIPE_DUAL_INTEGRATION.md) - Technical details

## Testing Credentials

### Stripe Test Mode
- Card: `4242 4242 4242 4242`
- Expiry: Any future date
- CVC: Any 3 digits

### Razorpay Test Mode
- Card: `4111 1111 1111 1111`
- Expiry: Any future date  
- CVV: Any 3 digits
- Alternative: UPI ID `success@razorpay`

## Support & Issues

For issues:
1. Check the relevant setup guide (Stripe/Razorpay)
2. Review logs: `npm run dev` output or Railway logs
3. Check `.env` variables are set correctly
4. Ensure backend and frontend URLs match

## License

This project is proprietary.
