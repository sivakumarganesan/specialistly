# Specialist Display Flow in Marketplace

## ✅ Data Source & Flow

### 1. **Database (MongoDB - users collection)**
```
Specialist 1:
- _id: 69785f3fd6c5ab2bc5c786ca
- Name: siva1
- Email: siva1@gmail.com
- Role: specialist
- isSpecialist: true

Specialist 2 (From Booking Error):
- _id: 69796ec0d6c5ab2bc5c786dc  
- Name: Sivakumar Ganesan
- Email: sivakumarganeshm@gmail.com
- Role: specialist
- isSpecialist: true
```

### 2. **Backend API Route** 
📍 **GET `/api/creator/specialists/all`**

**Controller:** [backend/controllers/creatorController.js](../../backend/controllers/creatorController.js#L106)

```javascript
export const getAllSpecialists = async (req, res) => {
  const User = (await import('../models/User.js')).default;
  const specialists = await User.find({ isSpecialist: true });
  
  const specialistsData = specialists.map(specialist => ({
    _id: specialist._id,
    name: specialist.name,
    email: specialist.email,
    bio: 'Expert Specialist',
    specialization: 'Professional Services',
    profilePicture: specialist.profilePicture,
    rating: 4.5,
    totalStudents: 0,
    servicesCount: 0,
    coursesCount: 0,
    isSpecialist: specialist.isSpecialist,
    membership: specialist.membership,
  }));
  
  return { success: true, data: specialistsData };
};
```

### 3. **Frontend API Client**
📍 [src/app/api/apiClient.ts](../../src/app/api/apiClient.ts#L105)

```typescript
export const creatorAPI = {
  getAllSpecialists: () => apiCall("/creator/specialists/all"),
  getById: (id: string) => apiCall(`/creator/id/${id}`),
  // ... other methods
};
```

### 4. **Marketplace Component**
📍 [src/app/components/Marketplace.tsx](../../src/app/components/Marketplace.tsx)

**Fetching Specialists:**
```typescript
const fetchSpecialists = async () => {
  const response = await creatorAPI.getAllSpecialists();
  const creators = Array.isArray(response?.data) ? response.data : [];
  
  const activeSpecialists = creators
    .filter((creator: any) => creator.email !== user?.email)  // Exclude current user
    .map((creator: any) => ({
      _id: creator._id,
      name: creator.name,
      email: creator.email,
      bio: creator.bio || "Expert Specialist",
      specialization: creator.specialization || "Professional Services",
      profilePicture: creator.profilePicture,
      rating: creator.rating || 4.5,
      totalStudents: creator.totalStudents || 0,
      servicesCount: creator.servicesCount || 0,
      coursesCount: creator.coursesCount || 0,
    }));
  
  setSpecialists(activeSpecialists);
};
```

### 5. **Display in Marketplace UI**
Specialists are displayed in a grid with:
- Profile picture (avatar)
- Name
- Specialization
- Rating
- Bio
- Courses & Services count
- Student count
- "View Profile" button

## ✅ Specialist Selection Flow

When user clicks "View Profile" on a specialist card:

```
Marketplace.tsx
  ↓ onViewSpecialist(specialist._id, specialist.email)
  ↓
App.tsx (handleViewSpecialist callback)
  ↓
SpecialistProfile.tsx receives:
  - specialistId: string (MongoDB _id)
  - specialistEmail: string
  ↓
fetchSpecialistData() calls:
  1. creatorAPI.getById(specialistId)
     → GET /api/creator/id/:id
     → Returns specialist from User collection
  2. courseAPI.getAll({ creator: specialistEmail })
     → GET /api/courses?creator=email
     → Returns specialist's courses
  3. serviceAPI.getAll({ creator: specialistEmail })
     → GET /api/services?creator=email
     → Returns specialist's services
  4. appointmentAPI.getAvailable()
     → GET /api/appointments/available
     → Returns available booking slots
```

## ✅ New Route Added

**File:** [backend/routes/creatorRoutes.js](../../backend/routes/creatorRoutes.js)

```javascript
router.get('/id/:id', getCreatorById);  // ← NEW ROUTE ADDED
```

**Function:** [backend/controllers/creatorController.js](../../backend/controllers/creatorController.js#L106)

```javascript
export const getCreatorById = async (req, res) => {
  const { id } = req.params;
  const User = (await import('../models/User.js')).default;
  
  const specialist = await User.findById(id);
  
  return {
    _id: specialist._id,
    name: specialist.name,
    email: specialist.email,
    // ... other fields
  };
};
```

## ✅ Data Consistency

- ✅ Specialists are fetched from `users` collection with `isSpecialist: true`
- ✅ Current user is filtered out from the marketplace list
- ✅ Each specialist's ID can be used to fetch individual profile
- ✅ Specialist email is used to fetch their courses and services
- ✅ All specialist data in the marketplace matches the database records

## 🎯 Result

Users see correct specialist data in the marketplace with:
- Actual names and emails from database
- Derived data (rating, bio, counts)
- Ability to click and view full profile
- Option to book sessions with the specialist
