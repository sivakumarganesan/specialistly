import React, { useState, useEffect } from 'react';
import { Loader } from 'lucide-react';
import { pageBuilderAPI } from '@/app/api/pageBuilderAPI';
import { PublicPageViewer } from './PublicPageViewer';
import { getSubdomainInfo } from '@/app/utils/subdomainUtils';

interface PublicWebsiteProps {
  subdomain?: string;
}

export const PublicWebsite: React.FC<PublicWebsiteProps> = ({ subdomain: propSubdomain }) => {
  const [website, setWebsite] = useState<any>(null);
  const [pages, setPages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  const subdomainInfo = getSubdomainInfo();
  const actualSubdomain = propSubdomain || subdomainInfo.subdomain;

  useEffect(() => {
    if (!actualSubdomain) {
      setError('No subdomain found');
      setIsLoading(false);
      return;
    }

    const loadWebsite = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch website and pages data
        const response = await fetch(
          `${window.location.origin}/api/page-builder/public/websites/${actualSubdomain}`
        );

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Website not found');
          }
          throw new Error('Failed to load website');
        }

        const data = await response.json();
        if (!data.success) {
          throw new Error(data.message || 'Failed to load website');
        }

        setWebsite(data.data.website);
        setPages(data.data.pages || []);
        setCurrentPageIndex(0);
      } catch (err) {
        console.error('Error loading public website:', err);
        setError(err instanceof Error ? err.message : 'Failed to load website');
      } finally {
        setIsLoading(false);
      }
    };

    loadWebsite();
  }, [actualSubdomain]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 to-indigo-100">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Loading website...</p>
        </div>
      </div>
    );
  }

  if (error || !website) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 to-indigo-100">
        <div className="text-center max-w-md">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Website Not Found</h1>
          <p className="text-gray-600 mb-4">{error || 'This website is not available'}</p>
          <p className="text-sm text-gray-500">
            Subdomain: <code className="bg-gray-200 px-2 py-1 rounded">{actualSubdomain}</code>
          </p>
        </div>
      </div>
    );
  }

  // If there are published pages, show the first one
  if (pages && pages.length > 0) {
    const currentPage = pages[currentPageIndex];
    return (
      <PublicPageViewer
        subdomain={actualSubdomain || ''}
        pageSlug={currentPage.slug}
      />
    );
  }

  // Show empty state if no pages
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 to-indigo-100">
      <div className="text-center max-w-md">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">{website?.branding?.siteName || 'Welcome'}</h1>
        <p className="text-gray-600 mb-4">No pages published yet</p>
        <p className="text-sm text-gray-500">
          {website?.branding?.tagline || 'Coming soon'}
        </p>
      </div>
    </div>
  );
};

export default PublicWebsite;
