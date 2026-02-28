#!/bin/bash

# Stripe Payment Integration - Dependency Installation Script
# Run this script to install all required dependencies for Stripe integration

echo "🚀 Installing Stripe Payment Integration Dependencies..."
echo ""

# Color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Backend Dependencies
echo -e "${BLUE}📦 Installing Backend Dependencies...${NC}"
npm install --save stripe dotenv

echo -e "${GREEN}✓ Backend dependencies installed${NC}"
echo ""

# Frontend Dependencies  
echo -e "${BLUE}📦 Installing Frontend Dependencies...${NC}"
npm install --save @stripe/react-stripe-js @stripe/js

echo -e "${GREEN}✓ Frontend dependencies installed${NC}"
echo ""

# Optional but recommended dependencies
echo -e "${BLUE}📦 Installing Optional Dependencies...${NC}"
npm install --save-dev dotenv-cli  # For easier env management

echo -e "${GREEN}✓ Optional dependencies installed${NC}"
echo ""

# MongoDB dependencies (if not already installed)
if ! npm list mongoose > /dev/null 2>&1; then
  echo -e "${BLUE}📦 Installing MongoDB/Mongoose...${NC}"
  npm install --save mongoose
  echo -e "${GREEN}✓ Mongoose installed${NC}"
else
  echo -e "${GREEN}✓ Mongoose already installed${NC}"
fi
echo ""

# Email service (recommended for confirmations)
if ! npm list nodemailer > /dev/null 2>&1; then
  echo -e "${BLUE}📦 Installing Email Service (Nodemailer)...${NC}"
  npm install --save nodemailer
  echo -e "${GREEN}✓ Nodemailer installed${NC}"
else
  echo -e "${GREEN}✓ Nodemailer already installed${NC}"
fi
echo ""

# Logging (recommended)
if ! npm list winston > /dev/null 2>&1; then
  echo -e "${BLUE}📦 Installing Logging Library (Winston)...${NC}"
  npm install --save winston
  echo -e "${GREEN}✓ Winston installed${NC}"
else
  echo -e "${GREEN}✓ Winston already installed${NC}"
fi
echo ""

# Display installation summary
cat << 'EOF'
✅ Installation Complete!

Installed Packages:
  BACKEND:
    • stripe (Payment processing)
    • dotenv (Environment variables)
    
  FRONTEND:
    • @stripe/react-stripe-js (React integration)
    • @stripe/js (Stripe.js library)
    
  OPTIONAL (Recommended):
    • mongoose (Database)
    • nodemailer (Email confirmations)
    • winston (Application logging)

Next Steps:
1. Create .env.local and .env.production files
2. Get Stripe API keys from https://dashboard.stripe.com/apikeys
3. Add keys to environment files
4. Run: npm run dev (to start development server)
5. Test payment flow with test cards

Test Cards:
  Success:    4242 4242 4242 4242
  Decline:    4000 0000 0000 0002
  3D Secure:  4000 0025 0000 3155

For more info, see:
  - STRIPE_ENVIRONMENT_SETUP.md
  - PAYMENT_INTEGRATION_ARCHITECTURE.md
  - STRIPE_PRODUCTION_DEPLOYMENT.md

Happy coding! 🚀
EOF
