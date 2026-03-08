import React, { useState, useEffect } from 'react';
import { Loader, Menu, X } from 'lucide-react';
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
  const [currentPageSlug, setCurrentPageSlug] = useState<string>('');
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState<any>(null);

  const subdomainInfo = getSubdomainInfo();
  const actualSubdomain = propSubdomain || subdomainInfo.subdomain;

  // Load website data on mount or subdomain change
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
        const pagesList = data.data.pages || [];
        setPages(pagesList);
        
        // Set home page or first page as default
        const homePage = pagesList.find((p: any) => p.isHomePage) || pagesList[0];
        if (homePage) {
          setCurrentPageSlug(homePage.slug);
          setCurrentPage(homePage);
        }
      } catch (err) {
        console.error('Error loading public website:', err);
        setError(err instanceof Error ? err.message : 'Failed to load website');
      } finally {
        setIsLoading(false);
      }
    };

    loadWebsite();
  }, [actualSubdomain]);

  // Handle page navigation
  const handlePageClick = (page: any) => {
    setCurrentPageSlug(page.slug);
    setCurrentPage(page);
    setIsMobileNavOpen(false);
    window.scrollTo(0, 0);
  };

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

  // Show empty state if no pages
  if (!pages || pages.length === 0) {
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
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: website?.branding?.colors?.primary || '#f9fafb' }}>
      {/* Header Navigation */}
      <header
        className="shadow-md sticky top-0 z-40"
        style={{ backgroundColor: website?.branding?.colors?.primary || '#1f2937' }}
      >
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          {/* Logo/Brand */}
          <div className="flex items-center gap-3">
            {website?.branding?.logo && (
              <img
                src={website.branding.logo}
                alt={website?.branding?.siteName}
                className="h-10 w-auto"
              />
            )}
            <div>
              <h1 className="text-xl font-bold text-white" style={{ color: website?.branding?.colors?.primary ? '#fff' : '#1f2937' }}>
                {website?.branding?.siteName || 'Website'}
              </h1>
              {website?.branding?.tagline && (
                <p className="text-sm opacity-75 text-white">
                  {website.branding.tagline}
                </p>
              )}
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {pages.map((page) => (
              <button
                key={page._id}
                onClick={() => handlePageClick(page)}
                className={`font-medium px-4 py-2 rounded transition-all ${
                  currentPageSlug === page.slug
                    ? 'bg-white text-indigo-600'
                    : 'text-white hover:bg-white hover:bg-opacity-10'
                }`}
              >
                {page.title}
              </button>
            ))}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
            className="md:hidden text-white p-2"
          >
            {isMobileNavOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </nav>

        {/* Mobile Navigation Menu */}
        {isMobileNavOpen && (
          <div className="md:hidden bg-opacity-95 bg-black">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {pages.map((page) => (
                <button
                  key={page._id}
                  onClick={() => handlePageClick(page)}
                  className={`w-full text-left px-4 py-2 rounded font-medium transition-all ${
                    currentPageSlug === page.slug
                      ? 'bg-white text-indigo-600'
                      : 'text-white hover:bg-white hover:bg-opacity-10'
                  }`}
                >
                  {page.title}
                </button>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* Page Content */}
      <main className="flex-1">
        {currentPageSlug && currentPage && (
          <PublicPageViewer
            subdomain={actualSubdomain || ''}
            pageSlug={currentPageSlug}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-bold mb-2">{website?.branding?.siteName}</h3>
              <p className="text-gray-400 text-sm">{website?.branding?.tagline}</p>
            </div>
            <div>
              <h4 className="font-bold mb-2">Pages</h4>
              <ul className="space-y-1">
                {pages.map((page) => (
                  <li key={page._id}>
                    <button
                      onClick={() => handlePageClick(page)}
                      className="text-gray-400 hover:text-white transition text-sm"
                    >
                      {page.title}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-2">About</h4>
              <p className="text-gray-400 text-sm">
                Built with Specialistly Branded Page Builder
              </p>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8">
            <p className="text-gray-400 text-sm text-center">
              © {new Date().getFullYear()} {website?.branding?.siteName}. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicWebsite;
