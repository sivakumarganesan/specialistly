import React, { useState, useEffect, useCallback } from 'react';
import { PageSection } from '@/app/hooks/usePageBuilder';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Textarea } from '@/app/components/ui/textarea';
import { Upload, X, ChevronLeft, ChevronRight } from 'lucide-react';

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

// Build a slides array — supports both legacy (single slide) and multi-slide content
function getSlides(content: any): any[] {
  // New multi-slide format
  if (Array.isArray(content?.slides) && content.slides.length > 0) {
    return content.slides;
  }
  // Legacy single-slide: build one slide from top-level fields
  return [{
    title: content?.title || '',
    accentText: content?.accentText || '',
    subtitle: content?.subtitle || '',
    ctaText: content?.ctaText || '',
    ctaLink: content?.ctaLink || '',
    backgroundImage: content?.backgroundImage || '',
    overlayImage: content?.overlayImage || '',
  }];
}

// Helper: detect if a hex color is dark (luminance < 0.4)
function isDarkColor(hex: string): boolean {
  const c = hex.replace('#', '');
  if (c.length < 6) return false;
  const r = parseInt(c.substring(0, 2), 16) / 255;
  const g = parseInt(c.substring(2, 4), 16) / 255;
  const b = parseInt(c.substring(4, 6), 16) / 255;
  const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
  return luminance < 0.4;
}

// Preview Component — slideshow with multiple slides
export const HeroSectionPreview: React.FC<{ section: PageSection }> = ({
  section,
}) => {
  const slides = getSlides(section.content);
  const accentColor = section.content?.accentColor || '#00b4d8';
  const bgColor = section.content?.backgroundColor || section.styling?.backgroundColor || '#f0f4f8';
  const darkBg = isDarkColor(bgColor);
  const autoplayInterval = (section.content?.autoplaySeconds || 5) * 1000;

  const [currentSlide, setCurrentSlide] = useState(0);

  // Auto-advance slides
  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, autoplayInterval);
    return () => clearInterval(timer);
  }, [slides.length, autoplayInterval]);

  const goTo = useCallback((idx: number) => setCurrentSlide(idx), []);
  const goPrev = useCallback(() => setCurrentSlide((p) => (p - 1 + slides.length) % slides.length), [slides.length]);
  const goNext = useCallback(() => setCurrentSlide((p) => (p + 1) % slides.length), [slides.length]);

  const slide = slides[currentSlide] || slides[0];
  const backgroundImage = slide?.backgroundImage;
  const overlayImage = slide?.overlayImage;
  const overlayMaxHeight = section.content?.overlayMaxHeight || 500;
  const titleColor = section.content?.titleColor || ((backgroundImage || darkBg) ? '#ffffff' : '#111827');
  const subtitleColor = section.content?.descriptionColor || ((backgroundImage || darkBg) ? 'rgba(255,255,255,0.85)' : '#4b5563');

  return (
    <div
      className="relative overflow-hidden"
      style={{ backgroundColor: bgColor, minHeight: `${Math.max(420, overlayMaxHeight + 40)}px` }}
    >
      {/* Background image — full-cover with gentle treatment */}
      {backgroundImage && (
        <>
          <img
            src={backgroundImage}
            alt=""
            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700"
            style={{
              filter: 'blur(2px) brightness(0.85)',
              transform: 'scale(1.02)',
            }}
          />
          {/* Gradient overlay: solid on text side, transparent on image side */}
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(to right, ${bgColor}ee 0%, ${bgColor}cc 40%, ${bgColor}44 70%, transparent 100%)`,
            }}
          />
        </>
      )}

      {/* When no background image, add a subtle gradient for depth */}
      {!backgroundImage && (
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, ${bgColor} 0%, ${bgColor} 50%, ${accentColor}10 100%)`,
          }}
        />
      )}

      {/* Content grid: text left, image right */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-8 lg:px-16 py-12 sm:py-16 lg:py-20 grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-center">
        {/* Left — Text content */}
        <div className="order-2 lg:order-1">
          {slide?.title && (
            <h1
              className="text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight mb-2"
              style={{ color: titleColor, whiteSpace: 'pre-line' }}
            >
              {slide.title}
            </h1>
          )}
          {slide?.accentText && (
            <p
              className="text-xl sm:text-2xl lg:text-3xl font-bold mb-4 sm:mb-6"
              style={{ color: accentColor }}
            >
              {slide.accentText}
            </p>
          )}
          {slide?.subtitle && (
            <p
              className="text-sm sm:text-base lg:text-lg mb-6 sm:mb-8 max-w-lg leading-relaxed"
              style={{ color: subtitleColor }}
            >
              {slide.subtitle}
            </p>
          )}
          {slide?.ctaText && (
            slide?.ctaLink ? (
              <a
                href={slide.ctaLink}
                target={slide.ctaLink.startsWith('http') ? '_blank' : undefined}
                rel={slide.ctaLink.startsWith('http') ? 'noopener noreferrer' : undefined}
                className="inline-block px-6 sm:px-8 py-3 rounded-lg font-semibold text-white transition-all hover:opacity-90 shadow-lg text-sm sm:text-base"
                style={{ backgroundColor: accentColor }}
              >
                {slide.ctaText}
              </a>
            ) : (
              <button
                className="px-6 sm:px-8 py-3 rounded-lg font-semibold text-white transition-all hover:opacity-90 shadow-lg text-sm sm:text-base"
                style={{ backgroundColor: accentColor }}
              >
                {slide.ctaText}
              </button>
            )
          )}
        </div>

        {/* Right — spacer to reserve grid column when overlay is absolute */}
        {overlayImage && <div className="order-1 lg:order-2 hidden lg:block" />}
      </div>

      {/* Overlay image — positioned absolutely to span full hero height on the right */}
      {overlayImage && (
        <div className="absolute right-0 top-0 bottom-0 w-1/2 hidden lg:flex items-start justify-center z-10 pointer-events-none">
          <img
            src={overlayImage}
            alt="Hero"
            className="w-auto object-contain"
            style={{
              height: `${overlayMaxHeight}px`,
              maxHeight: '100%',
              maxWidth: '90%',
              filter: 'drop-shadow(0 8px 30px rgba(0,0,0,0.25))',
            }}
          />
        </div>
      )}
      {/* Mobile overlay image */}
      {overlayImage && (
        <div className="relative z-10 flex justify-center px-6 -mt-4 mb-4 lg:hidden">
          <img
            src={overlayImage}
            alt="Hero"
            className="w-auto object-contain mx-auto"
            style={{
              maxHeight: `${Math.min(overlayMaxHeight, 350)}px`,
              maxWidth: '80%',
              filter: 'drop-shadow(0 8px 30px rgba(0,0,0,0.25))',
            }}
          />
        </div>
      )}

      {/* Navigation arrows (shown when >1 slide) */}
      {slides.length > 1 && (
        <>
          <button
            onClick={goPrev}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-20 bg-black/30 hover:bg-black/50 text-white rounded-full p-2 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={goNext}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-20 bg-black/30 hover:bg-black/50 text-white rounded-full p-2 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      {/* Dot indicators */}
      <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => goTo(idx)}
            className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full transition-colors ${
              idx === currentSlide ? '' : 'border-2 border-gray-400 bg-transparent'
            }`}
            style={idx === currentSlide ? { backgroundColor: accentColor } : {}}
          />
        ))}
      </div>
    </div>
  );
};

export default HeroSectionEditor;
