# Issue: Cross-Domain localStorage Problem

## Problem
Customer can't see enrolled courses on branded specialist pages because of cross-domain localStorage separation.

### Scenario
1. Customer logs in at https://staging.specialistly.com
   - Token is stored in `staging.specialistly.com`'s localStorage
   - `localStorage.getItem('authToken')` works ✓

2. Customer navigates to specialist's branded page at https://nest.staging.specialistly.com
   - Different domain = different localStorage partition
   - `localStorage.getItem('authToken')` returns `null` ✗
   - API call doesn't include Authorization header
   - Backend returns empty enrollment list

## Root Cause

**Browsers partition localStorage by domain:**
- `staging.specialistly.com` ← one partition
- `nest.staging.specialistly.com` ← different partition (even same TLD doesn't share)
- `nithyachellam.specialistly.com` ← another partition

The frontend cannot access localStorage across domains for security reasons.

## Solutions

### Option 1: Centralized Auth with Shared Subdomain  (RECOMMENDED)
Keep token in **`specialistly.com`** localStorage and access it via:
- Store on shared domain cookies with `SameSite=Lax` and `Domain=.specialistly.com`
- Cookies are shared across all subdomains

**Pros:** Seamless cross-domain access
**Cons:** Requires backend changes for cookie-based auth

### Option 2: Store Token in Both Domains
- When user logs in at staging.specialistly.com, also store token at nest.specialistly.com
- Requires postMessage or redirect with token in URL
  
**Pros:** Works with localStorage
**Cons:** Complex, security risk if using URL

### Option 3: Use Query Parameter or Header
Frontend passes token in URL or request header when going to branded page:
```
https://nest.staging.specialistly.com/my-learning?token=jwt_token_here
```
Then JavaScript stores it in the new domain's localStorage

**Pros:** Simple implementation
**Cons:** Security risk (token in URL), limited by URL length

### Option 4: Backend Fallback (Already Implemented in Latest Code)
Backend retrieves customer email from query parameter or header:
```
GET /api/courses/enrollments/self-paced/my-courses?specialistEmail=nithyachellam@gmail.com
Headers: X-Customer-Email: sinduja.vel@gmail.com
```

**Pros:** Works immediately, no frontend changes
**Cons:** Less secure than JWT auth

## Current Implementation Status

✓ **Backend Fallback Already Implemented:**
- Priority 3 fallback in `backend/controllers/enrollmentController.js` line 177
- Checks `X-Customer-Email` header when no token

✗ **Frontend Not Using Fallback:**
- coursesAPI.ts always tries to use localStorage.getItem('authToken')
- Should fall back to X-Customer-Email header when auth token unavailable

## Recommended Fix (Short-term)

**Use Backend Fallback with X-Customer-Email Header:**

Modify `src/app/api/coursesAPI.ts`:

```typescript
export const getMySelfPacedCourses = () => {
  const headers = {};
  
  // Try to use auth token first
  const token = localStorage.getItem('authToken');
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  } else {
    // Fallback: Get customer email from localStorage (set at login time)
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user?.email) {
      headers['X-Customer-Email'] = user.email;
    }
  }
  
  return axios.get(`${API_BASE}/enrollments/self-paced/my-courses`, {
    headers,
  });
};
```

## Long-term Fix

Switch to Cookie-based authentication with Domain attribute:
```
Set-Cookie: authToken=jwt_token; Path=/; Domain=.specialistly.com; SameSite=Lax; HttpOnly
```

This allows:
- All subdomains to access the token
- HttpOnly prevents XSS tokens theft
- Automatic inclusion in cross-domain requests

## Testing

1. Login at staging.specialistly.com
2. Check browser DevTools > Application > localStorage
3. Navigate to nest.staging.specialistly.com
4. Check DevTools again - note localStorage is empty
5. Courses should still display (using header fallback)

## Files to Update

1. `src/app/api/coursesAPI.ts` - Add X-Customer-Email fallback to all methods
2. `backend/controllers/enrollmentController.js` - Already has the fallback (no changes needed)
3. Documentation (this file)
