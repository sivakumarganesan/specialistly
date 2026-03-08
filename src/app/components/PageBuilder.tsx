import { useState, useEffect } from "react";
import { Card } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Plus, Loader, ArrowLeft } from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";
import { pageBuilderAPI } from "@/app/api/pageBuilderAPI";
import BrandedPageBuilder from "@/app/components/PageBuilder/BrandedPageBuilder";

interface Website {
  _id: string;
  name: string;
  subdomain?: string;
  branding?: any;
  isPublished: boolean;
  createdAt: string;
}

export function PageBuilder() {
  const { user } = useAuth();
  const [websites, setWebsites] = useState<Website[]>([]);
  const [selectedWebsiteId, setSelectedWebsiteId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load websites on mount
  useEffect(() => {
    loadWebsites();
  }, []);

  const loadWebsites = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await pageBuilderAPI.getWebsites();
      if (response.success && response.data) {
        setWebsites(response.data);
        // Auto-select first website if available
        if (response.data.length > 0) {
          setSelectedWebsiteId(response.data[0]._id);
        }
      }
    } catch (err: any) {
      console.error('Failed to load websites:', err);
      setError(err.message || 'Failed to load websites');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateWebsite = async () => {
    try {
      setIsCreating(true);
      setError(null);
      
      const response = await pageBuilderAPI.createWebsite({
        name: `My Website ${new Date().toLocaleDateString()}`,
        tagline: 'My professional website',
        colors: {
          primary: '#4f46e5',
          secondary: '#06b6d4',
          accent: '#ec4899',
        },
      });

      if (response.success && response.data) {
        setWebsites([...websites, response.data]);
        setSelectedWebsiteId(response.data._id);
      }
    } catch (err: any) {
      console.error('Failed to create website:', err);
      setError(err.message || 'Failed to create website');
    } finally {
      setIsCreating(false);
    }
  };

  // If a website is selected, show the branded page builder
  if (selectedWebsiteId) {
    const selectedWebsite = websites.find(w => w._id === selectedWebsiteId);
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <button
              onClick={() => setSelectedWebsiteId(null)}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Websites
            </button>
          </div>
        </div>
        <BrandedPageBuilder
          websiteId={selectedWebsiteId}
          websiteName={selectedWebsite?.name || 'Website'}
          subdomain={selectedWebsite?.subdomain}
        />
      </div>
    );
  }

  // Show website list
  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex justify-center items-center min-h-96">
          <Loader className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Branded Page Builder</h1>
        <p className="text-lg text-gray-600">Create and customize your professional website</p>
      </div>

      {error && (
        <Card className="mb-6 p-4 border-red-200 bg-red-50">
          <p className="text-red-800">{error}</p>
        </Card>
      )}

      {websites.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
              <Plus className="h-8 w-8 text-indigo-600" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No websites yet</h2>
          <p className="text-gray-600 mb-6">Create your first professional website to get started</p>
          <Button
            onClick={handleCreateWebsite}
            disabled={isCreating}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            {isCreating ? 'Creating...' : 'Create Your First Website'}
          </Button>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">Your Websites</h2>
            <Button
              onClick={handleCreateWebsite}
              disabled={isCreating}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              {isCreating ? 'Creating...' : 'Create New Website'}
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {websites.map((website) => (
              <Card
                key={website._id}
                className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setSelectedWebsiteId(website._id)}
              >
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">{website.name}</h3>
                  {website.isPublished && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Published
                    </span>
                  )}
                </div>
                
                <p className="text-sm text-gray-600 mb-4">
                  {website.subdomain ? (
                    <>
                      <strong>Domain:</strong>
                      <br />
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded mt-1 block">
                        {website.subdomain}.specialistly.com
                      </code>
                    </>
                  ) : (
                    <span className="text-gray-500">No subdomain configured</span>
                  )}
                </p>

                <p className="text-xs text-gray-500 mb-4">
                  Created {new Date(website.createdAt).toLocaleDateString()}
                </p>

                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedWebsiteId(website._id);
                  }}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  Edit Website
                </Button>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default PageBuilder;
