import React from 'react';
import { Page, PageSection } from '@/app/hooks/usePageBuilder';
import { Website } from '@/app/hooks/usePageBuilder';
import { HeroSectionPreview } from './sections/HeroSection';
import { ServicesSectionPreview } from './sections/ServicesSection';

interface PreviewModeProps {
  page: Page;
  website?: Website;
}

const SectionRenderer: React.FC<{ section: PageSection }> = ({ section }) => {
  switch (section.type) {
    case 'hero':
      return <HeroSectionPreview section={section} />;
    case 'services':
      return <ServicesSectionPreview section={section} />;
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
        <div className="py-16 px-4 bg-gray-50">
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
        <div className="py-16 px-4 bg-white">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold mb-4 text-center">{section.title}</h2>
            {section.description && (
              <p className="text-gray-600 mb-12 text-center">{section.description}</p>
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {(section.content?.testimonials || []).map((testimonial: any) => (
                <div key={testimonial.id} className="bg-gray-50 p-6 rounded-lg">
                  <div className="flex items-center mb-4">
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
        <div className="py-16 px-4 bg-gray-50">
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
        <div className="py-16 px-4 bg-white">
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
        <div className="py-16 px-4 bg-blue-50">
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
    case 'gallery':
      return (
        <div className="py-16 px-4 bg-gray-50">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold mb-4">{section.title}</h2>
            {section.description && (
              <p className="text-gray-600 mb-12">{section.description}</p>
            )}
            <div className="grid gap-4" style={{
              gridTemplateColumns: `repeat(${section.content?.columns || 3}, minmax(0, 1fr))`,
            }}>
              {/* Gallery items would go here */}
            </div>
          </div>
        </div>
      );
    default:
      return (
        <div className="py-16 px-4 bg-gray-100 text-center">
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

export const PreviewMode: React.FC<PreviewModeProps> = ({ page, website }) => {
  if (!page.sections || page.sections.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600 text-lg">No sections yet. Add sections to preview.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-white overflow-auto" style={{ height: 'calc(100vh - 120px)' }}>
      <div className="min-h-full">
        {/* Render in order */}
        {[...page.sections]
          .sort((a, b) => a.order - b.order)
          .map((section) => (
            <SectionRenderer key={section._id} section={section} />
          ))}
      </div>
    </div>
  );
};

export default PreviewMode;
