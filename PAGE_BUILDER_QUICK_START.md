# Quick Start: Page Builder Integration Guide

This guide helps you integrate all the Page Builder components and get the system running.

## Step 1: Wire Up EditorCanvas in PageBuilderEditor

Update `src/app/components/PageBuilderEditor/index.tsx`:

```typescript
import EditorCanvas from './EditorCanvas';
import SectionLibrary, { SECTION_TEMPLATES } from './SectionLibrary';
import { PageSection } from '@/app/hooks/usePageBuilder';

// Inside PageBuilderEditor component, replace the EditorCanvas stub:

const handleAddSection = () => {
  setShowSectionLibrary(true);
};

const handleSelectSectionTemplate = (template: typeof SECTION_TEMPLATES[0]) => {
  const newSection: PageSection = {
    _id: `section-${Date.now()}`,
    type: template.type as any,
    order: selectedPage?.sections.length || 0,
    title: template.name,
    content: template.defaultContent,
    styling: {
      padding: '40px 20px',
      backgroundColor: 'white',
    },
    visibility: {
      showOnMobile: true,
      showOnTablet: true,
      showOnDesktop: true,
      isVisible: true,
    },
  };

  addSection(newSection);
};

// In the render method, replace the stub:
{selectedPage && mode === 'edit' && (
  <>
    <EditorCanvas
      page={selectedPage}
      onAddSection={handleAddSection}
      onUpdateSection={updateSection}
      onDeleteSection={deleteSection}
      onReorderSections={reorderSections}
      onSelectSection={selectSection}
      selectedSectionId={selectedSection?._id}
    />
    <SectionLibrary
      isOpen={showSectionLibrary}
      onClose={() => setShowSectionLibrary(false)}
      onSelectTemplate={handleSelectSectionTemplate}
    />
  </>
)}
```

## Step 2: Add Missing State Variables

```typescript
const [showSectionLibrary, setShowSectionLibrary] = useState(false);

// In usePageBuilder destructure:
const {
  website,
  pages,
  selectedPage,
  selectedSection,
  mode,
  isDirty,
  isLoading,
  error,
  setWebsite,
  setPages,
  setMode,
  setError,
  setLoading,
  selectPage,
  selectSection,
  addSection,
  updateSection,
  deleteSection,
  reorderSections,
  undo,
  redo,
  publish,
} = usePageBuilder();
```

## Step 3: Import Required Dependencies

Ensure these are in your `package.json`:

```json
{
  "dependencies": {
    "zustand": "^4.4.0",
    "react-beautiful-dnd": "^13.1.1",
    "lucide-react": "^0.292.0"
  }
}
```

Install if needed:
```bash
npm install zustand react-beautiful-dnd lucide-react
```

## Step 4: Set Up API Integration

Make sure your auth token is available in localStorage:

```typescript
// In your auth context or after login:
localStorage.setItem('token', authToken);

// PageBuilderAPI will automatically use it:
// Authorization: `Bearer ${localStorage.getItem('token')}`
```

## Step 5: Test the Integration

1. **Create a website:**
   ```typescript
   const website = await pageBuilderAPI.createWebsite({
     displayName: 'Test Website',
     description: 'Testing the page builder'
   });
   console.log('Website created:', website.data.domainName);
   ```

2. **Load it in the editor:**
   ```typescript
   // Pass websiteId from URL or props
   <PageBuilderEditor websiteId={websiteId} />
   ```

3. **Test adding sections:**
   - Click "Add Section" in the editor canvas
   - Select Hero from the library
   - Verify it appears in the canvas
   - Edit the content and watch real-time preview

## Common Integration Points

### Connect to Dashboard
```typescript
// In Dashboard or navigation component
<Link to={`/page-builder/${websiteId}`}>
  <PageBuilderEditor websiteId={websiteId} />
</Link>
```

### Load Existing Website
```typescript
useEffect(() => {
  const loadWebsite = async () => {
    const website = await pageBuilderAPI.getWebsite(websiteId);
    setWebsite(website.data);
  };
  loadWebsite();
}, [websiteId]);
```

### Save Changes (Auto-save pattern)
```typescript
useEffect(() => {
  const saveTimer = setTimeout(async () => {
    if (isDirty && selectedPage) {
      try {
        await pageBuilderAPI.updatePage(websiteId, selectedPage._id, {
          title: selectedPage.title,
          slug: selectedPage.slug,
          description: selectedPage.description,
        });
        // Mark as clean
      } catch (error) {
        setError('Failed to save');
      }
    }
  }, 2000); // Save 2 seconds after last change

  return () => clearTimeout(saveTimer);
}, [isDirty]);
```

### Publish Workflow
```typescript
const handlePublish = async () => {
  try {
    setLoading(true);
    
    // Save any pending changes first
    if (selectedPage && isDirty) {
      await savePage();
    }
    
    // Publish the website
    await pageBuilderAPI.publishWebsite(websiteId);
    
    // Update state
    publish();
    
    // Show success message
    toast.success('Website published!');
  } catch (error) {
    toast.error('Failed to publish');
  } finally {
    setLoading(false);
  }
};
```

## Implementing Remaining Section Types

Each section needs two components:

1. **Editor Component** (e.g., `HeroSectionEditor`)
   - Form inputs for content
   - Styling controls
   - Live preview

2. **Preview Component** (e.g., `HeroSectionPreview`)
   - Renders the actual section
   - Used in EditorCanvas and public view
   - Responsive design

### Template:
```typescript
export const NewSectionEditor: React.FC<SectionEditorProps> = ({
  section,
  onChange,
}) => {
  return (
    <div className="space-y-6">
      {/* Edit form */}
      <Card className="p-6">
        <h3 className="font-bold mb-4">Content</h3>
        {/* Input components */}
      </Card>
    </div>
  );
};

export const NewSectionPreview: React.FC<{ section: PageSection }> = ({
  section,
}) => {
  return (
    <div>
      {/* Render preview */}
    </div>
  );
};
```

## Debugging Tips

1. **Check Store State**
   ```typescript
   // In browser console
   const state = usePageBuilder.getState();
   console.log(state);
   ```

2. **Verify API Calls**
   - Open DevTools Network tab
   - Check request/response bodies
   - Verify auth token in headers

3. **Check Database**
   ```bash
   # In MongoDB Atlas or local CLI
   db.websites.findOne({})
   db.pages.findOne({})
   ```

4. **Enable Debug Logging**
   ```typescript
   // In pageBuilderAPI.ts
   console.log('API Call:', method, endpoint, data);
   ```

## Performance Optimization

### Lazy Load Section Components
```typescript
const sectionComponents = {
  hero: React.lazy(() => import('./sections/HeroSection')),
  services: React.lazy(() => import('./sections/ServicesSection')),
  // ...
};

const SectionComponent = sectionComponents[section.type];
<React.Suspense fallback={<Spinner />}>
  <SectionComponent section={section} />
</React.Suspense>
```

### Memoize Section Previews
```typescript
export const HeroSectionPreview = React.memo(({ section }) => {
  // Component code
});
```

### Virtual Scrolling for Large Pages
```typescript
import { FixedSizeList } from 'react-window';

// Wrap sections list in virtual scroller
```

## Next Steps

1. **Complete remaining section types** (Testimonials, Team, Contact, etc.)
2. **Build properties panel** with dynamic forms
3. **Implement media library UI**
4. **Create public website renderer**
5. **Add responsive preview modes** (mobile, tablet, desktop)
6. **Build analytics dashboard**
7. **Add collaboration features**

## Testing Checklist

- [ ] Create website
- [ ] Create page
- [ ] Add Hero section
- [ ] Edit section content
- [ ] Drag to reorder sections
- [ ] Delete section
- [ ] Publish website
- [ ] View public website
- [ ] Test undo/redo
- [ ] Test responsive preview
- [ ] Upload media
- [ ] Test error states
- [ ] Test loading states
- [ ] Test auth/permissions

---

For more details, see:
- [PAGE_BUILDER_ARCHITECTURE.md](./PAGE_BUILDER_ARCHITECTURE.md)
- [PAGE_BUILDER_FRONTEND_GUIDE.md](./PAGE_BUILDER_FRONTEND_GUIDE.md)
- [PAGE_BUILDER_IMPLEMENTATION_STATUS.md](./PAGE_BUILDER_IMPLEMENTATION_STATUS.md)

