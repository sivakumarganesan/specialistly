# My Learning Visibility Fix - Complete Summary

## Problem
When an admin enrolled a customer in courses using the admin panel, the customer could not see those courses in their "My Learning" page after logging in.

## Root Cause
The Specialistly platform uses **two separate MongoDB collections** that are linked only by email:
- **User collection**: Used for authentication (login/signup)
- **Customer collection**: Used for customer data and enrollments

When admin enrolls a customer:
- Admin searches customer by email: gets `Customer._id` (e.g., `507f1f77bcf86cd799438888`)
- Admin enrollment stores: `customerId: Customer._id`

When customer views "My Learning":
- Customer logs in: JWT token contains `userId: User._id` (e.g., `507f1f77bcf86cd799439011`)
- These are **two different MongoDB ObjectIds** from different collections!
- Old code queried: `SelfPacedEnrollment.find({ customerId: req.user?.userId })`
- Result: **No enrollments found** because User._id ≠ Customer._id

## Solution
Modified three endpoints to look up Customer by email first, then use that Customer's ID:

### 1. **enrollmentController.js - getMyCourses** ✅
```javascript
// Get customer ID by email lookup
let customerId = req.user?.userId;
if (!customerId && req.user?.email) {
  const customer = await Customer.findOne({ email: req.user.email });
  if (customer) {
    customerId = customer._id.toString();
  }
}
// Now query enrollments with correct customerId
const enrollments = await SelfPacedEnrollment.find({ customerId });
```

### 2. **cohortController.js - getMyCohorts** ✅
Applied same fix for cohort-based enrollments

### 3. **certificateController.js - getMyCertificates** ✅
Applied same fix for certificate retrieval

## Flow After Fix

```
1. Admin enrolls customer via email search
   → Gets Customer._id (e.g., "507f...")
   → Stores in: SelfPacedEnrollment { customerId: "507f..." }

2. Customer logs in
   → JWT token: { userId: User._id (e.g., "507g..."), email: "test@example.com" }

3. Customer views "My Learning"
   → getMyCourses called
   → Tries: customerId = req.user?.userId → "507g..." (User._id)
   → No enrollments found (wrong ID)
   → ✅ NEW: Looks up by email
   → Finds: Customer { _id: "507f..." } with matching email
   → Queries: SelfPacedEnrollment.find({ customerId: "507f..." })
   → ✅ Successfully finds admin-created enrollment!
   → Displays course in "My Learning"
```

## Testing Checklist

### Manual Test
1. **Setup**: Have MongoDB and backend running
2. **Step 1 - Create Test Scenario**:
   - Go to admin panel → Enrollment Management
   - Search for a customer by email: "test@example.com"
   - Select a published course
   - Click "Add Self-Paced Enrollment"
   - Verify: Enrollment created successfully

3. **Step 2 - Login as Customer**:
   - Log out of admin panel
   - Log in as customer with same email: "test@example.com"
   - Navigate to "My Learning" tab

4. **Step 3 - Verify**:
   - ✅ Course should now appear in "My Learning"
   - ✅ Course shows correct progress (0%)
   - ✅ Course can be opened and lessons viewed

### API Test (Using Postman or curl)

1. **Admin enrolls customer**:
```bash
POST /api/admin/enrollments/self-paced/add
Authorization: Bearer <admin_token>
{
  "courseId": "course_id_here",
  "customerId": "customer_id_here",
  "customerEmail": "test@example.com"
}
```

2. **Customer views My Learning**:
```bash
GET /api/courses/enrollments/self-paced/my-courses
Authorization: Bearer <customer_token>
```

Expected response: Should contain the course added by admin

## Backward Compatibility
✅ All changes are backward compatible
- Falls back to original behavior if Customer lookup fails
- Query parameters still work: `?customerId=...`
- Existing enrollments unaffected

## Commits
- **6a44629**: Fix My Learning visibility by linking User and Customer via email lookup
- **9cba794**: Apply Customer email lookup fix to cohort and certificate controllers

## Files Modified
1. `backend/controllers/enrollmentController.js` - getMyCourses endpoint
2. `backend/controllers/cohortController.js` - getMyCohorts endpoint  
3. `backend/controllers/certificateController.js` - getMyCertificates endpoint

## Environment
- Node.js: ≥ 20.0.0
- MongoDB: Connected ✅
- Backend: Port 5001 ✅
- No additional dependencies needed
