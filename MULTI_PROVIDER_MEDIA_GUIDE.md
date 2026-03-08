# Multi-Provider Media System Documentation

## Overview

The Page Builder now supports **three media providers** for different use cases:

1. **S3** - General files and images (default)
2. **Cloudflare HLS** - Professional video streaming with HLS/DASH
3. **YouTube** - Embedded YouTube videos

---

## Architecture

### Backend Flow

```
Upload Request
    ↓
mediaRoutes.js (detects provider type)
    ↓
    ├─→ File upload? → mediaController.uploadMedia()
    │       ↓
    │   ├─→ provider='cloudflare' → uploadVideoToCloudflare()
    │   ├─→ provider='s3' → uploadMediaToS3()
    │   └─→ provider='youtube' → (error, needs URL)
    │
    └─→ JSON body with videoUrl? → mediaController.uploadMedia()
            ↓
        provider='youtube' → validateYouTubeVideo()
        provider='cloudflare' → (error, needs file)
        provider='s3' → (error, needs file)
```

### Storage Providers

| Provider   | Purpose | File Types | Max Size | Bandwidth | CDN |
|-----------|---------|-----------|----------|-----------|-----|
| **S3** | General files | Images, PDFs, docs | 100MB | Limited | Fast |
| **Cloudflare** | Video streaming | MP4, WebM, MOV | 5GB | Unlimited | Excellent |
| **YouTube** | Embedded videos | External links | N/A | YouTube's | YouTube's |

---

## Implementation

### Database Schema

```javascript
// New fields in MediaLibrary model
{
  // Core fields
  filename: String,
  originalName: String,
  fileType: String, // 'image', 'video', 'document', 'audio'
  url: String,
  
  // Provider field
  storageProvider: String, // 's3', 'cloudflare', 'youtube'
  
  // S3
  storageKey: String,
  
  // Cloudflare specific
  cloudflareId: String,              // Video UID
  cloudflarePlaylistUrl: String,     // HLS playlist
  
  // YouTube specific
  youtubeVideoId: String,            // Video ID
  embedUrl: String,                  // Embed URL
  
  // Metadata
  metadata: {
    uploadedVia: String,             // Provider used
    duration: Number,                // For videos
    width: Number,
    height: Number,
  }
}
```

---

## API Usage

### 1. Upload to S3 (Default)

**Images, PDFs, Documents**

```bash
curl -X POST "http://localhost:5000/api/page-builder/websites/{websiteId}/media/upload" \
  -H "Authorization: Bearer {token}" \
  -F "file=@image.jpg" \
  -F "provider=s3" \
  -F "tags=hero,banner" \
  -F "alt=Hero banner image"
```

**Frontend:**

```typescript
const media = await pageBuilderAPI.uploadMedia(
  websiteId,
  imageFile,
  ['hero', 'banner'],
  'Hero banner image',
  'Image showing the hero section'
);

console.log(media.data.url); // S3 URL
```

### 2. Upload to Cloudflare HLS

**Professional Video Streaming**

```bash
curl -X POST "http://localhost:5000/api/page-builder/websites/{websiteId}/media/upload" \
  -H "Authorization: Bearer {token}" \
  -F "file=@video.mp4" \
  -F "provider=cloudflare" \
  -F "title=Product Demo" \
  -F "tags=demo,product"
```

**Frontend:**

```typescript
const video = await pageBuilderAPI.uploadVideoToCloudflare(
  websiteId,
  videoFile,
  'Product Demo Video',
  ['demo', 'product'],
  'Product demonstration'
);

// Returns:
{
  cloudflareId: 'abc123def456',
  url: 'https://watch.cloudflarestream.com/abc123def456',
  hlsPlaylistUrl: 'https://..../manifest.m3u8',
  thumbnailUrl: 'https://..../thumbnail.jpg',
  duration: 120, // seconds
}
```

Use in video component:

```tsx
<video
  controls
  poster={video.thumbnailUrl}
  controlsList="nodownload"
>
  <source
    src={video.hlsPlaylistUrl}
    type="application/x-mpegURL"
  />
</video>
```

Or with HLSVideoPlayer component (recommended):

```tsx
<HLSVideoPlayer
  src={video.hlsPlaylistUrl}
  poster={video.thumbnailUrl}
  controls
/>
```

### 3. Add YouTube Videos

**Embed External YouTube Videos**

```bash
curl -X POST "http://localhost:5000/api/page-builder/websites/{websiteId}/media/upload" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "youtube",
    "videoUrl": "https://youtube.com/watch?v=dQw4w9WgXcQ",
    "title": "Never Gonna Give You Up",
    "tags": ["music", "classic"],
    "alt": "Rick Astley - Never Gonna Give You Up"
  }'
```

**Supported YouTube URL formats:**
- `https://www.youtube.com/watch?v=VIDEO_ID`
- `https://youtu.be/VIDEO_ID`
- `https://www.youtube.com/embed/VIDEO_ID`
- `VIDEO_ID` (direct ID)

**Frontend:**

```typescript
const youtubeVideo = await pageBuilderAPI.addYouTubeVideo(
  websiteId,
  'https://youtube.com/watch?v=dQw4w9WgXcQ',
  'Never Gonna Give You Up',
  ['music', 'classic'],
  'Rick Astley music video'
);

// Returns:
{
  provider: 'youtube',
  videoId: 'dQw4w9WgXcQ',
  embedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
  thumbnailUrl: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
}
```

Use in video component:

```tsx
<iframe
  width="100%"
  height="600"
  src={youtubeVideo.embedUrl}
  title={youtubeVideo.videoId}
  frameBorder="0"
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
  allowFullScreen
/>
```

---

## Media Library Response Format

When fetching media library:

```bash
GET /api/page-builder/websites/{websiteId}/media
```

Response:

```json
{
  "success": true,
  "data": [
    {
      "_id": "media123",
      "filename": "hero-image.jpg",
      "originalName": "hero-image.jpg",
      "fileType": "image",
      "url": "https://s3.amazonaws.com/...",
      "storageProvider": "s3",
      "storageKey": "media/specialist123/website456/...",
      "tags": ["hero", "banner"],
      "alt": "Hero image",
      "thumbnailUrl": null,
      "size": 145000,
      "createdAt": "2026-03-06T10:00:00Z"
    },
    {
      "_id": "media456",
      "filename": "product-demo.mp4",
      "originalName": "product-demo.mp4",
      "fileType": "video",
      "url": "https://watch.cloudflarestream.com/abc123def456",
      "storageProvider": "cloudflare",
      "cloudflareId": "abc123def456",
      "cloudflarePlaylistUrl": "https://..../manifest.m3u8",
      "thumbnailUrl": "https://..../thumbnail.jpg",
      "metadata": {
        "duration": 120,
        "uploadedVia": "cloudflare"
      },
      "tags": ["demo"],
      "createdAt": "2026-03-06T11:00:00Z"
    },
    {
      "_id": "media789",
      "filename": "Never Gonna Give You Up",
      "originalName": "Never Gonna Give You Up",
      "fileType": "video",
      "url": "https://www.youtube.com/embed/dQw4w9WgXcQ",
      "storageProvider": "youtube",
      "youtubeVideoId": "dQw4w9WgXcQ",
      "embedUrl": "https://www.youtube.com/embed/dQw4w9WgXcQ",
      "thumbnailUrl": "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
      "tags": ["music"],
      "createdAt": "2026-03-06T12:00:00Z"
    }
  ]
}
```

---

## Frontend Implementation

### Component Example: Media Uploader

```typescript
import { useState } from 'react';
import { pageBuilderAPI } from '@/app/api/pageBuilderAPI';

type Provider = 's3' | 'cloudflare' | 'youtube';

export const MediaUploader = ({ websiteId }) => {
  const [provider, setProvider] = useState<Provider>('s3');
  const [loading, setLoading] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState('');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      let result;

      if (provider === 'cloudflare') {
        result = await pageBuilderAPI.uploadVideoToCloudflare(
          websiteId,
          file,
          file.name
        );
      } else {
        result = await pageBuilderAPI.uploadMedia(
          websiteId,
          file,
          [],
          file.name
        );
      }

      console.log('Upload successful:', result);
      // Refresh media library here
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleYouTubeAdd = async () => {
    if (!youtubeUrl) return;

    setLoading(true);
    try {
      const result = await pageBuilderAPI.addYouTubeVideo(
        websiteId,
        youtubeUrl,
        'YouTube Video'
      );

      console.log('YouTube video added:', result);
      setYoutubeUrl('');
      // Refresh media library here
    } catch (error) {
      console.error('Failed to add YouTube video:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Provider selector */}
      <div>
        <label className="block text-sm font-medium mb-2">Provider</label>
        <select
          value={provider}
          onChange={(e) => setProvider(e.target.value as Provider)}
          className="w-full px-3 py-2 border rounded-lg"
        >
          <option value="s3">S3 (Images & Files)</option>
          <option value="cloudflare">Cloudflare (HLS Video)</option>
          <option value="youtube">YouTube (External)</option>
        </select>
      </div>

      {/* File upload */}
      {provider !== 'youtube' && (
        <div>
          <label className="block text-sm font-medium mb-2">Upload File</label>
          <input
            type="file"
            onChange={handleFileUpload}
            disabled={loading}
            accept={provider === 'cloudflare' ? 'video/*' : '*'}
            className="w-full"
          />
        </div>
      )}

      {/* YouTube URL input */}
      {provider === 'youtube' && (
        <div className="space-y-2">
          <label className="block text-sm font-medium">YouTube URL</label>
          <input
            type="text"
            placeholder="https://youtube.com/watch?v=..."
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
          />
          <button
            onClick={handleYouTubeAdd}
            disabled={loading || !youtubeUrl}
            className="w-full bg-blue-600 text-white py-2 rounded-lg disabled:opacity-50"
          >
            {loading ? 'Adding...' : 'Add YouTube Video'}
          </button>
        </div>
      )}

      {loading && <p className="text-sm text-gray-600">Uploading...</p>}
    </div>
  );
};
```

---

## Configuration

### Environment Variables

```bash
# S3
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_BUCKET_NAME=specialistly-media
AWS_REGION=us-east-1

# Cloudflare
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_API_TOKEN=your_api_token

# YouTube (no config needed - just validation)
```

### Max File Sizes

- **S3**: 100 MB (configurable)
- **Cloudflare**: 5 GB (Cloudflare limit)
- **YouTube**: No limit (external)

---

## Deletion Handling

When deleting media:

```typescript
await pageBuilderAPI.deleteMedia(websiteId, mediaId);
```

**Provider-specific behavior:**

| Provider | Action |
|----------|--------|
| **S3** | Deleted immediately from S3 |
| **Cloudflare** | Deleted from Cloudflare Stream |
| **YouTube** | No server-side deletion (external) |
| **All** | Soft-deleted in database (marked as `isDeleted: true`) |

---

## Best Practices

### 1. Choose Right Provider

```
Images/PDFs/Documents? → Use S3
Video streaming? → Use Cloudflare
External YouTube? → Use YouTube
```

### 2. Validate URLs

```typescript
// For YouTube
if (!youtubeUrl.includes('youtube') && !youtubeUrl.includes('youtu.be')) {
  setError('Please enter a valid YouTube URL');
}
```

### 3. Handle Large Files

```typescript
// Cloudflare can handle 5GB, S3 100MB
if (file.size > 100 * 1024 * 1024) {
  // Suggest Cloudflare for large videos
  setProvider('cloudflare');
}
```

### 4. Use Thumbnails

```typescript
// Always display thumbnail
<img
  src={media.thumbnailUrl || 'placeholder.jpg'}
  alt={media.alt || 'Media preview'}
  className="w-full h-auto"
/>
```

### 5. Error Handling

```typescript
try {
  const result = await pageBuilderAPI.uploadVideoToCloudflare(...);
} catch (error) {
  if (error.message.includes('credentials')) {
    setError('Cloudflare not configured');
  } else if (error.message.includes('file type')) {
    setError('Invalid file format');
  } else {
    setError(error.message);
  }
}
```

---

## Troubleshooting

### Cloudflare uploads failing
- Check `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN` in .env
- Verify Cloudflare credentials are correct
- Check file format (MP4, WebM, MOV only)
- File size limit is 5GB

### S3 uploads slow
- Check AWS credentials
- Verify S3 bucket permissions
- Consider Cloudflare for large videos

### YouTube URL validation fails
- Use full URL: `https://youtube.com/watch?v=ID`
- Or short URL: `https://youtu.be/ID`
- Or direct ID: `dQw4w9WgXcQ`

### Thumbnails not showing
- S3/YouTube use provided/generated thumbnails
- Cloudflare generates thumbnail after processing
- Check privacy settings on YouTube videos

---

## Performance Tips

1. **For images:** Use S3 (fast, CDN-backed)
2. **For large videos:** Use Cloudflare (streaming, no download)
3. **For external videos:** Use YouTube (no hosting cost)
4. **Lazy load thumbnails:** Load only when section visible
5. **Cache media metadata:** Store provider info to avoid re-fetching

---

## Future Enhancements

1. Vimeo support
2. Bunny CDN integration
3. Direct HLS stream input
4. Video transcoding
5. Automated quality levels
6. Analytics dashboard
7. Bandwidth monitoring
8. Automatic cleanup of unused media

