# Specialist Branded Subdomain System - Implementation Guide

## Overview
This implementation adds a complete user-owned branded subdomain system with a controlled page builder for the specialist marketplace. Each specialist gets their own public branded page accessible via a custom subdomain.

## Architecture

### 1. Data Model: `SpecialistBranding`
**Location**: `backend/models/SpecialistBranding.js`

Stores all branding and page content data:
- **Slug**: Unique identifier for subdomain (e.g., `john-smith` for `john-smith.myapp.com`)
- **Business Info**: Name, tagline, logo, colors
- **Page Sections**: 
  - Header (title, subtitle, CTA)
  - About (bio, profile image)
  - Services (display mode: grid/list/carousel)
  - Testimonials (with ratings)
  - Call-to-Action
  - Footer
- **SEO**: Title, description, keywords
- **Layout Style**: minimal/modern/corporate/creative
- **Published Status**: Draft or Published
- **Social Links**: Platform and URL
- **Color Scheme**: Primary, secondary, accent colors

### 2. Backend Routes & API
**Location**: `backend/routes/brandingRoutes.js`

#### Public Endpoints
- `GET /api/branding/public/slug/:slug` - Fetch published page data
- `GET /api/branding/available/slug?slug=...` - Check slug availability

#### Specialist Endpoints
- `GET /api/branding/:email` - Get specialist's branding
- `POST /api/branding` - Create new branding
- `PUT /api/branding/:email` - Update branding
- `PUT /api/branding/:email/section/:section` - Update specific section
- `PUT /api/branding/:email/publish` - Toggle publish status
- `POST /api/branding/:email/testimonials` - Add testimonial
- `DELETE /api/branding/:email/testimonials/:id` - Remove testimonial
- `POST /api/branding/:email/social` - Add social link
- `DELETE /api/branding/:email/social/:platform` - Remove social link

### 3. Frontend Components

#### PageBuilder Component
**Location**: `src/app/components/PageBuilder.tsx`

Dashboard for specialists to customize their page:
- **General Tab**: Business name, tagline, slug, logo, layout style
- **Design Tab**: Color scheme (primary, secondary, accent), header customization
- **Sections Tab**: Enable/disable sections, customize titles and content
- **SEO Tab**: Page title, meta description, keywords

Features:
- Real-time preview updates
- Save changes to backend
- Publish/unpublish pages
- Copy subdomain URL to clipboard

#### SpecialistLandingPage Component
**Location**: `src/app/components/SpecialistLandingPage.tsx`

Public-facing page rendered from branding data:
- Dynamic header with custom colors and text
- About section with profile image
- Services section (grid/list/carousel modes)
- Testimonials section with ratings
- Call-to-action section
- Social links footer
- Responsive design with custom colors

### 4. Frontend API Integration
**Location**: `src/app/api/apiClient.ts`

New `brandingAPI` object with methods:
```typescript
brandingAPI.getPublicBranding(slug)       // Public page data
brandingAPI.checkSlugAvailability(slug)   // Check slug
brandingAPI.getMyBranding(email)          // Get specialist's branding
brandingAPI.updateBranding(email, data)   // Update branding
brandingAPI.updateSection(email, section, data)  // Update section
brandingAPI.togglePublish(email)          // Publish/unpublish
brandingAPI.addTestimonial(email, data)   // Add testimonial
brandingAPI.removeTestimonial(email, id)  // Remove testimonial
brandingAPI.addSocialLink(email, data)    // Add social link
brandingAPI.removeSocialLink(email, platform)  // Remove social link
```

### 5. Navigation Integration
- Added "Branded Page Builder" to specialist sidebar menu
- Route: `page-builder`
- Accessible from main dashboard

## How It Works

### For Specialists
1. **Create/Edit Branding**:
   - Navigate to "Branded Page Builder" in sidebar
   - Fill in business info, colors, and content sections
   - Customize each page section independently
   - Save changes and publish

2. **Manage Content**:
   - Edit headline, about section, services
   - Add/remove testimonials
   - Add social media links
   - Configure SEO metadata
   - Choose layout style

3. **Access Public Page**:
   - View live page URL: `https://{slug}.myapp.com`
   - Copy URL to share with customers
   - Toggle publish status to draft/live

### For Customers
1. **Access Specialist Page**:
   - Visit specialist's subdomain (e.g., `https://john-smith.myapp.com`)
   - View branded page with custom colors and content
   - See all services in configured display mode
   - Read testimonials and social links
   - Click to book sessions

## Setup Instructions

### 1. Database Initialization
The `SpecialistBranding` model is automatically initialized on server start. No manual migration needed.

### 2. Server Configuration
The branding routes are automatically mounted at `/api/branding` in server.js.

### 3. Frontend Access
1. Login as a specialist
2. Click "Branded Page Builder" in sidebar
3. Fill in business information
4. Customize design and sections
5. Click "Save Changes" to persist
6. Click "Publish" to make public
7. Share the subdomain URL with customers

## Default Values
If a specialist doesn't have branding configured, defaults are:
```javascript
{
  slug: "email-prefix", // e.g., "john" from john@example.com
  businessName: "My Service",
  businessTagline: "Professional Services",
  colors: {
    primary: "#3B82F6",    // Blue
    secondary: "#10B981",  // Green
    accent: "#F59E0B"      // Amber
  },
  header: {
    title: "Welcome",
    subtitle: "Your Professional Services",
    ctaButtonText: "Book a Session"
  }
}
```

## Slug Rules
- Lowercase automatically
- Spaces converted to hyphens
- Special characters removed
- Must be unique
- Check availability before creating

## Display Modes for Services
- **Grid**: 3-column card layout (desktop)
- **List**: Full-width list with details
- **Carousel**: Swipeable carousel (future enhancement)

## SEO Optimization
Each page includes:
- Meta title (50-60 chars recommended)
- Meta description (150-160 chars recommended)
- Keywords for search engines

## Security Notes
- Public branding only shows if `isPublished: true`
- Specialists can only edit their own branding
- No free-form HTML allowed (structured components only)
- All color inputs validated
- URLs validated for social links

## Testing Checklist

### Page Builder
- [ ] Navigate to Page Builder
- [ ] Update business name and tagline
- [ ] Change color scheme
- [ ] Update header section
- [ ] Enable/disable about section
- [ ] Configure services section display
- [ ] Edit CTA section
- [ ] Update SEO fields
- [ ] Click "Save Changes"
- [ ] Click "Publish" button
- [ ] Verify published status changes
- [ ] Copy subdomain URL

### Public Landing Page
- [ ] Visit specialist's subdomain URL
- [ ] Verify custom colors applied
- [ ] See business name and tagline
- [ ] View header section
- [ ] Check about section displays
- [ ] Verify services list/grid
- [ ] See testimonials if enabled
- [ ] Check CTA section
- [ ] Verify social links show
- [ ] Check footer displays

### Unpublished Pages
- [ ] Unpublish a page
- [ ] Try to access deleted page
- [ ] Verify 404 error returned

## Future Enhancements
1. **Carousel Services**: Smooth swipeable carousel
2. **Image Uploads**: File upload for logos and images
3. **Custom Domain**: Allow custom domain instead of subdomain
4. **Analytics**: Track page views and CTAs
5. **Email Capture**: Newsletter signup form
6. **Gallery Section**: Photo gallery with lightbox
7. **Video Embed**: YouTube/Vimeo video support
8. **Booking Calendar**: Integrated booking calendar
9. **Theme Templates**: Pre-designed themes
10. **Mobile Preview**: Real-time mobile preview in builder

## File Structure
```
backend/
  models/
    SpecialistBranding.js         # Data model
  controllers/
    brandingController.js          # Business logic
  routes/
    brandingRoutes.js              # API routes

src/app/
  components/
    PageBuilder.tsx                # Dashboard UI
    SpecialistLandingPage.tsx      # Public page
  api/
    apiClient.ts                   # API client (updated)
  
  Sidebar.tsx                       # Updated with page-builder route
  App.tsx                           # Updated with PageBuilder component
```

## API Response Examples

### Get Branding
```json
{
  "success": true,
  "data": {
    "slug": "john-smith",
    "businessName": "John Smith Consulting",
    "businessTagline": "Expert Business Strategy",
    "colors": {
      "primary": "#3B82F6",
      "secondary": "#10B981",
      "accent": "#F59E0B"
    },
    "isPublished": true,
    ...
  }
}
```

### Check Slug Availability
```json
{
  "success": true,
  "available": true
}
```

## Troubleshooting

**Page not found after publishing**
- Verify `isPublished: true` in database
- Check slug is correct
- Clear browser cache

**Colors not updating**
- Ensure hex color format is valid
- Refresh page after save
- Check browser console for errors

**Services not showing**
- Verify services are marked `status: 'active'`
- Check services section is enabled
- Confirm creator email matches specialist email

**Subdomain not working**
- Verify slug value in database
- Check server routing is correct
- Clear browser cache and cookies
