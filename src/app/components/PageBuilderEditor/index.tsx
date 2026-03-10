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
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">
              {website?.displayName || 'Page Builder'}
            </h1>
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-2">
                <p className="text-sm text-gray-600">Domain:</p>
                <p className="text-sm font-mono text-gray-700">{website?.domainName}</p>
              </div>
              {website?.subdomain && (
                <div className="flex items-center gap-2 pl-4 border-l border-gray-200">
                  <p className="text-sm text-gray-600">Subdomain:</p>
                  <p className="text-sm font-mono text-blue-600 font-semibold">{website.subdomain}</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Mode Selection */}
            <div className="flex gap-2 flex-col items-end">
              {selectedPage && website?.subdomain && website.isPublished && (
                <div className="mb-2 p-2 bg-green-50 rounded border border-green-200 text-right">
                  <p className="text-xs text-green-700 font-semibold mb-1">✓ Published:</p>
                  <a
                    href={`/public/${website.subdomain}/${selectedPage.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-mono text-green-600 hover:text-green-700 hover:underline block break-all"
                    title="Open published page in new tab"
                  >
                    specialistly.com/public/{website.subdomain}/{selectedPage.slug}
                  </a>
                </div>
              )}
              {selectedPage && website?.subdomain && !website.isPublished && (
                <div className="mb-2 p-2 bg-yellow-50 rounded border border-yellow-200 text-right">
                  <p className="text-xs text-yellow-700 mb-1">📋 Not published yet</p>
                  <p className="text-xs text-yellow-600 font-mono">
                    /public/{website.subdomain}/{selectedPage.slug}
                  </p>
                </div>
              )}
              <div className="flex gap-2">
                <Button
                  variant={mode === 'edit' ? 'default' : 'outline'}
                  onClick={() => setMode('edit')}
                  className="gap-2"
                >
                  Edit
                </Button>
                <Button
                  variant={mode === 'preview' ? 'default' : 'outline'}
                  onClick={() => setMode('preview')}
                  className="gap-2"
                >
                  <Eye className="w-4 h-4" />
                  Preview
                </Button>
                <Button
                  variant={mode === 'branding' ? 'default' : 'outline'}
                  onClick={() => setMode('branding')}
                  className="gap-2"
                >
                  <Settings className="w-4 h-4" />
                  Branding
                </Button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 border-l border-gray-200 pl-4">
              <Button
                variant="outline"
                size="sm"
                onClick={undo}
                title="Undo (Ctrl+Z)"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={redo}
                title="Redo (Ctrl+Y)"
              >
                <RotateCw className="w-4 h-4" />
              </Button>

              {isDirty && (
                <Button
                  variant="default"
                  size="sm"
                  className="gap-2 bg-green-600 hover:bg-green-700"
                >
                  <Save className="w-4 h-4" />
                  Save
                </Button>
              )}

              <Button
                variant="outline"
                size="sm"
                className="gap-2"
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
          <div className="px-6 py-3 bg-red-50 border-t border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Pages */}
        <aside className="w-80 border-r border-gray-200 bg-white overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Pages</h2>
              <Button
                size="sm"
                variant="outline"
                onClick={handleAddPage}
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                Add
              </Button>
            </div>

            <div className="space-y-2">
              {pages.map((page) => (
                <div
                  key={page._id}
                  className={`px-4 py-3 rounded-lg border-2 transition-colors group ${
                    selectedPage?._id === page._id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <button
                    onClick={() => selectPage(page)}
                    className="w-full text-left mb-2"
                  >
                    <div className="font-medium text-gray-900">{page.title}</div>
                    <div className="text-sm text-gray-500">{page.slug}</div>
                    {page.isHomePage && (
                      <div className="text-xs font-semibold text-green-600 mt-1">
                        HOME PAGE
                      </div>
                    )}
                    {page.isPublished && (
                      <div className="text-xs font-semibold text-blue-600 mt-1">
                        ✓ PUBLISHED
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
                          // Update page state
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
                      {page.isPublished ? 'Unpublish' : 'Publish'}
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
        <main className="flex-1 overflow-auto">
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
        <aside className="w-80 border-l border-gray-200 bg-white overflow-y-auto">
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
    <div className="p-8">
      <Card className="p-8">
        <h2 className="text-2xl font-bold mb-6">Branding Settings</h2>
        
        {successMessage && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded">
            {successMessage}
          </div>
        )}

        {errorMessage && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">
            {errorMessage}
          </div>
        )}

        <div className="space-y-6">
          {/* Site Name */}
          <div>
            <label className="block text-sm font-medium mb-2">Site Name</label>
            <Input
              type="text"
              value={siteName}
              onChange={(e) => setSiteName(e.target.value)}
              placeholder="My Creator Site"
            />
          </div>

          {/* Tagline */}
          <div>
            <label className="block text-sm font-medium mb-2">Tagline</label>
            <Input
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="Welcome to my site"
            />
          </div>

          {/* Logo Upload */}
          <div>
            <label className="block text-sm font-medium mb-2">Logo</label>
            <div className="space-y-3">
              <div className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                {logo ? (
                  <img src={logo} alt="Logo" className="w-full h-full object-contain p-2" />
                ) : (
                  <span className="text-gray-400 text-center text-xs">No logo</span>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="gap-2"
                >
                  <Upload className="w-4 h-4" />
                  {isUploading ? 'Uploading...' : 'Upload Logo'}
                </Button>
                {logo && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setLogo(null)}
                    disabled={isUploading}
                  >
                    <X className="w-4 h-4" />
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
              <p className="text-xs text-gray-500">Max 5MB, PNG or JPG recommended</p>
            </div>
          </div>

          {/* Primary Color */}
          <div>
            <label className="block text-sm font-medium mb-2">Primary Color</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="w-16 h-10 rounded cursor-pointer"
              />
              <code className="text-sm text-gray-600 font-mono">{primaryColor}</code>
            </div>
          </div>

          {/* Secondary Color */}
          <div>
            <label className="block text-sm font-medium mb-2">Secondary Color</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={secondaryColor}
                onChange={(e) => setSecondaryColor(e.target.value)}
                className="w-16 h-10 rounded cursor-pointer"
              />
              <code className="text-sm text-gray-600 font-mono">{secondaryColor}</code>
            </div>
          </div>

          {/* Save Button */}
          <div className="border-t pt-6">
            <Button
              onClick={handleSaveBranding}
              disabled={isSaving}
              className="gap-2 bg-blue-600 hover:bg-blue-700"
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
          </div>
        </div>
      </Card>
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

  useEffect(() => {
    setTitle(section?.title || '');
    setDescription(section?.description || '');
    setContent(section?.content || {});
  }, [section]);

  if (!section) {
    return (
      <div className="p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-700">Properties</h3>
        <p className="text-gray-500 text-sm">Click on a section to edit its properties</p>
      </div>
    );
  }

  const handleSave = () => {
    if (onUpdateSection) {
      onUpdateSection({
        title,
        description,
        content,
      });
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
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
        <Input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Section title"
        />
      </div>

      {/* Section Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Section description"
        />
      </div>

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
