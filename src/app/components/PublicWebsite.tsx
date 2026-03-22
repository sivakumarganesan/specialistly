import React, { useState, useEffect } from 'react';
import { Loader, Menu, X, MapPin, Phone, Facebook, Instagram, Youtube, Twitter, Linkedin } from 'lucide-react';
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

  // Intercept internal link clicks (e.g. CTA buttons with href="/about-us")
  // so they navigate within the SPA instead of doing a full page reload
  const handleInternalLinkClick = (e: React.MouseEvent<HTMLElement>) => {
    const target = (e.target as HTMLElement).closest('a[href]') as HTMLAnchorElement | null;
    if (!target) return;
    const href = target.getAttribute('href');
    if (!href || !href.startsWith('/') || href.startsWith('//')) return;
    // Strip leading slash to get the slug
    const slug = href.replace(/^\/+/, '');
    const matchedPage = pages.find((p: any) => p.slug === slug);
    if (matchedPage) {
      e.preventDefault();
      handlePageClick(matchedPage);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-gray-900 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Loading website...</p>
        </div>
      </div>
    );
  }

  if (error || !website) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
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
      <div className="flex items-center justify-center min-h-screen bg-white">
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

  // Extract topbar and navbar sections from the home page (or first page)
  const homePage = pages.find((p: any) => p.isHomePage) || pages[0];
  const homePageSections = homePage?.sections || [];
  const topBarSection = homePageSections.find((s: any) => s.type === 'topbar');
  const navBarSection = homePageSections.find((s: any) => s.type === 'navbar');
  const hasCustomHeader = !!(topBarSection || navBarSection);

  const socialIcons: Record<string, React.ReactNode> = {
    facebook: <Facebook className="w-3.5 h-3.5" />,
    instagram: <Instagram className="w-3.5 h-3.5" />,
    youtube: <Youtube className="w-3.5 h-3.5" />,
    twitter: <Twitter className="w-3.5 h-3.5" />,
    linkedin: <Linkedin className="w-3.5 h-3.5" />,
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ fontFamily: `'${website?.branding?.fontFamily || 'Inter'}', system-ui, -apple-system, sans-serif` }}>
      {/* Google Fonts */}
      {website?.branding?.fontFamily && !['system-ui', 'Georgia'].includes(website.branding.fontFamily) && (
        <link
          href={`https://fonts.googleapis.com/css2?family=${encodeURIComponent(website.branding.fontFamily)}:wght@300;400;500;600;700&display=swap`}
          rel="stylesheet"
        />
      )}

      {/* ─── Custom Header (TopBar + NavBar sections) ─── */}
      {hasCustomHeader ? (
        <header className="sticky top-0 z-40">
          {/* Top Bar */}
          {topBarSection && (() => {
            const tc = topBarSection.content || {};
            const bgColor = tc.backgroundColor || '#00acc1';
            const textColor = tc.textColor || '#ffffff';
            const socialLinks: { platform: string; url: string }[] = tc.socialLinks || [];
            return (
              <div style={{ backgroundColor: bgColor, color: textColor }} className="py-2 px-4 text-xs sm:text-sm">
                <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-4 flex-wrap">
                    {tc.address && (
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>{tc.address}</span>
                      </span>
                    )}
                    {tc.phone && (
                      <a href={`tel:${tc.phone.replace(/\s/g, '')}`} className="flex items-center gap-1.5 hover:opacity-80" style={{ color: textColor }}>
                        <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>{tc.phone}</span>
                      </a>
                    )}
                  </div>
                  {socialLinks.length > 0 && (
                    <div className="flex items-center gap-3">
                      {socialLinks.map((link, i) => (
                        <a key={i} href={link.url || '#'} target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity" style={{ color: textColor }}>
                          {socialIcons[link.platform] || <span className="text-xs">{link.platform}</span>}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Nav Bar */}
          {(() => {
            const nc = navBarSection?.content || {};
            const navBgColor = nc.backgroundColor || website?.branding?.headerBgColor || '#ffffff';
            const navTextColor = nc.textColor || '#333333';
            const brandColor = nc.brandColor || website?.branding?.primaryColor || '#00acc1';
            const brandName = nc.brandName || website?.branding?.siteName || 'Website';
            const logoUrl = nc.logoUrl || website?.branding?.logo || '';
            const logoDisplayMode = nc.logoDisplayMode || 'auto';
            const showLogo = logoUrl && (logoDisplayMode === 'both' || logoDisplayMode === 'logo' || (logoDisplayMode === 'auto' && logoUrl));
            const showText = logoDisplayMode === 'both' || logoDisplayMode === 'text' || (logoDisplayMode === 'auto' && !logoUrl);
            // Merge section-defined menu items with page links
            const sectionMenuItems: { label: string; url: string }[] = nc.menuItems || [];
            const hasMenuItems = sectionMenuItems.length > 0;

            return (
              <nav style={{ backgroundColor: navBgColor }} className="border-b border-gray-200 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {showLogo && <img src={logoUrl} alt={brandName} className="h-8 w-auto object-contain" />}
                    {showText && <span className="text-lg sm:text-xl font-bold tracking-tight" style={{ color: brandColor }}>{brandName}</span>}
                  </div>

                  {/* Desktop nav */}
                  <div className="hidden md:flex items-center gap-6">
                    {/* Section-defined menu items */}
                    {sectionMenuItems.map((item, i) => (
                      <a key={`menu-${i}`} href={item.url || '#'} className="text-sm font-medium hover:opacity-70 transition-opacity" style={{ color: navTextColor }}>
                        {item.label}
                      </a>
                    ))}
                    {/* Page links as text menu */}
                    {pages.map((page) => (
                      <button
                        key={page._id}
                        onClick={() => handlePageClick(page)}
                        className={`text-sm font-medium transition-opacity ${currentPageSlug === page.slug ? 'opacity-100' : 'opacity-70 hover:opacity-100'}`}
                        style={{ color: currentPageSlug === page.slug ? brandColor : navTextColor }}
                      >
                        {page.title}
                      </button>
                    ))}
                  </div>

                  {/* Mobile hamburger */}
                  {(pages.length > 0 || hasMenuItems) && (
                    <button className="md:hidden p-1" style={{ color: navTextColor }} onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}>
                      {isMobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                  )}
                </div>

                {/* Mobile menu */}
                {isMobileNavOpen && (
                  <div className="md:hidden border-t border-gray-200 px-4 py-3 space-y-1" style={{ backgroundColor: navBgColor }}>
                    {sectionMenuItems.map((item, i) => (
                      <a key={`mob-menu-${i}`} href={item.url || '#'} className="block text-sm font-medium py-2 hover:opacity-70" style={{ color: navTextColor }}>
                        {item.label}
                      </a>
                    ))}
                    {pages.map((page) => (
                      <button
                        key={page._id}
                        onClick={() => handlePageClick(page)}
                        className={`block w-full text-left text-sm font-medium py-2 ${currentPageSlug === page.slug ? '' : 'opacity-70'}`}
                        style={{ color: currentPageSlug === page.slug ? brandColor : navTextColor }}
                      >
                        {page.title}
                      </button>
                    ))}
                  </div>
                )}
              </nav>
            );
          })()}
        </header>
      ) : (
      /* ─── Fallback Header (original branded header with text menu) ─── */
      <header
        className="shadow-sm sticky top-0 z-40"
        style={{ 
          backgroundColor: website?.branding?.headerBgColor || website?.branding?.primaryColor || '#3B82F6',
        }}
      >
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4 flex-shrink-0">
            {website?.branding?.logo && (
              <img src={website.branding.logo} alt={website?.branding?.siteName} className="h-12 w-auto object-contain" />
            )}
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: website?.branding?.headerTextColor || '#ffffff' }}>
              {website?.branding?.siteName || 'Website'}
            </h1>
          </div>

          <div className="hidden md:flex items-center gap-6 flex-1 justify-end">
            {pages.map((page) => {
              const headerText = website?.branding?.headerTextColor || '#ffffff';
              const isActive = currentPageSlug === page.slug;
              return (
                <button
                  key={page._id}
                  onClick={() => handlePageClick(page)}
                  className="text-sm font-medium transition-opacity"
                  style={{
                    color: headerText,
                    opacity: isActive ? 1 : 0.75,
                    borderBottom: isActive ? `2px solid ${headerText}` : '2px solid transparent',
                    paddingBottom: '2px',
                  }}
                >
                  {page.title}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
            className="md:hidden p-2"
            style={{ color: website?.branding?.headerTextColor || '#ffffff' }}
          >
            {isMobileNavOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </nav>

        {isMobileNavOpen && (
          <div className="md:hidden border-t border-white border-opacity-20 px-4 py-3 space-y-1" style={{ backgroundColor: website?.branding?.headerBgColor || website?.branding?.primaryColor || '#1f2937' }}>
            {pages.map((page) => (
              <button
                key={page._id}
                onClick={() => handlePageClick(page)}
                className="block w-full text-left px-4 py-2 text-sm font-medium transition-opacity"
                style={{
                  color: website?.branding?.headerTextColor || '#ffffff',
                  opacity: currentPageSlug === page.slug ? 1 : 0.7,
                }}
              >
                {page.title}
              </button>
            ))}
          </div>
        )}
      </header>
      )}

      {/* Page Content */}
      <main className="flex-1" onClick={handleInternalLinkClick}>
        {currentPageSlug && currentPage && (
          <PublicPageViewer
            subdomain={actualSubdomain || ''}
            pageSlug={currentPageSlug}
            pageData={currentPage}
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
