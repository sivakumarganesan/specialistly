# Specialistly Page Builder System - Complete Architecture

## Executive Overview

A professional drag-and-drop website builder for specialists to create branded mini-websites. This document outlines the complete technical architecture, database schema, frontend components, and API structure.

---

## 1. DATABASE SCHEMA DESIGN

### 1.1 Website Configuration Schema

```javascript
// Collection: websites
{
  _id: ObjectId,
  specialistId: ObjectId (ref: User),
  domainName: String (e.g., "john-smith.specialistly.com"),
  customDomain: String (optional),
  displayName: String,
  description: String,
  isPublished: Boolean,
  
  // Branding
  branding: {
    logo: {
      url: String,
      alt: String,
      width: Number,
      height: Number,
    },
    favicon: String (URL),
    primaryColor: String (hex),
    secondaryColor: String (hex),
    accentColor: String (hex),
    backgroundColor: String (hex),
    textColor: String (hex),
    
    // Typography
    typography: {
      headingFont: String (e.g., "Inter", "Playfair Display"),
      bodyFont: String,
      fontSize: {
        h1: Number,
        h2: Number,
        h3: Number,
        body: Number,
      }
    },
    
    // Button Styles
    buttonStyle: {
      borderRadius: Number (px),
      padding: String (e.g., "12px 24px"),
      backgroundColor: String,
      textColor: String,
      hoverBackgroundColor: String,
      fontWeight: String,
    },
  },
  
  // Header/Navigation
  header: {
    layout: String (enum: "standard", "centered", "full-width"),
    logoPosition: String (enum: "left", "center"),
    showCTA: Boolean,
    ctaButton: {
      text: String,
      url: String,
      target: String (enum: "_self", "_blank"),
      style: String,
    },
  },
  
  // Footer
  footer: {
    layout: String,
    content: String,
    socialLinks: [{
      platform: String (facebook, twitter, linkedin, instagram),
      url: String,
    }],
    contactInfo: {
      email: String,
      phone: String,
      address: String,
    },
    copyright: String,
  },
  
  // Pages
  pages: [{
    _id: ObjectId,
    title: String,
    slug: String (unique per website),
    description: String (SEO meta description),
    isHomePage: Boolean,
    isPublished: Boolean,
    order: Number,
    sections: [ObjectId] (ref: PageSection),
    seoKeywords: [String],
    customMeta: Object,
  }],
  
  // Navigation Menu
  navigation: [{
    id: String (uuid),
    label: String,
    pageId: ObjectId (ref: pages),
    url: String (if external),
    isExternal: Boolean,
    order: Number,
    children: [recursive],
  }],
  
  // Theme (template)
  theme: {
    id: String,
    name: String,
    version: String,
  },
  
  // Analytics
  analytics: {
    googleAnalyticsId: String,
    facebookPixelId: String,
    customScripts: [String],
  },
  
  createdAt: Date,
  updatedAt: Date,
  lastPublishedAt: Date,
}
```

### 1.2 Page Section Schema

```javascript
// Collection: pageSections
{
  _id: ObjectId,
  websiteId: ObjectId (ref: websites),
  pageId: ObjectId (ref: pages),
  
  type: String (enum: "hero", "about", "services", "video", "testimonials", "cta", "text", "image", "gallery", "contact", "pricing", "team", "features", "faq", "newsletter", "custom"),
  
  // Component-specific content
  content: {
    // Hero Section
    hero: {
      title: String,
      subtitle: String,
      backgroundImage: String (URL),
      backgroundVideo: String (URL or YouTube embed),
      overlayOpacity: Number (0-1),
      overlayColor: String,
      primaryButton: {
        text: String,
        url: String,
        target: String,
      },
      secondaryButton: {
        text: String,
        url: String,
        target: String,
      },
      layout: String (enum: "left", "center", "right"),
      height: String (enum: "small", "medium", "large", "full"),
    },
    
    // About Section
    about: {
      title: String,
      description: String,
      image: String (URL),
      imagePosition: String (enum: "left", "right"),
      features: [{
        icon: String,
        title: String,
        description: String,
      }],
    },
    
    // Services/Offerings Section
    services: {
      title: String,
      description: String,
      layout: String (enum: "grid", "list", "carousel"),
      items: [{
        id: String (uuid),
        icon: String (URL),
        title: String,
        description: String,
        price: Number,
        duration: String (e.g., "30 mins", "1 hour"),
        image: String,
        url: String (link to booking),
      }],
    },
    
    // Video Section
    video: {
      title: String,
      description: String,
      videoUrl: String,
      videoType: String (enum: "youtube", "vimeo", "upload"),
      thumbnail: String,
      layout: String (enum: "full", "contained"),
    },
    
    // Testimonials
    testimonials: {
      title: String,
      description: String,
      layout: String (enum: "carousel", "grid", "list"),
      items: [{
        id: String,
        name: String,
        role: String,
        company: String,
        image: String,
        testimonial: String,
        rating: Number (1-5),
      }],
    },
    
    // Call-to-Action
    cta: {
      title: String,
      description: String,
      buttonText: String,
      buttonUrl: String,
      backgroundColor: String,
      layout: String (enum: "left-image", "right-image", "full"),
      image: String,
    },
    
    // Text/Rich Content
    text: {
      content: String (rich text HTML),
      alignment: String (enum: "left", "center", "right"),
      backgroundColor: String,
      padding: String,
    },
    
    // Image Section
    image: {
      url: String,
      alt: String,
      width: String,
      height: String,
      layout: String (enum: "contained", "full", "full-height"),
      link: String,
    },
    
    // Gallery Section
    gallery: {
      title: String,
      description: String,
      layout: String (enum: "grid-2", "grid-3", "grid-4", "masonry"),
      images: [{
        id: String,
        url: String,
        alt: String,
        link: String,
      }],
    },
    
    // Contact Form
    contact: {
      title: String,
      description: String,
      formFields: [{
        id: String,
        label: String,
        type: String (text, email, phone, textarea, select),
        required: Boolean,
        placeholder: String,
        options: [String], // for select
      }],
      redirectUrl: String,
      successMessage: String,
    },
    
    // Pricing Section
    pricing: {
      title: String,
      description: String,
      layout: String (enum: "comparison", "cards", "list"),
      plans: [{
        id: String,
        name: String,
        price: Number,
        currency: String,
        billingPeriod: String,
        description: String,
        features: [String],
        cta: {
          text: String,
          url: String,
        },
      }],
    },
  },
  
  // Styling/Layout
  styling: {
    backgroundColor: String,
    backgroundImage: String,
    padding: String (e.g., "40px 20px"),
    margin: String,
    minHeight: String,
    textColor: String,
    alignment: String,
    containerWidth: String (enum: "full", "contained", "narrow"),
    customCSS: String,
  },
  
  // Visibility
  visibility: {
    isVisible: Boolean,
    showOnMobile: Boolean,
    showOnTablet: Boolean,
    showOnDesktop: Boolean,
  },
  
  order: Number,
  createdAt: Date,
  updatedAt: Date,
}
```

### 1.3 Media Library Schema

```javascript
// Collection: mediaLibrary
{
  _id: ObjectId,
  specialistId: ObjectId (ref: User),
  websiteId: ObjectId (ref: websites),
  
  filename: String,
  originalName: String,
  fileType: String (image, video, document),
  mimeType: String,
  
  url: String,
  thumbnailUrl: String,
  
  metadata: {
    size: Number (bytes),
    width: Number (for images),
    height: Number,
    duration: Number (seconds, for videos),
  },
  
  tags: [String],
  alt: String,
  
  uploadedAt: Date,
}
```

### 1.4 Page Version History Schema

```javascript
// Collection: pageVersions
{
  _id: ObjectId,
  websiteId: ObjectId,
  pageId: ObjectId,
  
  version: Number,
  title: String,
  snapshot: Object (complete page sections data),
  
  createdBy: ObjectId (ref: User),
  createdAt: Date,
  publishedAt: Date,
  
  changesSummary: String,
}
```

---

## 2. FRONTEND ARCHITECTURE

### 2.1 Component Structure

```
src/app/components/PageBuilder/
├── PageBuilder.tsx                 // Main container
├── EditorCanvas.tsx               // Canvas view
├── SectionLibrary.tsx             // Available sections to add
├── SectionEditor.tsx              // Individual section editor
├── LayoutPreview.tsx              // Preview mode
├── BrandingPanel.tsx              // Color, font, logo settings
├── PageManagement.tsx             // Page list/edit
├── NavigationBuilder.tsx           // Menu builder
├── MediaLibrary.tsx               // Media management
├── PreviewMode.tsx                // Full website preview
└── Utils/
    ├── sectionTemplates.ts        // Default section configs
    ├── dragDrop.ts                // Drag-drop logic
    └── validation.ts              // Form validation
```

### 2.2 State Management (Zustand or Redux)

```typescript
// Page Builder Store
interface PageBuilderStore {
  // Website data
  website: Website | null;
  pages: Page[];
  currentPage: Page | null;
  
  // Sections
  sections: PageSection[];
  selectedSectionId: string | null;
  
  // UI State
  mode: 'edit' | 'preview';
  isDirty: boolean;
  
  // Actions
  setWebsite: (website: Website) => void;
  setCurrentPage: (pageId: string) => void;
  addSection: (type: string, position: number) => void;
  updateSection: (sectionId: string, content: any) => void;
  deleteSection: (sectionId: string) => void;
  reorderSections: (fromIndex: number, toIndex: number) => void;
  
  // Branding
  updateBranding: (branding: Branding) => void;
  
  // Publishing
  publishPage: () => Promise<void>;
  publishWebsite: () => Promise<void>;
  
  // Undo/Redo
  undo: () => void;
  redo: () => void;
}
```

---

## 3. API ENDPOINTS

### 3.1 Website Endpoints

#### GET /api/websites/:specialistId
- Fetch all websites for a specialist

#### POST /api/websites
- Create new website
- Body: { displayName, description, theme }

#### PUT /api/websites/:websiteId
- Update website (branding, header, footer, settings)

#### DELETE /api/websites/:websiteId
- Delete website

#### GET /api/websites/:websiteId/preview
- Get website preview data

#### PUT /api/websites/:websiteId/publish
- Publish website

---

### 3.2 Page Endpoints

#### GET /api/websites/:websiteId/pages
- Get all pages for a website

#### POST /api/websites/:websiteId/pages
- Create new page
- Body: { title, slug }

#### PUT /api/websites/:websiteId/pages/:pageId
- Update page (title, description, seo)

#### DELETE /api/websites/:websiteId/pages/:pageId
- Delete page

#### PUT /api/websites/:websiteId/pages/:pageId/publish
- Publish page

#### PUT /api/websites/:websiteId/pages/reorder
- Reorder pages
- Body: { pageOrder: [pageId, pageId, ...] }

---

### 3.3 Section Endpoints

#### GET /api/websites/:websiteId/pages/:pageId/sections
- Get all sections for a page

#### POST /api/websites/:websiteId/pages/:pageId/sections
- Add new section
- Body: { type, order, content, styling }

#### PUT /api/websites/:websiteId/pages/:pageId/sections/:sectionId
- Update section

#### DELETE /api/websites/:websiteId/pages/:pageId/sections/:sectionId
- Delete section

#### PUT /api/websites/:websiteId/pages/:pageId/sections/reorder
- Reorder sections
- Body: { sectionOrder: [sectionId, sectionId, ...] }

---

### 3.4 Media Library Endpoints

#### GET /api/media-library/:websiteId
- Get all media for a website

#### POST /api/media-library/upload
- Upload media
- Multipart form data

#### DELETE /api/media-library/:mediaId
- Delete media file

#### PUT /api/media-library/:mediaId/tags
- Update media tags

---

### 3.5 Branding Endpoints

#### GET /api/websites/:websiteId/branding
- Get branding settings

#### PUT /api/websites/:websiteId/branding
- Update branding
- Body: { colors, typography, logo, favicon }

---

### 3.6 Public Preview/Customer View Endpoints

#### GET /api/public/websites/:domainOrSpecialistId
- Get published website data (public)

#### GET /api/public/websites/:domainOrSpecialistId/pages/:pageSlug
- Get specific page (public)

---

## 4. KEY FEATURES IMPLEMENTATION ROADMAP

### Phase 1: Foundation (Week 1-2)
- ✅ Database schemas
- ✅ Basic website CRUD
- ✅ Hero section component
- ✅ Pages management
- ✅ Basic preview

### Phase 2: Core Builder (Week 2-3)
- ✅ Drag-drop sections
- ✅ Section library (5-6 section types)
- ✅ Branding panel
- ✅ Media library (basic)
- ✅ Real-time preview

### Phase 3: Advanced Features (Week 3-4)
- ✅ All section types (10+)
- ✅ Navigation builder
- ✅ Contact forms
- ✅ SEO settings
- ✅ Version history

### Phase 4: Deployment & Polish (Week 4)
- ✅ Publishing system
- ✅ Custom domains
- ✅ Performance optimization
- ✅ Testing & bug fixes

---

## 5. TECHNOLOGY STACK

**Frontend:**
- React 18 + TypeScript
- Tailwind CSS
- React Beautiful DnD (drag-and-drop)
- React Hook Form (form handling)
- Zustand (state management)
- React Query (API caching)

**Backend:**
- Node.js + Express
- MongoDB
- AWS S3 / Cloudinary (media storage)
- JWT authentication
- Express middleware for validation

**Deployment:**
- GitHub Actions (CI/CD)
- Railway.app (current)
- Cloudflare (CDN, custom domains)

---

## 6. SECURITY CONSIDERATIONS

1. **Authorization**: Only specialist can edit their website
2. **File Uploads**: Validate file types, scan for malware
3. **Rich Text**: Sanitize HTML input (prevent XSS)
4. **Rate Limiting**: Limit API requests per specialist
5. **CORS**: Configure for custom domain access
6. **Database**: Ensure proper indexes for query optimization

---

## 7. PERFORMANCE OPTIMIZATION

1. **Lazy Loading**: Load sections on demand in preview
2. **Image Optimization**: Automatically resize/compress uploads
3. **Caching**: Implement Redis for published websites
4. **CDN**: Serve static assets via Cloudflare
5. **Database Indexing**: Index frequently queried fields

---

## 8. CUSTOMER VIEW EXPERIENCE

**Public Website Display:**
- Full branded experience at `specialist.specialistly.com`
- Or custom domain: `specialist.com`
- Navigation based on published pages
- View services/offerings
- Contact forms
- Social links in footer
- Responsive design (mobile, tablet, desktop)

---

## Next Steps

1. Backend: Create database schemas and migrations
2. Backend: Build API endpoints with validation
3. Frontend: Create base PageBuilder component structure
4. Frontend: Build SectionEditor components
5. Frontend: Implement drag-and-drop
6. Frontend: Build preview mode
7. Integration: Connect frontend to backend APIs
8. Testing: E2E testing of page creation flow
9. Deployment: Deploy to staging/production

