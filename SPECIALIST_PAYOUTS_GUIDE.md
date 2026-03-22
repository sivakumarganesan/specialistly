# Specialist Razorpay Automated Payouts Guide

## Overview

Specialists can now receive automatic payments directly to their bank accounts through Razorpay. The system:

1. Collects specialist bank account details securely
2. Creates Razorpay contacts and fund accounts automatically
3. Initiates automatic payouts after course purchase
4. Tracks payout status in real-time dashboard

## 🚀 Setup Process for Specialists

### Step 1: Add Bank Account Details (5 minutes)

**For Specialists:**

1. Log in to Specialistly as a specialist
2. Go to **Specialist Dashboard** → **Settings** → **Bank Account**
3. Click **"Add Bank Account"** or **"Update Bank Account"**
4. Fill in the form:

   - **Account Holder Name**: Your full name (exactly as on bank account)
   - **Account Number**: Your bank account number (8-18 digits)
   - **IFSC Code**: 11-character bank code (e.g., `AXIS0000123`)
   - **Account Type**: Select "Savings" or "Current"
   - **Bank Name**: Your bank name (e.g., "Axis Bank")

5. Click **"Save Bank Account"**

**What happens next:**
- Bank details are encrypted and stored securely
- Razorpay contact is created for future payouts
- Status shows "Unverified" until first payout test

### Step 2: Verify Account (First Payout)

**What happens automatically:**

When a customer purchases your course:

1. **Payment Processing**:
   - Customer pays via Razorpay
   - Commission is calculated (platform takes 15%)
   - Your payout amount is determined

2. **Payout Initiation**:
   - System creates Razorpay fund account (bank link)
   - Payout is initiated using NEFT mode
   - Funds transfer to your bank account (2-4 hours)
   - Status updates in your dashboard

3. **Automatic Tracking**:
   - Payout record created with status "Processing"
   - Webhook updates status when transferred
   - Appears in your "Payout History"

## 📊 Payout Dashboard

Access your payout statistics at: **Specialist Dashboard** → **Payouts**

### Displays:

**This Month Summary:**
- Total Earnings: Sum of all sales this month
- Paid Amount: Already transferred payouts
- Pending Amount: Awaiting processing
- New Enrollments: Number of course purchases

**All-Time Statistics:**
- Total Earnings: Cumulative earnings
- Total Commission Paid: Platform commission deducted
- Last Payout Date: When was your last transfer

**Bank Account Status:**
- Setup Status: Configured / Not Setup
- Verification: Unverified / Verified
- Auto Payouts: Enabled / Pending

### Payout History Table:

Shows all payouts with:
- Course Title
- Amount (in INR)
- Status (Pending, Processing, Completed, Failed)
- Request Date
- Completion Date

**Status Meanings:**

| Status | Meaning | Action Needed? |
|--------|---------|---|
| Pending | Awaiting processing | No, automatic |
| Processing | Razorpay initiated transfer | No, in progress |
| Completed | Successfully transferred | ✅ Money received |
| Failed | Transfer failed | Yes, check bank details |
| On Hold | Manual verification needed | Contact support |
| Rejected | Payment rejected | Contact support |

## 💰 Commission Breakdown

**Example: ₹1,000 Course Sale**

```
Customer pays:        ₹1,000
Platform commission:  ₹150 (15%)
Your payout:          ₹850
```

### Timing:

- Customer completes payment: Immediately
- Your payout initiated: Within seconds
- Funds arrive at your bank: 2-4 hours (NEFT)

**Transfer Mode**: NEFT (2-4 hours)
- Suitable for all Indian banks
- No additional charges
- Real-time confirmation

## ⚠️ Important Notes

### Bank Account Verification

- First payout acts as verification
- Once verified, all future payouts are automatic
- If first payout fails, check:
  - Account number digits
  - IFSC code spelling
  - Account holder name match

### Payout Restrictions

⚠️ **Payouts will NOT be initiated if:**

- Bank account not configured
- Account not yet verified (only for first payout)
- Customer payment marked as failed/refunded
- Commission calculation shows $0

### Security

- Bank account numbers are encrypted
- Stored securely in database
- Never shared with customers
- Visible only to you and platform admin

## 🔧 Troubleshooting

### "Payout Initiated but Money Not Received"

**Check:**
1. Your payout status in dashboard (should be "Completed")
2. Bank account in your bank's app
3. Check for "clearence holds" (some banks do this)
4. If > 4 hours passed, contact your bank

**Contact Support if:**
- Status shows "Failed"
- Money not received after 24 hours
- See a strange error message

### "Cannot Add/Update Bank Account"

**Possible Causes:**

1. **Empty Fields**: All fields are required
2. **Invalid Account Number**: Must be 8-18 digits (numbers only)
3. **Invalid IFSC Code**: Must be exactly 11 characters (e.g., `AXIS0000123`)
4. **Network Error**: Try again in a few moments
5. **Not Logged In**: Log out and back in

**Easy Fix:**
- Verify all fields are filled correctly
- Account number should only have numbers
- IFSC code should be UPPERCASE
- Click "Update" not "Add" if already configured

### "Payout Status Stuck as Processing"

**Normal Timeline:**
- Initiated: Instant
- Processing: Up to 2 hours
- Completed: After transfer cleared

**If stuck > 4 hours:**
- Refresh page (might be cached)
- Contact support with payout ID
- Include course and student email

## 🎯 Best Practices

### For Maximum Success:

1. **Verify Details Early**
   - Add bank account right away
   - Make a test course to verify payout
   - Ensure first payout completes successfully

2. **Keep Information Updated**
   - If you change banks, update immediately
   - Especially if closing bank account
   - Test with small amount first

3. **Monitor Dashboard Weekly**
   - Check pending payouts
   - Review payout history
   - Ensure account status is "Verified"

4. **Reconcile with Bank**
   - Match dashboard amounts with bank deposits
   - Keep records for tax purposes
   - Report discrepancies within 24 hours

## 📱 API Endpoints (For Integration)

### Specialist Endpoints:

```
POST   /api/specialist/bank-account      → Add/update bank details
GET    /api/specialist/bank-account      → Get current bank info
GET    /api/specialist/payout-stats      → Get payout statistics
GET    /api/specialist/payouts           → Get payout history
```

### Admin Endpoints:

```
POST   /api/admin/process-payout/:id     → Manually trigger payout
GET    /api/admin/payouts                → View all payouts (admin)
```

## 🌟 Common Questions

**Q: When do I get paid?**
A: Immediately after customer completes payment. Usually 2-4 hours in your bank account.

**Q: What if my account details are wrong?**
A: First payout will fail. Update details and re-initiate manually (contact support).

**Q: Can I change my bank account?**
A: Yes, update anytime in Settings. Next payout will use new account.

**Q: Is there a minimum payout amount?**
A: No, every sale generates a payout (even ₹10).

**Q: What's the transfer fee?**
A: Zero. Razorpay doesn't charge transfer fees in India.

**Q: Do I have tax responsibility?**
A: Yes, you're responsible for income tax on earnings. Keep payout records.

**Q: What if a customer requests refund?**
A: Customer gets refund, your payout reverses automatically.

**Q: How are earnings calculated?**
A: Specialist Payout = Course Price × (100% - 15% commission)

**Q: Can I batch multiple payouts?**
A: Yes, combined earnings are paid out as one transfer.

**Q: What happens to failed payouts?**
A: System retries once. Check details and contact support if persistent issue.

## 📞 Support

**Having Issues?**

1. Check troubleshooting section above
2. Verify bank details are correct
3. Contact support with:
   - Specialist email
   - Course name
   - Customer email/name (if applicable)
   - Payout ID (from dashboard)
   - Issue description

**Support Email**: support@specialistly.com

---

**Last Updated**: March 5, 2026
**System**: Razorpay Automated Payouts v1.0
