# Option 3 Settings Pages - Route Integration (5 Minutes)

## Quick Setup Guide

Your settings components are ready! They just need routes. Follow this quick guide to get them integrated.

---

## Step 1: Find Your Main Routes File

Look for your main router configuration file. Common locations:
- `src/app/App.tsx` (if using React Router directly)
- `src/app/routes/index.tsx` (if using route modules)
- `src/routes.tsx` (dedicated routes file)

---

## Step 2: Add Settings Routes

Add these routes to your route configuration:

```tsx
import { SpecialistSettings } from '@/app/components/SpecialistSettings';
import { CustomerSettings } from '@/app/components/CustomerSettings';

// Inside your route definitions, add:

{
  path: '/settings/specialist',
  element: <SpecialistSettings onBack={() => navigate(-1)} />
}

{
  path: '/settings/customer',
  element: <CustomerSettings onBack={() => navigate(-1)} />
}
```

---

## Step 3: Add Navigation Links

In your dashboard or header navigation component:

```tsx
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/app/context/AuthContext';

export function Navigation() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  return (
    <nav>
      {/* Existing nav items */}
      
      {user && (
        <Link 
          to={user.isSpecialist ? '/settings/specialist' : '/settings/customer'}
          className="flex items-center gap-2 hover:bg-gray-100 p-2 rounded"
        >
          ⚙️ Settings
        </Link>
      )}
    </nav>
  );
}
```

---

## Step 4: Test All Three Options

```bash
# Option 1: Post-signup wizard
# 1. Sign up with new email
# 2. Should see OnboardingWizard
# 3. Go through steps and complete

# Option 2: During signup form
# 1. Sign up
# 2. If specialist, should see expandable categories section
# 3. Can select categories before submitting
# 4. Should skip onboarding if categories selected

# Option 3: Settings page
# 1. Click Settings link in navigation
# 2. View current categories/interests
# 3. Click Edit button
# 4. Modify selections and save
# 5. Should show toast notification
# 6. Database should update
```

---

## Step 5: Verify Database Updates

Check MongoDB to confirm data is saving:

```javascript
// For specialists setting categories
db.users.findOne({ email: 'test@example.com' })
// Should have: { categoriesSetAt: Date, onboardingComplete: true }

// For customers setting interests
db.customers.findOne({ email: 'test@example.com' })
// Should have: { interests: ["Fitness", "Tech", ...], interestsUpdatedAt: Date }
```

---

## Step 6: Deploy

```bash
# Build and test
npm run build

# If all good, commit and deploy
git add .
git commit -m "feat: Add settings routes for Option 3"
git push origin main

# Deploy to Vercel / your hosting
```

---

## Component Props Reference

### SpecialistSettings
```tsx
interface SpecialistSettingsProps {
  onBack: () => void;  // Called when user clicks back button
}
```

### CustomerSettings
```tsx
interface CustomerSettingsProps {
  onBack: () => void;  // Called when user clicks back button
}
```

---

## Common Issues & Solutions

### "Component not found" error
- Verify import paths match your project structure
- Check that component files exist in `src/app/components/`

### Settings page is blank
- Make sure `useAuth()` hook is working and returning user data
- Check browser console for API errors
- Verify GET endpoint: `/api/customers/interests/:email` is working

### Changes not saving
- Check browser Network tab for PUT request status
- Verify API endpoint returns 200 OK
- Check MongoDB to see if data was actually saved

### Styles look wrong
- Components use Tailwind CSS - ensure it's imported
- Check that Radix UI icons are installed (Check icon)

---

## That's It! 🎉

Your three-option category tagging system is now fully deployed:

- **Option 1**: Post-signup onboarding wizard ✅
- **Option 2**: Category selection in signup form ✅  
- **Option 3**: Settings pages for anytime editing ✅

Users can now manage their specialities/interests however they prefer!

---

**Estimated Setup Time**: 5-10 minutes  
**Difficulty Level**: Easy  
**Testing Time**: 10-15 minutes
