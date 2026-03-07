import React, { useState, useEffect } from 'react';
import { Plus, Loader2, AlertCircle } from 'lucide-react';
import { TemplateGallery } from './TemplateGallery';
import { CreatePageFromTemplate } from './CreatePageFromTemplate';

interface BrandedPageBuilderProps {
  websiteId: string;
  websiteName: string;
  onPageCreated?: (page: any) => void;
}

export const BrandedPageBuilder: React.FC<BrandedPageBuilderProps> = ({
  websiteId,
  websiteName,
  onPageCreated,
}) => {
  const [showTemplateGallery, setShowTemplateGallery] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPages();
  }, [websiteId]);

  const fetchPages = async () => {
    try {
      setLoading(true);
      setError('');

      const apiUrl = (import.meta.env.VITE_API_URL as string) || '/api';
      const authToken = localStorage.getItem('authToken');

      const response = await fetch(
        `${apiUrl}/page-builder/websites/${websiteId}/pages`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`,
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        setPages(data.data || []);
      } else {
        setError('Failed to load pages');
      }
    } catch (err) {
      console.error('Error fetching pages:', err);
      setError('Failed to load pages');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTemplate = (templateId: string, templateName: string) => {
    setSelectedTemplate({ id: templateId, name: templateName });
    setShowTemplateGallery(false);
    setShowCreateForm(true);
  };

  const handlePageCreated = (newPage: any) => {
    setShowCreateForm(false);
    setSelectedTemplate(null);
    setPages([...pages, newPage]);
    if (onPageCreated) {
      onPageCreated(newPage);
    }
    // Optionally refresh pages
    fetchPages();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{websiteName}</h1>
              <p className="text-gray-600 mt-2">
                Create and manage branded pages for your specialist website
              </p>
            </div>
            <button
              onClick={() => setShowTemplateGallery(true)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition font-medium"
            >
              <Plus className="w-5 h-5" />
              Create New Page
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex gap-2 items-start">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Error Loading Pages</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : pages.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-50 rounded-full mb-4">
              <Plus className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Pages Yet</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Start creating branded pages for your specialist website. Choose from our collection of
              professional templates.
            </p>
            <button
              onClick={() => setShowTemplateGallery(true)}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
            >
              Create First Page
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pages.map((page) => (
              <div
                key={page._id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition cursor-pointer group"
              >
                {/* Card Header */}
                <div className="h-32 bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center group-hover:shadow-inner transition">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">
                      {page.isHomePage ? '🏠 Home Page' : '📄 Page'}
                    </p>
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 text-lg truncate">{page.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    /{page.slug}
                  </p>

                  {/* Sections Count */}
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-600">
                      <span className="font-medium">{page.sections?.length || 0}</span> sections
                    </p>
                  </div>

                  {/* Status Badge */}
                  <div className="mt-3 flex gap-2">
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded-full ${
                        page.isPublished
                          ? 'bg-green-50 text-green-700'
                          : 'bg-yellow-50 text-yellow-700'
                      }`}
                    >
                      {page.isPublished ? '✓ Published' : '○ Draft'}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="mt-4 flex gap-2">
                    <button className="flex-1 px-3 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 text-sm font-medium rounded-lg transition">
                      Edit
                    </button>
                    <button className="flex-1 px-3 py-2 bg-gray-50 text-gray-600 hover:bg-gray-100 text-sm font-medium rounded-lg transition">
                      View
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* Add New Page Card */}
            <button
              onClick={() => setShowTemplateGallery(true)}
              className="bg-white rounded-lg shadow-sm border-2 border-dashed border-gray-300 hover:border-blue-400 hover:shadow-md transition flex flex-col items-center justify-center p-8 min-h-[300px] group"
            >
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 group-hover:bg-blue-100 rounded-lg transition mb-4">
                <Plus className="w-6 h-6 text-gray-600 group-hover:text-blue-600" />
              </div>
              <p className="font-medium text-gray-900 group-hover:text-blue-600 transition">
                Add New Page
              </p>
              <p className="text-sm text-gray-500 mt-1">From template</p>
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      {showTemplateGallery && (
        <TemplateGallery
          onSelectTemplate={handleSelectTemplate}
          onCancel={() => setShowTemplateGallery(false)}
        />
      )}

      {showCreateForm && selectedTemplate && (
        <CreatePageFromTemplate
          templateId={selectedTemplate.id}
          templateName={selectedTemplate.name}
          websiteId={websiteId}
          onSuccess={handlePageCreated}
          onCancel={() => {
            setShowCreateForm(false);
            setSelectedTemplate(null);
          }}
        />
      )}
    </div>
  );
};

export default BrandedPageBuilder;
