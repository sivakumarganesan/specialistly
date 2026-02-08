import mongoose from 'mongoose';

const brandingColorSchema = new mongoose.Schema({
  primary: {
    type: String,
    default: '#3B82F6', // Blue
  },
  secondary: {
    type: String,
    default: '#10B981', // Green
  },
  accent: {
    type: String,
    default: '#F59E0B', // Amber
  },
}, { _id: false });

const socialLinkSchema = new mongoose.Schema({
  platform: {
    type: String,
    enum: ['twitter', 'linkedin', 'facebook', 'instagram', 'youtube', 'tiktok', 'github'],
  },
  url: String,
}, { _id: false });

const pageHeaderSchema = new mongoose.Schema({
  title: String,
  subtitle: String,
  backgroundImage: String,
  ctaButtonText: {
    type: String,
    default: 'Book a Session',
  },
  ctaButtonLink: {
    type: String,
    default: '#services',
  },
}, { _id: false });

const aboutSectionSchema = new mongoose.Schema({
  enabled: {
    type: Boolean,
    default: true,
  },
  title: String,
  bio: String,
  profileImage: String,
}, { _id: false });

const serviceCardSchema = new mongoose.Schema({
  id: String,
  title: String,
  description: String,
  price: String,
  duration: String,
  highlighted: Boolean,
}, { _id: false });

const servicesSectionSchema = new mongoose.Schema({
  enabled: {
    type: Boolean,
    default: true,
  },
  title: {
    type: String,
    default: 'My Services',
  },
  description: String,
  displayMode: {
    type: String,
    enum: ['grid', 'list', 'carousel'],
    default: 'grid',
  },
}, { _id: false });

const testimonialSchema = new mongoose.Schema({
  id: String,
  name: String,
  title: String,
  message: String,
  rating: Number,
  image: String,
}, { _id: false });

const testimonialsSectionSchema = new mongoose.Schema({
  enabled: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    default: 'What My Clients Say',
  },
  testimonials: [testimonialSchema],
}, { _id: false });

const ctaSectionSchema = new mongoose.Schema({
  enabled: {
    type: Boolean,
    default: true,
  },
  title: String,
  description: String,
  buttonText: {
    type: String,
    default: 'Get Started',
  },
}, { _id: false });

const footerSchema = new mongoose.Schema({
  enabled: {
    type: Boolean,
    default: true,
  },
  copyrightText: String,
  showSocialLinks: {
    type: Boolean,
    default: true,
  },
}, { _id: false });

const specialistBrandingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    sparse: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  
  // Slug for subdomain (e.g., "john-smith" for john-smith.myapp.com)
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  
  // Branding
  businessName: String,
  businessTagline: String,
  colors: brandingColorSchema,
  logoUrl: String,
  faviconUrl: String,
  
  // Social Links
  socialLinks: [socialLinkSchema],
  
  // Selected Courses and Services for display
  selectedCourses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
  }],
  selectedServices: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
  }],
  
  // Page Sections
  header: pageHeaderSchema,
  about: aboutSectionSchema,
  services: servicesSectionSchema,
  testimonials: testimonialsSectionSchema,
  cta: ctaSectionSchema,
  footer: footerSchema,
  
  // Page Settings
  seoTitle: String,
  seoDescription: String,
  seoKeywords: String,
  
  // Layout Options
  layoutStyle: {
    type: String,
    enum: ['minimal', 'modern', 'corporate', 'creative'],
    default: 'modern',
  },
  
  // Published Status
  isPublished: {
    type: Boolean,
    default: true,
  },
  
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Ensure slug is always unique and URL-safe
specialistBrandingSchema.pre('save', function(next) {
  if (this.slug) {
    this.slug = this.slug.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  }
  this.updatedAt = new Date();
  next();
});

// Index for fast slug lookups
specialistBrandingSchema.index({ slug: 1 });
specialistBrandingSchema.index({ email: 1 });
specialistBrandingSchema.index({ userId: 1 });

export default mongoose.model('SpecialistBranding', specialistBrandingSchema);
