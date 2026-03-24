import React, { useState, useRef, useEffect, useCallback } from 'react';
import { PageSection } from '@/app/hooks/usePageBuilder';

interface VideoItem {
  id: string;
  url: string;
  title: string;
  description?: string;
  personName?: string;
  personRole?: string;
}

/** Extract YouTube video ID from various URL formats */
const getYouTubeId = (url: string): string | null => {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtube\.com\/embed\/|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
};

const getThumbnail = (videoId: string) =>
  `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

/** Lazy-loaded video thumbnail that only renders when in viewport */
const LazyThumbnail: React.FC<{ videoId: string; alt: string }> = ({ videoId, alt }) => {
  const imgRef = useRef<HTMLImageElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [src, setSrc] = useState('');

  useEffect(() => {
    const el = imgRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSrc(getThumbnail(videoId));
          observer.disconnect();
        }
      },
      { rootMargin: '200px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [videoId]);

  return (
    <img
      ref={imgRef}
      src={src}
      alt={alt}
      className={`w-full h-full object-cover transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}
      onLoad={() => setLoaded(true)}
      onError={(e) => {
        // Fallback to hqdefault if maxresdefault not available
        const t = e.target as HTMLImageElement;
        if (t.src.includes('maxresdefault')) {
          t.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
        }
      }}
    />
  );
};

/** Person avatar with initials fallback */
const PersonAvatar: React.FC<{ name: string; accentColor: string }> = ({ name, accentColor }) => {
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return (
    <div
      className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0"
      style={{ background: `linear-gradient(135deg, ${accentColor}, ${accentColor}dd)` }}
    >
      {initials}
    </div>
  );
};

// Premium Video Testimonial Preview Component
export const VideoGallerySectionPreview: React.FC<{ section: PageSection }> = ({ section }) => {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [lightboxVideo, setLightboxVideo] = useState<VideoItem | null>(null);
  const videos = (section.content?.videos || []) as VideoItem[];
  const layout = section.content?.layout || 'grid';
  const columns = section.content?.columns || 2;
  const accentColor = section.content?.accentColor || '#0ea5e9';
  const bgColor = section.styling?.backgroundColor || '#f8fafc';

  const isDark = (() => {
    const c = bgColor.replace('#', '');
    if (c.length < 6) return false;
    const r = parseInt(c.substring(0, 2), 16) / 255;
    const g = parseInt(c.substring(2, 4), 16) / 255;
    const b = parseInt(c.substring(4, 6), 16) / 255;
    return 0.299 * r + 0.587 * g + 0.114 * b < 0.4;
  })();

  const titleColor = section.content?.titleColor || (isDark ? '#ffffff' : '#0f172a');
  const subtitleColor = section.content?.descriptionColor || (isDark ? 'rgba(255,255,255,0.65)' : '#64748b');
  const cardBg = isDark ? 'rgba(255,255,255,0.06)' : '#ffffff';
  const cardBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
  const cardTextColor = isDark ? '#f1f5f9' : '#0f172a';
  const cardDescColor = isDark ? 'rgba(255,255,255,0.6)' : '#475569';
  const personNameColor = isDark ? '#e2e8f0' : '#1e293b';
  const personRoleColor = isDark ? 'rgba(255,255,255,0.5)' : '#94a3b8';

  const gridCols =
    columns === 1 ? 'grid-cols-1' :
    columns === 3 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' :
    columns === 4 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4' :
    'grid-cols-1 md:grid-cols-2';

  const closeLightbox = useCallback(() => {
    setLightboxVideo(null);
  }, []);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox();
    };
    if (lightboxVideo) {
      window.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [lightboxVideo, closeLightbox]);

  const TestimonialCard = ({ video, featured = false }: { video: VideoItem; featured?: boolean }) => {
    const videoId = getYouTubeId(video.url);
    const isPlaying = playingId === video.id;
    const hasQuote = video.description && video.description.length > 0;

    return (
      <div
        className={`group rounded-2xl overflow-hidden transition-all duration-500 hover:-translate-y-1 ${featured ? 'md:col-span-2' : ''}`}
        style={{
          backgroundColor: cardBg,
          border: `1px solid ${cardBorder}`,
          boxShadow: isDark
            ? '0 4px 24px rgba(0,0,0,0.3)'
            : '0 1px 3px rgba(0,0,0,0.04), 0 8px 32px rgba(0,0,0,0.06)',
        }}
      >
        {/* Video Thumbnail / Player */}
        <div className="relative" style={{ aspectRatio: featured ? '2/1' : '16/9' }}>
          {isPlaying && videoId ? (
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`}
              title={video.title}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              loading="lazy"
            />
          ) : videoId ? (
            <div
              className="relative w-full h-full cursor-pointer group/play"
              onClick={() => setPlayingId(video.id)}
            >
              <LazyThumbnail videoId={videoId} alt={video.title || 'Video testimonial'} />
              {/* Gradient overlay */}
              <div
                className="absolute inset-0 transition-opacity duration-300"
                style={{
                  background: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.1) 40%, transparent 70%)',
                }}
              />
              {/* Duration-style pill */}
              <div className="absolute top-3 right-3 px-2 py-0.5 bg-black/60 backdrop-blur-sm rounded text-white text-[11px] font-medium tracking-wide">
                VIDEO
              </div>
              {/* Play button */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center shadow-xl transition-all duration-300 group-hover/play:scale-110 group-hover/play:shadow-2xl"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.95)',
                    backdropFilter: 'blur(8px)',
                  }}
                >
                  <svg className="w-6 h-6 ml-0.5" style={{ color: accentColor }} fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
              {/* Bottom title overlay on featured cards */}
              {featured && video.title && (
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <h3 className="text-white font-bold text-xl drop-shadow-md line-clamp-2">{video.title}</h3>
                </div>
              )}
            </div>
          ) : (
            <div
              className="w-full h-full flex items-center justify-center"
              style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#f1f5f9' }}
            >
              <div className="text-center p-6">
                <div
                  className="w-14 h-14 rounded-full mx-auto mb-3 flex items-center justify-center"
                  style={{ backgroundColor: `${accentColor}12` }}
                >
                  <svg className="w-7 h-7" style={{ color: accentColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-sm font-medium" style={{ color: subtitleColor }}>Paste a YouTube link</p>
              </div>
            </div>
          )}
        </div>

        {/* Content area */}
        <div className="p-5">
          {/* Quote / Description */}
          {hasQuote && (
            <div className="relative mb-4">
              <svg
                className="absolute -top-1 -left-1 w-6 h-6 opacity-15"
                style={{ color: accentColor }}
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10H14.017zM0 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151C7.546 6.068 5.983 8.789 5.983 11H10v10H0z" />
              </svg>
              <p
                className="text-sm leading-relaxed pl-5 italic"
                style={{ color: cardDescColor }}
              >
                {video.description}
              </p>
            </div>
          )}

          {/* Title (non-featured) */}
          {!featured && video.title && (
            <h3
              className="font-semibold text-[15px] leading-snug mb-3 line-clamp-2"
              style={{ color: cardTextColor }}
            >
              {video.title}
            </h3>
          )}

          {/* Person info */}
          {(video.personName || video.title) && (
            <div className="flex items-center gap-3">
              <PersonAvatar
                name={video.personName || video.title || 'V'}
                accentColor={accentColor}
              />
              <div className="min-w-0">
                <p
                  className="font-semibold text-sm truncate"
                  style={{ color: personNameColor }}
                >
                  {video.personName || 'Anonymous'}
                </p>
                {video.personRole && (
                  <p
                    className="text-xs truncate"
                    style={{ color: personRoleColor }}
                  >
                    {video.personRole}
                  </p>
                )}
              </div>
              {/* Expand button */}
              {videoId && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setLightboxVideo(video);
                  }}
                  className="ml-auto w-8 h-8 rounded-full flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100"
                  style={{
                    backgroundColor: `${accentColor}10`,
                    color: accentColor,
                  }}
                  title="Watch fullscreen"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                  </svg>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="py-20 px-4" style={{ backgroundColor: bgColor }}>
      <div className="max-w-6xl mx-auto">
        {/* Section header */}
        {(section.content?.title || section.content?.description) && (
          <div className="text-center mb-14">
            {section.content?.title && (
              <h2
                className="text-3xl sm:text-4xl font-bold tracking-tight mb-4"
                style={{ color: titleColor }}
              >
                {section.content.title}
              </h2>
            )}
            {section.content?.description && (
              <p
                className="text-lg max-w-2xl mx-auto leading-relaxed"
                style={{ color: subtitleColor }}
              >
                {section.content.description}
              </p>
            )}
            {/* Decorative accent line */}
            <div
              className="w-16 h-1 rounded-full mx-auto mt-6"
              style={{ backgroundColor: accentColor }}
            />
          </div>
        )}

        {videos.length === 0 ? (
          <div className="text-center py-16">
            <div
              className="w-20 h-20 rounded-2xl mx-auto mb-5 flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${accentColor}15, ${accentColor}08)`,
                border: `1px dashed ${accentColor}30`,
              }}
            >
              <svg className="w-9 h-9" style={{ color: accentColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="font-medium text-base mb-1" style={{ color: cardTextColor }}>No testimonials yet</p>
            <p className="text-sm" style={{ color: subtitleColor }}>
              Add video testimonials in the properties panel
            </p>
          </div>
        ) : layout === 'featured' && videos.length > 0 ? (
          <div className={`grid gap-6 ${gridCols}`}>
            <TestimonialCard video={videos[0]} featured />
            {videos.slice(1).map((video) => (
              <TestimonialCard key={video.id} video={video} />
            ))}
          </div>
        ) : (
          <div className={`grid gap-6 ${gridCols}`}>
            {videos.map((video) => (
              <TestimonialCard key={video.id} video={video} />
            ))}
          </div>
        )}
      </div>

      {/* Fullscreen Lightbox */}
      {lightboxVideo && (() => {
        const videoId = getYouTubeId(lightboxVideo.url);
        if (!videoId) return null;
        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={closeLightbox}
          >
            <div className="absolute inset-0 bg-black/85 backdrop-blur-sm" />
            <div
              className="relative max-w-5xl w-full rounded-2xl overflow-hidden"
              style={{ boxShadow: '0 32px 64px rgba(0,0,0,0.5)' }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={closeLightbox}
                className="absolute -top-12 right-0 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors backdrop-blur-sm"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <div style={{ aspectRatio: '16/9' }}>
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`}
                  title={lightboxVideo.title}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
              {/* Info bar below video */}
              <div className="bg-white/5 backdrop-blur-md px-6 py-4 flex items-center gap-4">
                {lightboxVideo.personName && (
                  <PersonAvatar name={lightboxVideo.personName} accentColor={accentColor} />
                )}
                <div className="min-w-0">
                  <p className="text-white font-semibold text-base truncate">
                    {lightboxVideo.title || 'Video Testimonial'}
                  </p>
                  <p className="text-white/60 text-sm truncate">
                    {lightboxVideo.personName}
                    {lightboxVideo.personRole ? ` — ${lightboxVideo.personRole}` : ''}
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default VideoGallerySectionPreview;
