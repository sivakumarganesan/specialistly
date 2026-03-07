# Multi-Provider Media System Testing Guide

## Test Environment Setup

### Prerequisites
- Backend running on `http://localhost:5000`
- Postman or Insomnia installed
- Bearer token for authorization
- Website ID for testing

### Required Credentials

```env
# Add to .env for testing
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_BUCKET_NAME=specialistly-media
AWS_REGION=us-east-1
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_API_TOKEN=your_api_token
```

---

## Test Cases

### 1. S3 Upload Test

**Endpoint:** `POST http://localhost:5000/api/page-builder/websites/{websiteId}/media/upload`

**Headers:**
```
Authorization: Bearer {token}
```

**Body (Form-Data):**
```
file: [Select image.jpg]
provider: s3
tags: test,s3
alt: Test S3 image
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "_id": "media_id",
    "filename": "image.jpg",
    "fileType": "image",
    "url": "https://s3.amazonaws.com/...",
    "storageProvider": "s3",
    "storageKey": "media/...",
    "cloudflareId": null,
    "youtubeVideoId": null
  }
}
```

**Success Criteria:**
- ✅ Status code 200
- ✅ URL starts with `https://s3.amazonaws.com`
- ✅ storageProvider = 's3'
- ✅ File accessible via returned URL

---

### 2. S3 Document Upload Test

**Endpoint:** `POST http://localhost:5000/api/page-builder/websites/{websiteId}/media/upload`

**Headers:**
```
Authorization: Bearer {token}
```

**Body (Form-Data):**
```
file: [Select document.pdf]
provider: s3
tags: document,pdf
alt: Sample PDF
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "fileType": "document",
    "url": "https://s3.amazonaws.com/...",
    "storageProvider": "s3"
  }
}
```

**Success Criteria:**
- ✅ Status code 200
- ✅ fileType = 'document'
- ✅ File is downloadable from URL

---

### 3. Cloudflare HLS Video Upload Test

**Endpoint:** `POST http://localhost:5000/api/page-builder/websites/{websiteId}/media/upload`

**Headers:**
```
Authorization: Bearer {token}
```

**Body (Form-Data):**
```
file: [Select video.mp4]
provider: cloudflare
title: Test Video Upload
tags: test,video
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "_id": "media_id",
    "filename": "video.mp4",
    "fileType": "video",
    "url": "https://watch.cloudflarestream.com/...",
    "storageProvider": "cloudflare",
    "cloudflareId": "abc123def456",
    "cloudflarePlaylistUrl": "https://.../manifest.m3u8",
    "thumbnailUrl": "https://.../thumbnail.jpg",
    "metadata": {
      "duration": 120,
      "uploadedVia": "cloudflare"
    }
  }
}
```

**Success Criteria:**
- ✅ Status code 200
- ✅ cloudflareId populated
- ✅ HLS playlist URL valid (returns m3u8 playlist when accessed)
- ✅ Thumbnail URL accessible
- ✅ Duration extracted correctly
- ⚠️ Note: Cloudflare may take seconds to process

---

### 4. YouTube Video Add Test

**Endpoint:** `POST http://localhost:5000/api/page-builder/websites/{websiteId}/media/upload`

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "provider": "youtube",
  "videoUrl": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "title": "Rick Astley - Never Gonna Give You Up",
  "tags": ["music", "80s"],
  "alt": "Music video"
}
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "_id": "media_id",
    "filename": "Rick Astley - Never Gonna Give You Up",
    "fileType": "video",
    "url": "https://www.youtube.com/embed/dQw4w9WgXcQ",
    "storageProvider": "youtube",
    "youtubeVideoId": "dQw4w9WgXcQ",
    "embedUrl": "https://www.youtube.com/embed/dQw4w9WgXcQ",
    "thumbnailUrl": "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg"
  }
}
```

**Success Criteria:**
- ✅ Status code 200
- ✅ youtubeVideoId extracted correctly
- ✅ embedUrl is correct YouTube embed URL
- ✅ thumbnailUrl accessible (YouTube thumbnail)
- ✅ No file upload required
- ✅ Works with multiple YouTube URL formats

---

### 5. YouTube Short URL Test

**Body (JSON):**
```json
{
  "provider": "youtube",
  "videoUrl": "https://youtu.be/dQw4w9WgXcQ",
  "title": "Rick Roll",
  "tags": ["music"]
}
```

**Expected Result:**
- ✅ Successfully extracts `dQw4w9WgXcQ` as video ID
- ✅ Returns same response as standard URL

---

### 6. YouTube Direct ID Test

**Body (JSON):**
```json
{
  "provider": "youtube",
  "videoUrl": "dQw4w9WgXcQ",
  "title": "Rick Roll",
  "tags": ["music"]
}
```

**Expected Result:**
- ✅ Successfully recognizes direct ID
- ✅ Returns valid embedUrl

---

### 7. Invalid YouTube URL Test

**Body (JSON):**
```json
{
  "provider": "youtube",
  "videoUrl": "https://example.com/video",
  "title": "Invalid Video"
}
```

**Expected Response:**
```json
{
  "success": false,
  "error": "Invalid YouTube URL"
}
```

**Success Criteria:**
- ✅ Status code 400 or 422
- ✅ Proper error message
- ✅ No media entry created

---

### 8. Media Library Fetch Test

**Endpoint:** `GET http://localhost:5000/api/page-builder/websites/{websiteId}/media`

**Headers:**
```
Authorization: Bearer {token}
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "media_s3",
      "storageProvider": "s3",
      "url": "https://s3.amazonaws.com/..."
    },
    {
      "_id": "media_cf",
      "storageProvider": "cloudflare",
      "cloudflarePlaylistUrl": "https://.../manifest.m3u8"
    },
    {
      "_id": "media_yt",
      "storageProvider": "youtube",
      "youtubeVideoId": "dQw4w9WgXcQ"
    }
  ]
}
```

**Success Criteria:**
- ✅ Status code 200
- ✅ All uploaded media returned
- ✅ Provider-specific fields populated correctly
- ✅ All URLs accessible

---

### 9. Media Deletion Test (S3)

**Endpoint:** `DELETE http://localhost:5000/api/page-builder/websites/{websiteId}/media/{mediaId}`

**Headers:**
```
Authorization: Bearer {token}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Media deleted successfully"
}
```

**Quick Verification:**
```bash
# Try to access deleted S3 URL
curl https://s3.amazonaws.com/[deleted-file-path]
# Should return 403 or 404
```

**Success Criteria:**
- ✅ Status code 200
- ✅ File deleted from S3
- ✅ Media soft-deleted in database
- ✅ Listed in media library with isDeleted: true (if returned)

---

### 10. Media Deletion Test (Cloudflare)

**Setup:**
1. Upload video to Cloudflare (from Test 3)
2. Note the media ID and cloudflareId

**Endpoint:** `DELETE http://localhost:5000/api/page-builder/websites/{websiteId}/media/{mediaId}`

**Expected Response:**
```json
{
  "success": true,
  "message": "Media deleted successfully"
}
```

**Quick Verification:**
```bash
# Try to access deleted HLS URL
curl https://.../[deleted-video-id]/manifest.m3u8
# Should return 404
```

**Success Criteria:**
- ✅ Status code 200
- ✅ Video deleted from Cloudflare Stream
- ✅ Media soft-deleted in database
- ✅ HLS stream no longer accessible

---

### 11. Media Deletion Test (YouTube)

**Endpoint:** `DELETE http://localhost:5000/api/page-builder/websites/{websiteId}/media/{mediaId}`

**Expected Response:**
```json
{
  "success": true,
  "message": "Media deleted successfully"
}
```

**Success Criteria:**
- ✅ Status code 200
- ✅ Media soft-deleted locally (YouTube video remains on YouTube)
- ✅ Entry removed from media library
- ✅ No error thrown for external deletion (YouTube doesn't require deletion)

---

### 12. Invalid File Upload Test

**Endpoint:** `POST http://localhost:5000/api/page-builder/websites/{websiteId}/media/upload`

**Body (Form-Data):**
```
file: [Select executable.exe]
provider: s3
```

**Expected Response:**
```json
{
  "success": false,
  "error": "File type not allowed"
}
```

**Success Criteria:**
- ✅ Status code 400 or 422
- ✅ Proper error message
- ✅ File not stored

---

### 13. Missing Authorization Test

**Endpoint:** `POST http://localhost:5000/api/page-builder/websites/{websiteId}/media/upload`

**Headers:** (None - no Authorization)

**Body (Form-Data):**
```
file: [Select image.jpg]
```

**Expected Response:**
```json
{
  "success": false,
  "error": "No authorization token provided"
}
```

**Success Criteria:**
- ✅ Status code 401
- ✅ Request rejected

---

### 14. File Size Limit Test (S3)

**Endpoint:** `POST http://localhost:5000/api/page-builder/websites/{websiteId}/media/upload`

**Body (Form-Data):**
```
file: [150MB file]
provider: s3
```

**Expected Response:**
```json
{
  "success": false,
  "error": "File size exceeds 100MB limit"
}
```

**Success Criteria:**
- ✅ Status code 400 or 422
- ✅ Proper error message
- ✅ File not stored

---

### 15. File Size Limit Test (Cloudflare) - Boundary

**Endpoint:** `POST http://localhost:5000/api/page-builder/websites/{websiteId}/media/upload`

**Body (Form-Data):**
```
file: [4.9GB video]
provider: cloudflare
```

**Expected Result:**
- ✅ Accepted (under 5GB limit)
- ✅ Processing initiated
- ✅ Returns cloudflareId for tracking

---

## Postman Collection Example

### Create collection in Postman:

```json
{
  "info": {
    "name": "Page Builder Media - Multi-Provider",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Upload S3 Image",
      "event": [],
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{token}}"
          }
        ],
        "body": {
          "mode": "formdata",
          "formdata": [
            {
              "key": "file",
              "type": "file",
              "src": []
            },
            {
              "key": "provider",
              "value": "s3",
              "type": "text"
            }
          ]
        },
        "url": {
          "raw": "{{baseUrl}}/api/page-builder/websites/{{websiteId}}/media/upload",
          "host": ["{{baseUrl}}"],
          "path": ["api", "page-builder", "websites", "{{websiteId}}", "media", "upload"]
        }
      }
    },
    {
      "name": "Upload Cloudflare Video",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{token}}"
          }
        ],
        "body": {
          "mode": "formdata",
          "formdata": [
            {
              "key": "file",
              "type": "file",
              "src": []
            },
            {
              "key": "provider",
              "value": "cloudflare",
              "type": "text"
            },
            {
              "key": "title",
              "value": "Test Video",
              "type": "text"
            }
          ]
        },
        "url": {
          "raw": "{{baseUrl}}/api/page-builder/websites/{{websiteId}}/media/upload",
          "host": ["{{baseUrl}}"],
          "path": ["api", "page-builder", "websites", "{{websiteId}}", "media", "upload"]
        }
      }
    },
    {
      "name": "Add YouTube Video",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{token}}"
          },
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"provider\": \"youtube\",\n  \"videoUrl\": \"https://www.youtube.com/watch?v=dQw4w9WgXcQ\",\n  \"title\": \"Test YouTube Video\",\n  \"tags\": [\"test\", \"video\"]\n}"
        },
        "url": {
          "raw": "{{baseUrl}}/api/page-builder/websites/{{websiteId}}/media/upload",
          "host": ["{{baseUrl}}"],
          "path": ["api", "page-builder", "websites", "{{websiteId}}", "media", "upload"]
        }
      }
    }
  ],
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:5000"
    },
    {
      "key": "token",
      "value": ""
    },
    {
      "key": "websiteId",
      "value": ""
    }
  ]
}
```

---

## Quick Test Command Line

### Test with curl:

```bash
# 1. S3 Upload
curl -X POST http://localhost:5000/api/page-builder/websites/WEBSITE_ID/media/upload \
  -H "Authorization: Bearer TOKEN" \
  -F "file=@image.jpg" \
  -F "provider=s3"

# 2. Cloudflare Upload
curl -X POST http://localhost:5000/api/page-builder/websites/WEBSITE_ID/media/upload \
  -H "Authorization: Bearer TOKEN" \
  -F "file=@video.mp4" \
  -F "provider=cloudflare" \
  -F "title=My Video"

# 3. YouTube Add
curl -X POST http://localhost:5000/api/page-builder/websites/WEBSITE_ID/media/upload \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "youtube",
    "videoUrl": "https://youtube.com/watch?v=VIDEO_ID",
    "title": "Video Title"
  }'

# 4. Get All Media
curl -X GET http://localhost:5000/api/page-builder/websites/WEBSITE_ID/media \
  -H "Authorization: Bearer TOKEN"

# 5. Delete Media
curl -X DELETE http://localhost:5000/api/page-builder/websites/WEBSITE_ID/media/MEDIA_ID \
  -H "Authorization: Bearer TOKEN"
```

---

## Success Checklist

- [ ] S3 image uploaded and accessible
- [ ] S3 document uploaded and downloadable
- [ ] Cloudflare video uploaded and HLS playable
- [ ] YouTube video added via URL (not file)
- [ ] YouTube short URL works
- [ ] YouTube direct ID works
- [ ] Invalid YouTube URL rejected
- [ ] Media library shows all three types
- [ ] S3 media deleted from storage
- [ ] Cloudflare media deleted from stream
- [ ] YouTube media soft-deleted locally
- [ ] Invalid file type rejected
- [ ] No authorization returns 401
- [ ] S3 file size limit enforced
- [ ] Cloudflare 5GB limit documented
- [ ] All responses have proper structure
- [ ] Error messages are user-friendly
- [ ] Metadata extracted correctly

---

## Performance Benchmarks

Target metrics per provider:

| Provider | Upload Time | File Type | Expected Performance |
|----------|-----------|-----------|----------------------|
| **S3** | < 3s | Image/Doc | Instant, CDN-backed |
| **Cloudflare** | < 10s | Video | Queued, async processing |
| **YouTube** | < 1s | URL | Immediate (validation only) |

---

## Debugging Tips

### If S3 upload fails:
```
1. Check AWS credentials in .env
2. Verify S3 bucket exists
3. Check bucket permissions
4. Ensure file format allowed
```

### If Cloudflare upload fails:
```
1. Check CLOUDFLARE_ACCOUNT_ID in .env
2. Check CLOUDFLARE_API_TOKEN in .env
3. Verify Cloudflare Stream API enabled
4. Check video file format (MP4/WebM/MOV only)
5. Ensure file < 5GB
6. Check network, Cloudflare may take seconds
```

### If YouTube validation fails:
```
1. Verify YouTube URL format
2. Check if video is public or unlisted
3. Try different URL formats
4. Ensure full URL, not just ID
```

