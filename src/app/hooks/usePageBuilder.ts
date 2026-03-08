import { create } from 'zustand';

export interface PageSection {
  _id?: string;
  type: 'hero' | 'about' | 'services' | 'video' | 'testimonials' | 'cta' | 'text' | 'image' | 'gallery' | 'contact' | 'pricing' | 'team' | 'features' | 'faq' | 'newsletter' | 'custom';
  order: number;
  title?: string;
  description?: string;
  content: Record<string, any>;
  styling: {
    backgroundColor?: string;
    padding?: string;
    margin?: string;
    minHeight?: string;
    textColor?: string;
    alignment?: string;
    containerWidth?: string;
    customCSS?: string;
  };
  visibility: {
    showOnMobile?: boolean;
    showOnTablet?: boolean;
    showOnDesktop?: boolean;
    isVisible?: boolean;
  };
  metadata?: {
    title?: string;
    description?: string;
    altText?: string;
  };
}

export interface Page {
  _id?: string;
  websiteId?: string;
  title: string;
  slug: string;
  description?: string;
  order: number;
  isHomePage?: boolean;
  isPublished?: boolean;
  publishedAt?: string;
  sections: PageSection[];
  seo?: {
    title?: string;
    description?: string;
    keywords?: string;
    ogImage?: string;
    ogTitle?: string;
    ogDescription?: string;
    canonicalUrl?: string;
  };
}

export interface Website {
  _id?: string;
  specialistId?: string;
  creatorEmail?: string;
  subdomain?: string;
  displayName: string;
  description?: string;
  domainName: string;
  customDomain?: string;
  isPublished?: boolean;
  publishedAt?: string;
  pages: Page[];
  branding: {
    logo?: string;
    favicon?: string;
    colors?: {
      primary?: string;
      secondary?: string;
      accent?: string;
    };
    typography?: {
      fontFamily?: string;
      fontSize?: string;
    };
    buttonStyles?: Record<string, any>;
  };
  header?: {
    layout?: string;
    logoPosition?: string;
    cta?: string;
  };
  footer?: {
    socialLinks?: string[];
    contact?: string;
    copyright?: string;
  };
  navigation?: Array<{
    label: string;
    slug: string;
    order: number;
  }>;
  theme?: {
    id: string;
    name: string;
    version: string;
  };
  analytics?: {
    googleAnalyticsId?: string;
    facebookPixelId?: string;
    customScripts?: string;
  };
}

interface PageBuilderState {
  // Data
  website: Website | null;
  pages: Page[];
  selectedPage: Page | null;
  selectedSection: PageSection | null;
  
  // UI State
  mode: 'edit' | 'preview' | 'branding';
  isDirty: boolean;
  isLoading: boolean;
  error: string | null;
  
  // History
  history: Page[][];
  historyIndex: number;
  
  // Actions - Website
  setWebsite: (website: Website) => void;
  setPages: (pages: Page[]) => void;
  setMode: (mode: 'edit' | 'preview' | 'branding') => void;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
  
  // Actions - Page Management
  selectPage: (page: Page | null) => void;
  addPage: (page: Page) => void;
  updatePage: (pageId: string, updates: Partial<Page>) => void;
  deletePage: (pageId: string) => void;
  reorderPages: (pages: Page[]) => void;
  
  // Actions - Section Management
  selectSection: (section: PageSection | null) => void;
  addSection: (section: PageSection) => void;
  updateSection: (sectionId: string, updates: Partial<PageSection>) => void;
  deleteSection: (sectionId: string) => void;
  reorderSections: (sectionIds: string[]) => void;
  
  // Actions - History
  undo: () => void;
  redo: () => void;
  
  // Actions - Publishing
  publish: () => void;
  unpublish: () => void;
  
  // Utilities
  reset: () => void;
}

export const usePageBuilder = create<PageBuilderState>((set, get) => ({
  // Initial State
  website: null,
  pages: [],
  selectedPage: null,
  selectedSection: null,
  mode: 'edit',
  isDirty: false,
  isLoading: false,
  error: null,
  history: [],
  historyIndex: -1,
  
  // Website Actions
  setWebsite: (website) => set({ website }),
  setPages: (pages) => set({ pages }),
  setMode: (mode) => set({ mode }),
  setError: (error) => set({ error }),
  setLoading: (loading) => set({ isLoading: loading }),
  
  // Page Management
  selectPage: (page) => set({ selectedPage: page, selectedSection: null }),
  
  addPage: (page) => set((state) => {
    const newPages = [...state.pages, page];
    return {
      pages: newPages,
      isDirty: true,
      history: [...state.history.slice(0, state.historyIndex + 1), newPages],
      historyIndex: state.historyIndex + 1,
    };
  }),
  
  updatePage: (pageId, updates) => set((state) => {
    const newPages = state.pages.map((page) =>
      page._id === pageId ? { ...page, ...updates } : page
    );
    return {
      pages: newPages,
      isDirty: true,
      history: [...state.history.slice(0, state.historyIndex + 1), newPages],
      historyIndex: state.historyIndex + 1,
    };
  }),
  
  deletePage: (pageId) => set((state) => {
    const newPages = state.pages.filter((page) => page._id !== pageId);
    return {
      pages: newPages,
      isDirty: true,
      selectedPage: state.selectedPage?._id === pageId ? null : state.selectedPage,
      history: [...state.history.slice(0, state.historyIndex + 1), newPages],
      historyIndex: state.historyIndex + 1,
    };
  }),
  
  reorderPages: (pages) => set((state) => ({
    pages,
    isDirty: true,
    history: [...state.history.slice(0, state.historyIndex + 1), pages],
    historyIndex: state.historyIndex + 1,
  })),
  
  // Section Management
  selectSection: (section) => set({ selectedSection: section }),
  
  addSection: (section) => set((state) => {
    if (!state.selectedPage) return state;
    
    const newPages = state.pages.map((page) => {
      if (page._id === state.selectedPage?._id) {
        return {
          ...page,
          sections: [...page.sections, section],
        };
      }
      return page;
    });
    
    return {
      pages: newPages,
      isDirty: true,
      selectedPage: newPages.find((p) => p._id === state.selectedPage?._id) || null,
      history: [...state.history.slice(0, state.historyIndex + 1), newPages],
      historyIndex: state.historyIndex + 1,
    };
  }),
  
  updateSection: (sectionId, updates) => set((state) => {
    if (!state.selectedPage) return state;
    
    const newPages = state.pages.map((page) => {
      if (page._id === state.selectedPage?._id) {
        return {
          ...page,
          sections: page.sections.map((section) =>
            section._id === sectionId ? { ...section, ...updates } : section
          ),
        };
      }
      return page;
    });
    
    return {
      pages: newPages,
      isDirty: true,
      selectedPage: newPages.find((p) => p._id === state.selectedPage?._id) || null,
      history: [...state.history.slice(0, state.historyIndex + 1), newPages],
      historyIndex: state.historyIndex + 1,
    };
  }),
  
  deleteSection: (sectionId) => set((state) => {
    if (!state.selectedPage) return state;
    
    const newPages = state.pages.map((page) => {
      if (page._id === state.selectedPage?._id) {
        return {
          ...page,
          sections: page.sections.filter((section) => section._id !== sectionId),
        };
      }
      return page;
    });
    
    return {
      pages: newPages,
      isDirty: true,
      selectedPage: newPages.find((p) => p._id === state.selectedPage?._id) || null,
      selectedSection: state.selectedSection?._id === sectionId ? null : state.selectedSection,
      history: [...state.history.slice(0, state.historyIndex + 1), newPages],
      historyIndex: state.historyIndex + 1,
    };
  }),
  
  reorderSections: (sectionIds) => set((state) => {
    if (!state.selectedPage) return state;
    
    const sectionMap = new Map(
      state.selectedPage.sections.map((s) => [s._id, s])
    );
    
    const newSections = sectionIds
      .map((id) => sectionMap.get(id))
      .filter((s) => s !== undefined) as PageSection[];
    
    const newPages = state.pages.map((page) => {
      if (page._id === state.selectedPage?._id) {
        return {
          ...page,
          sections: newSections.map((section, index) => ({
            ...section,
            order: index,
          })),
        };
      }
      return page;
    });
    
    return {
      pages: newPages,
      isDirty: true,
      selectedPage: newPages.find((p) => p._id === state.selectedPage?._id) || null,
      history: [...state.history.slice(0, state.historyIndex + 1), newPages],
      historyIndex: state.historyIndex + 1,
    };
  }),
  
  // History
  undo: () => set((state) => {
    if (state.historyIndex > 0) {
      const newIndex = state.historyIndex - 1;
      return {
        pages: state.history[newIndex],
        historyIndex: newIndex,
      };
    }
    return state;
  }),
  
  redo: () => set((state) => {
    if (state.historyIndex < state.history.length - 1) {
      const newIndex = state.historyIndex + 1;
      return {
        pages: state.history[newIndex],
        historyIndex: newIndex,
      };
    }
    return state;
  }),
  
  // Publishing
  publish: () => set((state) => ({
    website: state.website
      ? {
          ...state.website,
          isPublished: true,
          publishedAt: new Date().toISOString(),
        }
      : null,
    isDirty: false,
  })),
  
  unpublish: () => set((state) => ({
    website: state.website
      ? {
          ...state.website,
          isPublished: false,
        }
      : null,
  })),
  
  // Reset
  reset: () => set({
    website: null,
    pages: [],
    selectedPage: null,
    selectedSection: null,
    mode: 'edit',
    isDirty: false,
    isLoading: false,
    error: null,
    history: [],
    historyIndex: -1,
  }),
}));

export default usePageBuilder;
