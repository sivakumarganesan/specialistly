import React, { useState, useEffect } from 'react';
import { usePageBuilder, Website, Page, PageSection } from '@/app/hooks/usePageBuilder';
import { pageBuilderAPI } from '@/app/api/pageBuilderAPI';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Textarea } from '@/app/components/ui/textarea';
import EditorCanvas from './EditorCanvas';
import SectionLibrary from './SectionLibrary';
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
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {website?.displayName || 'Page Builder'}
            </h1>
            <p className="text-sm text-gray-500">{website?.domainName}</p>
          </div>

          <div className="flex items-center gap-4">
            {/* Mode Selection */}
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
                <button
                  key={page._id}
                  onClick={() => selectPage(page)}
                  className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-colors ${
                    selectedPage?._id === page._id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium text-gray-900">{page.title}</div>
                  <div className="text-sm text-gray-500">{page.slug}</div>
                  {page.isHomePage && (
                    <div className="text-xs font-semibold text-green-600 mt-1">
                      HOME PAGE
                    </div>
                  )}
                </button>
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

const BrandingPanel: React.FC<{ website: Website | null }> = ({ website }) => (
  <div className="p-8">
    <Card className="p-8">
      <h2 className="text-2xl font-bold mb-6">Branding Settings</h2>
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Logo</label>
          <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center">
            {website?.branding?.logo ? (
              <img src={website.branding.logo} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <span className="text-gray-400">No logo</span>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Primary Color</label>
          <input
            type="color"
            defaultValue={website?.branding?.colors?.primary || '#3B82F6'}
            className="w-16 h-10 rounded cursor-pointer"
          />
        </div>
      </div>
    </Card>
  </div>
);

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
}> = ({ isLoading, onPublish, onCancel }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <Card className="w-96 p-6">
      <h2 className="text-xl font-bold mb-4">Publish Website</h2>
      <p className="text-gray-600 mb-6">
        This will publish all your pages and make them visible to the public.
      </p>
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

export default PageBuilderEditor;
