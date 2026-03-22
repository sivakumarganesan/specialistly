import React, { useState, useEffect } from 'react';
import { usePageBuilder, Website, Page, PageSection } from '@/app/hooks/usePageBuilder';
import { pageBuilderAPI } from '@/app/api/pageBuilderAPI';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Textarea } from '@/app/components/ui/textarea';
import EditorCanvas from './EditorCanvas';
import SectionLibrary from './SectionLibrary';
import { PreviewMode } from './PreviewMode';
import {
  Plus,
  Save,
  Eye,
  RotateCcw,
  RotateCw,
  Settings,
  Upload,
  Loader,
  X,
  Trash2,
  Pencil,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';

interface PageBuilderEditorProps {
  websiteId: string;
}

const PageBuilderEditor: React.FC<PageBuilderEditorProps> = ({ websiteId }) => {
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [showSectionLibrary, setShowSectionLibrary] = useState(false);
  const [selectedSection, setSelectedSection] = useState<PageSection | null>(null);
  const {
    website,
    pages,
    selectedPage,
    mode,
    isDirty,
    isLoading,
    error,
    setWebsite,
    setPages,
    setMode,
    setError,
    setLoading,
    addPage,
    selectPage,
    undo,
    redo,
    publish,
  } = usePageBuilder();

  // Load website and pages on mount
  useEffect(() => {
    loadWebsiteData();
  }, [websiteId]);

  const handleAddSection = () => {
    setShowSectionLibrary(true);
  };

  const handleSelectSectionTemplate = (template: any) => {
    addSectionToPage(template.type, template.defaultContent);
  };

  const addSectionToPage = async (sectionType: string, sectionData: any) => {
    if (!selectedPage) return;

    try {
      setLoading(true);
      await pageBuilderAPI.createSection(
        websiteId,
        selectedPage._id,
        {
          type: sectionType,
          title: sectionData.title || '',
          description: sectionData.description || '',
          content: sectionData,
          styling: sectionData.styling || {},
        }
      );

      // Refetch the page with populated sections to get the correct _id
      const freshPage = await pageBuilderAPI.getPageById(websiteId, selectedPage._id);
      if (freshPage.data) {
        selectPage(freshPage.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add section');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSection = async (sectionId: string, updates: Partial<PageSection>) => {
    if (!selectedPage) return;

    try {
      setLoading(true);
      await pageBuilderAPI.updateSection(
        websiteId,
        selectedPage._id,
        sectionId,
        updates
      );

      // Update local state
      const updatedSections = selectedPage.sections.map(s =>
        s._id === sectionId ? { ...s, ...updates } : s
      );
      const updatedPage = { ...selectedPage, sections: updatedSections };
      selectPage(updatedPage);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update section');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSection = async (sectionId: string) => {
    if (!selectedPage) return;

    if (!confirm('Are you sure you want to delete this section?')) return;

    try {
      setLoading(true);
      await pageBuilderAPI.deleteSection(
        websiteId,
        selectedPage._id,
        sectionId
      );

      // Update local state
      const updatedSections = selectedPage.sections.filter(s => s._id !== sectionId);
      const updatedPage = { ...selectedPage, sections: updatedSections };
      selectPage(updatedPage);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete section');
    } finally {
      setLoading(false);
    }
  };

  const handleReorderSections = async (newSections: PageSection[]) => {
    if (!selectedPage) return;

    try {
      setLoading(true);
      // Update each section with new order
      for (let i = 0; i < newSections.length; i++) {
        await pageBuilderAPI.updateSection(
          websiteId,
          selectedPage._id,
          newSections[i]._id,
          { order: i }
        );
      }

      // Update local state
      const updatedPage = { ...selectedPage, sections: newSections };
      selectPage(updatedPage);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reorder sections');
    } finally {
      setLoading(false);
    }
  };

  const handleReorderPage = async (pageId: string, direction: 'up' | 'down') => {
    const sorted = pages.slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const idx = sorted.findIndex(p => p._id === pageId);
    if (idx < 0) return;
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;

    try {
      setLoading(true);

      // Normalize orders first (in case all pages have the same order value)
      const updates: Promise<any>[] = [];
      const newPages = sorted.map((p, i) => ({ ...p, order: i }));
      // Swap the two target pages
      const tmp = newPages[idx].order;
      newPages[idx] = { ...newPages[idx], order: newPages[swapIdx].order };
      newPages[swapIdx] = { ...newPages[swapIdx], order: tmp };

      // Update all pages that changed
      for (const p of newPages) {
        const original = pages.find(op => op._id === p._id);
        if (!original || (original.order ?? 0) !== p.order) {
          updates.push(pageBuilderAPI.updatePage(websiteId, p._id, { order: p.order }));
        }
      }
      await Promise.all(updates);

      setPages(newPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reorder pages');
    } finally {
      setLoading(false);
    }
  };

  // Load website and pages on mount
  useEffect(() => {
    loadWebsiteData();
  }, [websiteId]);

  const loadWebsiteData = async () => {
    try {
      setLoading(true);
      const websiteData = await pageBuilderAPI.getWebsite(websiteId);
      const pagesData = await pageBuilderAPI.getPages(websiteId);
      
      setWebsite(websiteData.data);
      setPages(pagesData.data || []);
      
      // Select first page
      if (pagesData.data && pagesData.data.length > 0) {
        selectPage(pagesData.data[0]);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to load website';
      console.error('Load website error:', errorMsg);
      
      // If we get a 404 or "not found" error, try to fetch the first available website
      if (errorMsg.includes('404') || errorMsg.includes('not found')) {
        console.log('Website not found, attempting to fetch your websites...');
        try {
          const response = await fetch(
            (import.meta.env.VITE_API_URL as string || '/api') + '/page-builder/websites',
            {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
              },
            }
          );
          
          if (response.ok) {
            const data = await response.json();
            if (data.data && data.data.length > 0) {
              console.log('Found available website, redirecting...');
              window.location.href = `/page-builder/${data.data[0]._id}`;
              return;
            }
          }
        } catch (redirectErr) {
          console.error('Error during redirect:', redirectErr);
        }
      }
      
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPage = async () => {
    try {
      const title = prompt('Enter page title:');
      if (!title) return;

      const slug = title.toLowerCase().replace(/\s+/g, '-');
      const newPage = await pageBuilderAPI.createPage(websiteId, {
        title,
        slug,
      });

      addPage(newPage.data);
      selectPage(newPage.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create page');
    }
  };

  const handlePublish = async () => {
    try {
      setLoading(true);
      await pageBuilderAPI.publishWebsite(websiteId);
      publish();
      setShowPublishDialog(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to publish website');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteWebsite = async () => {
    const confirmDelete = confirm(
      `Are you absolutely sure you want to delete "${website?.displayName}"?\n\nThis action cannot be undone. All pages, sections, and content will be permanently deleted.`
    );
    
    if (!confirmDelete) return;

    try {
      setLoading(true);
      setError(null);
      console.log(`Deleting website ${websiteId}...`);
      
      await pageBuilderAPI.deleteWebsite(websiteId);
      
      console.log('Website deleted successfully');
      // Redirect to dashboard
      window.location.href = '/dashboard';
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to delete website';
      console.error('Delete website error:', errorMsg);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (isLoading && !website) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-slate-50">
      {/* Professional Header */}
      <header className="bg-gradient-to-r from-blue-600 via-blue-700 to-gray-800 shadow-lg">
        <div className="px-8 py-6 flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
                <span className="font-bold text-lg" style={{ color: '#ffffff' }}>📄</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold" style={{ color: '#ffffff' }}>
                  {website?.displayName || 'Page Builder'}
                </h1>
                <p className="text-sm mt-1" style={{ color: '#bfdbfe' }}>Professional Website Designer</p>
              </div>
            </div>
            <div className="flex items-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <span className="text-sm" style={{ color: '#bfdbfe' }}>Domain:</span>
                <span className="text-sm font-mono font-semibold px-3 py-1 rounded" style={{ color: '#ffffff', backgroundColor: 'rgba(255,255,255,0.1)' }}>{website?.domainName}</span>
              </div>
              {website?.subdomain && (
                <div className="flex items-center gap-2 pl-6 border-l" style={{ borderColor: 'rgba(255,255,255,0.2)' }}>
                  <span className="text-sm" style={{ color: '#bfdbfe' }}>Subdomain:</span>
                  <span className="font-mono font-semibold px-3 py-1 rounded" style={{ color: '#ffffff', backgroundColor: 'rgba(255,255,255,0.1)' }}>{website.subdomain}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-6">
            {/* Status Indicator */}
            {selectedPage && (
              <div className="text-right">
                {website?.subdomain && website.isPublished ? (
                  <div className="flex items-center gap-2 px-4 py-2 rounded-lg" style={{ backgroundColor: 'rgba(34,197,94,0.1)', border: '1px solid rgba(74,222,128,0.3)' }}>
                    <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: '#4ade80' }}></div>
                    <p className="text-xs font-semibold" style={{ color: '#bbf7d0' }}>LIVE</p>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-4 py-2 rounded-lg" style={{ backgroundColor: 'rgba(234,179,8,0.1)', border: '1px solid rgba(250,204,21,0.3)' }}>
                    <div className="w-2 h-2" style={{ backgroundColor: '#facc15' }}></div>
                    <p className="text-xs font-semibold" style={{ color: '#fef08a' }}>DRAFT</p>
                  </div>
                )}
              </div>
            )}

            {/* Mode Selection */}
            <div className="flex gap-2 rounded-lg p-1" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
              <button
                onClick={() => setMode('edit')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all"
                style={mode === 'edit'
                  ? { backgroundColor: '#ffffff', color: '#2563eb' }
                  : { backgroundColor: 'transparent', color: '#bfdbfe' }}
              >
                ✏️ Edit
              </button>
              <button
                onClick={() => setMode('preview')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all"
                style={mode === 'preview'
                  ? { backgroundColor: '#ffffff', color: '#2563eb' }
                  : { backgroundColor: 'transparent', color: '#bfdbfe' }}
              >
                👁️ Preview
              </button>
              <button
                onClick={() => setMode('branding')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all"
                style={mode === 'branding'
                  ? { backgroundColor: '#ffffff', color: '#2563eb' }
                  : { backgroundColor: 'transparent', color: '#bfdbfe' }}
              >
                🎨 Branding
              </button>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pl-6" style={{ borderLeft: '1px solid rgba(255,255,255,0.2)' }}>
              <button
                onClick={undo}
                title="Undo"
                className="inline-flex items-center justify-center w-8 h-8 rounded-md transition-all hover:bg-white/10"
                style={{ color: '#ffffff' }}
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={redo}
                title="Redo"
                className="inline-flex items-center justify-center w-8 h-8 rounded-md transition-all hover:bg-white/10"
                style={{ color: '#ffffff' }}
              >
                <RotateCw className="w-4 h-4" />
              </button>

              {isDirty && (
                <Button
                  size="sm"
                  className="gap-2 bg-white text-blue-600 hover:bg-blue-50 font-semibold"
                >
                  <Save className="w-4 h-4" />
                  Save
                </Button>
              )}

              <Button
                size="sm"
                className="gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold"
                onClick={() => setShowPublishDialog(true)}
                disabled={isLoading}
              >
                <Upload className="w-4 h-4" />
                Publish
              </Button>

              <Button
                size="sm"
                title="Delete website"
                onClick={handleDeleteWebsite}
                disabled={isLoading}
                className="gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </Button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="px-8 py-3 bg-red-500 bg-opacity-90 text-white text-sm font-medium">
            ⚠️ {error}
          </div>
        )}
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden gap-0">
        {/* Left Sidebar - Pages */}
        <aside className="w-80 border-r border-slate-200 bg-white overflow-y-auto shadow-sm">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Pages</h2>
                <p className="text-xs text-slate-500 mt-1">Your website pages</p>
              </div>
              <Button
                size="sm"
                onClick={handleAddPage}
                className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="w-4 h-4" />
                Add
              </Button>
            </div>

            <div className="space-y-3">
              {pages
                .slice()
                .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                .map((page, idx, sortedPages) => (
                <div
                  key={page._id}
                  className={`px-4 py-4 rounded-lg border-2 transition-all group cursor-pointer ${
                    selectedPage?._id === page._id
                      ? 'border-blue-500 bg-blue-50 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <button
                      onClick={() => selectPage(page)}
                      className="flex-1 text-left"
                    >
                      <div className="font-semibold text-slate-900">{page.title}</div>
                      <div className="text-xs text-slate-500 font-mono mt-1">{page.slug}</div>
                      {page.isPublished && (
                        <div className="text-xs font-semibold text-green-600 mt-2 flex items-center gap-1">
                          ✓ Published
                        </div>
                      )}
                    </button>
                    <div className="flex items-center gap-1 ml-2">
                      {page.isHomePage && (
                        <span className="text-xs font-bold text-white bg-green-600 px-2 py-1 rounded">HOME</span>
                      )}
                      {/* Reorder arrows */}
                      <div className="flex flex-col">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleReorderPage(page._id, 'up');
                          }}
                          disabled={idx === 0 || isLoading}
                          className="p-0.5 text-slate-400 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Move up"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleReorderPage(page._id, 'down');
                          }}
                          disabled={idx === sortedPages.length - 1 || isLoading}
                          className="p-0.5 text-slate-400 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Move down"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Page Actions */}
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        const newTitle = prompt('Rename page:', page.title);
                        if (!newTitle || newTitle === page.title) return;
                        const newSlug = newTitle.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
                        try {
                          setLoading(true);
                          await pageBuilderAPI.updatePage(
                            website?._id || websiteId,
                            page._id,
                            { title: newTitle, slug: newSlug }
                          );
                          const updatedPage = { ...page, title: newTitle, slug: newSlug };
                          setPages(pages.map(p => p._id === page._id ? updatedPage : p));
                          if (selectedPage?._id === page._id) selectPage(updatedPage);
                        } catch (err) {
                          setError(err instanceof Error ? err.message : 'Failed to rename page');
                        } finally {
                          setLoading(false);
                        }
                      }}
                      disabled={isLoading}
                      className="text-xs px-2"
                      title="Rename page"
                    >
                      <Pencil className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant={page.isPublished ? "default" : "outline"}
                      onClick={async () => {
                        try {
                          setLoading(true);
                          await pageBuilderAPI.publishPage(
                            website?._id || websiteId,
                            page._id
                          );
                          const updatedPage = { ...page, isPublished: !page.isPublished };
                          selectPage(updatedPage);
                          setPages(pages.map(p => p._id === page._id ? updatedPage : p));
                        } catch (err) {
                          setError(err instanceof Error ? err.message : 'Failed to publish page');
                        } finally {
                          setLoading(false);
                        }
                      }}
                      disabled={isLoading}
                      className="flex-1 text-xs gap-1"
                    >
                      <Upload className="w-3 h-3" />
                      {page.isPublished ? 'Unpub' : 'Pub'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        if (!confirm(`Delete page "${page.title}"?`)) return;
                        try {
                          setLoading(true);
                          await pageBuilderAPI.deletePage(
                            website?._id || websiteId,
                            page._id
                          );
                          setPages(pages.filter(p => p._id !== page._id));
                          if (selectedPage?._id === page._id) {
                            selectPage(pages[0] || null);
                          }
                        } catch (err) {
                          setError(err instanceof Error ? err.message : 'Failed to delete page');
                        } finally {
                          setLoading(false);
                        }
                      }}
                      disabled={isLoading}
                      className="text-xs text-red-600 hover:text-red-700 px-2"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Center Canvas */}
        <main className="flex-1 overflow-auto bg-gradient-to-br from-slate-50 to-slate-100">
          {selectedPage && mode === 'edit' && (
            <>
              <EditorCanvas
                page={selectedPage}
                onAddSection={handleAddSection}
                onUpdateSection={handleUpdateSection}
                onDeleteSection={handleDeleteSection}
                onReorderSections={handleReorderSections}
                onSelectSection={setSelectedSection}
                selectedSectionId={selectedSection?._id}
              />
              <SectionLibrary
                isOpen={showSectionLibrary}
                onSelectTemplate={handleSelectSectionTemplate}
                onClose={() => setShowSectionLibrary(false)}
              />
            </>
          )}
          {selectedPage && mode === 'preview' && (
            <PreviewMode page={selectedPage} website={website} />
          )}
          {mode === 'branding' && (
            <BrandingPanel website={website} onCancel={() => setMode('edit')} />
          )}
        </main>

        {/* Right Sidebar - Properties */}
        <aside className="w-80 border-l border-slate-200 bg-white overflow-y-auto shadow-sm">
          {selectedSection ? (
            <div className="border-b border-slate-200 bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4">
              <h3 className="font-bold text-slate-900">Section Properties</h3>
              <p className="text-xs text-slate-600 mt-1">Edit section content below</p>
            </div>
          ) : null}
          <PropertiesPanel 
            section={selectedSection} 
            onUpdateSection={selectedSection ? (updates) => handleUpdateSection(selectedSection._id, updates) : undefined}
          />
        </aside>
      </div>

      {/* Publish Dialog */}
      {showPublishDialog && (
        <PublishDialog
          website={website}
          isLoading={isLoading}
          onPublish={handlePublish}
          onCancel={() => setShowPublishDialog(false)}
        />
      )}
    </div>
  );
};

// Sub-components (stubs for now)
const PreviewMode: React.FC<{ page: Page; website: Website | null }> = ({
  page,
  website,
}) => (
  <div className="p-8">
    <Card className="min-h-screen">
      <div className="p-12" style={{ backgroundColor: website?.branding?.colors?.primary }}>
        <h1 className="text-4xl font-bold text-white mb-4">{page.title}</h1>
        <p className="text-white text-lg">{page.description}</p>
      </div>
    </Card>
  </div>
);

const BrandingPanel: React.FC<{ website: Website | null; onCancel?: () => void }> = ({ website, onCancel }) => {
  const [logo, setLogo] = useState<string | null>(website?.branding?.logo || null);
  const [primaryColor, setPrimaryColor] = useState(website?.branding?.colors?.primary || '#3B82F6');
  const [secondaryColor, setSecondaryColor] = useState(website?.branding?.colors?.secondary || '#ec4899');
  const [siteName, setSiteName] = useState(website?.branding?.siteName || '');
  const [tagline, setTagline] = useState(website?.branding?.tagline || '');
  const [headerBgColor, setHeaderBgColor] = useState(website?.branding?.headerBgColor || '');
  const [headerTextColor, setHeaderTextColor] = useState(website?.branding?.headerTextColor || '#ffffff');
  const [footerBgColor, setFooterBgColor] = useState(website?.branding?.footerBgColor || '#111827');
  const [footerTextColor, setFooterTextColor] = useState(website?.branding?.footerTextColor || '#ffffff');
  const [accentColor, setAccentColor] = useState(website?.branding?.accentColor || '');
  const [fontFamily, setFontFamily] = useState(website?.branding?.fontFamily || 'Inter');
  const [buttonStyle, setButtonStyle] = useState(website?.branding?.buttonStyle || 'filled');
  const [buttonRadius, setButtonRadius] = useState(website?.branding?.buttonRadius || '8px');
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !website) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please upload an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('File size must be less than 5MB');
      return;
    }

    try {
      setIsUploading(true);
      setErrorMessage('');

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', file);

      const apiUrl = (import.meta.env.VITE_API_URL as string) || '/api';
      const authToken = localStorage.getItem('authToken');

      // Check if token exists
      if (!authToken) {
        console.error('❌ No auth token found in localStorage for logo upload');
        setErrorMessage('Authentication token not found. Please log in again.');
        setIsUploading(false);
        return;
      }

      console.log('📤 Uploading logo to:', `${apiUrl}/page-builder/websites/${website._id}/media/upload`);
      console.log('🔐 Auth token present:', !!authToken, `(length: ${authToken.length})`);

      // Upload to media endpoint
      const uploadResponse = await fetch(
        `${apiUrl}/page-builder/websites/${website._id}/media/upload`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`,
          },
          body: formData,
        }
      );

      console.log('📥 Upload response status:', uploadResponse.status);

      if (!uploadResponse.ok) {
        const error = await uploadResponse.json();
        console.error('❌ Upload request failed:', error);
        throw new Error(error.message || `Upload failed with status ${uploadResponse.status}`);
      }

      const uploadData = await uploadResponse.json();
      const logoUrl = uploadData.data?.url || uploadData.data?.media?.url;

      if (!logoUrl) {
        throw new Error('No URL returned from upload');
      }

      console.log('✅ Logo uploaded successfully:', logoUrl);
      setLogo(logoUrl);
      setSuccessMessage('Logo uploaded successfully');
    } catch (error) {
      console.error('Logo upload error:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to upload logo');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveBranding = async () => {
    if (!website) return;

    try {
      setIsSaving(true);
      setErrorMessage('');

      await pageBuilderAPI.updateBranding(website._id, {
        logo: logo || undefined,
        colors: {
          primary: primaryColor,
          secondary: secondaryColor,
        },
        siteName,
        tagline,
        headerBgColor: headerBgColor || primaryColor,
        headerTextColor,
        footerBgColor,
        footerTextColor,
        accentColor: accentColor || primaryColor,
        fontFamily,
        buttonStyle,
        buttonRadius,
      });

      setSuccessMessage('Branding settings saved successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Save branding error:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to save branding');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen p-8 bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-gray-900 rounded-lg flex items-center justify-center text-white text-xl">
              🎨
            </div>
            <div>
              <h2 className="text-3xl font-bold text-slate-900">Branding Settings</h2>
              <p className="text-slate-600 mt-1">Customize your website's appearance and identity</p>
            </div>
          </div>
        </div>

        {/* Content Card */}
        <Card className="p-8 shadow-lg border border-slate-200">
          {successMessage && (
            <div className="mb-6 p-4 bg-green-50 border border-green-300 text-green-700 rounded-lg flex items-center gap-3">
              <span className="text-xl">✓</span>
              <div>
                <p className="font-semibold text-sm">Success</p>
                <p className="text-xs mt-1">{successMessage}</p>
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="mb-6 p-4 bg-red-50 border border-red-300 text-red-700 rounded-lg flex items-center gap-3">
              <span className="text-xl">⚠</span>
              <div>
                <p className="font-semibold text-sm">Error</p>
                <p className="text-xs mt-1">{errorMessage}</p>
              </div>
            </div>
          )}

          <div className="space-y-8">
            {/* Site Name Section */}
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-3">Site Name</label>
              <Input
                type="text"
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
                placeholder="My Creator Site"
                className="border-slate-300 focus:border-blue-500"
              />
              <p className="text-xs text-slate-500 mt-2">The name displayed at the top of your website</p>
            </div>

            {/* Tagline Section */}
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-3">Tagline</label>
              <Input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="Welcome to my site"
                className="border-slate-300 focus:border-blue-500"
              />
              <p className="text-xs text-slate-500 mt-2">A short description or motto for your site</p>
            </div>

            {/* Logo Upload Section */}
            <div className="border-t border-slate-200 pt-8">
              <label className="block text-sm font-semibold text-slate-900 mb-4">Logo</label>
              <div className="space-y-4">
                <div className="w-40 h-40 bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl flex items-center justify-center border-2 border-dashed border-slate-300 overflow-hidden">
                  {logo ? (
                    <img src={logo} alt="Logo" className="w-full h-full object-contain p-4" />
                  ) : (
                    <div className="text-center">
                      <span className="text-4xl mb-2 block">📷</span>
                      <span className="text-slate-400 text-xs">No logo</span>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Upload className="w-4 h-4" />
                    {isUploading ? 'Uploading...' : 'Upload Logo'}
                  </Button>
                  {logo && (
                    <Button
                      variant="outline"
                      onClick={() => setLogo(null)}
                      disabled={isUploading}
                      className="gap-2 text-red-600 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                      Remove
                    </Button>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  disabled={isUploading}
                  className="hidden"
                />
                <p className="text-xs text-slate-500">Max 5MB • PNG or JPG recommended • Square format works best</p>
              </div>
            </div>

            {/* Colors Section */}
            <div className="border-t border-slate-200 pt-8">
              <h3 className="font-semibold text-slate-900 mb-6">Color Theme</h3>
              
              <div className="grid grid-cols-2 gap-8">
                {/* Primary Color */}
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-3">Primary Color</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-14 h-14 rounded-lg cursor-pointer border border-slate-300"
                    />
                    <code className="text-sm text-slate-600 font-mono bg-slate-100 px-3 py-2 rounded">{primaryColor}</code>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">Buttons, links, and main accents</p>
                </div>

                {/* Secondary Color */}
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-3">Secondary Color</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      className="w-14 h-14 rounded-lg cursor-pointer border border-slate-300"
                    />
                    <code className="text-sm text-slate-600 font-mono bg-slate-100 px-3 py-2 rounded">{secondaryColor}</code>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">Highlights and secondary elements</p>
                </div>

                {/* Accent Color */}
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-3">Accent Color</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={accentColor || primaryColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      className="w-14 h-14 rounded-lg cursor-pointer border border-slate-300"
                    />
                    <code className="text-sm text-slate-600 font-mono bg-slate-100 px-3 py-2 rounded">{accentColor || primaryColor}</code>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">Hover states and special highlights</p>
                </div>
              </div>
            </div>

            {/* Header & Footer Styling */}
            <div className="border-t border-slate-200 pt-8">
              <h3 className="font-semibold text-slate-900 mb-6">Header & Footer</h3>
              
              {/* Header Preview */}
              <div className="mb-6 rounded-lg overflow-hidden border border-slate-200">
                <div className="px-4 py-3 flex items-center justify-between" style={{ backgroundColor: headerBgColor || primaryColor, color: headerTextColor }}>
                  <span className="font-bold text-sm">{siteName || 'Your Site'}</span>
                  <div className="flex gap-3 text-xs font-medium opacity-80">
                    <span>Page 1</span><span>Page 2</span><span>Page 3</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8 mb-8">
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-3">Header Background</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={headerBgColor || primaryColor}
                      onChange={(e) => setHeaderBgColor(e.target.value)}
                      className="w-14 h-14 rounded-lg cursor-pointer border border-slate-300"
                    />
                    <code className="text-sm text-slate-600 font-mono bg-slate-100 px-3 py-2 rounded">{headerBgColor || primaryColor}</code>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-3">Header Text</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={headerTextColor}
                      onChange={(e) => setHeaderTextColor(e.target.value)}
                      className="w-14 h-14 rounded-lg cursor-pointer border border-slate-300"
                    />
                    <code className="text-sm text-slate-600 font-mono bg-slate-100 px-3 py-2 rounded">{headerTextColor}</code>
                  </div>
                </div>
              </div>

              {/* Footer Preview */}
              <div className="mb-6 rounded-lg overflow-hidden border border-slate-200">
                <div className="px-4 py-3 text-center text-xs" style={{ backgroundColor: footerBgColor, color: footerTextColor }}>
                  <span className="opacity-80">© {new Date().getFullYear()} {siteName || 'Your Site'}. All rights reserved.</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-3">Footer Background</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={footerBgColor}
                      onChange={(e) => setFooterBgColor(e.target.value)}
                      className="w-14 h-14 rounded-lg cursor-pointer border border-slate-300"
                    />
                    <code className="text-sm text-slate-600 font-mono bg-slate-100 px-3 py-2 rounded">{footerBgColor}</code>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-3">Footer Text</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={footerTextColor}
                      onChange={(e) => setFooterTextColor(e.target.value)}
                      className="w-14 h-14 rounded-lg cursor-pointer border border-slate-300"
                    />
                    <code className="text-sm text-slate-600 font-mono bg-slate-100 px-3 py-2 rounded">{footerTextColor}</code>
                  </div>
                </div>
              </div>
            </div>

            {/* Typography */}
            <div className="border-t border-slate-200 pt-8">
              <h3 className="font-semibold text-slate-900 mb-6">Typography</h3>
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-3">Font Family</label>
                <select
                  value={fontFamily}
                  onChange={(e) => setFontFamily(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value="Inter">Inter (Modern & Clean)</option>
                  <option value="Georgia">Georgia (Classic Serif)</option>
                  <option value="Poppins">Poppins (Friendly)</option>
                  <option value="Playfair Display">Playfair Display (Elegant)</option>
                  <option value="Roboto">Roboto (Professional)</option>
                  <option value="Montserrat">Montserrat (Bold & Modern)</option>
                  <option value="Lato">Lato (Warm & Stable)</option>
                  <option value="Open Sans">Open Sans (Neutral)</option>
                  <option value="Raleway">Raleway (Stylish)</option>
                  <option value="system-ui">System Default</option>
                </select>
                <p className="text-xs text-slate-500 mt-2" style={{ fontFamily }}>
                  Preview: The quick brown fox jumps over the lazy dog
                </p>
              </div>
            </div>

            {/* Button Styling */}
            <div className="border-t border-slate-200 pt-8">
              <h3 className="font-semibold text-slate-900 mb-6">Button Style</h3>
              <div className="grid grid-cols-2 gap-4 mb-6">
                {[
                  { id: 'filled', label: 'Filled', style: { backgroundColor: primaryColor, color: '#fff', border: 'none' } },
                  { id: 'outlined', label: 'Outlined', style: { backgroundColor: 'transparent', color: primaryColor, border: `2px solid ${primaryColor}` } },
                  { id: 'rounded', label: 'Rounded', style: { backgroundColor: primaryColor, color: '#fff', border: 'none', borderRadius: '24px' } },
                  { id: 'pill', label: 'Pill', style: { backgroundColor: primaryColor, color: '#fff', border: 'none', borderRadius: '9999px' } },
                ].map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setButtonStyle(option.id)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      buttonStyle === option.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <span
                        className="px-6 py-2 text-sm font-semibold"
                        style={{ ...option.style, borderRadius: option.style.borderRadius || buttonRadius }}
                      >
                        Button
                      </span>
                      <span className="text-xs text-slate-600">{option.label}</span>
                    </div>
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-3">Corner Radius</label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="0"
                    max="24"
                    value={parseInt(buttonRadius)}
                    onChange={(e) => setButtonRadius(`${e.target.value}px`)}
                    className="flex-1"
                  />
                  <code className="text-sm text-slate-600 font-mono bg-slate-100 px-3 py-2 rounded w-16 text-center">{buttonRadius}</code>
                </div>
                <div className="mt-3 flex gap-3">
                  <span className="px-5 py-2 text-sm font-semibold text-white" style={{ backgroundColor: primaryColor, borderRadius: buttonRadius }}>
                    Preview Button
                  </span>
                </div>
              </div>
            </div>

            {/* Save & Cancel Buttons */}
            <div className="border-t border-slate-200 pt-8 flex gap-4">
              <Button
                onClick={handleSaveBranding}
                disabled={isSaving}
                className="gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-2"
              >
                {isSaving ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Branding
                  </>
                )}
              </Button>
              {onCancel && (
                <Button
                  onClick={onCancel}
                  variant="outline"
                  className="gap-2 px-8 py-2"
                >
                  Cancel
                </Button>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

const PropertiesPanel: React.FC<{
  section?: PageSection;
  onUpdateSection?: (updates: Partial<PageSection>) => void;
}> = ({ section, onUpdateSection }) => {
  const [title, setTitle] = useState(section?.title || '');
  const [description, setDescription] = useState(section?.description || '');
  const [content, setContent] = useState<Record<string, any>>(section?.content || {});
  const [aboutImageUrl, setAboutImageUrl] = useState(section?.content?.image || '');
  const [isUploadingAboutImage, setIsUploadingAboutImage] = useState(false);
  const [isUploadingHeroImage, setIsUploadingHeroImage] = useState<'bg' | 'overlay' | null>(null);
  const [uploadError, setUploadError] = useState('');
  const aboutImageInputRef = React.useRef<HTMLInputElement>(null);
  const heroBgImageRef = React.useRef<HTMLInputElement>(null);
  const heroOverlayImageRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTitle(section?.title || '');
    setDescription(section?.description || '');
    setContent(section?.content || {});
    setAboutImageUrl(section?.content?.image || '');
  }, [section]);

  if (!section) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="text-5xl mb-4">📋</div>
        <h3 className="text-lg font-bold text-slate-900 mb-2">Section Properties</h3>
        <p className="text-slate-500 text-sm">Select a section on the canvas to edit its properties</p>
      </div>
    );
  }

  const handleAboutImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setUploadError('Please upload an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File size must be less than 5MB');
      return;
    }

    try {
      setIsUploadingAboutImage(true);
      setUploadError('');

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', file);

      const apiUrl = (import.meta.env.VITE_API_URL as string) || '/api';
      const authToken = localStorage.getItem('authToken');

      // Check if token exists
      if (!authToken) {
        console.error('❌ No auth token found in localStorage');
        setUploadError('Authentication token not found. Please log in again.');
        setIsUploadingAboutImage(false);
        return;
      }

      console.log('📤 Uploading image to:', `${apiUrl}/page-builder/websites/${section.websiteId}/media/upload`);
      console.log('🔐 Auth token present:', !!authToken, `(length: ${authToken.length})`);

      // Upload to media endpoint
      const uploadResponse = await fetch(
        `${apiUrl}/page-builder/websites/${section.websiteId}/media/upload`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`,
          },
          body: formData,
        }
      );

      console.log('📥 Upload response status:', uploadResponse.status);

      if (!uploadResponse.ok) {
        const error = await uploadResponse.json();
        console.error('❌ Upload request failed:', error);
        throw new Error(error.message || `Upload failed with status ${uploadResponse.status}`);
      }

      const uploadData = await uploadResponse.json();
      const imageUrl = uploadData.data?.url || uploadData.data?.media?.url;

      if (!imageUrl) {
        throw new Error('No URL returned from upload');
      }

      console.log('✅ Image uploaded successfully:', imageUrl);
      setAboutImageUrl(imageUrl);
      setContent({ ...content, image: imageUrl });
    } catch (error) {
      console.error('About image upload error:', error);
      setUploadError(error instanceof Error ? error.message : 'Failed to upload image');
    } finally {
      setIsUploadingAboutImage(false);
    }
  };

  const handleHeroImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'backgroundImage' | 'overlayImage') => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setUploadError('Please upload an image file'); return; }
    if (file.size > 5 * 1024 * 1024) { setUploadError('File size must be less than 5MB'); return; }

    try {
      setIsUploadingHeroImage(field === 'backgroundImage' ? 'bg' : 'overlay');
      setUploadError('');
      const formData = new FormData();
      formData.append('file', file);
      const apiUrl = (import.meta.env.VITE_API_URL as string) || '/api';
      const authToken = localStorage.getItem('authToken');
      if (!authToken) { setUploadError('Authentication token not found.'); return; }

      const uploadResponse = await fetch(
        `${apiUrl}/page-builder/websites/${section?.websiteId}/media/upload`,
        { method: 'POST', headers: { 'Authorization': `Bearer ${authToken}` }, body: formData }
      );
      if (!uploadResponse.ok) {
        const error = await uploadResponse.json();
        throw new Error(error.message || `Upload failed with status ${uploadResponse.status}`);
      }
      const uploadData = await uploadResponse.json();
      const imageUrl = uploadData.data?.url || uploadData.data?.media?.url;
      if (!imageUrl) throw new Error('No URL returned from upload');

      const updatedContent = { ...content, [field]: imageUrl };
      setContent(updatedContent);

      // Auto-save so the image persists immediately
      if (onUpdateSection) {
        onUpdateSection({ content: updatedContent });
      }
    } catch (error) {
      console.error('Hero image upload error:', error);
      setUploadError(error instanceof Error ? error.message : 'Failed to upload image');
    } finally {
      setIsUploadingHeroImage(null);
    }
  };

  const handleSave = () => {
    if (onUpdateSection) {
      let updateData: Partial<PageSection> = {
        content,
      };

      if (section?.type === 'about') {
        updateData.title = content.title || '';
        updateData.description = content.description || '';
      } else if (section?.type === 'topbar' || section?.type === 'navbar') {
        // These sections don't use top-level title/description
      } else {
        updateData.title = title;
        updateData.description = description;
      }

      onUpdateSection(updateData);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4 text-gray-900">
          {section.type.charAt(0).toUpperCase() + section.type.slice(1)} Section
        </h3>
        <p className="text-xs text-gray-500 mb-4">Edit the section properties below</p>
      </div>

      {/* Section Title */}
      {section.type !== 'about' && section.type !== 'topbar' && section.type !== 'navbar' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
          <Input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Section title"
          />
        </div>
      )}

      {/* Section Description */}
      {section.type !== 'about' && section.type !== 'topbar' && section.type !== 'navbar' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Section description"
          />
        </div>
      )}

      {/* Section-specific content editors */}
      <div className="border-t pt-4">
        <h4 className="text-sm font-semibold text-gray-900 mb-4">Content</h4>

        {/* ─── Top Bar ─── */}
        {section.type === 'topbar' && (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <Input
                type="text"
                value={content.address || ''}
                onChange={(e) => setContent({ ...content, address: e.target.value })}
                placeholder="123 Main St, City - 600001"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <Input
                type="text"
                value={content.phone || ''}
                onChange={(e) => setContent({ ...content, phone: e.target.value })}
                placeholder="+91 9500012345"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Background Color</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={content.backgroundColor || '#00acc1'}
                  onChange={(e) => setContent({ ...content, backgroundColor: e.target.value })}
                  className="w-10 h-10 rounded cursor-pointer border border-gray-300"
                />
                <Input
                  type="text"
                  value={content.backgroundColor || '#00acc1'}
                  onChange={(e) => setContent({ ...content, backgroundColor: e.target.value })}
                  className="flex-1"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Text Color</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={content.textColor || '#ffffff'}
                  onChange={(e) => setContent({ ...content, textColor: e.target.value })}
                  className="w-10 h-10 rounded cursor-pointer border border-gray-300"
                />
                <Input
                  type="text"
                  value={content.textColor || '#ffffff'}
                  onChange={(e) => setContent({ ...content, textColor: e.target.value })}
                  className="flex-1"
                />
              </div>
            </div>
            {/* Social Links */}
            <div className="border-t pt-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">Social Links</label>
              {(content.socialLinks || []).map((link: any, idx: number) => (
                <div key={idx} className="flex gap-2 mb-2 items-center">
                  <select
                    className="border rounded px-2 py-1.5 text-sm bg-white"
                    value={link.platform}
                    onChange={(e) => {
                      const updated = [...(content.socialLinks || [])];
                      updated[idx] = { ...updated[idx], platform: e.target.value };
                      setContent({ ...content, socialLinks: updated });
                    }}
                  >
                    <option value="facebook">Facebook</option>
                    <option value="instagram">Instagram</option>
                    <option value="youtube">YouTube</option>
                    <option value="twitter">Twitter/X</option>
                    <option value="linkedin">LinkedIn</option>
                  </select>
                  <Input
                    type="text"
                    value={link.url}
                    onChange={(e) => {
                      const updated = [...(content.socialLinks || [])];
                      updated[idx] = { ...updated[idx], url: e.target.value };
                      setContent({ ...content, socialLinks: updated });
                    }}
                    placeholder="https://..."
                    className="flex-1"
                  />
                  <button
                    onClick={() => {
                      const updated = (content.socialLinks || []).filter((_: any, i: number) => i !== idx);
                      setContent({ ...content, socialLinks: updated });
                    }}
                    className="text-red-500 hover:text-red-700 text-xs px-2"
                  >✕</button>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const updated = [...(content.socialLinks || []), { platform: 'facebook', url: '' }];
                  setContent({ ...content, socialLinks: updated });
                }}
              >
                + Add Social Link
              </Button>
            </div>
          </div>
        )}

        {/* ─── Navigation Bar ─── */}
        {section.type === 'navbar' && (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Brand Name</label>
              <Input
                type="text"
                value={content.brandName || ''}
                onChange={(e) => setContent({ ...content, brandName: e.target.value })}
                placeholder="My Brand"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Brand Color</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={content.brandColor || '#00acc1'}
                  onChange={(e) => setContent({ ...content, brandColor: e.target.value })}
                  className="w-10 h-10 rounded cursor-pointer border border-gray-300"
                />
                <Input
                  type="text"
                  value={content.brandColor || '#00acc1'}
                  onChange={(e) => setContent({ ...content, brandColor: e.target.value })}
                  className="flex-1"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Logo Image URL</label>
              <Input
                type="text"
                value={content.logoUrl || ''}
                onChange={(e) => setContent({ ...content, logoUrl: e.target.value })}
                placeholder="https://... (optional)"
              />
              <p className="text-xs text-gray-500 mt-1">Paste a logo image URL or leave blank for text-only</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Background Color</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={content.backgroundColor || '#ffffff'}
                  onChange={(e) => setContent({ ...content, backgroundColor: e.target.value })}
                  className="w-10 h-10 rounded cursor-pointer border border-gray-300"
                />
                <Input
                  type="text"
                  value={content.backgroundColor || '#ffffff'}
                  onChange={(e) => setContent({ ...content, backgroundColor: e.target.value })}
                  className="flex-1"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Text Color</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={content.textColor || '#333333'}
                  onChange={(e) => setContent({ ...content, textColor: e.target.value })}
                  className="w-10 h-10 rounded cursor-pointer border border-gray-300"
                />
                <Input
                  type="text"
                  value={content.textColor || '#333333'}
                  onChange={(e) => setContent({ ...content, textColor: e.target.value })}
                  className="flex-1"
                />
              </div>
            </div>
            {/* Menu Items */}
            <div className="border-t pt-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">Menu Items</label>
              {(content.menuItems || []).map((item: any, idx: number) => (
                <div key={idx} className="flex gap-2 mb-2 items-center">
                  <Input
                    type="text"
                    value={item.label}
                    onChange={(e) => {
                      const updated = [...(content.menuItems || [])];
                      updated[idx] = { ...updated[idx], label: e.target.value };
                      setContent({ ...content, menuItems: updated });
                    }}
                    placeholder="Label"
                    className="flex-1"
                  />
                  <Input
                    type="text"
                    value={item.url}
                    onChange={(e) => {
                      const updated = [...(content.menuItems || [])];
                      updated[idx] = { ...updated[idx], url: e.target.value };
                      setContent({ ...content, menuItems: updated });
                    }}
                    placeholder="/page or URL"
                    className="flex-1"
                  />
                  <button
                    onClick={() => {
                      const updated = (content.menuItems || []).filter((_: any, i: number) => i !== idx);
                      setContent({ ...content, menuItems: updated });
                    }}
                    className="text-red-500 hover:text-red-700 text-xs px-2"
                  >✕</button>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const updated = [...(content.menuItems || []), { label: '', url: '' }];
                  setContent({ ...content, menuItems: updated });
                }}
              >
                + Add Menu Item
              </Button>
            </div>
          </div>
        )}
        
        {section.type === 'hero' && (
          <div className="space-y-3">
            {/* Global hero settings */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Accent Color</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={content.accentColor || '#00b4d8'}
                  onChange={(e) => setContent({ ...content, accentColor: e.target.value })}
                  className="w-10 h-10 rounded cursor-pointer border border-gray-300"
                />
                <Input
                  type="text"
                  value={content.accentColor || '#00b4d8'}
                  onChange={(e) => setContent({ ...content, accentColor: e.target.value })}
                  className="flex-1"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Autoplay Seconds</label>
              <Input
                type="number"
                min={2}
                max={30}
                value={content.autoplaySeconds || 5}
                onChange={(e) => setContent({ ...content, autoplaySeconds: parseInt(e.target.value) || 5 })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Overlay Image Max Height (px)</label>
              <Input
                type="number"
                min={200}
                max={1000}
                step={50}
                value={content.overlayMaxHeight || 500}
                onChange={(e) => setContent({ ...content, overlayMaxHeight: parseInt(e.target.value) || 500 })}
              />
              <p className="text-xs text-gray-500 mt-1">Default: 500px. Increase for a larger overlay image.</p>
            </div>

            {/* Slides */}
            <div className="border-t pt-3">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-gray-800">Slides ({(content.slides || [{ title: content.title || '', accentText: content.accentText || '', subtitle: content.subtitle || '', ctaText: content.ctaText || '', ctaLink: content.ctaLink || '', backgroundImage: content.backgroundImage || '', overlayImage: content.overlayImage || '' }]).length})</label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const currentSlides = content.slides || [{ title: content.title || '', accentText: content.accentText || '', subtitle: content.subtitle || '', ctaText: content.ctaText || '', ctaLink: content.ctaLink || '', backgroundImage: content.backgroundImage || '', overlayImage: content.overlayImage || '' }];
                    setContent({ ...content, slides: [...currentSlides, { title: '', accentText: '', subtitle: '', ctaText: '', ctaLink: '', backgroundImage: '', overlayImage: '' }] });
                  }}
                >
                  + Add Slide
                </Button>
              </div>
              {(content.slides || [{ title: content.title || '', accentText: content.accentText || '', subtitle: content.subtitle || '', ctaText: content.ctaText || '', ctaLink: content.ctaLink || '', backgroundImage: content.backgroundImage || '', overlayImage: content.overlayImage || '' }]).map((slide: any, slideIdx: number) => (
                <div key={slideIdx} className="border rounded-lg p-3 mb-3 bg-gray-50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-gray-600">Slide {slideIdx + 1}</span>
                    {(content.slides || []).length > 1 && (
                      <button
                        onClick={() => {
                          const updated = (content.slides || []).filter((_: any, i: number) => i !== slideIdx);
                          setContent({ ...content, slides: updated });
                        }}
                        className="text-red-500 hover:text-red-700 text-xs"
                      >Remove</button>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Input
                      type="text"
                      value={slide.title || ''}
                      onChange={(e) => {
                        const slides = [...(content.slides || [{ title: content.title || '', accentText: content.accentText || '', subtitle: content.subtitle || '', ctaText: content.ctaText || '', ctaLink: content.ctaLink || '', backgroundImage: content.backgroundImage || '', overlayImage: content.overlayImage || '' }])];
                        slides[slideIdx] = { ...slides[slideIdx], title: e.target.value };
                        setContent({ ...content, slides });
                      }}
                      placeholder="Headline"
                    />
                    <Input
                      type="text"
                      value={slide.accentText || ''}
                      onChange={(e) => {
                        const slides = [...(content.slides || [])];
                        slides[slideIdx] = { ...slides[slideIdx], accentText: e.target.value };
                        setContent({ ...content, slides });
                      }}
                      placeholder="Accent text"
                    />
                    <Input
                      type="text"
                      value={slide.subtitle || ''}
                      onChange={(e) => {
                        const slides = [...(content.slides || [])];
                        slides[slideIdx] = { ...slides[slideIdx], subtitle: e.target.value };
                        setContent({ ...content, slides });
                      }}
                      placeholder="Subtitle / description"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        type="text"
                        value={slide.ctaText || ''}
                        onChange={(e) => {
                          const slides = [...(content.slides || [])];
                          slides[slideIdx] = { ...slides[slideIdx], ctaText: e.target.value };
                          setContent({ ...content, slides });
                        }}
                        placeholder="CTA text"
                      />
                      <Input
                        type="text"
                        value={slide.ctaLink || ''}
                        onChange={(e) => {
                          const slides = [...(content.slides || [])];
                          slides[slideIdx] = { ...slides[slideIdx], ctaLink: e.target.value };
                          setContent({ ...content, slides });
                        }}
                        placeholder="CTA link"
                      />
                    </div>
                    {/* Background image for this slide */}
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Background image</p>
                      {slide.backgroundImage && (
                        <div className="relative mb-1">
                          <img src={slide.backgroundImage} alt="" className="w-full h-16 object-cover rounded" />
                          <button
                            onClick={() => {
                              const slides = [...(content.slides || [])];
                              slides[slideIdx] = { ...slides[slideIdx], backgroundImage: '' };
                              setContent({ ...content, slides });
                            }}
                            className="absolute top-0.5 right-0.5 bg-red-500 text-white px-1 rounded text-[10px]"
                          >✕</button>
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        id={`hero-slide-bg-${slideIdx}`}
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          try {
                            const formData = new FormData();
                            formData.append('file', file);
                            const apiUrl = (import.meta.env.VITE_API_URL as string) || '/api';
                            const authToken = localStorage.getItem('authToken');
                            if (!authToken) return;
                            const res = await fetch(`${apiUrl}/page-builder/websites/${section?.websiteId}/media/upload`, { method: 'POST', headers: { 'Authorization': `Bearer ${authToken}` }, body: formData });
                            if (!res.ok) throw new Error('Upload failed');
                            const data = await res.json();
                            const url = data.data?.url || data.data?.media?.url;
                            if (url) {
                              const slides = [...(content.slides || [])];
                              slides[slideIdx] = { ...slides[slideIdx], backgroundImage: url };
                              const updatedContent = { ...content, slides };
                              setContent(updatedContent);
                              if (onUpdateSection) onUpdateSection({ content: updatedContent });
                            }
                          } catch (err) { console.error('Slide bg upload error:', err); }
                        }}
                      />
                      <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => document.getElementById(`hero-slide-bg-${slideIdx}`)?.click()}>
                        {slide.backgroundImage ? 'Change Background' : 'Upload Background'}
                      </Button>
                    </div>
                    {/* Overlay image for this slide */}
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Overlay image (right side)</p>
                      {slide.overlayImage && (
                        <div className="relative mb-1">
                          <img src={slide.overlayImage} alt="" className="w-full h-16 object-cover rounded" />
                          <button
                            onClick={() => {
                              const slides = [...(content.slides || [])];
                              slides[slideIdx] = { ...slides[slideIdx], overlayImage: '' };
                              setContent({ ...content, slides });
                            }}
                            className="absolute top-0.5 right-0.5 bg-red-500 text-white px-1 rounded text-[10px]"
                          >✕</button>
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        id={`hero-slide-overlay-${slideIdx}`}
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          try {
                            const formData = new FormData();
                            formData.append('file', file);
                            const apiUrl = (import.meta.env.VITE_API_URL as string) || '/api';
                            const authToken = localStorage.getItem('authToken');
                            if (!authToken) return;
                            const res = await fetch(`${apiUrl}/page-builder/websites/${section?.websiteId}/media/upload`, { method: 'POST', headers: { 'Authorization': `Bearer ${authToken}` }, body: formData });
                            if (!res.ok) throw new Error('Upload failed');
                            const data = await res.json();
                            const url = data.data?.url || data.data?.media?.url;
                            if (url) {
                              const slides = [...(content.slides || [])];
                              slides[slideIdx] = { ...slides[slideIdx], overlayImage: url };
                              const updatedContent = { ...content, slides };
                              setContent(updatedContent);
                              if (onUpdateSection) onUpdateSection({ content: updatedContent });
                            }
                          } catch (err) { console.error('Slide overlay upload error:', err); }
                        }}
                      />
                      <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => document.getElementById(`hero-slide-overlay-${slideIdx}`)?.click()}>
                        {slide.overlayImage ? 'Change Overlay' : 'Upload Overlay'}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {uploadError && (
              <p className="text-xs text-red-600">{uploadError}</p>
            )}
          </div>
        )}

        {section.type === 'about' && (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <Input
                type="text"
                value={content.title || ''}
                onChange={(e) => setContent({ ...content, title: e.target.value })}
                placeholder="About Us"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <Textarea
                value={content.description || ''}
                onChange={(e) => setContent({ ...content, description: e.target.value })}
                placeholder="Tell your story..."
                rows={5}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Image Position</label>
              <select
                value={content.imagePosition || 'right'}
                onChange={(e) =>
                  setContent({ ...content, imagePosition: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="left">Left</option>
                <option value="right">Right</option>
                <option value="top">Top</option>
                <option value="bottom">Bottom</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Section Image</label>
              <div className="space-y-3">
                <div className="w-full h-40 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                  {aboutImageUrl ? (
                    <img src={aboutImageUrl} alt="About section" className="w-full h-full object-cover rounded-lg" />
                  ) : (
                    <span className="text-gray-400 text-center text-xs">No image</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => aboutImageInputRef.current?.click()}
                    disabled={isUploadingAboutImage}
                    className="gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    {isUploadingAboutImage ? 'Uploading...' : 'Upload Image'}
                  </Button>
                  {aboutImageUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setAboutImageUrl('');
                        setContent({ ...content, image: '' });
                      }}
                      disabled={isUploadingAboutImage}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                <input
                  ref={aboutImageInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAboutImageUpload}
                  disabled={isUploadingAboutImage}
                  className="hidden"
                />
                {uploadError && (
                  <p className="text-xs text-red-600">{uploadError}</p>
                )}
                <p className="text-xs text-gray-500">Max 5MB, PNG or JPG recommended</p>
              </div>
            </div>
          </div>
        )}

        {section.type === 'services' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Section Title</label>
              <Input
                type="text"
                value={content.title || ''}
                onChange={(e) => setContent({ ...content, title: e.target.value })}
                placeholder="Our Services"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Section Description</label>
              <Textarea
                value={content.description || ''}
                onChange={(e) => setContent({ ...content, description: e.target.value })}
                placeholder="Brief description of your services"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Layout</label>
              <div className="flex gap-2">
                <Button
                  variant={content.layout === 'grid' ? 'default' : 'outline'}
                  onClick={() => setContent({ ...content, layout: 'grid' })}
                  className="flex-1 text-xs"
                >
                  Grid
                </Button>
                <Button
                  variant={content.layout === 'list' ? 'default' : 'outline'}
                  onClick={() => setContent({ ...content, layout: 'list' })}
                  className="flex-1 text-xs"
                >
                  List
                </Button>
              </div>
            </div>
            
            {/* Services Management */}
            <div className="border-t pt-4">
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-sm font-semibold text-gray-900">Services</h4>
                <Button
                  size="sm"
                  onClick={() => {
                    const services = content.services || [];
                    services.push({
                      id: Date.now().toString(),
                      title: 'New Service',
                      description: 'Service description',
                      icon: '',
                    });
                    setContent({ ...content, services });
                  }}
                  className="text-xs"
                >
                  + Add Service
                </Button>
              </div>
              
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {(content.services || []).map((service: any, idx: number) => (
                  <div key={service.id} className="p-3 bg-gray-50 rounded border border-gray-200">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-medium text-gray-600">Service {idx + 1}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          const services = content.services.filter(
                            (s: any) => s.id !== service.id
                          );
                          setContent({ ...content, services });
                        }}
                        className="text-xs text-red-600 h-6 px-2"
                      >
                        Remove
                      </Button>
                    </div>
                    <Input
                      type="text"
                      value={service.title}
                      onChange={(e) => {
                        const services = content.services.map((s: any) =>
                          s.id === service.id
                            ? { ...s, title: e.target.value }
                            : s
                        );
                        setContent({ ...content, services });
                      }}
                      placeholder="Service title"
                      className="mb-2 text-xs"
                    />
                    {/* Service Image Upload */}
                    <div className="mb-2">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Image</label>
                      {service.image ? (
                        <div className="relative">
                          <img
                            src={service.image}
                            alt="Service"
                            className="w-full h-24 object-cover rounded border"
                          />
                          <button
                            onClick={() => {
                              const services = content.services.map((s: any) =>
                                s.id === service.id ? { ...s, image: '' } : s
                              );
                              setContent({ ...content, services });
                            }}
                            className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center w-full h-16 border-2 border-dashed border-gray-300 rounded cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-colors">
                          <div className="flex items-center gap-1.5">
                            <Upload className="w-4 h-4 text-gray-400" />
                            <span className="text-xs text-gray-500">Upload image</span>
                          </div>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = (event) => {
                                  const services = content.services.map((s: any) =>
                                    s.id === service.id
                                      ? { ...s, image: event.target?.result as string }
                                      : s
                                  );
                                  setContent({ ...content, services });
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>
                      )}
                      {!service.image && (
                        <Input
                          type="text"
                          value=""
                          onChange={(e) => {
                            const services = content.services.map((s: any) =>
                              s.id === service.id
                                ? { ...s, image: e.target.value }
                                : s
                            );
                            setContent({ ...content, services });
                          }}
                          placeholder="Or paste image URL"
                          className="mt-1 text-xs"
                        />
                      )}
                    </div>
                    <Textarea
                      value={service.description}
                      onChange={(e) => {
                        const services = content.services.map((s: any) =>
                          s.id === service.id
                            ? { ...s, description: e.target.value }
                            : s
                        );
                        setContent({ ...content, services });
                      }}
                      placeholder="Service description"
                      className="text-xs"
                      rows={2}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {section.type === 'cta' && (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Button Text</label>
              <Input
                type="text"
                value={content.buttonText || ''}
                onChange={(e) => setContent({ ...content, buttonText: e.target.value })}
                placeholder="CTA button text"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Background Color</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={content.backgroundColor || '#3B82F6'}
                  onChange={(e) => setContent({ ...content, backgroundColor: e.target.value })}
                  className="w-12 h-10 rounded cursor-pointer"
                />
                <Input
                  type="text"
                  value={content.backgroundColor || '#3B82F6'}
                  onChange={(e) => setContent({ ...content, backgroundColor: e.target.value })}
                  className="flex-1"
                />
              </div>
            </div>
          </div>
        )}

        {section.type === 'contact' && (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <Input
                type="email"
                value={content.email || ''}
                onChange={(e) => setContent({ ...content, email: e.target.value })}
                placeholder="Contact email"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <Input
                type="tel"
                value={content.phone || ''}
                onChange={(e) => setContent({ ...content, phone: e.target.value })}
                placeholder="Phone number"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <Textarea
                value={content.address || ''}
                onChange={(e) => setContent({ ...content, address: e.target.value })}
                placeholder="Street address"
              />
            </div>
          </div>
        )}

        {section.type === 'pricing' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="text-sm font-semibold text-gray-900">Pricing Plans</h4>
              <Button
                size="sm"
                onClick={() => {
                  const plans = content.plans || [];
                  plans.push({
                    id: Date.now().toString(),
                    name: 'Standard',
                    price: '$99',
                    description: 'Perfect for small businesses',
                    features: ['Feature 1', 'Feature 2'],
                  });
                  setContent({ ...content, plans });
                }}
                className="text-xs"
              >
                + Add Plan
              </Button>
            </div>
            
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {(content.plans || []).map((plan: any, idx: number) => (
                <div key={plan.id} className="p-3 bg-gray-50 rounded border border-gray-200">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-medium text-gray-600">Plan {idx + 1}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        const plans = content.plans.filter(
                          (p: any) => p.id !== plan.id
                        );
                        setContent({ ...content, plans });
                      }}
                      className="text-xs text-red-600 h-6 px-2"
                    >
                      Remove
                    </Button>
                  </div>
                  <Input
                    type="text"
                    value={plan.name}
                    onChange={(e) => {
                      const plans = content.plans.map((p: any) =>
                        p.id === plan.id
                          ? { ...p, name: e.target.value }
                          : p
                      );
                      setContent({ ...content, plans });
                    }}
                    placeholder="Plan name"
                    className="mb-2 text-xs"
                  />
                  <Input
                    type="text"
                    value={plan.price}
                    onChange={(e) => {
                      const plans = content.plans.map((p: any) =>
                        p.id === plan.id
                          ? { ...p, price: e.target.value }
                          : p
                      );
                      setContent({ ...content, plans });
                    }}
                    placeholder="Price (e.g., $99/month)"
                    className="mb-2 text-xs"
                  />
                  <Textarea
                    value={plan.description}
                    onChange={(e) => {
                      const plans = content.plans.map((p: any) =>
                        p.id === plan.id
                          ? { ...p, description: e.target.value }
                          : p
                      );
                      setContent({ ...content, plans });
                    }}
                    placeholder="Plan description"
                    className="text-xs"
                    rows={1}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {section.type === 'gallery' && (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Columns</label>
              <Input
                type="number"
                min="1"
                max="6"
                value={content.columns || 3}
                onChange={(e) => setContent({ ...content, columns: parseInt(e.target.value) })}
              />
            </div>
          </div>
        )}

        {section.type === 'video' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Section Title</label>
              <Input
                type="text"
                value={content.title || ''}
                onChange={(e) => setContent({ ...content, title: e.target.value })}
                placeholder="Our Videos"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Section Description</label>
              <Textarea
                value={content.description || ''}
                onChange={(e) => setContent({ ...content, description: e.target.value })}
                placeholder="Watch our latest content"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Layout</label>
              <div className="flex gap-2">
                <Button
                  variant={content.layout === 'grid' ? 'default' : 'outline'}
                  onClick={() => setContent({ ...content, layout: 'grid' })}
                  className="flex-1 text-xs"
                >
                  Grid
                </Button>
                <Button
                  variant={content.layout === 'featured' ? 'default' : 'outline'}
                  onClick={() => setContent({ ...content, layout: 'featured' })}
                  className="flex-1 text-xs"
                >
                  Featured
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-1">Featured: first video large, rest in grid</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Columns</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4].map((n) => (
                  <Button
                    key={n}
                    variant={(content.columns || 3) === n ? 'default' : 'outline'}
                    onClick={() => setContent({ ...content, columns: n })}
                    className="flex-1 text-xs"
                  >
                    {n}
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Accent Color</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={content.accentColor || '#FF0000'}
                  onChange={(e) => setContent({ ...content, accentColor: e.target.value })}
                  className="w-12 h-10 rounded cursor-pointer"
                />
                <Input
                  type="text"
                  value={content.accentColor || '#FF0000'}
                  onChange={(e) => setContent({ ...content, accentColor: e.target.value })}
                  className="flex-1"
                />
              </div>
            </div>

            {/* Videos Management */}
            <div className="border-t pt-4">
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-sm font-semibold text-gray-900">Videos</h4>
                <Button
                  size="sm"
                  onClick={() => {
                    const videos = content.videos || [];
                    videos.push({
                      id: Date.now().toString(),
                      url: '',
                      title: 'New Video',
                      description: '',
                    });
                    setContent({ ...content, videos });
                  }}
                  className="text-xs"
                >
                  + Add Video
                </Button>
              </div>
              
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {(content.videos || []).map((video: any, idx: number) => {
                  const videoId = video.url ? (() => {
                    const patterns = [
                      /(?:youtube\.com\/watch\?v=|youtube\.com\/embed\/|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
                      /^([a-zA-Z0-9_-]{11})$/,
                    ];
                    for (const p of patterns) { const m = video.url.match(p); if (m) return m[1]; }
                    return null;
                  })() : null;

                  return (
                    <div key={video.id} className="p-3 bg-gray-50 rounded border border-gray-200">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-medium text-gray-600">Video {idx + 1}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            const videos = content.videos.filter(
                              (v: any) => v.id !== video.id
                            );
                            setContent({ ...content, videos });
                          }}
                          className="text-xs text-red-600 h-6 px-2"
                        >
                          Remove
                        </Button>
                      </div>

                      {/* Thumbnail preview */}
                      {videoId && (
                        <div className="relative mb-2 rounded overflow-hidden" style={{ aspectRatio: '16/9' }}>
                          <img
                            src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`}
                            alt={video.title}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center shadow">
                              <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                            </div>
                          </div>
                        </div>
                      )}

                      <Input
                        type="text"
                        value={video.url}
                        onChange={(e) => {
                          const videos = content.videos.map((v: any) =>
                            v.id === video.id ? { ...v, url: e.target.value } : v
                          );
                          setContent({ ...content, videos });
                        }}
                        placeholder="YouTube URL (e.g. https://youtube.com/watch?v=...)"
                        className="mb-2 text-xs"
                      />
                      <Input
                        type="text"
                        value={video.title}
                        onChange={(e) => {
                          const videos = content.videos.map((v: any) =>
                            v.id === video.id ? { ...v, title: e.target.value } : v
                          );
                          setContent({ ...content, videos });
                        }}
                        placeholder="Video title"
                        className="mb-2 text-xs"
                      />
                      <Textarea
                        value={video.description || ''}
                        onChange={(e) => {
                          const videos = content.videos.map((v: any) =>
                            v.id === video.id ? { ...v, description: e.target.value } : v
                          );
                          setContent({ ...content, videos });
                        }}
                        placeholder="Short description (optional)"
                        className="text-xs"
                        rows={2}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {section.type === 'newsletter' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Placeholder</label>
              <Input
                type="text"
                value={content.placeholder || ''}
                onChange={(e) => setContent({ ...content, placeholder: e.target.value })}
                placeholder="Enter your email"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Button Text</label>
              <Input
                type="text"
                value={content.buttonText || ''}
                onChange={(e) => setContent({ ...content, buttonText: e.target.value })}
                placeholder="Subscribe"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={content.showNewsUpdates !== false}
                onChange={(e) => setContent({ ...content, showNewsUpdates: e.target.checked })}
                className="rounded"
              />
              <label className="text-sm text-gray-700">Show news updates section</label>
            </div>

            {/* News Updates Management */}
            <div className="border-t pt-4">
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-sm font-semibold text-gray-900">News Updates</h4>
                <Button
                  size="sm"
                  onClick={() => {
                    const newsUpdates = content.newsUpdates || [];
                    newsUpdates.push({
                      id: Date.now().toString(),
                      title: 'New Update',
                      content: 'Write your update content here...',
                      date: new Date().toLocaleDateString(),
                      image: '',
                    });
                    setContent({ ...content, newsUpdates });
                  }}
                  className="text-xs"
                >
                  + Add Update
                </Button>
              </div>
              
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {(content.newsUpdates || []).map((update: any, idx: number) => (
                  <div key={update.id} className="p-3 bg-gray-50 rounded border border-gray-200">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-medium text-gray-600">Update {idx + 1}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          const newsUpdates = content.newsUpdates.filter(
                            (u: any) => u.id !== update.id
                          );
                          setContent({ ...content, newsUpdates });
                        }}
                        className="text-xs text-red-600 h-6 px-2"
                      >
                        Remove
                      </Button>
                    </div>
                    <Input
                      type="text"
                      value={update.title}
                      onChange={(e) => {
                        const newsUpdates = content.newsUpdates.map((u: any) =>
                          u.id === update.id ? { ...u, title: e.target.value } : u
                        );
                        setContent({ ...content, newsUpdates });
                      }}
                      placeholder="Update title"
                      className="mb-2 text-xs"
                    />
                    <Textarea
                      value={update.content}
                      onChange={(e) => {
                        const newsUpdates = content.newsUpdates.map((u: any) =>
                          u.id === update.id ? { ...u, content: e.target.value } : u
                        );
                        setContent({ ...content, newsUpdates });
                      }}
                      placeholder="Update content"
                      className="text-xs mb-2"
                      rows={3}
                    />
                    <Input
                      type="text"
                      value={update.date}
                      onChange={(e) => {
                        const newsUpdates = content.newsUpdates.map((u: any) =>
                          u.id === update.id ? { ...u, date: e.target.value } : u
                        );
                        setContent({ ...content, newsUpdates });
                      }}
                      placeholder="Date"
                      className="mb-2 text-xs"
                    />
                    {/* News update image */}
                    {update.image ? (
                      <div className="flex items-center gap-2 mb-1">
                        <img src={update.image} alt="" className="w-16 h-10 rounded object-cover border" />
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            const newsUpdates = content.newsUpdates.map((u: any) =>
                              u.id === update.id ? { ...u, image: '' } : u
                            );
                            setContent({ ...content, newsUpdates });
                          }}
                          className="text-xs text-red-600 h-6 px-2"
                        >
                          Remove Image
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs w-full"
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'file';
                          input.accept = 'image/*';
                          input.onchange = async (e) => {
                            const file = (e.target as HTMLInputElement).files?.[0];
                            if (!file) return;
                            if (file.size > 5 * 1024 * 1024) { alert('Max 5MB'); return; }
                            try {
                              const formData = new FormData();
                              formData.append('file', file);
                              const apiUrl = (import.meta.env.VITE_API_URL as string) || '/api';
                              const authToken = localStorage.getItem('authToken');
                              if (!authToken) return;
                              const resp = await fetch(
                                `${apiUrl}/page-builder/websites/${section.websiteId}/media/upload`,
                                { method: 'POST', headers: { 'Authorization': `Bearer ${authToken}` }, body: formData }
                              );
                              if (!resp.ok) throw new Error('Upload failed');
                              const data = await resp.json();
                              const imageUrl = data.data?.url || data.data?.media?.url;
                              if (imageUrl) {
                                const newsUpdates = content.newsUpdates.map((u: any) =>
                                  u.id === update.id ? { ...u, image: imageUrl } : u
                                );
                                setContent({ ...content, newsUpdates });
                              }
                            } catch (err) { console.error('Upload error:', err); alert('Upload failed'); }
                          };
                          input.click();
                        }}
                      >
                        Upload Image
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {section.type === 'testimonials' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="text-sm font-semibold text-gray-900">Testimonials</h4>
              <Button
                size="sm"
                onClick={() => {
                  const testimonials = content.testimonials || [];
                  testimonials.push({
                    id: Date.now().toString(),
                    name: 'Client Name',
                    title: 'Client Title',
                    text: 'Your testimonial text here...',
                    image: '',
                  });
                  setContent({ ...content, testimonials });
                }}
                className="text-xs"
              >
                + Add Testimonial
              </Button>
            </div>
            
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {(content.testimonials || []).map((testimonial: any, idx: number) => (
                <div key={testimonial.id} className="p-3 bg-gray-50 rounded border border-gray-200">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-medium text-gray-600">Testimonial {idx + 1}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        const testimonials = content.testimonials.filter(
                          (t: any) => t.id !== testimonial.id
                        );
                        setContent({ ...content, testimonials });
                      }}
                      className="text-xs text-red-600 h-6 px-2"
                    >
                      Remove
                    </Button>
                  </div>
                  <Input
                    type="text"
                    value={testimonial.name}
                    onChange={(e) => {
                      const testimonials = content.testimonials.map((t: any) =>
                        t.id === testimonial.id
                          ? { ...t, name: e.target.value }
                          : t
                      );
                      setContent({ ...content, testimonials });
                    }}
                    placeholder="Client name"
                    className="mb-2 text-xs"
                  />
                  <Input
                    type="text"
                    value={testimonial.title}
                    onChange={(e) => {
                      const testimonials = content.testimonials.map((t: any) =>
                        t.id === testimonial.id
                          ? { ...t, title: e.target.value }
                          : t
                      );
                      setContent({ ...content, testimonials });
                    }}
                    placeholder="Title/Company"
                    className="mb-2 text-xs"
                  />
                  <div className="mb-2">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Client Photo</label>
                    {testimonial.image ? (
                      <div className="flex items-center gap-2 mb-1">
                        <img
                          src={testimonial.image}
                          alt={testimonial.name}
                          className="w-10 h-10 rounded-full object-cover border border-gray-300"
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            const testimonials = content.testimonials.map((t: any) =>
                              t.id === testimonial.id ? { ...t, image: '' } : t
                            );
                            setContent({ ...content, testimonials });
                          }}
                          className="text-xs text-red-600 h-6 px-2"
                        >
                          Remove
                        </Button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs flex-1"
                          onClick={() => {
                            const input = document.createElement('input');
                            input.type = 'file';
                            input.accept = 'image/*';
                            input.onchange = async (e) => {
                              const file = (e.target as HTMLInputElement).files?.[0];
                              if (!file) return;
                              if (file.size > 5 * 1024 * 1024) {
                                alert('File size must be less than 5MB');
                                return;
                              }
                              try {
                                const formData = new FormData();
                                formData.append('file', file);
                                const apiUrl = (import.meta.env.VITE_API_URL as string) || '/api';
                                const authToken = localStorage.getItem('authToken');
                                if (!authToken) return;
                                const uploadResponse = await fetch(
                                  `${apiUrl}/page-builder/websites/${section.websiteId}/media/upload`,
                                  {
                                    method: 'POST',
                                    headers: { 'Authorization': `Bearer ${authToken}` },
                                    body: formData,
                                  }
                                );
                                if (!uploadResponse.ok) throw new Error('Upload failed');
                                const uploadData = await uploadResponse.json();
                                const imageUrl = uploadData.data?.url || uploadData.data?.media?.url;
                                if (imageUrl) {
                                  const testimonials = content.testimonials.map((t: any) =>
                                    t.id === testimonial.id ? { ...t, image: imageUrl } : t
                                  );
                                  setContent({ ...content, testimonials });
                                }
                              } catch (err) {
                                console.error('Photo upload error:', err);
                                alert('Failed to upload photo. Please try again.');
                              }
                            };
                            input.click();
                          }}
                        >
                          Upload Photo
                        </Button>
                      </div>
                    )}
                  </div>
                  <Textarea
                    value={testimonial.text}
                    onChange={(e) => {
                      const testimonials = content.testimonials.map((t: any) =>
                        t.id === testimonial.id
                          ? { ...t, text: e.target.value }
                          : t
                      );
                      setContent({ ...content, testimonials });
                    }}
                    placeholder="Testimonial text"
                    className="text-xs"
                    rows={2}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {section.type === 'faq' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="text-sm font-semibold text-gray-900">FAQ Items</h4>
              <Button
                size="sm"
                onClick={() => {
                  const faqs = content.faqs || [];
                  faqs.push({
                    id: Date.now().toString(),
                    question: 'Your question here?',
                    answer: 'Your answer here...',
                  });
                  setContent({ ...content, faqs });
                }}
                className="text-xs"
              >
                + Add FAQ
              </Button>
            </div>
            
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {(content.faqs || []).map((faq: any, idx: number) => (
                <div key={faq.id} className="p-3 bg-gray-50 rounded border border-gray-200">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-medium text-gray-600">FAQ {idx + 1}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        const faqs = content.faqs.filter(
                          (f: any) => f.id !== faq.id
                        );
                        setContent({ ...content, faqs });
                      }}
                      className="text-xs text-red-600 h-6 px-2"
                    >
                      Remove
                    </Button>
                  </div>
                  <Input
                    type="text"
                    value={faq.question}
                    onChange={(e) => {
                      const faqs = content.faqs.map((f: any) =>
                        f.id === faq.id
                          ? { ...f, question: e.target.value }
                          : f
                      );
                      setContent({ ...content, faqs });
                    }}
                    placeholder="Question"
                    className="mb-2 text-xs"
                  />
                  <Textarea
                    value={faq.answer}
                    onChange={(e) => {
                      const faqs = content.faqs.map((f: any) =>
                        f.id === faq.id
                          ? { ...f, answer: e.target.value }
                          : f
                      );
                      setContent({ ...content, faqs });
                    }}
                    placeholder="Answer"
                    className="text-xs"
                    rows={2}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {section.type === 'team' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Section Title</label>
              <Input
                type="text"
                value={content.title || ''}
                onChange={(e) => setContent({ ...content, title: e.target.value })}
                placeholder="Our Team"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Section Description</label>
              <Textarea
                value={content.description || ''}
                onChange={(e) => setContent({ ...content, description: e.target.value })}
                placeholder="Meet the people behind our success"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Layout</label>
              <div className="flex gap-2">
                <Button
                  variant={content.layout === 'grid' ? 'default' : 'outline'}
                  onClick={() => setContent({ ...content, layout: 'grid' })}
                  className="flex-1 text-xs"
                >
                  Grid
                </Button>
                <Button
                  variant={content.layout === 'list' ? 'default' : 'outline'}
                  onClick={() => setContent({ ...content, layout: 'list' })}
                  className="flex-1 text-xs"
                >
                  List
                </Button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Accent Color</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={content.accentColor || '#3B82F6'}
                  onChange={(e) => setContent({ ...content, accentColor: e.target.value })}
                  className="w-12 h-10 rounded cursor-pointer"
                />
                <Input
                  type="text"
                  value={content.accentColor || '#3B82F6'}
                  onChange={(e) => setContent({ ...content, accentColor: e.target.value })}
                  className="flex-1"
                />
              </div>
            </div>

            {/* Team Members Management */}
            <div className="border-t pt-4">
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-sm font-semibold text-gray-900">Team Members</h4>
                <Button
                  size="sm"
                  onClick={() => {
                    const members = content.members || [];
                    members.push({
                      id: Date.now().toString(),
                      name: 'Team Member',
                      role: 'Role / Title',
                      bio: '',
                      image: '',
                      email: '',
                      phone: '',
                      linkedin: '',
                      twitter: '',
                    });
                    setContent({ ...content, members });
                  }}
                  className="text-xs"
                >
                  + Add Member
                </Button>
              </div>
              
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {(content.members || []).map((member: any, idx: number) => (
                  <div key={member.id} className="p-3 bg-gray-50 rounded border border-gray-200">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-medium text-gray-600">Member {idx + 1}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          const members = content.members.filter(
                            (m: any) => m.id !== member.id
                          );
                          setContent({ ...content, members });
                        }}
                        className="text-xs text-red-600 h-6 px-2"
                      >
                        Remove
                      </Button>
                    </div>

                    {/* Photo Upload */}
                    <div className="mb-2">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Photo</label>
                      {member.image ? (
                        <div className="relative inline-block">
                          <img
                            src={member.image}
                            alt={member.name}
                            className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                          />
                          <button
                            onClick={() => {
                              const members = content.members.map((m: any) =>
                                m.id === member.id ? { ...m, image: '' } : m
                              );
                              setContent({ ...content, members });
                            }}
                            className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center w-full h-20 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-colors">
                          <div className="flex items-center gap-1.5">
                            <Upload className="w-4 h-4 text-gray-400" />
                            <span className="text-xs text-gray-500">Upload photo</span>
                          </div>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = (event) => {
                                  const members = content.members.map((m: any) =>
                                    m.id === member.id
                                      ? { ...m, image: event.target?.result as string }
                                      : m
                                  );
                                  setContent({ ...content, members });
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>
                      )}
                      {!member.image && (
                        <Input
                          type="text"
                          value=""
                          onChange={(e) => {
                            const members = content.members.map((m: any) =>
                              m.id === member.id
                                ? { ...m, image: e.target.value }
                                : m
                            );
                            setContent({ ...content, members });
                          }}
                          placeholder="Or paste image URL"
                          className="mt-1 text-xs"
                        />
                      )}
                    </div>

                    <Input
                      type="text"
                      value={member.name}
                      onChange={(e) => {
                        const members = content.members.map((m: any) =>
                          m.id === member.id ? { ...m, name: e.target.value } : m
                        );
                        setContent({ ...content, members });
                      }}
                      placeholder="Full name"
                      className="mb-2 text-xs"
                    />
                    <Input
                      type="text"
                      value={member.role}
                      onChange={(e) => {
                        const members = content.members.map((m: any) =>
                          m.id === member.id ? { ...m, role: e.target.value } : m
                        );
                        setContent({ ...content, members });
                      }}
                      placeholder="Role / Title (e.g., Senior Dentist)"
                      className="mb-2 text-xs"
                    />
                    <Textarea
                      value={member.bio}
                      onChange={(e) => {
                        const members = content.members.map((m: any) =>
                          m.id === member.id ? { ...m, bio: e.target.value } : m
                        );
                        setContent({ ...content, members });
                      }}
                      placeholder="Bio / description"
                      className="text-xs mb-2"
                      rows={2}
                    />

                    {/* Contact & Social */}
                    <details className="text-xs">
                      <summary className="cursor-pointer text-gray-500 hover:text-gray-700 font-medium mb-2">Contact & Social Links</summary>
                      <div className="space-y-2 pl-1">
                        <Input
                          type="email"
                          value={member.email || ''}
                          onChange={(e) => {
                            const members = content.members.map((m: any) =>
                              m.id === member.id ? { ...m, email: e.target.value } : m
                            );
                            setContent({ ...content, members });
                          }}
                          placeholder="Email address"
                          className="text-xs"
                        />
                        <Input
                          type="tel"
                          value={member.phone || ''}
                          onChange={(e) => {
                            const members = content.members.map((m: any) =>
                              m.id === member.id ? { ...m, phone: e.target.value } : m
                            );
                            setContent({ ...content, members });
                          }}
                          placeholder="Phone number"
                          className="text-xs"
                        />
                        <Input
                          type="url"
                          value={member.linkedin || ''}
                          onChange={(e) => {
                            const members = content.members.map((m: any) =>
                              m.id === member.id ? { ...m, linkedin: e.target.value } : m
                            );
                            setContent({ ...content, members });
                          }}
                          placeholder="LinkedIn profile URL"
                          className="text-xs"
                        />
                        <Input
                          type="url"
                          value={member.twitter || ''}
                          onChange={(e) => {
                            const members = content.members.map((m: any) =>
                              m.id === member.id ? { ...m, twitter: e.target.value } : m
                            );
                            setContent({ ...content, members });
                          }}
                          placeholder="Twitter / X profile URL"
                          className="text-xs"
                        />
                      </div>
                    </details>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {section.type === 'courses' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Section Title</label>
              <Input
                type="text"
                value={content.title || ''}
                onChange={(e) => setContent({ ...content, title: e.target.value })}
                placeholder="Our Courses"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Section Description</label>
              <Textarea
                value={content.description || ''}
                onChange={(e) => setContent({ ...content, description: e.target.value })}
                placeholder="Brief description of your courses"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Layout</label>
              <div className="flex gap-2">
                <Button
                  variant={content.layout === 'grid' ? 'default' : 'outline'}
                  onClick={() => setContent({ ...content, layout: 'grid' })}
                  className="flex-1 text-xs"
                >
                  Grid
                </Button>
                <Button
                  variant={content.layout === 'list' ? 'default' : 'outline'}
                  onClick={() => setContent({ ...content, layout: 'list' })}
                  className="flex-1 text-xs"
                >
                  List
                </Button>
                <Button
                  variant={content.layout === 'carousel' ? 'default' : 'outline'}
                  onClick={() => setContent({ ...content, layout: 'carousel' })}
                  className="flex-1 text-xs"
                >
                  Carousel
                </Button>
              </div>
            </div>
            
            {/* Courses Management */}
            <div className="border-t pt-4">
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-sm font-semibold text-gray-900">Courses</h4>
                <Button
                  size="sm"
                  onClick={() => {
                    const courses = content.courses || [];
                    courses.push({
                      id: Date.now().toString(),
                      title: 'New Course',
                      description: 'Course description',
                      price: '$99',
                      duration: '4 weeks',
                      level: 'Beginner',
                      thumbnail: '',
                    });
                    setContent({ ...content, courses });
                  }}
                  className="text-xs"
                >
                  + Add Course
                </Button>
              </div>
              
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {(content.courses || []).map((course: any, idx: number) => (
                  <div key={course.id} className="p-3 bg-gray-50 rounded border border-gray-200">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-medium text-gray-600">Course {idx + 1}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          const courses = content.courses.filter(
                            (c: any) => c.id !== course.id
                          );
                          setContent({ ...content, courses });
                        }}
                        className="text-xs text-red-600 h-6 px-2"
                      >
                        Remove
                      </Button>
                    </div>
                    <Input
                      type="text"
                      value={course.title}
                      onChange={(e) => {
                        const courses = content.courses.map((c: any) =>
                          c.id === course.id
                            ? { ...c, title: e.target.value }
                            : c
                        );
                        setContent({ ...content, courses });
                      }}
                      placeholder="Course title"
                      className="mb-2 text-xs"
                    />
                    <Textarea
                      value={course.description}
                      onChange={(e) => {
                        const courses = content.courses.map((c: any) =>
                          c.id === course.id
                            ? { ...c, description: e.target.value }
                            : c
                        );
                        setContent({ ...content, courses });
                      }}
                      placeholder="Course description"
                      className="text-xs mb-2"
                      rows={2}
                    />
                    <Input
                      type="text"
                      value={course.price}
                      onChange={(e) => {
                        const courses = content.courses.map((c: any) =>
                          c.id === course.id
                            ? { ...c, price: e.target.value }
                            : c
                        );
                        setContent({ ...content, courses });
                      }}
                      placeholder="Price (e.g., $99)"
                      className="mb-2 text-xs"
                    />
                    <Input
                      type="text"
                      value={course.duration}
                      onChange={(e) => {
                        const courses = content.courses.map((c: any) =>
                          c.id === course.id
                            ? { ...c, duration: e.target.value }
                            : c
                        );
                        setContent({ ...content, courses });
                      }}
                      placeholder="Duration (e.g., 4 weeks)"
                      className="mb-2 text-xs"
                    />
                    <Input
                      type="text"
                      value={course.level}
                      onChange={(e) => {
                        const courses = content.courses.map((c: any) =>
                          c.id === course.id
                            ? { ...c, level: e.target.value }
                            : c
                        );
                        setContent({ ...content, courses });
                      }}
                      placeholder="Level (e.g., Beginner)"
                      className="text-xs"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {section.type === 'blog' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Layout</label>
              <div className="flex gap-2">
                <Button
                  variant={content.layout === 'grid' ? 'default' : 'outline'}
                  onClick={() => setContent({ ...content, layout: 'grid' })}
                  className="flex-1 text-xs"
                >
                  Grid
                </Button>
                <Button
                  variant={content.layout === 'list' ? 'default' : 'outline'}
                  onClick={() => setContent({ ...content, layout: 'list' })}
                  className="flex-1 text-xs"
                >
                  List
                </Button>
              </div>
            </div>

            {/* Blog Posts Management */}
            <div className="border-t pt-4">
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-sm font-semibold text-gray-900">Blog Posts</h4>
                <Button
                  size="sm"
                  onClick={() => {
                    const posts = content.posts || [];
                    posts.push({
                      id: Date.now().toString(),
                      title: 'New Blog Post',
                      excerpt: 'A brief summary of this post...',
                      content: 'Full blog post content goes here...',
                      image: '',
                      author: '',
                      date: new Date().toLocaleDateString(),
                      category: '',
                    });
                    setContent({ ...content, posts });
                  }}
                  className="text-xs"
                >
                  + Add Post
                </Button>
              </div>
              
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {(content.posts || []).map((post: any, idx: number) => (
                  <div key={post.id} className="p-3 bg-gray-50 rounded border border-gray-200">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-medium text-gray-600">Post {idx + 1}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          const posts = content.posts.filter((p: any) => p.id !== post.id);
                          setContent({ ...content, posts });
                        }}
                        className="text-xs text-red-600 h-6 px-2"
                      >
                        Remove
                      </Button>
                    </div>
                    <Input
                      type="text"
                      value={post.title}
                      onChange={(e) => {
                        const posts = content.posts.map((p: any) =>
                          p.id === post.id ? { ...p, title: e.target.value } : p
                        );
                        setContent({ ...content, posts });
                      }}
                      placeholder="Post title"
                      className="mb-2 text-xs"
                    />
                    <Input
                      type="text"
                      value={post.category}
                      onChange={(e) => {
                        const posts = content.posts.map((p: any) =>
                          p.id === post.id ? { ...p, category: e.target.value } : p
                        );
                        setContent({ ...content, posts });
                      }}
                      placeholder="Category (e.g., Technology)"
                      className="mb-2 text-xs"
                    />
                    <Textarea
                      value={post.excerpt}
                      onChange={(e) => {
                        const posts = content.posts.map((p: any) =>
                          p.id === post.id ? { ...p, excerpt: e.target.value } : p
                        );
                        setContent({ ...content, posts });
                      }}
                      placeholder="Brief excerpt/summary"
                      className="text-xs mb-2"
                      rows={2}
                    />
                    <Textarea
                      value={post.content}
                      onChange={(e) => {
                        const posts = content.posts.map((p: any) =>
                          p.id === post.id ? { ...p, content: e.target.value } : p
                        );
                        setContent({ ...content, posts });
                      }}
                      placeholder="Full blog post content"
                      className="text-xs mb-2"
                      rows={4}
                    />
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <Input
                        type="text"
                        value={post.author}
                        onChange={(e) => {
                          const posts = content.posts.map((p: any) =>
                            p.id === post.id ? { ...p, author: e.target.value } : p
                          );
                          setContent({ ...content, posts });
                        }}
                        placeholder="Author name"
                        className="text-xs"
                      />
                      <Input
                        type="text"
                        value={post.date}
                        onChange={(e) => {
                          const posts = content.posts.map((p: any) =>
                            p.id === post.id ? { ...p, date: e.target.value } : p
                          );
                          setContent({ ...content, posts });
                        }}
                        placeholder="Date"
                        className="text-xs"
                      />
                    </div>
                    {/* Blog post image */}
                    {post.image ? (
                      <div className="flex items-center gap-2">
                        <img src={post.image} alt="" className="w-16 h-10 rounded object-cover border" />
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            const posts = content.posts.map((p: any) =>
                              p.id === post.id ? { ...p, image: '' } : p
                            );
                            setContent({ ...content, posts });
                          }}
                          className="text-xs text-red-600 h-6 px-2"
                        >
                          Remove
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs w-full"
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'file';
                          input.accept = 'image/*';
                          input.onchange = async (e) => {
                            const file = (e.target as HTMLInputElement).files?.[0];
                            if (!file) return;
                            if (file.size > 5 * 1024 * 1024) { alert('Max 5MB'); return; }
                            try {
                              const formData = new FormData();
                              formData.append('file', file);
                              const apiUrl = (import.meta.env.VITE_API_URL as string) || '/api';
                              const authToken = localStorage.getItem('authToken');
                              if (!authToken) return;
                              const resp = await fetch(
                                `${apiUrl}/page-builder/websites/${section.websiteId}/media/upload`,
                                { method: 'POST', headers: { 'Authorization': `Bearer ${authToken}` }, body: formData }
                              );
                              if (!resp.ok) throw new Error('Upload failed');
                              const data = await resp.json();
                              const imageUrl = data.data?.url || data.data?.media?.url;
                              if (imageUrl) {
                                const posts = content.posts.map((p: any) =>
                                  p.id === post.id ? { ...p, image: imageUrl } : p
                                );
                                setContent({ ...content, posts });
                              }
                            } catch (err) { console.error('Upload error:', err); alert('Upload failed'); }
                          };
                          input.click();
                        }}
                      >
                        Upload Image
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="border-t pt-4">
        <h4 className="text-sm font-semibold text-gray-900 mb-3">Background Color</h4>
        <div className="flex gap-2 items-center">
          <input
            type="color"
            value={content.backgroundColor || '#ffffff'}
            onChange={(e) => setContent({ ...content, backgroundColor: e.target.value })}
            className="w-12 h-10 rounded cursor-pointer border border-gray-300"
          />
          <Input
            type="text"
            value={content.backgroundColor || '#ffffff'}
            onChange={(e) => setContent({ ...content, backgroundColor: e.target.value })}
            placeholder="#ffffff"
            className="flex-1"
          />
          {content.backgroundColor && content.backgroundColor !== '#ffffff' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setContent({ ...content, backgroundColor: '' })}
              className="text-xs text-gray-500"
            >
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* Save Button */}
      <Button
        onClick={handleSave}
        className="w-full bg-blue-600 hover:bg-blue-700"
      >
        <Save className="w-4 h-4 mr-2" />
        Save Changes
      </Button>
    </div>
  );
};

const PublishDialog: React.FC<{
  isLoading: boolean;
  onPublish: () => void;
  onCancel: () => void;
  website?: Website;
}> = ({ isLoading, onPublish, onCancel, website }) => {
  const getPublicURL = () => {
    if (!website?.subdomain) return 'https://yoursite.specialistly.com';
    return `https://${website.subdomain}.specialistly.com`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-96 p-6">
        <h2 className="text-xl font-bold mb-4">Publish Website</h2>
        <div className="space-y-4 mb-6">
          <p className="text-gray-600">
            This will publish all your pages and make them visible to the public.
          </p>
          
          {/* Show public URL */}
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <p className="text-sm text-gray-600 mb-1">Your website will be available at:</p>
            <p className="text-lg font-mono font-semibold text-blue-700 break-all">
              {getPublicURL()}
            </p>
          </div>

          {!website?.subdomain && (
            <p className="text-sm text-yellow-700 bg-yellow-50 p-2 rounded">
              ⚠️ Set a subdomain in Branding settings to customize your URL
            </p>
          )}
        </div>
        
        <div className="flex gap-4">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={onPublish}
            disabled={isLoading}
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            {isLoading ? (
              <>
                <Loader className="w-4 h-4 mr-2 animate-spin" />
                Publishing...
              </>
            ) : (
              'Publish'
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default PageBuilderEditor;
