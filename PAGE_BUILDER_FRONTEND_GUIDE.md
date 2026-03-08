# Page Builder Frontend Implementation Guide

## 1. COMPONENT STRUCTURE

### Main Component: PageBuilder.tsx

```tsx
import React, { useState, useCallback } from 'react';
import { useQuery, useMutation } from 'react-query';
import EditorCanvas from './EditorCanvas';
import SectionLibrary from './SectionLibrary';
import BrandingPanel from './BrandingPanel';
import PageManagement from './PageManagement';
import PreviewMode from './PreviewMode';

export default function PageBuilder({ websiteId }) {
  const [mode, setMode] = useState<'edit' | 'preview'>('edit');
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  
  // Fetch website data
  const { data: website, isLoading } = useQuery(
    ['website', websiteId],
    () => api.getWebsite(websiteId)
  );
  
  // Fetch pages
  const { data: pages } = useQuery(
    ['pages', websiteId],
    () => api.getPages(websiteId),
    { enabled: !!websiteId }
  );
  
  // Fetch current page sections
  const [currentPageId, setCurrentPageId] = useState<string | null>(null);
  const { data: sections } = useQuery(
    ['sections', currentPageId],
    () => api.getSections(websiteId, currentPageId),
    { enabled: !!currentPageId }
  );
  
  if (isLoading) return <div>Loading...</div>;
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-screen">
      {/* Left Sidebar - Pages & Sections */}
      <div className="lg:col-span-1 border-r overflow-y-auto bg-gray-50">
        <PageManagement
          pages={pages}
          currentPageId={currentPageId}
          onPageSelect={setCurrentPageId}
        />
      </div>
      
      {/* Main Canvas Area */}
      <div className="lg:col-span-2">
        {mode === 'edit' ? (
          <EditorCanvas
            sections={sections}
            selectedSectionId={selectedSectionId}
            onSelectSection={setSelectedSectionId}
          />
        ) : (
          <PreviewMode websiteId={websiteId} pageId={currentPageId} />
        )}
      </div>
      
      {/* Right Sidebar - Section Editor */}
      <div className="lg:col-span-1 border-l overflow-y-auto bg-white">
        {mode === 'edit' && selectedSectionId ? (
          <SectionEditor sectionId={selectedSectionId} />
        ) : mode === 'edit' ? (
          <SectionLibrary onAddSection={addSection} />
        ) : null}
      </div>
      
      {/* Toolbar */}
      <div className="col-span-full border-t p-4 bg-white flex justify-between items-center">
        <button onClick={() => setMode('edit')} className="btn">Edit</button>
        <button onClick={() => setMode('preview')} className="btn">Preview</button>
        <button onClick={publishWebsite} className="btn btn-primary">Publish</button>
      </div>
    </div>
  );
}
```

---

## 2. KEY COMPONENTS

### EditorCanvas.tsx
Displays sections in a drag-and-drop editor with:
- Section list
- Drag-to-reorder functionality
- Click to select for editing
- Add section button

### SectionEditor.tsx
Edits the selected section with:
- Content form (specific to section type)
- Styling panel (colors, padding, alignment)
- Visibility options (mobile, tablet, desktop)
- Delete button

### SectionLibrary.tsx
Shows available section templates:
- Hero
- About
- Services
- Video
- Testimonials
- CTA
- Text
- Image
- Gallery
- Contact
- Pricing
- Team
- Features
- FAQ

Click to add new section to page.

### BrandingPanel.tsx
Customize website branding:
- Logo upload
- Color picker (primary, secondary, accent)
- Font selection
- Button styles
- Header/Footer settings

### PageManagement.tsx
Manage pages:
- List all pages
- Create new page
- Edit page metadata
- Publish/unpublish
- Reorder pages
- Delete page (except homepage)

### PreviewMode.tsx
Live preview of website:
- Responsive views (desktop, tablet, mobile)
- Full navigation
- Links work
- Forms visible
- Real-time preview as you edit

---

## 3. STATE MANAGEMENT (Zustand Store)

```typescript
// stores/pageBuilderStore.ts

import { create } from 'zustand';

interface PageBuilderState {
  // Data
  website: Website | null;
  pages: Page[];
  currentPageId: string | null;
  sections: PageSection[];
  selectedSectionId: string | null;
  
  // UI
  mode: 'edit' | 'preview';
  isDirty: boolean;
  
  // History for undo/redo
  history: PageSection[][];
  historyIndex: number;
  
  // Actions
  setWebsite: (website: Website) => void;
  setPages: (pages: Page[]) => void;
  setSections: (sections: PageSection[]) => void;
  selectSection: (id: string) => void;
  setMode: (mode: 'edit' | 'preview') => void;
  
  // Section operations
  addSection: (section: PageSection) => void;
  updateSection: (id: string, updates: any) => void;
  deleteSection: (id: string) => void;
  reorderSections: (fromIndex: number, toIndex: number) => void;
  
  // History
  undo: () => void;
  redo: () => void;
}

export const usePageBuilder = create<PageBuilderState>((set) => ({
  // Initial state
  website: null,
  pages: [],
  currentPageId: null,
  sections: [],
  selectedSectionId: null,
  mode: 'edit',
  isDirty: false,
  history: [],
  historyIndex: 0,
  
  // Actions
  setWebsite: (website) => set({ website }),
  setPages: (pages) => set({ pages }),
  setSections: (sections) => set({ sections, history: [sections], historyIndex: 0 }),
  selectSection: (id) => set({ selectedSectionId: id }),
  setMode: (mode) => set({ mode }),
  
  addSection: (section) => set((state) => ({
    sections: [...state.sections, section],
    isDirty: true,
  })),
  
  updateSection: (id, updates) => set((state) => ({
    sections: state.sections.map(s =>
      s._id === id ? { ...s, ...updates } : s
    ),
    isDirty: true,
  })),
  
  deleteSection: (id) => set((state) => ({
    sections: state.sections.filter(s => s._id !== id),
    isDirty: true,
  })),
  
  reorderSections: (fromIndex, toIndex) => set((state) => {
    const newSections = [...state.sections];
    const [section] = newSections.splice(fromIndex, 1);
    newSections.splice(toIndex, 0, section);
    return { sections: newSections, isDirty: true };
  }),
  
  undo: () => set((state) => {
    if (state.historyIndex > 0) {
      return {
        historyIndex: state.historyIndex - 1,
        sections: state.history[state.historyIndex - 1],
      };
    }
    return state;
  }),
  
  redo: () => set((state) => {
    if (state.historyIndex < state.history.length - 1) {
      return {
        historyIndex: state.historyIndex + 1,
        sections: state.history[state.historyIndex + 1],
      };
    }
    return state;
  }),
}));
```

---

## 4. SECTION COMPONENT EXAMPLES

### Hero Section Component

```tsx
interface HeroProps {
  content: {
    title: string;
    subtitle: string;
    backgroundImage?: string;
    primaryButton?: { text: string; url: string };
    secondaryButton?: { text: string; url: string };
  };
  styling: {
    backgroundColor?: string;
    height?: 'small' | 'medium' | 'large' | 'full';
  };
}

export function HeroSection({ content, styling }: HeroProps) {
  const heightClass = {
    small: 'h-64',
    medium: 'h-96',
    large: 'h-screen',
    full: 'h-[600px]',
  }[styling.height || 'large'];

  return (
    <section
      className={`${heightClass} bg-cover bg-center relative flex items-center justify-center`}
      style={{ backgroundImage: `url(${content.backgroundImage})` }}
    >
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative z-10 text-center text-white max-w-2xl px-4">
        <h1 className="text-5xl font-bold mb-4">{content.title}</h1>
        <p className="text-xl mb-8">{content.subtitle}</p>
        <div className="flex gap-4 justify-center">
          {content.primaryButton && (
            <button className="btn btn-primary">
              {content.primaryButton.text}
            </button>
          )}
          {content.secondaryButton && (
            <button className="btn btn-secondary">
              {content.secondaryButton.text}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
```

### Services Section Component

```tsx
export function ServicesSection({ content, styling }: ServicesProps) {
  return (
    <section className="py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl font-bold text-center mb-4">
          {content.title}
        </h2>
        <p className="text-center text-gray-600 mb-12">
          {content.description}
        </p>
        
        <div className={`grid gap-6 ${
          content.layout === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' :
          content.layout === 'list' ? 'grid-cols-1' :
          'grid-cols-1 md:grid-cols-2'
        }`}>
          {content.items?.map((item, idx) => (
            <div key={idx} className="p-6 border rounded-lg hover:shadow-lg transition">
              {item.icon && <img src={item.icon} alt="" className="w-12 h-12 mb-4" />}
              <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
              <p className="text-gray-600 mb-4">{item.description}</p>
              {item.price && <p className="text-2xl font-bold">${item.price}</p>}
              {item.url && (
                <a href={item.url} className="text-blue-600 hover:underline">
                  Learn More →
                </a>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

---

## 5. DRAG AND DROP IMPLEMENTATION

```tsx
// Using react-beautiful-dnd
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

export function EditorCanvas({ sections, onReorder }) {
  const handleDragEnd = (result) => {
    const { source, destination } = result;
    if (!destination) return;
    
    if (source.index !== destination.index) {
      onReorder(source.index, destination.index);
    }
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="canvas">
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className="space-y-4"
          >
            {sections?.map((section, index) => (
              <Draggable key={section._id} draggableId={section._id} index={index}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={`p-4 border-2 rounded cursor-move ${
                      snapshot.isDragging ? 'bg-blue-50' : 'bg-white'
                    }`}
                  >
                    <SectionPreview section={section} />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}
```

---

## 6. API INTEGRATION LAYER

```typescript
// api/pageBuilderAPI.ts

const pageBuilderAPI = {
  // Websites
  createWebsite: (data) =>
    api.post('/page-builder/websites', data),
  getWebsites: () =>
    api.get('/page-builder/websites'),
  getWebsite: (websiteId) =>
    api.get(`/page-builder/websites/${websiteId}`),
  updateWebsite: (websiteId, data) =>
    api.put(`/page-builder/websites/${websiteId}`, data),
  updateBranding: (websiteId, data) =>
    api.put(`/page-builder/websites/${websiteId}/branding`, data),
  publishWebsite: (websiteId) =>
    api.put(`/page-builder/websites/${websiteId}/publish`),

  // Pages
  getPages: (websiteId) =>
    api.get(`/page-builder/websites/${websiteId}/pages`),
  createPage: (websiteId, data) =>
    api.post(`/page-builder/websites/${websiteId}/pages`, data),
  updatePage: (websiteId, pageId, data) =>
    api.put(`/page-builder/websites/${websiteId}/pages/${pageId}`, data),
  publishPage: (websiteId, pageId) =>
    api.put(`/page-builder/websites/${websiteId}/pages/${pageId}/publish`),
  deletePage: (websiteId, pageId) =>
    api.delete(`/page-builder/websites/${websiteId}/pages/${pageId}`),

  // Sections
  getSections: (websiteId, pageId) =>
    api.get(`/page-builder/websites/${websiteId}/pages/${pageId}/sections`),
  addSection: (websiteId, pageId, data) =>
    api.post(`/page-builder/websites/${websiteId}/pages/${pageId}/sections`, data),
  updateSection: (websiteId, pageId, sectionId, data) =>
    api.put(`/page-builder/websites/${websiteId}/pages/${pageId}/sections/${sectionId}`, data),
  deleteSection: (websiteId, pageId, sectionId) =>
    api.delete(`/page-builder/websites/${websiteId}/pages/${pageId}/sections/${sectionId}`),
  reorderSections: (websiteId, pageId, data) =>
    api.put(`/page-builder/websites/${websiteId}/pages/${pageId}/sections/reorder`, data),

  // Media
  getMediaLibrary: (websiteId) =>
    api.get(`/page-builder/websites/${websiteId}/media`),
  uploadMedia: (websiteId, formData) =>
    api.post(`/page-builder/websites/${websiteId}/media/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  deleteMedia: (websiteId, mediaId) =>
    api.delete(`/page-builder/websites/${websiteId}/media/${mediaId}`),

  // Public API
  getPublicWebsite: (domain) =>
    api.get(`/page-builder/public/websites/${domain}`),
};

export default pageBuilderAPI;
```

---

## 7. RESPONSIVE DESIGN APPROACH

All sections should be responsive across:
- **Mobile**: Single column, full width
- **Tablet**: 2 columns where applicable
- **Desktop**: Full layout with sidebars

Use Tailwind's responsive prefixes:
```tsx
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
```

---

## 8. FUTURE ENHANCEMENTS

1. **Template Library**: Pre-built website templates
2. **Advanced Animations**: Scroll animations, transitions
3. **A/B Testing**: Test different section variants
4. **Analytics Integration**: Track visitor behavior
5. **SEO Tools**: Meta tag editor, sitemap generation
6. **White Label**: Custom domains, branding
7. **Advanced Forms**: Conditional logic, integrations
8. **Collaborative Editing**: Real-time collaboration
9. **Content Calendar**: Schedule publishing
10. **Export/Backup**: Export website as static HTML

---

## NEXT STEPS

1. Deploy backend controllers and routes
2. Create React components structure
3. Implement drag-and-drop functionality
4. Build section editors
5. Connect frontend to backend APIs
6. Add real-time preview updates
7. Implement publishing workflow
8. Create customer-facing website renderer
9. Test and optimize performance
10. Deploy to production

