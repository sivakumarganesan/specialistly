# Category Tagging at Sign-Up & Post Sign-Up Implementation Guide

## 📋 Overview

This guide explains how to integrate speciality category and customer interests tagging into your authentication flow. The system now supports:

1. **Post Sign-Up Onboarding Wizard** - Multi-step setup after successful registration
2. **Specialist Category Setup** - Tag specialities during/after sign-up
3. **Customer Interest Setup** - Tag interests during/after sign-up
4. **Settings Pages** - Allow users to update categories/interests anytime

---

## 🏗️ Architecture

### Components Created

#### 1. **OnboardingWizard.tsx** (Multi-step Setup)
- Step 1: Welcome with account type confirmation
- Step 2: Category/Interest selection
- Step 3: Success message & next steps
- Handles both specialists and customers

#### 2. **SpecialistCategorySetup.tsx** (Specialist Categories)
- Multi-select interface for specialities
- Reusable component with props for customization
- Integrates with specialist category API
- Can be used standalone or in onboarding

#### 3. **CustomerInterestsSetup.tsx** (Customer Interests)
- Multi-select interface for interests
- Skip option available (interests are optional)
- Integrates with customer interests API
- Can be used standalone or in onboarding

---

## 🔧 Backend Changes

### Model Updates

#### User Model (`backend/models/User.js`)
```javascript
// New fields added:
onboardingComplete: {
  type: Boolean,
  default: false,
},
categoriesSetAt: Date,
customerInterests: [{
  type: String,
  enum: [13 categories]
}],
```

#### Customer Model (`backend/models/Customer.js`)
```javascript
// New fields added:
interests: [{
  type: String,
  enum: [13 categories]
}],
interestsUpdatedAt: Date,
```

### API Endpoints Added

#### Auth Routes (`backend/routes/authRoutes.js`)
```
PUT /api/auth/onboarding-complete
  - Marks onboarding as complete for a user
  - Body: { email: string }
  - Returns: { success, message, user }
```

#### Customer Routes (`backend/routes/customerRoutes.js`)
```
PUT /api/customers/interests
  - Updates customer interests
  - Body: { email: string, interests: string[] }
  - Returns: { success, message, data }
  - Validates interests against allowed categories

GET /api/customers/interests/:email
  - Retrieves customer interests
  - Returns: { success, data: { email, interests, interestsUpdatedAt } }
```

### Controller Methods

#### authController.js
- `markOnboardingComplete()` - Sets onboardingComplete flag

#### customerController.js
- `updateCustomerInterests()` - Saves customer interests
- `getCustomerInterests()` - Retrieves customer interests

---

## 🚀 Integration Steps

### Step 1: Update Your Sign-Up Component

Find your sign-up/auth page and modify it to show the onboarding wizard after successful registration.

**Example Integration in Sign-Up Flow:**

```typescript
// In your auth/sign-up page component

import { OnboardingWizard } from '@/app/components/OnboardingWizard';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/app/context/AuthContext'; // or your auth context

export function SignUpPage() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<'specialist' | 'customer'>('customer');
  const navigate = useNavigate();

  const handleSignUpSuccess = (email: string, role: 'specialist' | 'customer') => {
    setNewUserEmail(email);
    setNewUserRole(role);
    setShowOnboarding(true);
  };

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    // Redirect to dashboard
    navigate(newUserRole === 'specialist' ? '/specialist-dashboard' : '/customer-dashboard');
  };

  if (showOnboarding) {
    return (
      <OnboardingWizard
        userEmail={newUserEmail}
        userRole={newUserRole}
        onComplete={handleOnboardingComplete}
      />
    );
  }

  // ... rest of your sign-up form
  // When signup succeeds:
  // handleSignUpSuccess(userEmail, userRole);
}
```

### Step 2: Add Onboarding Check to Protected Routes

Check if user has completed onboarding on first login after sign-up:

```typescript
// In your ProtectedRoute component or dashboard layout

import { useEffect, useState } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { OnboardingWizard } from '@/app/components/OnboardingWizard';

export function ProtectedRoute({ children, ...rest }: any) {
  const { user } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    // If user is not logged in or onboarding is complete, do nothing
    if (!user || user.onboardingComplete) {
      setShowOnboarding(false);
      return;
    }

    // For new users who haven't completed onboarding, show wizard
    // This assumes you track onboardingComplete in your auth context
    setShowOnboarding(true);
  }, [user]);

  if (showOnboarding && user) {
    return (
      <OnboardingWizard
        userEmail={user.email}
        userRole={user.isSpecialist ? 'specialist' : 'customer'}
        onComplete={() => {
          setShowOnboarding(false);
          // Refresh user data if needed
          window.location.reload(); // or refetch user profile
        }}
      />
    );
  }

  return children;
}
```

### Step 3: Create Settings Pages for Category Management

Create pages to allow users to update categories/interests anytime:

```typescript
// SpecialistSettingsPage.tsx
import { SpecialistCategorySetup } from '@/app/components/SpecialistCategorySetup';
import { useAuth } from '@/app/context/AuthContext';

export function SpecialistSettingsPage() {
  const { user } = useAuth();

  return (
    <div className="p-6">
      <h1>Profile Settings</h1>
      
      {user && (
        <div className="mt-6">
          <h2>Your Specialities</h2>
          <SpecialistCategorySetup 
            specialistEmail={user.email}
            onComplete={() => {
              console.log('Categories updated');
              // Optionally refresh user data
            }}
          />
        </div>
      )}
    </div>
  );
}
```

```typescript
// CustomerSettingsPage.tsx
import { CustomerInterestsSetup } from '@/app/components/CustomerInterestsSetup';
import { useAuth } from '@/app/context/AuthContext';

export function CustomerSettingsPage() {
  const { user } = useAuth();

  return (
    <div className="p-6">
      <h1>Profile Settings</h1>
      
      {user && (
        <div className="mt-6">
          <h2>Your Interests</h2>
          <CustomerInterestsSetup 
            customerEmail={user.email}
            onComplete={() => {
              console.log('Interests updated');
              // Optionally refresh user data
            }}
          />
        </div>
      )}
    </div>
  );
}
```

### Step 4: Update AuthContext

Include onboarding status in your auth context:

```typescript
// In your AuthContext/authContext.tsx

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  isSpecialist: boolean;
  onboardingComplete?: boolean;
  specialityCategories?: string[];
  customerInterests?: string[];
  // ... other fields
}

export const AuthContext = createContext<{
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (data: any) => Promise<void>;
  logout: () => void;
  // ... other methods
} | null>(null);
```

---

## 📊 API Reference

### Mark Onboarding Complete
```
PUT /api/auth/onboarding-complete

Request:
{
  "email": "user@example.com"
}

Response:
{
  "success": true,
  "message": "Onboarding marked as complete",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "onboardingComplete": true
  }
}
```

### Update Customer Interests
```
PUT /api/customers/interests

Request:
{
  "email": "customer@example.com",
  "interests": ["Healthcare", "Sports", "Technology & IT"]
}

Response:
{
  "success": true,
  "message": "Interests updated successfully",
  "data": {
    "email": "customer@example.com",
    "interests": ["Healthcare", "Sports", "Technology & IT"],
    "interestsUpdatedAt": "2024-01-15T10:30:00Z"
  }
}
```

### Get Customer Interests
```
GET /api/customers/interests/:email

Response:
{
  "success": true,
  "data": {
    "email": "customer@example.com",
    "interests": ["Healthcare", "Sports"],
    "interestsUpdatedAt": "2024-01-15T10:30:00Z"
  }
}
```

### Update Specialist Categories
```
PUT /api/creator/categories/specialist/:email

Request:
{
  "email": "specialist@example.com",
  "categories": ["Healthcare", "Coaching"]
}

Response:
{
  "success": true,
  "message": "Speciality categories updated successfully",
  "data": {
    "email": "specialist@example.com",
    "specialityCategories": ["Healthcare", "Coaching"],
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

---

## 🔐 Security Considerations

1. **Email Verification**: Ensure email is verified before allowing access to onboarding
2. **Rate Limiting**: Add rate limits to update endpoints to prevent abuse
3. **Validation**: All category/interest values are validated against enum on backend
4. **Authorization**: Only users can update their own categories/interests
5. **HTTPS**: Ensure all API calls use HTTPS in production

---

## 📝 Frontend API Methods

The following methods are available in `apiClient.ts`:

```typescript
// Auth API
authAPI.markOnboardingComplete({ email: string })

// Customer API
customerAPI.updateInterests({ email: string, interests: string[] })
customerAPI.getInterests(email: string)

// Creator/Specialist API
creatorAPI.updateSpecialistCategories(email: string, categories: string[])
creatorAPI.getSpecialistCategories(email: string)
```

---

## 🎨 Component Props Reference

### OnboardingWizard
```typescript
interface OnboardingWizardProps {
  userEmail: string;           // Email of newly signed up user
  userRole: 'specialist' | 'customer';  // User role
  onComplete: () => void;      // Callback when wizard completes
}
```

### SpecialistCategorySetup
```typescript
interface SpecialistCategorySetupProps {
  specialistEmail: string;     // Specialist's email
  onComplete?: (categories: string[]) => void;  // Callback with selected categories
  isOnboarding?: boolean;      // Whether used in onboarding flow
}
```

### CustomerInterestsSetup
```typescript
interface CustomerInterestsSetupProps {
  customerEmail: string;       // Customer's email
  onComplete?: (interests: string[]) => void;   // Callback with selected interests
  isOnboarding?: boolean;      // Whether used in onboarding flow
}
```

---

## 🧪 Testing

### Test Scenarios

1. **Sign-Up Flow**
   - [ ] User signs up with specialist role → Sees onboarding wizard
   - [ ] User signs up with customer role → Sees onboarding wizard
   - [ ] User can skip category selection
   - [ ] User can select categories and save
   - [ ] Onboarding completion is recorded

2. **Post-Sign-Up Updates**
   - [ ] User can update specialities in settings
   - [ ] User can update interests in settings
   - [ ] Changes are persisted to database
   - [ ] Changes are reflected in API responses

3. **Validation**
   - [ ] Invalid categories are rejected
   - [ ] Empty email returns error
   - [ ] Non-existent user returns 404
   - [ ] API validates against allowed categories

---

## 📦 Deployment Checklist

- [ ] Backend Model changes deployed
- [ ] New API endpoints working
- [ ] Frontend components built successfully
- [ ] ApiClient methods added
- [ ] Sign-up flow integration tested
- [ ] Onboarding wizard tested with both roles
- [ ] Settings pages created and tested
- [ ] AuthContext updated with onboarding field
- [ ] Database migration completed (if using migrations)
- [ ] Environment variables configured
- [ ] HTTPS enabled for all API calls
- [ ] Error handling tested and working
- [ ] Loading states tested
- [ ] Success notifications working

---

## 🆘 Troubleshooting

### Issue: Onboarding Wizard Not Showing After Sign-Up

**Solution**: 
- Verify `showOnboarding` state is set to true after successful signup
- Check that user email is being passed correctly
- Ensure OnboardingWizard component is imported and rendered

### Issue: Categories Not Saving

**Solution**:
- Check network tab for 400/500 errors
- Verify email format is correct
- Ensure selected categories match allowed enum values
- Check backend logs for validation errors

### Issue: Onboarding Complete Flag Not Updating

**Solution**:
- Verify API endpoint is being called: `PUT /api/auth/onboarding-complete`
- Check response in network tab
- Ensure user profile is being refreshed after onboarding
- Check that AuthContext is updated with latest user data

### Issue: Interests Not Appearing in Customer Profile

**Solution**:
- Verify customer record exists in database
- Check that interests are being saved to Customer model (not just User)
- Ensure email matches between signup and interest save
- Check MongoDB for document structure

---

## 📚 Next Steps

1. **Email Notifications**: Send confirmation emails when categories/interests are set
2. **Recommendations**: Use categories/interests to recommend specialists/courses
3. **Analytics**: Track how many users complete onboarding
4. **A/B Testing**: Test different onboarding flows
5. **Mobile Optimization**: Ensure responsive design on mobile devices

---

## 📝 Implementation Summary

| Component | Purpose | Key Features |
|-----------|---------|--------------|
| OnboardingWizard | Multi-step setup | Progress bar, 3 steps, both roles |
| SpecialistCategorySetup | Specialist categories | Multi-select, save, skip |
| CustomerInterestsSetup | Customer interests | Multi-select, save, skip |
| Backend Routes | API endpoints | Validation, error handling |
| AuthContext | State management | Track onboarding status |
| Settings Pages | Post-signup updates | Allow anytime updates |

---

## 📞 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review console/network errors
3. Check backend logs for detailed error messages
4. Verify API endpoints are correctly implemented
5. Test with Postman or similar tool to isolate frontend/backend issues
