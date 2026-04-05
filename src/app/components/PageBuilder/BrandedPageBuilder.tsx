import React, { useState, useEffect } from 'react';
import { Plus, Loader2, AlertCircle, Edit2, Eye, X, Check, Home } from 'lucide-react';
import { TemplateGallery } from './TemplateGallery';
import { CreatePageFromTemplate } from './CreatePageFromTemplate';
import PageBuilderEditor from '../PageBuilderEditor';

// Helper to get the brand domain based on environment
const getBrandDomain = (subdomain: string): string => {
  if (typeof window === 'undefined') return `${subdomain}.specialistly.com`;
  
  const hostname = window.location.hostname;
  const isStaging = hostname.includes('staging');
  
  if (isStaging) {
    return `${subdomain}.staging.specialistly.com`;
  }
  return `${subdomain}.specialistly.com`;
};

interface BrandedPageBuilderProps {
  websiteId: string;
  websiteName: string;
  subdomain?: string;
  onPageCreated?: (page: any) => void;
}

export const BrandedPageBuilder: React.FC<BrandedPageBuilderProps> = ({
  websiteId,
  websiteName,
  subdomain,
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
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [actualSubdomain, setActualSubdomain] = useState<string | undefined>(subdomain);
  const [isEditingSubdomain, setIsEditingSubdomain] = useState(false);
  const [newSubdomain, setNewSubdomain] = useState<string>('');
  const [subdomainError, setSubdomainError] = useState('');
  const [subdomainLoading, setSubdomainLoading] = useState(false);

  useEffect(() => {
    ensureSubdomainConfigured();
    fetchPages();
  }, [websiteId]);

  // Ensure subdomain is configured for this website
  const ensureSubdomainConfigured = async () => {
    try {
      const apiUrl = (import.meta.env.VITE_API_URL as string) || '/api';
      const authToken = localStorage.getItem('authToken');

      const response = await fetch(
        `${apiUrl}/page-builder/websites/${websiteId}/ensure-subdomain`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.data?.subdomain) {
          setActualSubdomain(data.data.subdomain);
          setNewSubdomain(data.data.subdomain);
        }
      }
    } catch (err) {
      console.error('Error ensuring subdomain configured:', err);
    }
  };

  const updateSubdomainHandler = async () => {
    setSubdomainError('');
    
    // Basic validation
    if (!newSubdomain.trim()) {
      setSubdomainError('Subdomain is required');
      return;
    }

    if (newSubdomain === actualSubdomain) {
      setIsEditingSubdomain(false);
      return;
    }

    setSubdomainLoading(true);
    try {
      const apiUrl = (import.meta.env.VITE_API_URL as string) || '/api';
      const authToken = localStorage.getItem('authToken');

      const response = await fetch(
        `${apiUrl}/page-builder/websites/${websiteId}/subdomain`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ subdomain: newSubdomain.toLowerCase().trim() }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setSubdomainError(data.message || 'Failed to update subdomain');
        return;
      }

      setActualSubdomain(data.data.subdomain);
      setIsEditingSubdomain(false);
    } catch (err) {
      setSubdomainError(err instanceof Error ? err.message : 'Error updating subdomain');
    } finally {
      setSubdomainLoading(false);
    }
  };

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
    fetchPages();
  };

  // When editing a page, show the page editor in full screen
  if (editingPageId) {
    return (
      <div>
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <button
              onClick={() => {
                setEditingPageId(null);
                fetchPages();
              }}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition"
            >
              ← Back to Pages
            </button>
          </div>
        </div>
        <PageBuilderEditor websiteId={websiteId} />
      </div>
    );
  }

  // Check if subdomain is missing
  if (!actualSubdomain) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-6 rounded-lg">
            <p className="font-semibold mb-2">⚠️ Subdomain Configuring</p>
            <p className="text-sm">
              Setting up your subdomain. Please refresh the page in a moment...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Main page builder UI
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900">{websiteName}</h1>
              <p className="text-gray-600 mt-1">
                Create and manage branded pages for your specialist website
              </p>
              <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-gray-600">
                      <span className="font-semibold">Domain:</span>
                    </p>
                    <p className="text-lg font-mono text-blue-700 mt-1">
                      https://{getBrandDomain(actualSubdomain || '')}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setIsEditingSubdomain(true);
                      setNewSubdomain(actualSubdomain || '');
                      setSubdomainError('');
                    }}
                    className="ml-4 p-2 hover:bg-blue-100 rounded-lg transition"
                    title="Edit subdomain"
                  >
                    <Edit2 className="w-4 h-4 text-blue-600" />
                  </button>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowTemplateGallery(true)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition font-medium h-fit"
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
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded-full ${
                        page.isPublished
                          ? 'bg-green-50 text-green-700'
                          : 'bg-yellow-50 text-yellow-700'
                      }`}
                    >
                      {page.isPublished ? '✓ Published' : '○ Draft'}
                    </span>
                    {page.isHomePage && (
                      <span className="text-xs font-medium px-2 py-1 rounded-full bg-blue-50 text-blue-700">🏠 Landing Page</span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="mt-4 flex gap-2">
                    <button 
                      onClick={() => setEditingPageId(page._id)}
                      className="flex-1 px-3 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 text-sm font-medium rounded-lg transition flex items-center justify-center gap-1"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit
                    </button>
                    <button 
                      onClick={() => window.open(`https://${getBrandDomain(actualSubdomain || '')}/${page.slug}`, '_blank')}
                      className="flex-1 px-3 py-2 bg-gray-50 text-gray-600 hover:bg-gray-100 text-sm font-medium rounded-lg transition flex items-center justify-center gap-1"
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </button>
                  </div>
                  {!page.isHomePage && (
                    <button
                      onClick={async () => {
                        try {
                          const apiUrl = (import.meta.env.VITE_API_URL as string) || '/api';
                          const authToken = localStorage.getItem('authToken');
                          const res = await fetch(
                            `${apiUrl}/page-builder/websites/${websiteId}/pages/${page._id}`,
                            {
                              method: 'PUT',
                              headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${authToken}`,
                              },
                              body: JSON.stringify({ isHomePage: true }),
                            }
                          );
                          const result = await res.json();
                          if (result.success) {
                            setPages((prev: any[]) => prev.map((p: any) => ({ ...p, isHomePage: p._id === page._id })));
                          }
                        } catch (err) {
                          console.error('Failed to set as landing page:', err);
                        }
                      }}
                      className="w-full mt-2 px-3 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 text-sm font-medium rounded-lg transition flex items-center justify-center gap-1"
                    >
                      <Home className="w-4 h-4" />
                      Set as Default Landing Page
                    </button>
                  )}
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

      {/* Edit Subdomain Modal */}
      {isEditingSubdomain && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 border-b">
              <h2 className="text-xl font-bold">Edit Subdomain</h2>
              <p className="text-blue-100 text-sm mt-1">Change your website address</p>
            </div>

            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subdomain
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newSubdomain}
                    onChange={(e) => {
                      setNewSubdomain(e.target.value);
                      setSubdomainError('');
                    }}
                    placeholder="e.g., my-business"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={subdomainLoading}
                  />
                  <span className="text-gray-500 py-2 text-sm">{window.location.hostname.includes('staging') ? '.staging.specialistly.com' : '.specialistly.com'}</span>
                </div>
                {subdomainError && (
                  <p className="text-red-500 text-sm mt-2">{subdomainError}</p>
                )}
                <p className="text-gray-500 text-xs mt-2">
                  Use letters, numbers, and hyphens (3-50 characters)
                </p>
              </div>

              <div className="bg-gray-50 p-3 rounded-lg text-sm">
                <p className="text-gray-600">
                  Your website will be accessible at:<br />
                  <span className="font-mono text-blue-600 break-all">
                    https://{getBrandDomain(newSubdomain || 'subdomain')}
                  </span>
                </p>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setIsEditingSubdomain(false);
                    setSubdomainError('');
                  }}
                  disabled={subdomainLoading}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
                >
                  <X className="w-4 h-4 inline mr-2" />
                  Cancel
                </button>
                <button
                  onClick={updateSubdomainHandler}
                  disabled={subdomainLoading}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {subdomainLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Save
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
