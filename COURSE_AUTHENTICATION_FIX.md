# Course Enrollment Authentication Fix

## Problem
After completing a payment for a course, the "Enroll Now" button remained disabled because the `fetchEnrolledCourses()` endpoint was failing with a 400 error. The issue occurred when calling `/api/courses/enrollments/self-paced/my-courses` to refresh the list of enrolled courses.

### Root Cause
The `/enrollments/self-paced/my-courses` endpoint did not have authentication middleware applied, causing:
- No `req.user` object to be set from the JWT token
- The controller falling back to `req.query.customerId` which wasn't always properly passed
- A 400 error: "Customer ID is required"

## Solution
Added authentication middleware to three protected endpoints that fetch user-specific data:

### Changes Made

#### 1. Import Authentication Middleware
**File**: [backend/routes/courseRoutes.js](backend/routes/courseRoutes.js#L3)

```javascript
import { authMiddleware } from '../middleware/authMiddleware.js';
```

#### 2. Apply Middleware to Protected Routes

**Get My Self-Paced Courses** (Line 87-88)
```javascript
// Get my self-paced courses (requires authentication)
router.get('/enrollments/self-paced/my-courses', authMiddleware, getMyCourses);
```

**Get My Cohort Courses** (Line 105-106)
```javascript
// Get my cohorts (requires authentication)
router.get('/enrollments/cohort/my-courses', authMiddleware, getMyCohorts);
```

**Get My Certificates** (Line 133-134)
```javascript
// Get my certificates (requires authentication)
router.get('/certificates/my-certificates', authMiddleware, getMyCertificates);
```

## How It Works

1. **User Authentication**: When a user logs in, their JWT token is stored in `localStorage.authToken`
2. **API Requests**: Every API call automatically includes the token in the `Authorization` header:
   ```typescript
   // From apiClient.ts
   const authToken = token || localStorage.getItem('authToken');
   if (authToken) {
     options.headers = {
       ...options.headers,
       "Authorization": `Bearer ${authToken}`,
     };
   }
   ```
3. **Middleware Validation**: The `authMiddleware` validates the JWT and sets `req.user`:
   ```javascript
   const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
   req.user = decoded;
   ```
4. **Controller Access**: Controllers now reliably access the user ID:
   ```javascript
   const customerId = req.user?.userId || req.query.customerId;
   ```

## Payment Flow - Fixed
The complete flow now works correctly:

1. User logs in → token stored in `localStorage.authToken`
2. User clicks "Enroll Now" on a paid course
3. Payment modal opens with success callback:
   ```typescript
   onSuccess: async () => {
     await fetchEnrolledCourses(); // Now succeeds!
     // Button updates to "Already Enrolled"
   }
   ```
4. `fetchEnrolledCourses()` calls `courseAPI.getMyCourses(user.id)`
5. Request includes Authorization header with JWT token
6. Backend validates token via `authMiddleware`
7. `getMyCourses` retrieves enrollments using authenticated user ID
8. Response includes the newly enrolled course
9. Frontend updates `enrolledCourseIds` state
10. Button state reflects enrollment status

## Security Benefits

- **User-specific data**: Only authenticated users can access their enrollment records
- **Data isolation**: One user cannot see another user's enrollments
- **Token validation**: All requests require a valid JWT token
- **Consistent authentication**: All user-specific endpoints use the same middleware

## Testing

To verify the fix works:

1. **Login** as a customer
2. **Browse courses** and find a paid course
3. **Click "Enroll Now"** on a paid course
4. **Complete payment** in the modal
5. **Verify** the button changes from "Enroll Now" to "Already Enrolled"
6. **Navigate to "My Learning"** and confirm the course appears in the list

## Files Modified

- [backend/routes/courseRoutes.js](backend/routes/courseRoutes.js) - Added authMiddleware to 3 routes
