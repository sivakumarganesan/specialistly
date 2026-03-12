import React, { useState, useEffect } from 'react';
import { Page, PageSection } from '@/app/hooks/usePageBuilder';
import { HeroSectionPreview } from './PageBuilderEditor/sections/HeroSection';
import { ServicesSectionPreview } from './PageBuilderEditor/sections/ServicesSection';
import { CoursesSectionPreview } from './PageBuilderEditor/sections/CoursesSection';
import { AboutSectionPreview } from './PageBuilderEditor/sections/AboutSection';

const SectionRenderer: React.FC<{ section: PageSection }> = ({ section }) => {
  switch (section.type) {
    case 'hero':
      return <HeroSectionPreview section={section} />;
    case 'about':
      return <AboutSectionPreview section={section} />;
    case 'services':
      return <ServicesSectionPreview section={section} />;
    case 'courses':
      return <CoursesSectionPreview section={section} />;
    case 'cta':
      return (
        <div
          className="py-16 px-4 text-center text-white"
          style={{
            backgroundColor: section.content?.backgroundColor || '#3B82F6',
          }}
        >
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold mb-4">{section.title}</h2>
            {section.description && (
              <p className="text-lg mb-8 opacity-90">{section.description}</p>
            )}
            {section.content?.buttonText && (
              <button className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                {section.content.buttonText}
              </button>
            )}
          </div>
        </div>
      );
    case 'contact':
      return (
        <div className="py-16 px-4" style={{ backgroundColor: section.content?.backgroundColor || '#f9fafb' }}>
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold mb-4">{section.title}</h2>
            {section.description && (
              <p className="text-gray-600 mb-8">{section.description}</p>
            )}
            <div className="space-y-4">
              {section.content?.email && (
                <p>
                  <strong>Email:</strong> <a href={`mailto:${section.content.email}`} className="text-blue-600 hover:underline">{section.content.email}</a>
                </p>
              )}
              {section.content?.phone && (
                <p>
                  <strong>Phone:</strong> <a href={`tel:${section.content.phone}`} className="text-blue-600 hover:underline">{section.content.phone}</a>
                </p>
              )}
              {section.content?.address && (
                <p>
                  <strong>Address:</strong> {section.content.address}
                </p>
              )}
            </div>
          </div>
        </div>
      );
    case 'testimonials':
      return (
        <div className="py-16 px-4" style={{ backgroundColor: section.content?.backgroundColor || '#ffffff' }}>
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold mb-4 text-center">{section.title}</h2>
            {section.description && (
              <p className="text-gray-600 mb-12 text-center">{section.description}</p>
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {(section.content?.testimonials || []).map((testimonial: any) => (
                <div key={testimonial.id} className="bg-gray-50 p-6 rounded-lg">
                  <div className="flex items-center gap-3 mb-4">
                    {testimonial.image ? (
                      <img
                        src={testimonial.image}
                        alt={testimonial.name}
                        className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-blue-600 font-semibold text-lg">
                          {testimonial.name?.charAt(0)?.toUpperCase() || '?'}
                        </span>
                      </div>
                    )}
                    <div>
                      <p className="font-semibold">{testimonial.name}</p>
                      <p className="text-sm text-gray-600">{testimonial.title}</p>
                    </div>
                  </div>
                  <p className="text-gray-700">{testimonial.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    case 'pricing':
      return (
        <div className="py-16 px-4" style={{ backgroundColor: section.content?.backgroundColor || '#f9fafb' }}>
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold mb-4 text-center">{section.title}</h2>
            {section.description && (
              <p className="text-gray-600 mb-12 text-center">{section.description}</p>
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {(section.content?.plans || []).map((plan: any) => (
                <div key={plan.id} className="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                  <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                  <p className="text-3xl font-bold text-blue-600 mb-4">{plan.price}</p>
                  <p className="text-gray-600 mb-6">{plan.description}</p>
                  <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-semibold transition-colors">
                    Get Started
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    case 'faq':
      return (
        <div className="py-16 px-4" style={{ backgroundColor: section.content?.backgroundColor || '#ffffff' }}>
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold mb-4 text-center">{section.title}</h2>
            {section.description && (
              <p className="text-gray-600 mb-12 text-center">{section.description}</p>
            )}
            <div className="space-y-4">
              {(section.content?.faqs || []).map((faq: any) => (
                <details key={faq.id} className="bg-gray-50 p-4 rounded-lg cursor-pointer">
                  <summary className="font-semibold text-gray-900">{faq.question}</summary>
                  <p className="text-gray-600 mt-3">{faq.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </div>
      );
    case 'newsletter':
      return (
        <div className="py-16 px-4" style={{ backgroundColor: section.content?.backgroundColor || '#eff6ff' }}>
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">{section.title}</h2>
            {section.description && (
              <p className="text-gray-600 mb-8">{section.description}</p>
            )}
            <div className="flex gap-2">
              <input
                type="email"
                placeholder={section.content?.placeholder || 'Enter your email'}
                className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors">
                {section.content?.buttonText || 'Subscribe'}
              </button>
            </div>
          </div>
        </div>
      );
    default:
      return (
        <div className="py-16 px-4 text-center" style={{ backgroundColor: section.content?.backgroundColor || '#f3f4f6' }}>
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-2">{section.title}</h2>
            {section.description && (
              <p className="text-gray-600">{section.description}</p>
            )}
          </div>
        </div>
      );
  }
};

interface PublicPageViewerProps {
  subdomain: string;
  pageSlug: string;
}

export const PublicPageViewer: React.FC<PublicPageViewerProps> = ({ subdomain, pageSlug }) => {
  const [page, setPage] = useState<any>(null);
  const [website, setWebsite] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPublicPage = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/public/page/${subdomain}/${pageSlug}`);
        
        if (!response.ok) {
          throw new Error(response.status === 404 ? 'Page not found' : 'Failed to load page');
        }

        const data = await response.json();
        setWebsite(data.data.website);
        setPage(data.data.page);
        
        // Update page data with sections
        const pageWithSections = {
          ...data.data.page,
          sections: data.data.sections || [],
        };
        setPage(pageWithSections);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load page');
      } finally {
        setIsLoading(false);
      }
    };

    loadPublicPage();
  }, [subdomain, pageSlug]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading page...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 text-lg mb-4">{error}</p>
          <a href="/" className="text-blue-600 hover:underline">
            Go back home
          </a>
        </div>
      </div>
    );
  }

  if (!page || !website) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600 text-lg">Page not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-white" style={{ fontFamily: "'Segoe UI', 'Trebuchet MS', system-ui, -apple-system, sans-serif" }}>
      {/* Page content - NO DUPLICATE HEADER (handled by PublicWebsite) */}
      <main className="min-h-screen">
        {page.sections && page.sections.length > 0 ? (
          [...page.sections]
            .sort((a: PageSection, b: PageSection) => a.order - b.order)
            .map((section: PageSection) => (
              <SectionRenderer key={section._id} section={section} />
            ))
        ) : (
          <div className="flex items-center justify-center h-96 bg-gray-50">
            <p className="text-gray-600">No content available for this page</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer style={{ backgroundColor: website?.branding?.footerBgColor || '#111827', color: website?.branding?.footerTextColor || '#ffffff' }} className="py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p>&copy; {new Date().getFullYear()} {website.branding?.siteName || 'Website'}. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default PublicPageViewer;
