# Staging Environment - Read-Only Media Guide

**Date**: April 5, 2026  
**Status**: Active Protection Enabled

## Overview

Staging environment uses **shared production R2 buckets and Cloudflare Stream** accounts in **READ-ONLY mode** to protect production data from accidental modifications.

This means:
- ✅ **You CAN**: View, download, and playback all existing media
- ❌ **You CANNOT**: Upload new files, delete files, or modify any media
- ⚠️ **Why**: To prevent test files from contaminating production storage

---

## What's Protected

### 1. **File Uploads** (R2)
**Blocked Operations**:
- Uploading images/logos to page builder
- Uploading course materials
- Uploading gallery images

**Error Message**:
```
403 Forbidden
Media uploads are disabled in staging environment to protect production data
```

### 2. **File Deletions** (R2)
**Blocked Operations**:
- Deleting media from page builder
- Removing course materials
- Removing gallery images

**Error Message**:
```
403 Forbidden
Media deletion is disabled in staging environment to protect production data
```

### 3. **Video Uploads** (Cloudflare Stream)
**Blocked Operations**:
- Uploading new videos to courses
- Adding video lessons
- Uploading stream media

**Error Message**:
```
403 Forbidden
Video uploads are disabled in staging environment to protect production data
```

---

## Testing Guidelines for Testers

### ✅ What You CAN Test

1. **View Existing Media**
   - Browse media library
   - View product images
   - Watch production videos
   - Download files

2. **Branding & Design**
   - Apply existing logos to pages
   - Test page builder with existing media
   - Verify CDN delivery of images

3. **Video Playback**
   - Stream production videos
   - Test HLS playback
   - Test video player controls

4. **Read Operations**
   - List media files
   - Search media library
   - Filter by media type

### ❌ What You CANNOT Test

1. **Upload Operations**
   - Adding new product images
   - Uploading course materials
   - Importing media files

2. **Delete Operations**
   - Removing old media
   - Cleaning up media library
   - Deleting obsolete files

3. **Video Operations**
   - Uploading new videos
   - Creating video lessons
   - Testing video upload workflows

---

## How to Test Upload/Delete Workflows

### Option 1: Test in Production (⚠️ Careful!)
- Go to production environment
- Perform media operations
- **Important**: Clean up test files immediately

### Option 2: Use Staging R2 Bucket (Recommended Later)
- Wait for separate staging R2 bucket setup
- Have full CRUD permissions
- No risk to production
- **Status**: Coming soon

### Option 3: Local Testing
- Run backend with `.env.development`
- Use local Cloudflare credentials (if you have them)
- Test upload/delete locally

---

## What If I Accidentally Try to Upload?

**This is safe** — the API will reject with error code `403`:

```json
{
  "success": false,
  "message": "Media uploads are disabled in staging environment to protect production data",
  "details": "Staging uses read-only access to production R2 and Cloudflare Stream. View existing media is allowed, but new uploads are blocked.",
  "environment": "staging",
  "recommendation": "Test media operations in production or use a dedicated staging R2 bucket"
}
```

**No files are created. No side effects. It's safe.**

---

## Existing Cloned Media in Staging

All media from production was cloned to staging:

| Media Type | Status | How to Access |
|-----------|--------|---------------|
| Product Images | ✅ Available | Page Builder → Media Library |
| Course Materials | ✅ Available | Courses → Lessons → Course Materials |
| Videos | ✅ Available | Courses → Lessons → Play Video |
| Logos/Branding | ✅ Available | Page Builder → Branding |

**Note**: These are the SAME files from production (shared bucket). If production files are deleted, they disappear from staging too.

---

## FAQ

### Q: Can I delete a test file I see?
**A**: No. Delete operations are blocked in staging. If you accidentally uploaded to production (during testing there), please notify dev team immediately.

### Q: What if media URLs are broken?
**A**: This usually means:
1. File was deleted from production R2
2. Cloudflare Stream video is no longer available
3. Permission issue (rare)

**Action**: Report to dev team with media ID and file path.

### Q: How long does this protection stay?
**A**: Until a dedicated staging R2 bucket is set up (planned for Phase 3).

### Q: Can I bypass this?
**A**: Not intentionally. This is a backend security feature. If you need to test uploads, contact dev team for production access.

### Q: Why share production storage?
**A**: Cost optimization. Staging bucket setup requires additional infrastructure. Current approach:
- ✅ Low cost
- ✅ Real data for testing
- ✅ Protected from accidents
- ❌ Read-only (limitation)

---

## Support

**Issue**: Upload returns 403 error
- ✅ **Expected behavior** — Protection is working correctly

**Issue**: Existing media appears broken
- 🔴 **Report to dev team** — May indicate data corruption

**Issue**: Need to test upload functionality
- 💬 **Contact dev team** — Discuss options for testing in production

**Issue**: Read-only mode not working (can upload/delete)
- 🔴 **Security issue** — Report immediately to dev team

---

## Key Reminders

1. **DO NOT** test delete functionality — it's blocked
2. **DO NOT** upload tests files — use existing media
3. **DO NOT** modify stored video IDs — they're global
4. **DO** report any broken media to dev team
5. **DO** use production for upload/delete testing (carefully)

---

## Environment Variables

Staging uses: `CLOUDFLARE_R2_READ_ONLY_MODE=true`

This flag enables all protections. Never disable it without dev team approval.

---

*Last Updated: April 5, 2026*  
*Commit: 4b5215e*
