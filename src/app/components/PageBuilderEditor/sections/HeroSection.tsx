import React, { useState } from 'react';
import { PageSection } from '@/app/hooks/usePageBuilder';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Textarea } from '@/app/components/ui/textarea';
import { Upload, X } from 'lucide-react';

interface HeroSectionEditorProps {
  section: PageSection;
  onChange: (updates: Partial<PageSection>) => void;
}

export const HeroSectionEditor: React.FC<HeroSectionEditorProps> = ({
  section,
  onChange,
}) => {
  const [bgImagePreview, setBgImagePreview] = useState<string | null>(
    section.content?.backgroundImage || null
  );
  const [overlayImagePreview, setOverlayImagePreview] = useState<string | null>(
    section.content?.overlayImage || null
  );

  const handleBgImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageUrl = event.target?.result as string;
        setBgImagePreview(imageUrl);
        onChange({
          content: {
            ...section.content,
            backgroundImage: imageUrl,
          },
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOverlayImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageUrl = event.target?.result as string;
        setOverlayImagePreview(imageUrl);
        onChange({
          content: {
            ...section.content,
            overlayImage: imageUrl,
          },
        });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="font-bold mb-4">Background Image</h3>
        <p className="text-xs text-gray-500 mb-3">This image appears blurred behind the entire hero section</p>
        {bgImagePreview && (
          <div className="relative mb-4">
            <img
              src={bgImagePreview}
              alt="Hero background"
              className="w-full h-32 object-cover rounded-lg"
            />
            <button
              onClick={() => {
                setBgImagePreview(null);
                onChange({ content: { ...section.content, backgroundImage: null } });
              }}
              className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        <label className="flex items-center justify-center w-full px-4 py-6 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
          <div className="text-center">
            <Upload className="w-5 h-5 mx-auto mb-1 text-gray-400" />
            <span className="text-sm text-gray-600">Upload background image</span>
          </div>
          <input type="file" accept="image/*" onChange={handleBgImageUpload} className="hidden" />
        </label>
      </Card>

      <Card className="p-6">
        <h3 className="font-bold mb-4">Overlay Image</h3>
        <p className="text-xs text-gray-500 mb-3">This image appears on the right side of the hero, overlaid on the background</p>
        {overlayImagePreview && (
          <div className="relative mb-4">
            <img
              src={overlayImagePreview}
              alt="Hero overlay"
              className="w-full h-32 object-cover rounded-lg"
            />
            <button
              onClick={() => {
                setOverlayImagePreview(null);
                onChange({ content: { ...section.content, overlayImage: null } });
              }}
              className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        <label className="flex items-center justify-center w-full px-4 py-6 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
          <div className="text-center">
            <Upload className="w-5 h-5 mx-auto mb-1 text-gray-400" />
            <span className="text-sm text-gray-600">Upload overlay image</span>
          </div>
          <input type="file" accept="image/*" onChange={handleOverlayImageUpload} className="hidden" />
        </label>
      </Card>

      <Card className="p-6">
        <h3 className="font-bold mb-4">Content</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Title</label>
            <Input
              placeholder="Enter hero title"
              value={section.content?.title || ''}
              onChange={(e) =>
                onChange({ content: { ...section.content, title: e.target.value } })
              }
              className="text-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Accent Text</label>
            <Input
              placeholder="e.g., highlighted phrase"
              value={section.content?.accentText || ''}
              onChange={(e) =>
                onChange({ content: { ...section.content, accentText: e.target.value } })
              }
            />
            <p className="text-xs text-gray-500 mt-1">Displayed in accent color within the title area</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Subtitle</label>
            <Textarea
              placeholder="Enter hero subtitle"
              value={section.content?.subtitle || ''}
              onChange={(e) =>
                onChange({ content: { ...section.content, subtitle: e.target.value } })
              }
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">CTA Button Text</label>
            <Input
              placeholder="e.g., Get Started"
              value={section.content?.ctaText || ''}
              onChange={(e) =>
                onChange({ content: { ...section.content, ctaText: e.target.value } })
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">CTA Button Link</label>
            <Input
              placeholder="e.g., /services or https://example.com"
              value={section.content?.ctaLink || ''}
              onChange={(e) =>
                onChange({ content: { ...section.content, ctaLink: e.target.value } })
              }
            />
            <p className="text-xs text-gray-500 mt-1">Use /page-slug for site pages, or a full URL for external links</p>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="font-bold mb-4">Styling</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Accent Color</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={section.content?.accentColor || '#00b4d8'}
                onChange={(e) =>
                  onChange({ content: { ...section.content, accentColor: e.target.value } })
                }
                className="w-12 h-10 rounded cursor-pointer border border-gray-300"
              />
              <Input
                value={section.content?.accentColor || '#00b4d8'}
                onChange={(e) =>
                  onChange({ content: { ...section.content, accentColor: e.target.value } })
                }
                className="flex-1"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Min Height</label>
            <Input
              placeholder="e.g., 500px"
              value={section.styling?.minHeight || ''}
              onChange={(e) =>
                onChange({ styling: { ...section.styling, minHeight: e.target.value } })
              }
            />
          </div>
        </div>
      </Card>
    </div>
  );
};

// Preview Component — split layout with text left, overlay image right
export const HeroSectionPreview: React.FC<{ section: PageSection }> = ({
  section,
}) => {
  const backgroundImage = section.content?.backgroundImage;
  const overlayImage = section.content?.overlayImage;
  const bgColor = section.content?.backgroundColor || section.styling?.backgroundColor || '#f0f4f8';
  const accentColor = section.content?.accentColor || '#00b4d8';

  return (
    <div
      className="relative overflow-hidden"
      style={{ backgroundColor: bgColor }}
    >
      {/* Background image — uses an <img> for reliable mobile rendering */}
      {backgroundImage && (
        <>
          <img
            src={backgroundImage}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            style={{
              filter: 'blur(6px) brightness(0.92)',
              transform: 'scale(1.05)',
            }}
          />
          {/* Light overlay for readability */}
          <div className="absolute inset-0 bg-white/50" />
        </>
      )}

      {/* Content grid: text left, image right */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-8 lg:px-16 py-12 sm:py-16 lg:py-20 grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-center">
        {/* Left — Text content */}
        <div className="order-2 lg:order-1">
          {section.content?.title && (
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-2 text-gray-900">
              {section.content.title}
            </h1>
          )}
          {section.content?.accentText && (
            <p
              className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 sm:mb-6"
              style={{ color: accentColor }}
            >
              {section.content.accentText}
            </p>
          )}
          {section.content?.subtitle && (
            <p className="text-sm sm:text-base lg:text-lg text-gray-600 mb-6 sm:mb-8 max-w-lg leading-relaxed">
              »&nbsp; {section.content.subtitle}
            </p>
          )}
          {section.content?.ctaText && (
            section.content?.ctaLink ? (
              <a
                href={section.content.ctaLink}
                target={section.content.ctaLink.startsWith('http') ? '_blank' : undefined}
                rel={section.content.ctaLink.startsWith('http') ? 'noopener noreferrer' : undefined}
                className="inline-block px-6 sm:px-8 py-3 rounded-lg font-semibold text-white transition-all hover:opacity-90 shadow-lg text-sm sm:text-base"
                style={{ backgroundColor: accentColor }}
              >
                {section.content.ctaText}
              </a>
            ) : (
              <button
                className="px-6 sm:px-8 py-3 rounded-lg font-semibold text-white transition-all hover:opacity-90 shadow-lg text-sm sm:text-base"
                style={{ backgroundColor: accentColor }}
              >
                {section.content.ctaText}
              </button>
            )
          )}
        </div>

        {/* Right — Overlay image (visible on all screens) */}
        {overlayImage && (
          <div className="order-1 lg:order-2 flex justify-center lg:justify-end">
            <img
              src={overlayImage}
              alt="Hero"
              className="max-w-[70%] sm:max-w-[60%] lg:max-w-none lg:max-h-[480px] w-auto object-contain drop-shadow-2xl rounded-lg"
            />
          </div>
        )}
      </div>

      {/* Dot indicators */}
      <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full border-2 border-gray-400 bg-transparent" />
        <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full" style={{ backgroundColor: accentColor }} />
      </div>
    </div>
  );
};

export default HeroSectionEditor;
