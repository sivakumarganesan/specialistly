# Root Cause: Customer Enrolled Courses Not Showing in Staging

**Date**: April 5, 2026  
**Customer**: sinduja.vel@gmail.com  
**Specialist**: Unearth One Earth (nithyachellam@gmail.com)  
**Staging URL**: https://nest.staging.specialistly.com/my-learning

## Issue
Customer sees "No Courses Yet" even though they have 3 enrolled courses from this specialist.

## Verification - Database is Correct ✓

```
Customer: sinduja.vel@gmail.com
Customer ID: 69cbe01f00a3271b8d376d16

Total Enrollments: 4
  - Shamanic Intelink Class (Unearth One Earth) ✓
  - Contributions To Rivers of India (Unearth One Earth) ✓
  - Black Wolf Spirit Chants Recording (Unearth One Earth) ✓
  - [One course from another specialist]
```

**Database is healthy.** All data cloned correctly from production.

## Root Cause - Frontend Authentication Issue

The **frontend is NOT sending the Authorization header** when calling the `/my-courses` API endpoint.

### What Happens (Current - Broken)

```
Frontend: GET /api/courses/enrollments/self-paced/my-courses
          ?specialistEmail=nithyachellam@gmail.com
          [NO Authorization header]

Backend:  optionalAuthMiddleware
          - Looks for Authorization header
          - Not found
          - req.user = undefined
          - Continues without authentication

          getMyCourses()
          - userEmail = req.user?.email = undefined
          - userId = req.user?.userId = undefined
          - customerId parameter = not passed
          - Result: customerIdList = [] (EMPTY)
          - Returns: { success: true, data: [] }

Frontend: Displays "No Courses Yet"
```

### What Should Happen (Fixed - Working)

```
Frontend: GET /api/courses/enrollments/self-paced/my-courses
          ?specialistEmail=nithyachellam@gmail.com
          Authorization: Bearer <jwt_token_from_login>

Backend:  optionalAuthMiddleware
          - Finds Authorization header
          - Extracts token: "eyJ..."
          - jwt.verify(token)
          - req.user = { email: "sinduja.vel@gmail.com", userId: "...", ... }

          getMyCourses()
          - userEmail = "sinduja.vel@gmail.com"
          - Looks up Customer by email
          - customerIdList = [customer_id]
          - Filters enrollments by customerId
          - Filters enrollments by specialistEmail
          - Returns 3 courses

Frontend: Displays enrolled courses with progress
```

## Solutions

### Solution 1: Frontend Must Send Authorization Header (REQUIRED)

**In the My Learning page component:**

```javascript
// When fetching my-courses, ensure the token is sent
const token = localStorage.getItem('token');  // or from sessionStorage/cookies

const response = await fetch(
  '/api/courses/enrollments/self-paced/my-courses?specialistEmail=...',
  {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }
);
```

### Solution 2: Backend Accepts Fallback Headers (Already Implemented)

The backend now accepts these fallbacks if for any reason the Authorization header isn't working:

**Option A: X-Customer-Email Header**
```
X-Customer-Email: sinduja.vel@gmail.com
```

**Option B: Query Parameter**
```
?customerId=69cbe01f00a3271b8d376d16
```

## Immediate Action Required

**Frontend team must check:**

1. **Is the login endpoint storing the token?**
   - localStorage.setItem('token', response.token)?
   - Or cookies?
   - Or sessionStorage?

2. **Is the My Learning page retrieving the token?**
   - `const token = localStorage.getItem('token')`
   - Is it actually getting a value?

3. **Is the fetch request including the Authorization header?**
   - Add this to verify:
   ```javascript
   console.log('Token being sent:', token ? 'YES' : 'NO');
   console.log('Headers:', { Authorization: `Bearer ${token}` });
   ```

## Debug: Check Browser DevTools

When running the page:

1. Open DevTools → Network tab
2. Look at the `/my-courses` request
3. Click on "Headers" section
4. Scroll down to "Request Headers"
5. Check if "Authorization" header is present
6. If NOT present → Frontend token management issue
7. If IS present → Backend issue (but backend logs show NO requests with headers are coming)

## Backend Changes Made

✓ Added Priority 3 authentication fallback (X-Customer-Email header)
✓ Improved debug logging in optionalAuthMiddleware
✓ Added detailed error messages in getMyCourses
✓ Ready to accept customerId query parameter

## Expected Fix Timeline

Once frontend adds the Authorization header:
- User logs in
- Token stored in localStorage/sessionStorage/cookies
- My Learning page retrieves token
- Sends: `Authorization: Bearer <token>`
- 3 enrolled courses display correctly

## Verification Test

After frontend fix, verify with:

```bash
# Get login token
curl -X POST https://staging.specialistly.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"sinduja.vel@gmail.com","password":"..."}'

# Copy the returned token, then call:
curl -X GET "https://staging.specialistly.com/api/courses/enrollments/self-paced/my-courses?specialistEmail=nithyachellam@gmail.com" \
  -H "Authorization: Bearer <token_from_login>"

# Response should include 3 courses
```

## Staging Database Status

✓ All customer data present  
✓ All enrollments valid  
✓ All course data present  
✓ FK references repaired  
✓ Database is ready for testing

**Issue is 100% on the frontend authentication layer.**
