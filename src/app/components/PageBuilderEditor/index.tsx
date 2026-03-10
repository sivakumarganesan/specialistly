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
      const newSection = await pageBuilderAPI.createSection(
        websiteId,
        selectedPage._id,
        {
          type: sectionType,
          title: sectionData.title || '',
          description: sectionData.description || '',
          content: sectionData.content || {},
          styling: sectionData.styling || {},
        }
      );

      // Update local state
      const updatedPage = {
        ...selectedPage,
        sections: [...(selectedPage.sections || []), newSection.data],
      };
      selectPage(updatedPage);
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
      setError(err instanceof Error ? err.message : 'Failed to load website');
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
      <header className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 shadow-lg">
        <div className="px-8 py-6 flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">📄</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">
                  {website?.displayName || 'Page Builder'}
                </h1>
                <p className="text-blue-100 text-sm mt-1">Professional Website Designer</p>
              </div>
            </div>
            <div className="flex items-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <span className="text-blue-100 text-sm">Domain:</span>
                <span className="text-white text-sm font-mono font-semibold bg-white bg-opacity-10 px-3 py-1 rounded">{website?.domainName}</span>
              </div>
              {website?.subdomain && (
                <div className="flex items-center gap-2 pl-6 border-l border-white border-opacity-20">
                  <span className="text-blue-100 text-sm">Subdomain:</span>
                  <span className="text-white font-mono font-semibold bg-white bg-opacity-10 px-3 py-1 rounded">{website.subdomain}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-6">
            {/* Status Indicator */}
            {selectedPage && (
              <div className="text-right">
                {website?.subdomain && website.isPublished ? (
                  <div className="flex items-center gap-2 px-4 py-2 bg-green-500 bg-opacity-10 rounded-lg border border-green-400 border-opacity-30">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <p className="text-green-100 text-xs font-semibold">LIVE</p>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-4 py-2 bg-yellow-500 bg-opacity-10 rounded-lg border border-yellow-400 border-opacity-30">
                    <div className="w-2 h-2 bg-yellow-400"></div>
                    <p className="text-yellow-100 text-xs font-semibold">DRAFT</p>
                  </div>
                )}
              </div>
            )}

            {/* Mode Selection */}
            <div className="flex gap-2 bg-white bg-opacity-10 rounded-lg p-1">
              <Button
                variant={mode === 'edit' ? 'default' : 'ghost'}
                onClick={() => setMode('edit')}
                className={mode === 'edit' ? 'bg-white text-blue-600 hover:bg-white' : 'text-white hover:bg-white hover:bg-opacity-10'}
                size="sm"
              >
                ✏️ Edit
              </Button>
              <Button
                variant={mode === 'preview' ? 'default' : 'ghost'}
                onClick={() => setMode('preview')}
                className={mode === 'preview' ? 'bg-white text-blue-600 hover:bg-white' : 'text-white hover:bg-white hover:bg-opacity-10'}
                size="sm"
              >
                👁️ Preview
              </Button>
              <Button
                variant={mode === 'branding' ? 'default' : 'ghost'}
                onClick={() => setMode('branding')}
                className={mode === 'branding' ? 'bg-white text-blue-600 hover:bg-white' : 'text-white hover:bg-white hover:bg-opacity-10'}
                size="sm"
              >
                🎨 Branding
              </Button>
            </div>

            {/* Actions */}
            <div className="flex gap-2 border-l border-white border-opacity-20 pl-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={undo}
                title="Undo"
                className="text-white hover:bg-white hover:bg-opacity-10"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={redo}
                title="Redo"
                className="text-white hover:bg-white hover:bg-opacity-10"
              >
                <RotateCw className="w-4 h-4" />
              </Button>

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
              {pages.map((page) => (
                <div
                  key={page._id}
                  className={`px-4 py-4 rounded-lg border-2 transition-all group cursor-pointer ${
                    selectedPage?._id === page._id
                      ? 'border-blue-500 bg-blue-50 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <button
                    onClick={() => selectPage(page)}
                    className="w-full text-left mb-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-semibold text-slate-900">{page.title}</div>
                        <div className="text-xs text-slate-500 font-mono mt-1">{page.slug}</div>
                      </div>
                      {page.isHomePage && (
                        <span className="text-xs font-bold text-white bg-green-600 px-2 py-1 rounded">HOME</span>
                      )}
                    </div>
                    {page.isPublished && (
                      <div className="text-xs font-semibold text-green-600 mt-2 flex items-center gap-1">
                        ✓ Published
                      </div>
                    )}
                  </button>
                  
                  {/* Page Actions */}
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
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
            <BrandingPanel website={website} />
          )}
        </main>

        {/* Right Sidebar - Properties */}
        <aside className="w-80 border-l border-slate-200 bg-white overflow-y-auto shadow-sm">
          {selectedSection ? (
            <div className="border-b border-slate-200 bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4">
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

const BrandingPanel: React.FC<{ website: Website | null }> = ({ website }) => {
  const [logo, setLogo] = useState<string | null>(website?.branding?.logo || null);
  const [primaryColor, setPrimaryColor] = useState(website?.branding?.colors?.primary || '#3B82F6');
  const [secondaryColor, setSecondaryColor] = useState(website?.branding?.colors?.secondary || '#ec4899');
  const [siteName, setSiteName] = useState(website?.branding?.siteName || '');
  const [tagline, setTagline] = useState(website?.branding?.tagline || '');
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

      if (!uploadResponse.ok) {
        const error = await uploadResponse.json();
        throw new Error(error.message || 'Upload failed');
      }

      const uploadData = await uploadResponse.json();
      const logoUrl = uploadData.data?.url || uploadData.data?.media?.url;

      if (!logoUrl) {
        throw new Error('No URL returned from upload');
      }

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
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white text-xl">
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
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="w-20 h-20 rounded-lg cursor-pointer border border-slate-300"
                      />
                      <code className="text-sm text-slate-600 font-mono bg-slate-100 px-3 py-2 rounded">{primaryColor}</code>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mt-3">Used for buttons, links, and accents</p>
                </div>

                {/* Secondary Color */}
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-3">Secondary Color</label>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={secondaryColor}
                        onChange={(e) => setSecondaryColor(e.target.value)}
                        className="w-20 h-20 rounded-lg cursor-pointer border border-slate-300"
                      />
                      <code className="text-sm text-slate-600 font-mono bg-slate-100 px-3 py-2 rounded">{secondaryColor}</code>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mt-3">Used for highlights and secondary elements</p>
                </div>
              </div>
            </div>

            {/* Save Button */}
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
              <p className="text-xs text-slate-500 flex items-center">All changes saved automatically</p>
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
  const [uploadError, setUploadError] = useState('');
  const aboutImageInputRef = React.useRef<HTMLInputElement>(null);

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

      if (!uploadResponse.ok) {
        const error = await uploadResponse.json();
        throw new Error(error.message || 'Upload failed');
      }

      const uploadData = await uploadResponse.json();
      const imageUrl = uploadData.data?.url || uploadData.data?.media?.url;

      if (!imageUrl) {
        throw new Error('No URL returned from upload');
      }

      setAboutImageUrl(imageUrl);
      setContent({ ...content, image: imageUrl });
    } catch (error) {
      console.error('About image upload error:', error);
      setUploadError(error instanceof Error ? error.message : 'Failed to upload image');
    } finally {
      setIsUploadingAboutImage(false);
    }
  };

  const handleSave = () => {
    if (onUpdateSection) {
      // For about sections, sync content fields with section-level fields
      let updateData: Partial<PageSection> = {
        content,
      };

      if (section?.type === 'about') {
        // Use about-specific content fields for the section title/description
        updateData.title = content.title || '';
        updateData.description = content.description || '';
      } else {
        // For other sections, use the general title/description fields
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
      {section.type !== 'about' && (
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
      {section.type !== 'about' && (
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
        
        {section.type === 'hero' && (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Headline</label>
              <Input
                type="text"
                value={content.title || ''}
                onChange={(e) => setContent({ ...content, title: e.target.value })}
                placeholder="Hero headline"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subheadline</label>
              <Input
                type="text"
                value={content.subtitle || ''}
                onChange={(e) => setContent({ ...content, subtitle: e.target.value })}
                placeholder="Hero subtitle"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">CTA Button Text</label>
              <Input
                type="text"
                value={content.ctaText || ''}
                onChange={(e) => setContent({ ...content, ctaText: e.target.value })}
                placeholder="Call to action text"
              />
            </div>
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

        {section.type === 'newsletter' && (
          <div className="space-y-3">
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
