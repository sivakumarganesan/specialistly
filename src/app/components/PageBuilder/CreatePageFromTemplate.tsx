import React, { useState } from 'react';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';

interface CreatePageFromTemplateProps {
  templateId: string;
  templateName: string;
  websiteId: string;
  onSuccess: (page: any) => void;
  onCancel: () => void;
}

export const CreatePageFromTemplate: React.FC<CreatePageFromTemplateProps> = ({
  templateId,
  templateName,
  websiteId,
  onSuccess,
  onCancel,
}) => {
  const [pageTitle, setPageTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!pageTitle.trim()) {
      setError('Page title is required');
      return;
    }

    try {
      setLoading(true);
      const apiUrl = (import.meta.env.VITE_API_URL as string) || '/api';
      const authToken = localStorage.getItem('authToken');

      const response = await fetch(
        `${apiUrl}/page-templates/${templateId}/create-page`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            websiteId,
            pageTitle: pageTitle.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.message || 'Failed to create page');
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess(data.data);
      }, 1500);
    } catch (err) {
      console.error('Error creating page:', err);
      setError('Failed to create page. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Page Created!</h3>
          <p className="text-gray-600 mb-6">
            Your page "{pageTitle}" has been created from the {templateName} template.
          </p>
          <p className="text-sm text-gray-500">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 border-b">
          <h2 className="text-xl font-bold">Create Page from Template</h2>
          <p className="text-blue-100 text-sm mt-1">Using: {templateName}</p>
        </div>

        {/* Form */}
        <form onSubmit={handleCreate} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg flex gap-2 items-start">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Page Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={pageTitle}
              onChange={(e) => setPageTitle(e.target.value)}
              placeholder="e.g., Services, About Us, Contact"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
              autoFocus
            />
            <p className="text-xs text-gray-500 mt-1">
              This will be the title of your new page
            </p>
          </div>

          {/* Preview */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-xs font-semibold text-gray-700 uppercase mb-2">Preview</p>
            <div className="space-y-1 text-sm text-gray-600">
              <p>
                <span className="font-medium">Title:</span> {pageTitle || '(Your page title)'}
              </p>
              <p>
                <span className="font-medium">Template:</span> {templateName}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                ℹ️ You can edit all content, sections, and styling after creation
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !pageTitle.trim()}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Creating...' : 'Create Page'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePageFromTemplate;
