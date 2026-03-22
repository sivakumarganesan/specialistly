import React, { useState } from 'react';
import { PageSection } from '@/app/hooks/usePageBuilder';

interface GalleryImage {
  id: string;
  url: string;
  caption?: string;
}

export const GallerySectionPreview: React.FC<{ section: PageSection }> = ({ section }) => {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  const images: GalleryImage[] = section.content?.images || [];
  const columns = section.content?.columns || 3;
  const title = section.title || section.content?.title || '';
  const description = section.description || section.content?.description || '';
  const bgColor = section.styling?.backgroundColor || section.content?.backgroundColor || '#ffffff';
  const titleColor = section.content?.titleColor || '#111827';
  const descColor = section.content?.descriptionColor || '#4b5563';

  const gridCols =
    columns === 1 ? 'grid-cols-1'
    : columns === 2 ? 'grid-cols-1 sm:grid-cols-2'
    : columns === 4 ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4'
    : 'grid-cols-2 sm:grid-cols-3';

  if (images.length === 0) {
    return (
      <div className="py-16 px-4 text-center" style={{ backgroundColor: bgColor }}>
        <h2 className="text-2xl font-bold mb-2" style={{ color: titleColor }}>
          {title || 'Gallery'}
        </h2>
        {description && <p className="mb-6" style={{ color: descColor }}>{description}</p>}
        <div className="max-w-md mx-auto border-2 border-dashed border-gray-300 rounded-lg p-8">
          <p className="text-gray-400 text-sm">No images yet. Add images in the properties panel.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-16 px-4" style={{ backgroundColor: bgColor }}>
      <div className="max-w-6xl mx-auto">
        {title && (
          <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-center" style={{ color: titleColor }}>
            {title}
          </h2>
        )}
        {description && (
          <p className="text-lg mb-10 text-center" style={{ color: descColor }}>
            {description}
          </p>
        )}

        <div className={`grid ${gridCols} gap-4`}>
          {images.map((img, idx) => (
            <div
              key={img.id || idx}
              className="group relative overflow-hidden rounded-lg cursor-pointer aspect-square"
              onClick={() => setLightboxIdx(idx)}
            >
              <img
                src={img.url}
                alt={img.caption || `Gallery image ${idx + 1}`}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              {img.caption && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                  <p className="text-white text-sm">{img.caption}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {lightboxIdx !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setLightboxIdx(null)}
        >
          <button
            className="absolute top-4 right-4 text-white text-3xl font-bold hover:text-gray-300 z-10"
            onClick={() => setLightboxIdx(null)}
            aria-label="Close"
          >
            &times;
          </button>

          {images.length > 1 && (
            <>
              <button
                className="absolute left-4 text-white text-4xl font-bold hover:text-gray-300 z-10"
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIdx((lightboxIdx - 1 + images.length) % images.length);
                }}
                aria-label="Previous"
              >
                &#8249;
              </button>
              <button
                className="absolute right-4 text-white text-4xl font-bold hover:text-gray-300 z-10"
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIdx((lightboxIdx + 1) % images.length);
                }}
                aria-label="Next"
              >
                &#8250;
              </button>
            </>
          )}

          <div className="max-w-4xl max-h-[90vh] p-4" onClick={(e) => e.stopPropagation()}>
            <img
              src={images[lightboxIdx].url}
              alt={images[lightboxIdx].caption || ''}
              className="max-w-full max-h-[80vh] object-contain rounded-lg"
            />
            {images[lightboxIdx].caption && (
              <p className="text-white text-center mt-3">{images[lightboxIdx].caption}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default GallerySectionPreview;
