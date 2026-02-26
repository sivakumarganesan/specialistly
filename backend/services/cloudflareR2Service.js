/**
 * Cloudflare R2 Service
 * Handles file uploads and downloads to Cloudflare R2 storage
 * Replaces Google Drive integration for course materials
 */

import S3 from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import crypto from 'crypto';

class CloudflareR2Service {
  constructor() {
    this.accountId = process.env.CLOUDFLARE_ACCOUNT_ID || '';
    this.accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || '';
    this.secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || '';
    this.bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME || 'specialistly-files';
    this.endpoint = `https://${this.accountId}.r2.cloudflarestorage.com`;

    this.s3Client = new S3.S3Client({
      region: 'auto',
      endpoint: this.endpoint,
      credentials: {
        accessKeyId: this.accessKeyId,
        secretAccessKey: this.secretAccessKey,
      },
    });

    this.validateConfig();
  }

  validateConfig() {
    console.log('[R2 Service] Checking configuration...');
    console.log('[R2 Service] Account ID:', this.accountId ? '✓ Set' : '✗ Missing');
    console.log('[R2 Service] Access Key:', this.accessKeyId ? '✓ Set' : '✗ Missing');
    console.log('[R2 Service] Secret Key:', this.secretAccessKey ? '✓ Set' : '✗ Missing');
    console.log('[R2 Service] Bucket:', this.bucketName);

    if (!this.accountId || !this.accessKeyId || !this.secretAccessKey) {
      console.warn('\n⚠️  WARNING: Cloudflare R2 is NOT properly configured!');
      console.warn('   File upload features will not work.');
      console.warn('\n   To fix, add these to your environment variables:');
      if (!this.accountId) console.warn('   → CLOUDFLARE_ACCOUNT_ID=your_account_id');
      if (!this.accessKeyId) console.warn('   → CLOUDFLARE_R2_ACCESS_KEY_ID=your_access_key');
      if (!this.secretAccessKey) console.warn('   → CLOUDFLARE_R2_SECRET_ACCESS_KEY=your_secret_key');
      console.warn('   → CLOUDFLARE_R2_BUCKET_NAME=specialistly-files (optional)\n');
    } else {
      console.log('\n✓ Cloudflare R2 is configured and ready!\n');
    }
  }

  /**
   * Generate a unique file key for storage
   * Format: courses/{courseId}/lessons/{lessonId}/{timestamp}-{randomId}-{fileName}
   */
  generateFileKey(courseId, lessonId, fileName) {
    const timestamp = Date.now();
    const randomId = crypto.randomBytes(6).toString('hex');
    const safeName = fileName
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .substring(0, 100);
    
    return `courses/${courseId}/lessons/${lessonId}/${timestamp}-${randomId}-${safeName}`;
  }

  /**
   * Upload file to Cloudflare R2
   */
  async uploadFile(courseId, lessonId, fileName, fileBuffer, mimeType = 'application/octet-stream') {
    try {
      const fileKey = this.generateFileKey(courseId, lessonId, fileName);

      const command = new S3.PutObjectCommand({
        Bucket: this.bucketName,
        Key: fileKey,
        Body: fileBuffer,
        ContentType: mimeType,
        Metadata: {
          'course-id': courseId,
          'lesson-id': lessonId,
          'original-name': fileName,
          'uploaded-at': new Date().toISOString(),
        },
      });

      await this.s3Client.send(command);

      console.log(`[R2] File uploaded: ${fileKey}`);

      // Generate a signed URL that expires in 7 days
      const downloadUrl = await this.getSignedDownloadUrl(fileKey, 7 * 24 * 60 * 60);

      return {
        success: true,
        fileKey,
        fileName,
        fileSize: fileBuffer.length,
        mimeType,
        downloadUrl,
        uploadedAt: new Date(),
      };
    } catch (error) {
      console.error('[R2] Error uploading file:', error);
      throw new Error(`Failed to upload file: ${error.message}`);
    }
  }

  /**
   * Get signed download URL for a file
   * Allows temporary public access without exposing the bucket
   */
  async getSignedDownloadUrl(fileKey, expirationSeconds = 604800) {
    try {
      const command = new S3.GetObjectCommand({
        Bucket: this.bucketName,
        Key: fileKey,
      });

      const url = await getSignedUrl(this.s3Client, command, { expiresIn: expirationSeconds });
      return url;
    } catch (error) {
      console.error('[R2] Error generating signed URL:', error);
      throw new Error(`Failed to generate download URL: ${error.message}`);
    }
  }

  /**
   * Delete file from Cloudflare R2
   */
  async deleteFile(fileKey) {
    try {
      const command = new S3.DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: fileKey,
      });

      await this.s3Client.send(command);
      console.log(`[R2] File deleted: ${fileKey}`);

      return {
        success: true,
        message: 'File deleted successfully',
      };
    } catch (error) {
      console.error('[R2] Error deleting file:', error);
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  }

  /**
   * List files in a lesson folder
   */
  async listLessonFiles(courseId, lessonId) {
    try {
      const prefix = `courses/${courseId}/lessons/${lessonId}/`;

      const command = new S3.ListObjectsV2Command({
        Bucket: this.bucketName,
        Prefix: prefix,
      });

      const response = await this.s3Client.send(command);
      const files = (response.Contents || []).map(obj => ({
        fileKey: obj.Key,
        fileName: obj.Key.split('/').pop(),
        fileSize: obj.Size,
        uploadedAt: obj.LastModified,
      }));

      return {
        success: true,
        files,
      };
    } catch (error) {
      console.error('[R2] Error listing files:', error);
      throw new Error(`Failed to list files: ${error.message}`);
    }
  }

  /**
   * Get file metadata without downloading
   */
  async getFileMetadata(fileKey) {
    try {
      const command = new S3.HeadObjectCommand({
        Bucket: this.bucketName,
        Key: fileKey,
      });

      const response = await this.s3Client.send(command);

      return {
        success: true,
        metadata: {
          fileKey,
          fileSize: response.ContentLength,
          mimeType: response.ContentType,
          lastModified: response.LastModified,
          metadata: response.Metadata,
        },
      };
    } catch (error) {
      console.error('[R2] Error getting file metadata:', error);
      throw new Error(`Failed to get file metadata: ${error.message}`);
    }
  }
}

export default new CloudflareR2Service();
