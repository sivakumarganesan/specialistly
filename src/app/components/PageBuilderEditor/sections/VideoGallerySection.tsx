import React, { useState } from 'react';
import { PageSection } from '@/app/hooks/usePageBuilder';

interface VideoItem {
  id: string;
  url: string;
  title: string;
  description?: string;
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
  `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

// Preview Component
export const VideoGallerySectionPreview: React.FC<{ section: PageSection }> = ({ section }) => {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null);
  const videos = (section.content?.videos || []) as VideoItem[];
  const layout = section.content?.layout || 'grid';
  const columns = section.content?.columns || 3;
  const accentColor = section.content?.accentColor || '#FF0000';
  const bgColor = section.styling?.backgroundColor || '#ffffff';

  const isDark = (() => {
    const c = bgColor.replace('#', '');
    if (c.length < 6) return false;
    const r = parseInt(c.substring(0, 2), 16) / 255;
    const g = parseInt(c.substring(2, 4), 16) / 255;
    const b = parseInt(c.substring(4, 6), 16) / 255;
    return 0.299 * r + 0.587 * g + 0.114 * b < 0.4;
  })();

  const titleColor = isDark ? '#ffffff' : '#111827';
  const subtitleColor = isDark ? 'rgba(255,255,255,0.7)' : '#6b7280';
  const cardBg = isDark ? 'rgba(255,255,255,0.08)' : '#ffffff';
  const cardBorder = isDark ? 'rgba(255,255,255,0.1)' : '#e5e7eb';
  const cardTextColor = isDark ? '#ffffff' : '#111827';
  const cardDescColor = isDark ? 'rgba(255,255,255,0.7)' : '#4b5563';

  const gridCols =
    columns === 1 ? 'grid-cols-1' :
    columns === 2 ? 'grid-cols-1 sm:grid-cols-2' :
    columns === 4 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4' :
    'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';

  const VideoCard = ({ video }: { video: VideoItem }) => {
    const videoId = getYouTubeId(video.url);
    const isPlaying = playingId === video.id;

    return (
      <div
        className="group rounded-xl overflow-hidden transition-all duration-300 hover:-translate-y-1"
        style={{
          backgroundColor: cardBg,
          border: `1px solid ${cardBorder}`,
          boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
        }}
      >
        {/* Video / Thumbnail area */}
        <div className="relative" style={{ aspectRatio: '16/9' }}>
          {isPlaying && videoId ? (
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`}
              title={video.title}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : videoId ? (
            <div
              className="relative w-full h-full cursor-pointer group/play"
              onClick={() => setPlayingId(video.id)}
            >
              <img
                src={getThumbnail(videoId)}
                alt={video.title}
                className="w-full h-full object-cover"
              />
              {/* Play button overlay */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover/play:bg-black/30 transition-colors">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-transform group-hover/play:scale-110"
                  style={{ backgroundColor: accentColor }}
                >
                  <svg className="w-7 h-7 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
            </div>
          ) : (
            <div
              className="w-full h-full flex items-center justify-center"
              style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f3f4f6' }}
            >
              <div className="text-center">
                <svg className="w-12 h-12 mx-auto mb-2" style={{ color: subtitleColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <p className="text-sm" style={{ color: subtitleColor }}>Invalid URL</p>
              </div>
            </div>
          )}
        </div>

        {/* Info area */}
        <div className="px-4 py-3">
          <h3 className="font-semibold text-base line-clamp-2" style={{ color: cardTextColor }}>
            {video.title || 'Untitled Video'}
          </h3>
          {video.description && (
            <p className="text-sm mt-1 line-clamp-2" style={{ color: cardDescColor }}>
              {video.description}
            </p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="py-16 px-4" style={{ backgroundColor: bgColor }}>
      <div className="max-w-6xl mx-auto">
        {section.content?.title && (
          <h2 className="text-3xl sm:text-4xl font-bold mb-3 text-center" style={{ color: titleColor }}>
            {section.content.title}
          </h2>
        )}
        {section.content?.description && (
          <p className="text-lg mb-12 text-center max-w-2xl mx-auto" style={{ color: subtitleColor }}>
            {section.content.description}
          </p>
        )}

        {videos.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: `${accentColor}15` }}>
              <svg className="w-8 h-8" style={{ color: accentColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <p style={{ color: subtitleColor }}>No videos added yet</p>
            <p className="text-sm mt-1" style={{ color: subtitleColor }}>Select this section and add YouTube links in the properties panel</p>
          </div>
        ) : layout === 'featured' && videos.length > 0 ? (
          // Featured layout: one large + rest in grid below
          <div className="space-y-6">
            <div className="max-w-4xl mx-auto">
              <VideoCard video={videos[0]} />
            </div>
            {videos.length > 1 && (
              <div className={`grid gap-6 ${gridCols}`}>
                {videos.slice(1).map((video) => (
                  <VideoCard key={video.id} video={video} />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className={`grid gap-6 ${gridCols}`}>
            {videos.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        )}
      </div>

      {/* Lightbox modal for selected video */}
      {selectedVideo && (() => {
        const videoId = getYouTubeId(selectedVideo.url);
        if (!videoId) return null;
        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedVideo(null)}
          >
            <div className="absolute inset-0 bg-black/80" />
            <div
              className="relative max-w-4xl w-full rounded-2xl overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setSelectedVideo(null)}
                className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors"
              >
                ✕
              </button>
              <div style={{ aspectRatio: '16/9' }}>
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`}
                  title={selectedVideo.title}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default VideoGallerySectionPreview;
