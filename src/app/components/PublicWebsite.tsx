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
    <div className="min-h-screen flex flex-col" style={{ fontFamily: `'${website?.branding?.fontFamily || 'Inter'}', system-ui, -apple-system, sans-serif` }}>
      {/* Google Fonts */}
      {website?.branding?.fontFamily && !['system-ui', 'Georgia'].includes(website.branding.fontFamily) && (
        <link
          href={`https://fonts.googleapis.com/css2?family=${encodeURIComponent(website.branding.fontFamily)}:wght@300;400;500;600;700&display=swap`}
          rel="stylesheet"
        />
      )}
      {/* Header Navigation */}
      <header
        className="shadow-lg sticky top-0 z-40"
        style={{ 
          backgroundColor: website?.branding?.headerBgColor || website?.branding?.primaryColor || '#3B82F6',
        }}
      >
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between">
          {/* Logo/Brand - Left Side */}
          <div className="flex items-center gap-4 flex-shrink-0">
            {website?.branding?.logo && (
              <img
                src={website.branding.logo}
                alt={website?.branding?.siteName}
                className="h-14 w-auto object-contain"
              />
            )}
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: website?.branding?.headerTextColor || '#ffffff', fontFamily: `'${website?.branding?.fontFamily || 'Inter'}', system-ui, sans-serif` }}>
              {website?.branding?.siteName || 'Website'}
            </h1>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6 flex-1 justify-end">
            {pages.map((page) => {
              const headerText = website?.branding?.headerTextColor || '#ffffff';
              const isActive = currentPageSlug === page.slug;
              return (
                <button
                  key={page._id}
                  onClick={() => handlePageClick(page)}
                  className={`font-semibold px-6 py-2 rounded-lg transition-all border-2`}
                  style={isActive
                    ? { borderColor: headerText, backgroundColor: headerText, color: website?.branding?.headerBgColor || website?.branding?.primaryColor || '#3B82F6' }
                    : { borderColor: headerText, borderWidth: '2px', color: headerText, backgroundColor: 'transparent', opacity: 0.85 }
                  }
                >
                  {page.title}
                </button>
              );
            })}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
            className="md:hidden p-2"
            style={{ color: website?.branding?.headerTextColor || '#ffffff' }}
          >
            {isMobileNavOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </nav>

        {/* Mobile Navigation Menu */}
        {isMobileNavOpen && (
          <div className="md:hidden border-t border-white border-opacity-20" style={{ backgroundColor: website?.branding?.headerBgColor || website?.branding?.primaryColor || '#1f2937' }}>
            <div className="px-4 py-3 space-y-2">
              {pages.map((page) => (
                <button
                  key={page._id}
                  onClick={() => handlePageClick(page)}
                  className={`w-full text-left px-4 py-3 rounded-lg font-semibold transition-all text-white border-2 ${
                    currentPageSlug === page.slug 
                      ? 'bg-white text-gray-900 border-white' 
                      : 'border-white border-opacity-30 hover:border-opacity-100'
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
      <footer style={{ backgroundColor: website?.branding?.footerBgColor || '#111827', color: website?.branding?.footerTextColor || '#ffffff' }} className="py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-bold mb-2">{website?.branding?.siteName}</h3>
              <p className="text-sm opacity-60">{website?.branding?.tagline}</p>
            </div>
            <div>
              <h4 className="font-bold mb-2">Pages</h4>
              <ul className="space-y-1">
                {pages.map((page) => (
                  <li key={page._id}>
                    <button
                      onClick={() => handlePageClick(page)}
                      className="opacity-60 hover:opacity-100 transition text-sm"
                    >
                      {page.title}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-2">About</h4>
              <p className="text-sm opacity-60">
                Built with Specialistly Branded Page Builder
              </p>
            </div>
          </div>
          <div className="border-t mt-8 pt-8" style={{ borderColor: 'rgba(255,255,255,0.15)' }}>
            <p className="text-sm text-center opacity-60">
              © {new Date().getFullYear()} {website?.branding?.siteName}. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicWebsite;
