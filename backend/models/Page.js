import mongoose from 'mongoose';

const pageSchema = new mongoose.Schema(
  {
    websiteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Website',
      required: true,
      index: true,
    },
    
    title: {
      type: String,
      required: true,
    },
    
    slug: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    
    description: {
      type: String,
      default: '',
    },
    
    isHomePage: {
      type: Boolean,
      default: false,
    },
    
    isPublished: {
      type: Boolean,
      default: false,
    },
    
    order: {
      type: Number,
      default: 0,
    },
    
    // Sections on this page
    sections: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PageSection',
      },
    ],
    
    // SEO Settings
    seo: {
      title: String,
      description: String,
      keywords: [String],
      ogImage: String,
      ogTitle: String,
      ogDescription: String,
      canonicalUrl: String,
    },
    
    // Custom metadata
    customMeta: mongoose.Schema.Types.Mixed,
    
    // Publishing
    publishedAt: Date,
    publishedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Ensure slug is unique per website
pageSchema.index({ websiteId: 1, slug: 1 }, { unique: true });
pageSchema.index({ websiteId: 1, order: 1 });

export default mongoose.model('Page', pageSchema);
