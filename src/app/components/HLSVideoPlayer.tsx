import { useEffect, useRef, useState } from 'react';
import { AlertCircle } from 'lucide-react';

interface HLSVideoPlayerProps {
  hlsUrl: string;
  posterUrl?: string;
  title?: string;
  onTimeUpdate?: (time: number) => void;
  onDurationChange?: (duration: number) => void;
  onError?: (error: string) => void;
  autoplay?: boolean;
  controls?: boolean;
  className?: string;
}

/**
 * HLS Video Player Component
 * Plays HTTP Live Streaming (HLS) videos using hls.js
 * Provides adaptive bitrate streaming and fallback to native video support
 */
export function HLSVideoPlayer({
  hlsUrl,
  posterUrl,
  title = 'Video Player',
  onTimeUpdate,
  onDurationChange,
  onError,
  autoplay = false,
  controls = true,
  className = '',
}: HLSVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !hlsUrl) return;

    let hls: any = null;
    setError(null);
    setIsLoading(true);

    const initHls = async () => {
      try {
        // Dynamically import hls.js
        const HLS = (await import('hls.js')).default;

        // Check if HLS is supported
        if (HLS.isSupported()) {
          hls = new HLS({
            debug: false,
            enableWorker: true,
            lowLevelLogger: console,
          });

          // Handle HLS errors
          hls.on(HLS.Events.ERROR, (event: any, data: any) => {
            console.error('HLS Error:', data);
            
            if (data.fatal) {
              switch (data.type) {
                case HLS.ErrorTypes.NETWORK_ERROR:
                  setError('Network error: Could not load the video');
                  onError?.('Network error');
                  break;
                case HLS.ErrorTypes.MEDIA_ERROR:
                  setError('Media error: Video format not supported');
                  onError?.('Media error');
                  break;
                default:
                  setError('Error loading video');
                  onError?.('Unknown error');
                  break;
              }
            }
          });

          hls.on(HLS.Events.MANIFEST_PARSED, () => {
            setIsLoading(false);
            if (autoplay) {
              video.play().catch(err => {
                console.error('Autoplay failed:', err);
              });
            }
          });

          hls.loadSource(hlsUrl);
          hls.attachMedia(video);
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          // Native HLS support (Safari)
          video.src = hlsUrl;
          setIsLoading(false);
          if (autoplay) {
            video.play().catch(err => {
              console.error('Autoplay failed:', err);
            });
          }
        } else {
          setError('HLS streaming is not supported in your browser');
          onError?.('Browser not supported');
        }
      } catch (err) {
        console.error('Failed to initialize HLS:', err);
        setError('Failed to load hls.js library');
        onError?.('Library load error');
      }
    };

    initHls();

    return () => {
      if (hls) {
        hls.destroy();
      }
    };
  }, [hlsUrl, autoplay, onError]);

  const handleTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget;
    setCurrentTime(video.currentTime);
    onTimeUpdate?.(video.currentTime);
  };

  const handleDurationChange = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget;
    setDuration(video.duration);
    onDurationChange?.(video.duration);
  };

  const handlePlay = () => {
    setIsPlaying(true);
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  if (error) {
    return (
      <div className={`w-full bg-gray-900 rounded-lg overflow-hidden ${className}`}>
        <div className="aspect-video flex flex-col items-center justify-center bg-gray-800 p-6">
          <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
          <p className="text-white text-center font-medium">{error}</p>
          <p className="text-gray-400 text-sm mt-2 text-center max-w-md">
            Please try refreshing the page or contact support if the problem persists.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full bg-black rounded-lg overflow-hidden shadow-lg ${className}`}>
      {/* Video Container */}
      <div className="relative bg-black">
        <video
          ref={videoRef}
          className="w-full h-full"
          poster={posterUrl}
          controls={controls}
          onTimeUpdate={handleTimeUpdate}
          onDurationChange={handleDurationChange}
          onPlay={handlePlay}
          onPause={handlePause}
          controlsList="nodownload"
        />
        
        {/* Loading Spinner */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        )}

        {/* Video Title Overlay (when not playing) */}
        {!isPlaying && !isLoading && (
          <div className="absolute top-4 left-4 right-4 flex items-start">
            <span className="bg-indigo-600 text-white px-2 py-1 rounded text-sm font-medium truncate">
              {title}
            </span>
          </div>
        )}
      </div>

      {/* Custom Controls (Optional - if not using native controls) */}
      {!controls && (
        <div className="bg-gray-900 p-4 text-white text-sm">
          <div className="flex items-center justify-between">
            <span>{formatTime(currentTime)} / {formatTime(duration)}</span>
            <span className="text-gray-400">{title}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default HLSVideoPlayer;
