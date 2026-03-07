import mongoose from 'mongoose';

const mediaLibrarySchema = new mongoose.Schema(
  {
    specialistId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    
    websiteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Website',
      required: true,
      index: true,
    },
    
    filename: {
      type: String,
      required: true,
    },
    
    originalName: {
      type: String,
      required: true,
    },
    
    fileType: {
      type: String,
      enum: ['image', 'video', 'document', 'audio'],
      required: true,
    },
    
    mimeType: String,
    
    // Storage URLs
    url: {
      type: String,
      required: true,
    },
    
    thumbnailUrl: String,
    
    // File size in bytes
    size: Number,
    
    // Metadata
    metadata: {
      width: Number,
      height: Number,
      duration: Number, // for videos in seconds
      format: String,
      colorSpace: String,
    },
    
    // Organiztion
    tags: [String],
    alt: String,
    description: String,
    
    // Reference tracking
    usedInSections: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PageSection',
      },
    ],
    
    // Storage provider
    storageProvider: {
      type: String,
      enum: ['s3', 'cloudinary', 'local'],
      default: 's3',
    },
    
    storageKey: String, // S3 key or Cloudinary public_id
    
    // Soft delete
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
mediaLibrarySchema.index({ specialistId: 1, websiteId: 1 });
mediaLibrarySchema.index({ tags: 1 });
mediaLibrarySchema.index({ fileType: 1 });
mediaLibrarySchema.index({ createdAt: -1 });

export default mongoose.model('MediaLibrary', mediaLibrarySchema);
