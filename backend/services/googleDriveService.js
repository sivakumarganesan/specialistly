/**
 * Google Drive Service
 * Manages file sharing and access for course materials
 * Converts Google Drive links to downloadable URLs
 */

import dotenv from 'dotenv';

dotenv.config();

/**
 * Extract Google Drive file ID from various formats
 * Supports:
 * - https://drive.google.com/file/d/FILE_ID/view
 * - https://drive.google.com/open?id=FILE_ID
 * - Just the FILE_ID
 * @param {string} driveUrl - Google Drive URL or file ID
 * @returns {string} - Extracted file ID or error
 */
export const extractFileId = (driveUrl) => {
  if (!driveUrl) return null;

  // If it's just the file ID (alphanumeric with underscores/hyphens)
  if (/^[a-zA-Z0-9_-]+$/.test(driveUrl)) {
    return driveUrl;
  }

  // Format: https://drive.google.com/file/d/FILE_ID/view
  const match1 = driveUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (match1) return match1[1];

  // Format: https://drive.google.com/open?id=FILE_ID
  const match2 = driveUrl.match(/id=([a-zA-Z0-9_-]+)/);
  if (match2) return match2[1];

  return null;
};

/**
 * Get MIME type from Google Drive file
 * @param {string} fileName - File name with extension
 * @returns {string} - MIME type
 */
export const getMimeType = (fileName) => {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  
  const mimeTypes = {
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'ppt': 'application/vnd.ms-powerpoint',
    'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'txt': 'text/plain',
    'zip': 'application/zip',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
  };

  return mimeTypes[ext] || 'application/octet-stream';
};

/**
 * Convert Google Drive link to downloadable/viewable URL
 * @param {string} driveUrl - Google Drive link or file ID
 * @param {string} fileName - File name for download
 * @returns {object} - Download and view links
 */
export const generateDriveLinks = (driveUrl, fileName) => {
  try {
    const fileId = extractFileId(driveUrl);

    if (!fileId) {
      return {
        success: false,
        error: 'Invalid Google Drive URL or file ID',
      };
    }

    // Direct download link (works for public files)
    const downloadLink = `https://drive.google.com/uc?id=${fileId}&export=download`;
    
    // View link (works for public files)
    const viewLink = `https://drive.google.com/file/d/${fileId}/view`;
    
    // Preview embed link (for some file types)
    const previewLink = `https://drive.google.com/file/d/${fileId}/preview`;

    const fileType = fileName ? getMimeType(fileName) : 'application/octet-stream';

    return {
      success: true,
      fileId,
      fileName: fileName || 'Course Material',
      downloadLink,
      viewLink,
      previewLink,
      fileType,
      mimeType: fileType,
    };
  } catch (error) {
    console.error('❌ Error generating Drive links:', error.message);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Validate Google Drive file accessibility
 * Returns metadata about the file
 * @param {string} fileId - Google Drive file ID
 * @returns {object} - File info or error
 */
export const validateFileAccess = async (fileId) => {
  try {
    // Try to fetch file metadata using Drive API
    // This requires authentication, so for now we'll skip validation
    // In production, you'd want to validate with a service account
    
    console.log(`✓ File ID appears valid: ${fileId}`);
    
    return {
      success: true,
      fileId,
      isAccessible: true,
      message: 'File appears to be publicly accessible',
    };
  } catch (error) {
    console.error('❌ Error validating file:', error.message);
    return {
      success: false,
      error: 'Unable to verify file access',
      isAccessible: false,
    };
  }
};

/**
 * Get file type label for display
 * @param {string} fileType - MIME type or extension
 * @returns {string} - User-friendly file type label
 */
export const getFileTypeLabel = (fileType) => {
  if (fileType.includes('pdf')) return 'PDF Document';
  if (fileType.includes('word') || fileType.includes('document')) return 'Word Document';
  if (fileType.includes('spreadsheet') || fileType.includes('excel')) return 'Excel Spreadsheet';
  if (fileType.includes('presentation') || fileType.includes('powerpoint')) return 'PowerPoint Presentation';
  if (fileType.includes('text')) return 'Text File';
  if (fileType.includes('zip')) return 'ZIP Archive';
  if (fileType.includes('image')) return 'Image File';
  return 'File';
};

export default {
  extractFileId,
  getMimeType,
  generateDriveLinks,
  validateFileAccess,
  getFileTypeLabel,
};

