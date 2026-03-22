# Razorpay Specialist Payouts - Admin Guide

## System Overview

The automated payout system handles transferring course earnings to specialist bank accounts through Razorpay.

**Architecture:**

```
Customer Payment → Commission Calculated → Payout Record Created → 
Razorpay Contact Created → Fund Account Created → Payout Initiated → 
Bank Transfer Initiated → Webhook Updates Status
```

## 🔧 Backend Components

### Models

#### 1. CreatorProfile (Updated)
**New Fields:**
- `bankAccount` (nested object):
  - `accountHolderName`: String - Specialist's full name
  - `accountNumber`: String (encrypted) - Bank account
  - `ifscCode`: String - 11-character bank code
  - `accountType`: Enum - "savings" | "current"
  - `bankName`: String - Bank name
  - `isVerified`: Boolean - Account verification status
  - `verificationStatus`: Enum - "pending" | "verified" | "failed" | "unverified"
  - `verificationDate`: Date - When verified
  - `razorpayContactId`: String - Razorpay contact reference

#### 2. SpecialistPayout (New)
**Tracks all payouts:**
- `specialistId`: Reference to CreatorProfile
- `commissionId`: Reference to MarketplaceCommission
- `courseId`: Reference to Course
- `amount`: Number - Payout amount in paise
- `currency`: String - "INR"
- `originalPaymentAmount`: Number - Gross course price
- `commissionDeducted`: Number - Platform commission
- `razorpayPayoutId`: String - Payout tracking ID
- `razorpayPaymentId`: String - Original payment ID
- `status`: Enum - pending|processing|completed|failed|on_hold|rejected
- `failureReason`: String - Error details if failed
- `payoutRequestedAt`: Date - When initiated
- `payoutInitiatedAt`: Date - When sent to Razorpay
- `payoutCompletedAt`: Date - When transferred
- `bankDetailsSnapshot`: Object - Bank info backup
- `notes`: String - Admin notes

**Indexes:**
- `specialistId + status` - Quick lookup by status
- `commissionId` - Trace to original payment
- `razorpayPayoutId` - Razorpay tracking
- `createdAt` - Time-based queries

### Services

#### razorpayService.js (Extended)

**New Function: `processSpecialistPayout(commissionId, notes)`**

Steps:
1. Get commission and specialist details
2. Verify bank account exists
3. Create/reuse Razorpay contact
4. Create fund account (bank link)
5. Initiate payout via Razorpay API
6. Create SpecialistPayout record
7. Update commission with payout ID
8. Handle failures gracefully

**Parameters:**
- `commissionId`: MongoDB ID of MarketplaceCommission
- `notes`: Optional admin notes

**Returns:**
```json
{
  "success": true/false,
  "message": "Success message",
  "payout": {
    "id": "payout_record_id",
    "razorpayPayoutId": "payout_xxx",
    "status": "processing",
    "amount": 850.00,
    "estimatedArrivalTime": "2-4 hours for NEFT"
  }
}
```

### Controllers

#### payoutController.js (New)

**Endpoints:**

1. **POST /api/specialist/bank-account**
   - Update bank account for specialist
   - Validates IFSC and account number format
   - Returns masked account number for security

2. **GET /api/specialist/bank-account**
   - Retrieve current bank account
   - Returns masked account number

3. **GET /api/specialist/payouts**
   - Query: `status`, `limit`, `skip`
   - Returns payout history
   - Shows summary by status

4. **GET /api/specialist/payout-stats**
   - Monthly and all-time statistics
   - Bank account status
   - Current pending amounts

5. **POST /api/admin/payouts/:commissionId/process** (Admin Only)
   - Manually trigger payout
   - Validates admin role
   - Calls `processSpecialistPayout()`

### Routes

**File:** `backend/routes/payoutRoutes.js`

```javascript
POST   /specialist/bank-account        → updateBankAccount
GET    /specialist/bank-account        → getBankAccount
GET    /specialist/payouts             → getPayoutHistory
GET    /specialist/payout-stats        → getPayoutStats
POST   /admin/payouts/:id/process      → processPayoutManual (admin)
```

**Registered as:** `app.use('/api/specialist', payoutRoutes)`

## 🎯 Admin Operations

### Manual Payout Trigger

**When to Use:**
- First-time payout setup verification
- Retry failed payouts
- Manual adjustment/correction

**How to Trigger:**

```bash
curl -X POST \
  http://localhost:5001/api/admin/payouts/COMMISSION_ID/process \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"notes": "Manual retry - account verification"}'
```

**Response:**
```json
{
  "success": true,
  "message": "Payout initiated successfully",
  "payout": {
    "id": "PAYOUT_RECORD_ID",
    "razorpayPayoutId": "payout_xxx",
    "status": "processing",
    "amount": 850,
    "specialistEmail": "specialist@example.com",
    "estimatedArrivalTime": "2-4 hours for NEFT"
  }
}
```

### Checking Payout Status

**Database Query:**
```javascript
db.specialistpayouts.findOne({
  razorpayPayoutId: "payout_xxx"
})
```

**Response Fields:**
- `status`: Current status
- `payoutCompletedAt`: Actual transfer time
- `failureReason`: Error if failed
- `bankDetailsSnapshot`: Account used

### Handling Failed Payouts

**Steps:**

1. **Check Database Status**
   ```javascript
   db.specialistpayouts.findOne({
     specialistId: specialist_id,
     status: "failed"
   })
   ```

2. **Review Failure Reason**
   - Invalid account number
   - Bank holiday
   - Account suspended
   - IFSC code wrong

3. **Contact Specialist**
   - Ask to verify bank details
   - Confirm account not closed
   - Check for typos in IFSC

4. **Update Bank Account**
   - Specialist updates through UI or API
   - Delete failed payout record (optional)
   - Retry payout

5. **Retry Payout**
   ```bash
   POST /api/admin/payouts/COMMISSION_ID/process
   ```

### Monitoring Payouts

**Dashboard Queries:**

**Payouts This Month:**
```javascript
db.specialistpayouts.aggregate([
  { $match: { 
      createdAt: { $gte: ISODate("2026-03-01") },
      status: "completed"
  }},
  { $group: {
      _id: "$specialistId",
      totalPaid: { $sum: "$amount" },
      count: { $sum: 1 }
  }}
])
```

**Pending Payouts:**
```javascript
db.specialistpayouts.countDocuments({
  status: { $in: ["pending", "processing"] }
})
```

**Failed Payouts:**
```javascript
db.specialistpayouts.find({
  status: "failed"
}).sort({ createdAt: -1 })
```

## 🔐 Security Considerations

### Bank Data Protection

1. **Encryption**: Bank account numbers encrypted at rest
2. **Access Control**: Only accessible to specialist and admin
3. **Audit Trail**: All access/updates logged
4. **Masking**: Account numbers masked in API responses (show last 4 digits only)

### API Security

1. **Authentication**: All endpoints require JWT token
2. **Authorization**: Admin endpoints check role
3. **Rate Limiting**: Consider adding for payout triggers
4. **Input Validation**: IFSC (11 chars), Account (8-18 digits)

### Razorpay Integration

1. **Credentials**: Store in environment variables (never commit)
2. **API Keys**: Use separate test/live keys
3. **Webhook Verification**: HMAC-SHA256 signature validation required
4. **Error Handling**: Never expose error details to client

## 📊 Data Flow

### On Course Purchase

```
1. Customer pays via PaymentModal
2. Backend creates MarketplaceCommission
3. Calculates specialist payout (85% of price)
4. Calls processSpecialistPayout() automatically
5. Razorpay creates contact + fund account
6. Initiates NEFT transfer
7. Creates SpecialistPayout record (status: processing)
8. Webhook updates status to completed
9. Specialist sees in dashboard
```

### Manual Payout (Admin Triggered)

```
1. Admin calls POST /api/admin/payouts/:id/process
2. System validates specialist has bank account
3. Checks if payout already exists
4. Creates new Razorpay contact if needed
5. Initiates transfer
6. Creates SpecialistPayout record
7. Waits for webhook confirmation
```

## 🐛 Common Issues & Solutions

### Issue: "Razorpay credentials not configured"

**Cause:** Missing `RAZORPAY_KEY_ID` or `RAZORPAY_KEY_SECRET` in environment

**Solution:**
1. Add to `.env`: 
   ```
   RAZORPAY_KEY_ID=rzp_test_xxx
   RAZORPAY_KEY_SECRET=xxx
   ```
2. Restart backend
3. Retry payout

### Issue: "Invalid bank account" Error

**Cause:** Account details don't match Razorpay validation

**Solution:**
1. Verify specialist's account number digits (no spaces)
2. Check IFSC code format (must be 11 chars, uppercase)
3. Confirm account holder name matches bank records
4. Ask specialist to update in UI

### Issue: Payout Initiated but Status Stays "Processing"

**Cause:** Webhook not received or processed

**Solution:**
1. Check if webhook endpoint is running
2. Verify webhook route is registered
3. Check Railway logs for webhook errors
4. Manually check Razorpay dashboard for status

### Issue: Database Growing Too Large

**Solution:**
1. Archive old payouts (> 1 year) to separate collection
2. Add pagination to payout queries
3. Index on `createdAt` for sorting

## 📈 Performance Optimization

### Query Optimization

**Before:**
```javascript
// Slow - scans all documents
db.specialistpayouts.find({status: "completed"})
```

**After:**
```javascript
// Fast - uses index on specialistId + status
db.specialistpayouts.find({
  specialistId: ObjectId("..."),
  status: "completed"
})
```

### Caching Strategies

Consider caching:
- Bank account verification status (TTL: 1 hour)
- Payout statistics (TTL: 5 minutes)
- Razorpay contact IDs (persistent)

## 📞 Support Escalation

**If Specialist Reports Issue:**

1. **Payment reached (✅)**
   - Mark resolved in system
   - Update payout status

2. **Payment delayed (2-4 hours pending)**
   - Normal, no action needed
   - Provide timeline: "NEFT transfers 2-4 hours"

3. **Payment failed**
   - Check SpecialistPayout.failureReason
   - Ask specialist to verify account
   - Offer manual retry

4. **Duplicate payments**
   - Check for duplicate SpecialistPayout records
   - Contact Razorpay support with payout ID
   - Document in notes field

---

## Testing Checklist

- [ ] Add bank account without IFSC → Validate error
- [ ] Add bank account with invalid account number → Validate error  
- [ ] Add valid bank account → Should succeed
- [ ] View bank account → Should show masked number
- [ ] Trigger payout → Should create SpecialistPayout record
- [ ] Check payout status → Should show processing
- [ ] Receive webhook → Should update to completed
- [ ] View payout history → Should list all payouts
- [ ] View statistics → Should calculate correctly
- [ ] Failed payout retry → Should create new record

---

**Last Updated**: March 5, 2026
**Version**: Razorpay Automated Payouts v1.0
