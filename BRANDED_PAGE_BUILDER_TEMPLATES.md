# Branded Page Builder - Template System

## Overview

The Branded Page Builder is a template-based system that allows specialists to create professional branded websites accessible on custom subdomains. The system uses pre-designed templates that can be customized and deployed quickly.

## Architecture

### Components

1. **BrandedPageBuilder** (`BrandedPageBuilder.tsx`)
   - Main interface for specialists to create and manage pages
   - Shows all pages for a website
   - Integrates template selection and page creation
   - Admin-only access (for now)

2. **TemplateGallery** (`TemplateGallery.tsx`)
   - Browse available templates
   - Filter by category (landing, about, services, etc.)
   - Preview template designs and colors
   - Select a template to use

3. **CreatePageFromTemplate** (`CreatePageFromTemplate.tsx`)
   - Dialog to create a new page from selected template
   - Enter page title and customize settings
   - Automatically creates all sections from template

4. **AdminTemplateManager** (`AdminTemplateManager.tsx`)
   - Create, edit, delete page templates
   - Configure template sections, branding, and layout
   - Set active/inactive status
   - Track template usage

### Database Models

**PageTemplate** (`backend/models/PageTemplate.js`)
- `name`: Template name (unique)
- `description`: Template description
- `category`: Template category (landing, about, services, portfolio, contact, blog, pricing)
- `thumbnail`: Preview image URL
- `sections`: Array of template sections with default content
- `branding`: Color scheme, fonts, header/footer styles
- `layout`: Header type, container width, footer included
- `isActive`: Published/hidden status
- `usageCount`: Count of pages created from this template

**Page** (existing, enhanced)
- `websiteId`: References the specialist's website
- `title`: Page title
- `slug`: URL-friendly slug
- `sections`: Array of PageSection references
- `isPublished`: Published status

**PageSection** (existing)
- `pageId`: Parent page reference
- `type`: Section type (hero, about, services, etc.)
- `content`: Section content
- `styling`: Custom styles

### API Endpoints

#### Public Endpoints
- `GET /api/page-templates` - List active templates (with pagination)
  - Query: `category`, `limit`, `page`
- `GET /api/page-templates/:templateId` - Get single template

#### Protected Endpoints (Authenticated)
- `POST /api/page-templates/:templateId/create-page` - Create page from template
  - Body: `{ websiteId, pageTitle }`

#### Admin Endpoints (Admin Only)
- `GET /api/page-templates/admin/all` - Get all templates (admin view)
- `POST /api/page-templates/admin` - Create new template
- `PUT /api/page-templates/admin/:templateId` - Update template
- `DELETE /api/page-templates/admin/:templateId` - Delete template

## Workflow

### For Admin: Create Templates

1. Navigate to Admin → Page Templates
2. Click "Create Template"
3. Fill in template details:
   - Name: "Modern Landing Page"
   - Description: "Clean, modern landing page with hero section"
   - Category: "landing"
   - Color scheme (primary/secondary)
   - Layout options
4. Configure default sections (hero, services, CTA, etc.)
5. Set as active
6. Save

### For Specialist: Build Branded Website

1. Admin creates website for specialist (e.g., "john-consulting")
   - Generates subdomain: `john-consulting.specialistly.com`

2. Admin navigates to Branded Page Builder
   - Selects the specialist's website

3. Clicks "Create New Page"
   - Opens template gallery
   - Filters templates by category

4. Selects template (e.g., "Modern Landing Page")
   - Opens create form
   - Enters page title (e.g., "Home")

5. System automatically:
   - Creates page with slug
   - Creates all sections from template
   - Applies template's default styling and colors
   - Sets to draft status

6. Admin can then:
   - Edit page sections
   - Customize content
   - Change colors and fonts
   - Publish when ready

7. Published page is live at:
   - `https://john-consulting.specialistly.com/home`
   - Or `https://john-consulting.specialistly.com/` if homepage

## Usage Examples

### Create a Landing Page for a Specialist

```typescript
import { BrandedPageBuilder } from '@/app/components/PageBuilder';

function AdminPanel() {
  return (
    <BrandedPageBuilder
      websiteId="specialist-website-id"
      websiteName="John's Consulting"
      onPageCreated={(page) => {
        console.log('Page created:', page);
        // Redirect to edit page
      }}
    />
  );
}
```

### Create a Template (Admin)

```typescript
import { AdminTemplateManager } from '@/app/components/PageBuilder';

function AdminTemplateSection() {
  return <AdminTemplateManager />;
}
```

## Template Structure

Each template includes:

```javascript
{
  name: "Modern Landing Page",
  description: "Clean landing page with hero and services",
  category: "landing",
  sections: [
    {
      type: "hero",
      title: "Welcome to {{SITE_NAME}}",
      subtitle: "Your specialist brand",
      order: 0,
      defaultContent: {
        heading: "Your Business, Beautifully Presented",
        subheading: "Transform your expertise into revenue",
        buttonText: "Get Started"
      },
      styling: {
        backgroundColor: "#fff",
        alignment: "center",
        padding: "80px 20px"
      }
    },
    {
      type: "services",
      title: "Services",
      order: 1,
      defaultContent: {
        items: [
          { title: "Consulting", description: "Expert guidance..." },
          { title: "Training", description: "Hands-on training..." }
        ]
      }
    },
    // ... more sections
  ],
  branding: {
    primaryColor: "#4f46e5",
    secondaryColor: "#06b6d4",
    fontFamily: "Inter",
    headerStyle: "standard",
    footerStyle: "simple"
  },
  layout: {
    headerType: "sticky",
    footerIncluded: true,
    sidebarIncluded: false,
    containerWidth: "standard"
  }
}
```

## Features

✅ **Template-Based Creation** - Start with professional designs
✅ **Quick Setup** - Create pages in seconds
✅ **Multiple Pages** - Build complete websites
✅ **Customizable** - Change colors, content, layout
✅ **Admin-Managed** - Admins control specialist websites
✅ **Subdomain Ready** - Works with `https://{subdomain}.specialistly.com`
✅ **Usage Tracking** - See which templates are popular
✅ **Active/Inactive** - Control template visibility

## Database Indexes

```javascript
// PageTemplate indexes
pageTemplateSchema.index({ category: 1, isActive: 1 });
pageTemplateSchema.index({ isDefault: 1 });
```

## Future Enhancements

- [ ] Template preview in iframe
- [ ] Drag-and-drop section reordering
- [ ] WYSIWYG editor for sections
- [ ] Template sharing between admins
- [ ] Template version history
- [ ] Mobile-specific variations
- [ ] A/B testing for pages
- [ ] Analytics integration

## Deployment Notes

1. **Backend**: Template routes mounted at `/api/page-templates`
2. **Frontend**: Components use relative API URLs (`/api`) for production
3. **Admin Authentication**: Verify `req.user.isAdmin` flag
4. **Database**: Ensure `PageTemplate` collection exists with indexes

## Troubleshooting

### Pages not loading after creation
- Check that template `isActive` is true
- Verify sections were created: Should see section count > 0
- Check browser console for API errors

### Templates not appearing in gallery
- Verify template `isActive: true`
- Check category filter matches template category
- Ensure API authentication token is valid

### Errors when creating pages
- Verify page title is not empty
- Check that websiteId is valid
- Ensure user has access to the website
- Check that template exists and is active

## Security Considerations

- ✅ Template creation/modification requires admin role
- ✅ Page creation requires authentication
- ✅ Website access verified by comparing creatorEmail
- ✅ Public templates visible but creation restricted
- ✅ All operations logged for audit trail

## API Error Responses

```javascript
{
  success: false,
  message: "Template not found",
  // Optional additional error details
}
```

Common errors:
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Admin access required or insufficient permissions
- `404 Not Found` - Template or website not found
- `400 Bad Request` - Invalid data (missing required fields)
- `409 Conflict` - Duplicate name or slug
