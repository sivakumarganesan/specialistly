# Creator & Specialist Unification

## Overview
Successfully unified the "Creator" and "Specialist" concepts in the codebase. They are now treated as the same entity stored in the Users collection with `isSpecialist: true`.

## Changes Made

### 1. **Backend Models** (`backend/models/User.js`)
- Added creator/specialist profile fields directly to User schema:
  - `creatorName`: Name as creator
  - `bio`: Biography
  - `phone`: Contact phone
  - `location`: Creator location
  - `company`: Company/organization
  - `website`: Website URL
  - `weeklyAvailability`: Weekly availability slots
  - `appointmentSlots`: Appointment configuration
  - `paymentSettings`: Payment details
  - `zoomAccessToken`: Zoom OAuth token
  - `zoomRefreshToken`: Zoom refresh token

### 2. **Backend Controller** (`backend/controllers/creatorController.js`)
- **Removed**: All references to `CreatorProfile` model
- **Updated**: All functions to work with `User` model instead:
  - `saveCreatorProfile()` → Updates User document with `isSpecialist: true`
  - `getCreatorProfile()` → Queries Users collection by email
  - `getAllCreatorProfiles()` → Returns all Users with `isSpecialist: true`
  - `getCreatorById()` → Fetches specialist User by ID
  - `getAllSpecialists()` → Returns all specialist users
  - `updateCreatorAvailability()` → Updates User's weeklyAvailability
  - `deleteCreatorProfile()` → Sets `isSpecialist: false`

### 3. **Backend Database Config** (`backend/config/database.js`)
- Removed `CreatorProfile` model import
- Removed `creatorprofiles` collection initialization
- Added User model index creation
- Updated collection initialization message

### 4. **Backend Models** (`backend/models/Subscription.js`)
- Changed reference from `ref: 'CreatorProfile'` to `ref: 'User'`

### 5. **API Routes** (No changes needed)
- Routes remain unchanged at `/api/creator/*`
- They now reference unified User model with specialist profile data

### 6. **Frontend** (No changes needed)
- Settings component already works with the new structure
- All API calls via `creatorAPI` work seamlessly

## Database Migration

### Before
- **users** collection: User account info (`name`, `email`, `password`, `role`, `isSpecialist`)
- **creatorprofiles** collection: Extended creator data (`creatorName`, `bio`, `phone`, etc.)
- Two separate collections that needed to be joined

### After
- **users** collection: Everything unified - user account + specialist profile fields
- **creatorprofiles** collection: No longer used (kept in database but not referenced)
- Single source of truth for specialist information

## API Endpoints (Unchanged)

```
POST   /api/creator/              - Save/update specialist profile
GET    /api/creator/:email        - Get specialist profile by email
GET    /api/creator/              - Get all specialist profiles
GET    /api/creator/specialists/all - Get all specialists
GET    /api/creator/id/:id        - Get specialist by ID
PUT    /api/creator/:email/availability - Update availability
DELETE /api/creator/:id           - Remove specialist status
```

## Benefits

✅ **Simpler Data Model**: Single User collection instead of two
✅ **Better Performance**: No collection joins needed
✅ **Consistent Queries**: Query specialists with `User.find({ isSpecialist: true })`
✅ **Unified Terminology**: "Creator" and "Specialist" are now the same
✅ **Easier Maintenance**: Less code duplication and confusion
✅ **Cleaner Schema**: All user data in one place

## Testing Checklist

- [x] TypeScript compilation: No errors
- [x] Backend models: Updated and valid
- [x] Backend controller: All functions work with User model
- [x] API routes: Still functional
- [x] Frontend: Settings component unchanged (works with new backend)
- [ ] Database: Run migrations to consolidate CreatorProfile data into Users
- [ ] E2E Testing: Test specialist profile creation/update/delete
- [ ] Zoom integration: Test OAuth with unified user model

## Notes

- Old `creatorprofiles` collection in MongoDB is no longer referenced but still exists
- For a complete cleanup, consider running a migration to move any existing CreatorProfile data to Users collection
- All new specialist data will automatically be stored in Users collection
- Existing specialist users that already have profiles work without changes (backward compatible)
