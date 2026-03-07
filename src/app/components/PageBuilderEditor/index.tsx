import React, { useState, useEffect } from 'react';
import { usePageBuilder, Website, Page } from '@/app/hooks/usePageBuilder';
import { pageBuilderAPI } from '@/app/api/pageBuilderAPI';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import {
  Plus,
  Save,
  Eye,
  RotateCcw,
  RotateCw,
  Settings,
  Upload,
  Loader,
} from 'lucide-react';

interface PageBuilderEditorProps {
  websiteId: string;
}

const PageBuilderEditor: React.FC<PageBuilderEditorProps> = ({ websiteId }) => {
  const [showPublishDialog, setShowPublishDialog] = useState(false);
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
            <EditorCanvas page={selectedPage} />
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
          <PropertiesPanel />
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
const EditorCanvas: React.FC<{ page: Page }> = ({ page }) => (
  <div className="p-8">
    <Card className="min-h-screen">
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-4">{page.title}</h1>
        <p className="text-gray-500">Sections coming soon...</p>
        {page.sections.length === 0 && (
          <div className="mt-8 text-center py-16 border-2 border-dashed border-gray-300 rounded-lg">
            <Plus className="w-8 h-8 mx-auto text-gray-400 mb-2" />
            <p className="text-gray-600">No sections yet. Click to add one.</p>
          </div>
        )}
      </div>
    </Card>
  </div>
);

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

const PropertiesPanel: React.FC = () => (
  <div className="p-6">
    <h3 className="text-lg font-semibold mb-4">Properties</h3>
    <p className="text-gray-500">Select a section to edit its properties</p>
  </div>
);

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
