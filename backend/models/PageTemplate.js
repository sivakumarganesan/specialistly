import mongoose from 'mongoose';

const pageTemplateSchema = new mongoose.Schema(
  {
    // Template identification
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    category: {
      type: String,
      enum: ['landing', 'about', 'services', 'portfolio', 'contact', 'blog', 'pricing'],
      default: 'landing',
      index: true,
    },
    thumbnail: {
      type: String,
      default: '',
    },

    // Template configuration
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },

    // Template sections - default sections to include when creating from template
    sections: [
      {
        type: {
          type: String,
          enum: [
            'hero',
            'about',
            'services',
            'features',
            'testimonials',
            'cta',
            'faq',
            'contact',
            'footer',
            'gallery',
            'team',
            'pricing',
            'blog',
            'custom',
          ],
          required: true,
        },
        title: String,
        subtitle: String,
        order: Number,
        defaultContent: mongoose.Schema.Types.Mixed,
        styling: {
          backgroundColor: String,
          textColor: String,
          fontSize: String,
          padding: String,
          margin: String,
          alignment: String,
        },
      },
    ],

    // Branding defaults
    branding: {
      primaryColor: {
        type: String,
        default: '#4f46e5',
      },
      secondaryColor: {
        type: String,
        default: '#06b6d4',
      },
      fontFamily: {
        type: String,
        default: 'Inter',
      },
      headerStyle: {
        type: String,
        enum: ['minimal', 'standard', 'bold'],
        default: 'standard',
      },
      footerStyle: {
        type: String,
        enum: ['simple', 'detailed'],
        default: 'simple',
      },
    },

    // Layout configuration
    layout: {
      headerType: {
        type: String,
        enum: ['sticky', 'fixed', 'static'],
        default: 'sticky',
      },
      footerIncluded: {
        type: Boolean,
        default: true,
      },
      sidebarIncluded: {
        type: Boolean,
        default: false,
      },
      containerWidth: {
        type: String,
        enum: ['full', 'wide', 'standard', 'narrow'],
        default: 'standard',
      },
    },

    // SEO defaults
    seoDefaults: {
      titleTemplate: String,
      descriptionTemplate: String,
      keywordsTemplate: [String],
    },

    // Usage statistics
    usageCount: {
      type: Number,
      default: 0,
    },

    // Admin only
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Index for template discovery
pageTemplateSchema.index({ category: 1, isActive: 1 });
pageTemplateSchema.index({ isDefault: 1 });

export default mongoose.model('PageTemplate', pageTemplateSchema);
