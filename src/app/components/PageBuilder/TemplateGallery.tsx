import React, { useState, useEffect } from 'react';
import { Loader2, Code2, Palette, Layout } from 'lucide-react';

interface Template {
  _id: string;
  name: string;
  description: string;
  category: string;
  thumbnail: string;
  branding: {
    primaryColor: string;
    secondaryColor: string;
  };
  layout: {
    headerType: string;
    containerWidth: string;
  };
}

interface TemplateGalleryProps {
  onSelectTemplate: (templateId: string, templateName: string) => void;
  onCancel: () => void;
}

export const TemplateGallery: React.FC<TemplateGalleryProps> = ({ onSelectTemplate, onCancel }) => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTemplates();
  }, [selectedCategory]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      setError('');
      
      const apiUrl = (import.meta.env.VITE_API_URL as string) || '/api';
      const url = selectedCategory === 'all' 
        ? `${apiUrl}/page-templates`
        : `${apiUrl}/page-templates?category=${selectedCategory}`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        setTemplates(data.data);
      } else {
        setError('Failed to load templates');
      }
    } catch (err) {
      console.error('Error fetching templates:', err);
      setError('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { value: 'all', label: 'All Templates' },
    { value: 'landing', label: 'Landing Pages' },
    { value: 'about', label: 'About Us' },
    { value: 'services', label: 'Services' },
    { value: 'portfolio', label: 'Portfolio' },
    { value: 'contact', label: 'Contact' },
    { value: 'pricing', label: 'Pricing' },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 border-b">
          <h2 className="text-2xl font-bold">Choose a Template</h2>
          <p className="text-blue-100 mt-1">Select a template to get started with your page</p>
        </div>

        {/* Category Filter */}
        <div className="bg-gray-50 p-4 border-b sticky top-[80px] z-40">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition ${
                  selectedCategory === cat.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:border-blue-400'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : templates.length === 0 ? (
            <div className="text-center py-12">
              <Code2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No templates available in this category</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates.map((template) => (
                <div
                  key={template._id}
                  className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition cursor-pointer group"
                  onClick={() => onSelectTemplate(template._id, template.name)}
                >
                  {/* Thumbnail */}
                  <div className="bg-gradient-to-br from-gray-100 to-gray-200 h-40 flex items-center justify-center group-hover:brightness-110 transition relative">
                    {template.thumbnail ? (
                      <img
                        src={template.thumbnail}
                        alt={template.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Layout className="w-12 h-12 text-gray-400" />
                    )}
                    
                    {/* Color preview */}
                    <div className="absolute bottom-2 right-2 flex gap-1">
                      <div
                        className="w-6 h-6 rounded-full border-2 border-white shadow-md"
                        style={{ backgroundColor: template.branding.primaryColor }}
                        title="Primary color"
                      />
                      <div
                        className="w-6 h-6 rounded-full border-2 border-white shadow-md"
                        style={{ backgroundColor: template.branding.secondaryColor }}
                        title="Secondary color"
                      />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 text-lg">{template.name}</h3>
                        <p className="text-xs text-blue-600 font-medium uppercase mt-1">
                          {template.category}
                        </p>
                      </div>
                    </div>

                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {template.description || 'Professional template for your website'}
                    </p>

                    {/* Features */}
                    <div className="flex gap-3 text-xs text-gray-500 mb-4">
                      <span className="flex items-center gap-1">
                        <Layout className="w-3 h-3" />
                        {template.layout.containerWidth} width
                      </span>
                      <span className="flex items-center gap-1">
                        <Palette className="w-3 h-3" />
                        Customizable
                      </span>
                    </div>

                    {/* Action Button */}
                    <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition">
                      Use This Template
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 p-4 border-t flex gap-3 sticky bottom-0">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 font-medium transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default TemplateGallery;
