# Specialist Branded Subdomain System - Technical Details

## System Architecture

### Component Diagram
```
┌─────────────────────────────────────────────────────────────┐
│                    Specialist Dashboard                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Page Builder Component (PageBuilder.tsx)                    │
│  ├─ General Settings Tab                                     │
│  ├─ Design Customization Tab                                 │
│  ├─ Page Sections Configuration Tab                          │
│  └─ SEO Optimization Tab                                     │
│                                                               │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
        ┌─────────────────────────┐
        │   Branding API Routes   │
        │  (/api/branding/...)    │
        └────────────┬────────────┘
                     │
                     ▼
        ┌────────────────────────────────────────┐
        │  Branding Controller & Business Logic  │
        │   - Validation                         │
        │   - Authorization                      │
        │   - CRUD Operations                    │
        └────────────┬───────────────────────────┘
                     │
                     ▼
        ┌────────────────────────────────────────┐
        │     SpecialistBranding Model           │
        │   - Slug (unique identifier)           │
        │   - Branding Data                      │
        │   - Page Sections                      │
        │   - Publish Status                     │
        │   - Timestamps                         │
        └────────────┬───────────────────────────┘
                     │
                     ▼
                 MongoDB

        Public Landing Page Access:
        https://{slug}.myapp.com
        └─────────────────┬─────────────────┘
                          │
                          ▼
              ┌─────────────────────────┐
              │ GET /api/branding/public/
              │       slug/{slug}        │
              └────────────┬─────────────┘
                           │
                           ▼
            ┌──────────────────────────────────┐
            │ SpecialistLandingPage Component  │
            │ (SpecialistLandingPage.tsx)      │
            │                                  │
            │ - Dynamic rendering from data    │
            │ - Custom colors applied          │
            │ - Services section               │
            │ - About section                  │
            │ - Testimonials                   │
            │ - CTA section                    │
            │ - Social links footer            │
            └──────────────────────────────────┘
```

## Data Flow

### Creating/Updating Branding
1. Specialist fills form in PageBuilder component
2. Component state updated with form inputs
3. User clicks "Save Changes"
4. `brandingAPI.updateBranding(email, branding)` called
5. PUT request sent to `/api/branding/:email`
6. Backend validates data
7. SpecialistBranding document updated in MongoDB
8. Updated document returned to frontend
9. Component state refreshed with saved data
10. Success feedback shown to user

### Publishing a Page
1. Specialist clicks "Publish" button
2. `brandingAPI.togglePublish(email)` called
3. PUT request sent to `/api/branding/:email/publish`
4. Backend toggles `isPublished` field
5. Updated branding returned
6. Component state updated
7. UI shows new publish status
8. Public URL becomes accessible

### Accessing Public Page
1. Customer visits `https://{slug}.myapp.com`
2. Browser makes request with slug in URL
3. SpecialistLandingPage component receives slug prop
4. useEffect hook triggers data fetch
5. `brandingAPI.getPublicBranding(slug)` called
6. GET request sent to `/api/branding/public/slug/{slug}`
7. Backend queries MongoDB for matching slug
8. Checks `isPublished: true`
9. Returns branding + services data
10. Component renders page with custom colors and content

## Database Schema

### SpecialistBranding Collection
```javascript
{
  _id: ObjectId,
  
  // Identity
  userId: ObjectId,           // Reference to User
  email: String,              // Specialist email
  slug: String,               // Unique subdomain identifier
  
  // Branding
  businessName: String,
  businessTagline: String,
  logoUrl: String,
  faviconUrl: String,
  
  // Colors
  colors: {
    primary: String,          // Hex color
    secondary: String,        // Hex color
    accent: String            // Hex color
  },
  
  // Page Sections
  header: {
    title: String,
    subtitle: String,
    backgroundImage: String,
    ctaButtonText: String,
    ctaButtonLink: String
  },
  
  about: {
    enabled: Boolean,
    title: String,
    bio: String,
    profileImage: String
  },
  
  services: {
    enabled: Boolean,
    title: String,
    description: String,
    displayMode: String        // 'grid', 'list', 'carousel'
  },
  
  testimonials: {
    enabled: Boolean,
    title: String,
    testimonials: [
      {
        id: String,
        name: String,
        title: String,
        message: String,
        rating: Number,
        image: String
      }
    ]
  },
  
  cta: {
    enabled: Boolean,
    title: String,
    description: String,
    buttonText: String
  },
  
  footer: {
    enabled: Boolean,
    copyrightText: String,
    showSocialLinks: Boolean
  },
  
  // Social Links
  socialLinks: [
    {
      platform: String,        // 'twitter', 'linkedin', etc.
      url: String
    }
  ],
  
  // SEO
  seoTitle: String,
  seoDescription: String,
  seoKeywords: String,
  
  // Layout
  layoutStyle: String,         // 'minimal', 'modern', 'corporate', 'creative'
  
  // Status
  isPublished: Boolean,
  
  // Timestamps
  createdAt: Date,
  updatedAt: Date
}
```

### Indexes
- Unique index on `slug`
- Unique index on `email`
- Index on `userId`
- Compound index for slug + isPublished (optimization)

## API Endpoints Reference

### Authentication
All specialist endpoints require the user's email to be passed (would need auth middleware in production)

### Endpoints

#### 1. Get Public Branding
```
GET /api/branding/public/slug/:slug
Response: { success: true, data: BrandingData }
Status: 404 if not found or not published
```

#### 2. Check Slug Availability
```
GET /api/branding/available/slug?slug={slug}
Response: { success: true, available: boolean }
```

#### 3. Get Specialist Branding
```
GET /api/branding/:email
Response: { success: true, data: BrandingData }
Status: 404 if not found
```

#### 4. Create Branding
```
POST /api/branding
Body: {
  userId: ObjectId,
  email: String,
  slug: String,
  businessName: String
}
Response: { success: true, data: BrandingData }
Status: 400 if slug already taken
```

#### 5. Update Branding
```
PUT /api/branding/:email
Body: { ...any fields to update }
Response: { success: true, data: UpdatedBranding }
```

#### 6. Update Page Section
```
PUT /api/branding/:email/section/:section
Body: { ...section fields }
Sections: 'header', 'about', 'services', 'testimonials', 'cta', 'footer'
Response: { success: true, data: UpdatedBranding }
```

#### 7. Toggle Publish
```
PUT /api/branding/:email/publish
Response: { success: true, data: BrandingData, message: "..." }
```

#### 8. Add Testimonial
```
POST /api/branding/:email/testimonials
Body: {
  name: String,
  title: String,
  message: String,
  rating: Number,
  image: String
}
Response: { success: true, data: UpdatedBranding }
```

#### 9. Remove Testimonial
```
DELETE /api/branding/:email/testimonials/:testimonialId
Response: { success: true, data: UpdatedBranding }
```

#### 10. Add Social Link
```
POST /api/branding/:email/social
Body: {
  platform: String,  // 'twitter', 'linkedin', etc.
  url: String
}
Response: { success: true, data: UpdatedBranding }
```

#### 11. Remove Social Link
```
DELETE /api/branding/:email/social/:platform
Response: { success: true, data: UpdatedBranding }
```

## Validation Rules

### Slug Validation
```javascript
- Must be 3-50 characters
- Lowercase only
- Alphanumeric + hyphens
- Must be unique in database
- Auto-converts spaces to hyphens
- Strips special characters
```

### Color Validation
```javascript
- Must be valid hex color (#RRGGBB)
- Default fallback to brand colors
- Case-insensitive but stored lowercase
```

### Email Validation
```javascript
- Must match authenticated user's email
- Case-insensitive lookup
```

### Section Validation
```javascript
- Each section can be enabled/disabled
- Default enabled on creation
- Title and description required if enabled
- displayMode must be 'grid', 'list', or 'carousel'
```

## Performance Optimizations

### Database Indexes
```javascript
specialistBrandingSchema.index({ slug: 1 });           // Fast slug lookups
specialistBrandingSchema.index({ email: 1 });         // Fast email lookups
specialistBrandingSchema.index({ userId: 1 });        // Fast user lookups
specialistBrandingSchema.index({ 
  slug: 1, 
  isPublished: 1 
});  // Optimized for public page access
```

### Caching Opportunities
- Branding data could be cached in Redis
- Public page HTML could be pre-rendered and cached
- CDN-friendly static assets (logos, images)

### Query Optimization
- Queries only fetch published branding for public pages
- Specific field selection for partial updates
- Slug lookups use indexed field

## Security Considerations

### Access Control
```javascript
// Specialists can only edit their own branding
// Check: req.user.email === branding.email

// Public branding only shows if isPublished: true
const branding = await SpecialistBranding.findOne({
  slug: slug.toLowerCase(),
  isPublished: true
});
```

### Data Validation
```javascript
// All inputs validated before saving
// Color inputs validated as hex codes
// URLs validated with regex
// Slug auto-sanitized
```

### XSS Prevention
```javascript
// No free-form HTML allowed
// Only structured components
// React auto-escapes text content
// URLs sanitized before rendering
```

### CSRF Protection
- Would need token validation in production
- Currently using same-origin requests only

## File Uploads (Future)

When implementing image uploads:
```javascript
// File upload flow
1. Frontend: Select image file
2. Upload to cloud storage (AWS S3, Cloudinary, etc.)
3. Get URL from storage
4. Save URL in branding document
5. Frontend: Display image with URL
```

## Responsive Design

### PageBuilder Component
- Single column on mobile
- Two columns on tablet
- Three columns on desktop
- Touch-friendly color pickers

### SpecialistLandingPage
- Mobile-first responsive
- Services grid becomes single column on mobile
- Header stack on mobile
- Footer links wrap appropriately
- Touch-friendly buttons and links

## Error Handling

### Frontend
```javascript
try {
  const response = await brandingAPI.updateBranding(email, data);
  // Success
  setBranding(response.data);
} catch (error) {
  // Show error message
  console.error("Failed to save:", error);
}
```

### Backend
```javascript
try {
  // Do operation
  res.status(200).json({ success: true, data });
} catch (error) {
  res.status(500).json({
    success: false,
    message: error.message
  });
}
```

## Testing Scenarios

### Unit Tests
- Slug validation and sanitization
- Color format validation
- Email matching for authorization
- Publish/unpublish toggle

### Integration Tests
- Create branding flow
- Update specific section
- Publish and access public page
- Unpublish and verify 404
- Add/remove testimonials

### E2E Tests
- Complete flow from PageBuilder to public page
- All color customizations apply
- All sections enable/disable properly
- Social links appear in footer
- SEO metadata renders correctly

## Deployment Checklist

- [ ] SpecialistBranding model created and indexed
- [ ] Branding controller logic implemented
- [ ] Routes mounted in server.js
- [ ] Frontend API client updated with brandingAPI
- [ ] PageBuilder component added to sidebar
- [ ] App.tsx updated with page-builder route
- [ ] SpecialistLandingPage component created
- [ ] No TypeScript errors
- [ ] No JavaScript syntax errors
- [ ] Backend server can connect to MongoDB
- [ ] Test create branding flow
- [ ] Test update sections
- [ ] Test publish/unpublish
- [ ] Test public page access
- [ ] Test slug uniqueness validation
- [ ] Verify colors save and apply
- [ ] Check responsive design on mobile
- [ ] Verify SEO fields save

## Future Enhancements

### Phase 2
- [ ] Image upload functionality
- [ ] Photo gallery section
- [ ] Video embed support
- [ ] Custom domain instead of subdomain
- [ ] Theme templates (pre-designed layouts)

### Phase 3
- [ ] Page analytics (views, clicks, conversions)
- [ ] A/B testing for sections
- [ ] Email newsletter capture
- [ ] Booking calendar integration
- [ ] Live chat widget

### Phase 4
- [ ] AI-powered page content suggestions
- [ ] Page SEO scoring and recommendations
- [ ] Mobile app preview
- [ ] Scheduled publishing
- [ ] Page version history

## Monitoring & Logging

### Key Metrics to Track
- Page creation rate
- Page publish/unpublish frequency
- Public page views
- Slug collision attempts
- API response times

### Error Monitoring
- Failed branding updates
- Invalid slug attempts
- Database connection errors
- File upload failures

### Performance Metrics
- Branding query times
- Page render times
- Image load times
- API response times
