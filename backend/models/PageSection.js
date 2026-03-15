import mongoose from 'mongoose';

const pageSectionSchema = new mongoose.Schema(
  {
    websiteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Website',
      required: true,
      index: true,
    },
    
    pageId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    
    type: {
      type: String,
      enum: [
        'hero',
        'about',
        'services',
        'courses',
        'video',
        'testimonials',
        'cta',
        'text',
        'image',
        'gallery',
        'contact',
        'pricing',
        'team',
        'features',
        'faq',
        'newsletter',
        'blog',
        'custom',
      ],
      required: true,
    },
    
    // Section title and description
    title: {
      type: String,
      default: '',
    },
    
    description: {
      type: String,
      default: '',
    },
    
    // Content - flexible schema to accommodate different section types
    content: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    
    // Styling/Layout
    styling: {
      backgroundColor: String,
      backgroundImage: String,
      padding: { type: String, default: '40px 20px' },
      margin: String,
      minHeight: String,
      textColor: String,
      alignment: String,
      containerWidth: {
        type: String,
        enum: ['full', 'contained', 'narrow'],
        default: 'contained',
      },
      customCSS: String,
    },
    
    // Visibility/Responsive
    visibility: {
      isVisible: { type: Boolean, default: true },
      showOnMobile: { type: Boolean, default: true },
      showOnTablet: { type: Boolean, default: true },
      showOnDesktop: { type: Boolean, default: true },
    },
    
    // Order/Position
    order: {
      type: Number,
      default: 0,
    },
    
    // SEO/Meta
    metadata: {
      title: String,
      description: String,
      altText: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
pageSectionSchema.index({ websiteId: 1, pageId: 1 });
pageSectionSchema.index({ pageId: 1, order: 1 });

export default mongoose.model('PageSection', pageSectionSchema);
