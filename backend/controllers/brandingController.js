import SpecialistBranding from '../models/SpecialistBranding.js';
import User from '../models/User.js';

// Get specialist branding by email
export const getBrandingByEmail = async (req, res) => {
  try {
    const { email } = req.params;
    
    const branding = await SpecialistBranding.findOne({ email });
    
    if (!branding) {
      return res.status(404).json({
        success: false,
        message: 'Branding not found',
      });
    }
    
    res.status(200).json({
      success: true,
      data: branding,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get specialist branding by slug (for public landing pages)
export const getBrandingBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    
    const branding = await SpecialistBranding.findOne({ 
      slug: slug.toLowerCase(),
      isPublished: true,
    });
    
    if (!branding) {
      return res.status(404).json({
        success: false,
        message: 'Specialist page not found',
      });
    }
    
    res.status(200).json({
      success: true,
      data: branding,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Create specialist branding (auto-create when user is created)
export const createBranding = async (req, res) => {
  try {
    const { userId, email, slug, businessName } = req.body;
    
    // Check if slug already exists
    const existingSlug = await SpecialistBranding.findOne({ slug });
    if (existingSlug) {
      return res.status(400).json({
        success: false,
        message: 'Slug already taken',
      });
    }
    
    const branding = new SpecialistBranding({
      userId,
      email,
      slug: slug || email.split('@')[0],
      businessName: businessName || email.split('@')[0],
      header: {
        title: businessName || 'Welcome',
        subtitle: 'Professional Services',
      },
    });
    
    await branding.save();
    
    res.status(201).json({
      success: true,
      data: branding,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update specialist branding
export const updateBranding = async (req, res) => {
  try {
    const { email } = req.params;
    const updates = req.body;
    
    // Validate slug uniqueness if slug is being updated
    if (updates.slug) {
      const existingBranding = await SpecialistBranding.findOne({ 
        slug: updates.slug.toLowerCase(),
        email: { $ne: email }
      });
      if (existingBranding) {
        return res.status(400).json({
          success: false,
          message: 'Slug already taken',
        });
      }
    }
    
    const branding = await SpecialistBranding.findOneAndUpdate(
      { email },
      updates,
      { new: true, runValidators: true }
    );
    
    if (!branding) {
      return res.status(404).json({
        success: false,
        message: 'Branding not found',
      });
    }
    
    res.status(200).json({
      success: true,
      data: branding,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update specific page section
export const updatePageSection = async (req, res) => {
  try {
    const { email, section } = req.params;
    const sectionData = req.body;
    
    const branding = await SpecialistBranding.findOne({ email });
    
    if (!branding) {
      return res.status(404).json({
        success: false,
        message: 'Branding not found',
      });
    }
    
    // Update specific section
    if (branding[section] !== undefined) {
      branding[section] = { ...branding[section], ...sectionData };
    }
    
    await branding.save();
    
    res.status(200).json({
      success: true,
      data: branding,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Publish/Unpublish page
export const togglePublish = async (req, res) => {
  try {
    const { email } = req.params;
    
    const branding = await SpecialistBranding.findOne({ email });
    
    if (!branding) {
      return res.status(404).json({
        success: false,
        message: 'Branding not found',
      });
    }
    
    branding.isPublished = !branding.isPublished;
    await branding.save();
    
    res.status(200).json({
      success: true,
      data: branding,
      message: `Page ${branding.isPublished ? 'published' : 'unpublished'} successfully`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Check if slug is available
export const checkSlugAvailability = async (req, res) => {
  try {
    const { slug } = req.query;
    
    if (!slug) {
      return res.status(400).json({
        success: false,
        message: 'Slug is required',
      });
    }
    
    const existing = await SpecialistBranding.findOne({ 
      slug: slug.toLowerCase() 
    });
    
    res.status(200).json({
      success: true,
      available: !existing,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Add testimonial to branding
export const addTestimonial = async (req, res) => {
  try {
    const { email } = req.params;
    const testimonial = req.body;
    
    const branding = await SpecialistBranding.findOne({ email });
    
    if (!branding) {
      return res.status(404).json({
        success: false,
        message: 'Branding not found',
      });
    }
    
    testimonial.id = new Date().getTime().toString();
    branding.testimonials.testimonials.push(testimonial);
    await branding.save();
    
    res.status(200).json({
      success: true,
      data: branding,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Remove testimonial
export const removeTestimonial = async (req, res) => {
  try {
    const { email, testimonialId } = req.params;
    
    const branding = await SpecialistBranding.findOne({ email });
    
    if (!branding) {
      return res.status(404).json({
        success: false,
        message: 'Branding not found',
      });
    }
    
    branding.testimonials.testimonials = branding.testimonials.testimonials.filter(
      t => t.id !== testimonialId
    );
    await branding.save();
    
    res.status(200).json({
      success: true,
      data: branding,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Add social link
export const addSocialLink = async (req, res) => {
  try {
    const { email } = req.params;
    const { platform, url } = req.body;
    
    const branding = await SpecialistBranding.findOne({ email });
    
    if (!branding) {
      return res.status(404).json({
        success: false,
        message: 'Branding not found',
      });
    }
    
    branding.socialLinks.push({ platform, url });
    await branding.save();
    
    res.status(200).json({
      success: true,
      data: branding,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Remove social link
export const removeSocialLink = async (req, res) => {
  try {
    const { email, platform } = req.params;
    
    const branding = await SpecialistBranding.findOne({ email });
    
    if (!branding) {
      return res.status(404).json({
        success: false,
        message: 'Branding not found',
      });
    }
    
    branding.socialLinks = branding.socialLinks.filter(
      link => link.platform !== platform
    );
    await branding.save();
    
    res.status(200).json({
      success: true,
      data: branding,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
