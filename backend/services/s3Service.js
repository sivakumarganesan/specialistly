import AWS from 'aws-sdk';
import dotenv from 'dotenv';

dotenv.config();

// Configure AWS S3
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1',
});

/**
 * Upload file to S3
 * @param {Buffer} fileBuffer - File buffer from multer
 * @param {string} fileName - Original filename
 * @param {string} mimeType - File MIME type
 * @param {string} folder - Optional folder path (e.g., 'media/images')
 * @returns {Promise<{success: boolean, url?: string, key?: string, error?: string}>}
 */
export const uploadToS3 = async (fileBuffer, fileName, mimeType, folder = 'media') => {
  try {
    // Generate unique filename with timestamp
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(7);
    const extension = fileName.split('.').pop();
    const uniqueFileName = `${timestamp}-${randomId}-${fileName.replace(/\s+/g, '_')}`;
    const s3Key = `${folder}/${uniqueFileName}`;

    const params = {
      Bucket: process.env.AWS_BUCKET_NAME || 'specialistly-media',
      Key: s3Key,
      Body: fileBuffer,
      ContentType: mimeType,
      ACL: 'public-read',
      Metadata: {
        'original-name': fileName,
        'upload-timestamp': new Date().toISOString(),
      },
    };

    console.log(`📤 Uploading to S3: ${s3Key}`);
    const result = await s3.upload(params).promise();

    console.log(`✅ Successfully uploaded to S3: ${result.Location}`);

    return {
      success: true,
      url: result.Location,
      key: result.Key,
      filename: uniqueFileName,
      originalFilename: fileName,
    };
  } catch (error) {
    console.error('❌ S3 upload error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Delete file from S3
 * @param {string} s3Key - S3 object key
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const deleteFromS3 = async (s3Key) => {
  try {
    console.log(`🗑️  Deleting from S3: ${s3Key}`);

    await s3
      .deleteObject({
        Bucket: process.env.AWS_BUCKET_NAME || 'specialistly-media',
        Key: s3Key,
      })
      .promise();

    console.log(`✅ Successfully deleted from S3: ${s3Key}`);
    return { success: true };
  } catch (error) {
    console.error('❌ S3 delete error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Get file metadata from S3
 * @param {string} s3Key - S3 object key
 * @returns {Promise<{success: boolean, metadata?: object, error?: string}>}
 */
export const getS3FileMetadata = async (s3Key) => {
  try {
    console.log(`📋 Getting metadata for S3 file: ${s3Key}`);

    const data = await s3
      .headObject({
        Bucket: process.env.AWS_BUCKET_NAME || 'specialistly-media',
        Key: s3Key,
      })
      .promise();

    return {
      success: true,
      metadata: {
        size: data.ContentLength,
        mimeType: data.ContentType,
        lastModified: data.LastModified,
        etag: data.ETag,
      },
    };
  } catch (error) {
    console.error('❌ S3 metadata error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Generate signed URL for private files
 * @param {string} s3Key - S3 object key
 * @param {number} expirySeconds - URL expiry time in seconds (default: 3600 = 1 hour)
 * @returns {Promise<{success: boolean, url?: string, error?: string}>}
 */
export const getSignedS3Url = async (s3Key, expirySeconds = 3600) => {
  try {
    console.log(`🔐 Generating signed URL for: ${s3Key}`);

    const url = s3.getSignedUrl('getObject', {
      Bucket: process.env.AWS_BUCKET_NAME || 'specialistly-media',
      Key: s3Key,
      Expires: expirySeconds,
    });

    return { success: true, url };
  } catch (error) {
    console.error('❌ S3 signed URL error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * List files in S3 folder
 * @param {string} folder - Folder path (e.g., 'media/images')
 * @param {number} maxItems - Maximum items to return
 * @returns {Promise<{success: boolean, files?: array, error?: string}>}
 */
export const listS3Files = async (folder, maxItems = 100) => {
  try {
    console.log(`📂 Listing files in S3 folder: ${folder}`);

    const data = await s3
      .listObjectsV2({
        Bucket: process.env.AWS_BUCKET_NAME || 'specialistly-media',
        Prefix: `${folder}/`,
        MaxKeys: maxItems,
      })
      .promise();

    const files = (data.Contents || []).map((item) => ({
      key: item.Key,
      size: item.Size,
      lastModified: item.LastModified,
    }));

    return { success: true, files };
  } catch (error) {
    console.error('❌ S3 list error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Batch delete files from S3
 * @param {array} keys - Array of S3 keys to delete
 * @returns {Promise<{success: boolean, deleted?: array, error?: string}>}
 */
export const batchDeleteFromS3 = async (keys) => {
  try {
    if (!keys || keys.length === 0) {
      return { success: true, deleted: [] };
    }

    console.log(`🗑️  Batch deleting ${keys.length} files from S3`);

    const params = {
      Bucket: process.env.AWS_BUCKET_NAME || 'specialistly-media',
      Delete: {
        Objects: keys.map((key) => ({ Key: key })),
      },
    };

    const result = await s3.deleteObjects(params).promise();

    console.log(`✅ Deleted ${result.Deleted.length} files from S3`);
    return {
      success: true,
      deleted: result.Deleted.map((item) => item.Key),
    };
  } catch (error) {
    console.error('❌ S3 batch delete error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

export default {
  uploadToS3,
  deleteFromS3,
  getS3FileMetadata,
  getSignedS3Url,
  listS3Files,
  batchDeleteFromS3,
};
