import Website from '../models/Website.js';
import Page from '../models/Page.js';
import PageSection from '../models/PageSection.js';
import User from '../models/User.js';
import Course from '../models/Course.js';
import Service from '../models/Service.js';

// ============ Website Operations ============

export const createWebsite = async (req, res) => {
  try {
    const { name, tagline, colors } = req.body;
    const specialistId = req.user.id;
    const userEmail = req.user.email;

    // Validate required fields
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Website name is required',
      });
    }

    // Generate subdomain from name
    const subdomain = name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]/g, '')
      .substring(0, 50);

    // Check if subdomain already exists
    const existing = await Website.findOne({ subdomain });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Website name already taken',
      });
    }

    const website = new Website({
      creatorEmail: userEmail,
      specialistId: specialistId, // Add specialist ID for ownership verification
      subdomain,
      isConfigured: true,
      branding: {
        siteName: name,
        tagline: tagline || '',
        primaryColor: colors?.primary || '#4f46e5',
        secondaryColor: colors?.secondary || '#06b6d4',
        logo: colors?.logo || '',
      },
      theme: {
        mode: 'light',
      },
      content: {
        selectedCourses: [],
        selectedServices: [],
      },
      isPublished: false,
    });

    await website.save();

    res.status(201).json({
      success: true,
      data: website,
      message: 'Website created successfully',
    });
  } catch (error) {
    console.error('Create website error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create website',
    });
  }
};

export const getWebsites = async (req, res) => {
  try {
    console.log('[getWebsites] User authenticated:', req.user);
    const userEmail = req.user.email;

    if (!userEmail) {
      console.error('[getWebsites] No user email in token');
      return res.status(400).json({
        success: false,
        message: 'User email not found in token',
      });
    }

    console.log('[getWebsites] Searching for websites by email:', userEmail);
    const websites = await Website.find({ creatorEmail: userEmail })
      .select('-notes')
      .sort({ createdAt: -1 });

    console.log(`[getWebsites] Found ${websites.length} websites`);
    res.json({
      success: true,
      data: websites,
    });
  } catch (error) {
    console.error('Get websites error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getWebsiteById = async (req, res) => {
  try {
    const { websiteId } = req.params;
    const userEmail = req.user.email;

    const website = await Website.findById(websiteId);

    if (!website) {
      return res.status(404).json({
        success: false,
        message: 'Website not found',
      });
    }

    // Verify ownership
    if (website.creatorEmail !== userEmail) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    res.json({
      success: true,
      data: website,
    });
  } catch (error) {
    console.error('Get website error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateWebsite = async (req, res) => {
  try {
    const { websiteId } = req.params;
    const userEmail = req.user.email;
    const { name, tagline, colors, header, footer, navigation } = req.body;

    const website = await Website.findById(websiteId);

    if (!website) {
      return res.status(404).json({
        success: false,
        message: 'Website not found',
      });
    }

    // Verify ownership
    if (website.creatorEmail !== userEmail) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    // Update branding fields
    if (name || tagline || colors) {
      website.branding = {
        ...website.branding,
        ...(name && { siteName: name }),
        ...(tagline && { tagline }),
        ...(colors?.primary && { primaryColor: colors.primary }),
        ...(colors?.secondary && { secondaryColor: colors.secondary }),
      };
    }

    if (header) website.header = { ...website.header, ...header };
    if (footer) website.footer = { ...website.footer, ...footer };
    if (navigation) website.navigation = navigation;

    await website.save();

    res.json({
      success: true,
      data: website,
      message: 'Website updated successfully',
    });
  } catch (error) {
    console.error('Update website error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateBranding = async (req, res) => {
  try {
    const { websiteId } = req.params;
    const userEmail = req.user.email;
    let branding = req.body;

    const website = await Website.findById(websiteId);

    if (!website) {
      return res.status(404).json({
        success: false,
        message: 'Website not found',
      });
    }

    // Verify ownership
    if (website.creatorEmail !== userEmail) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    // Handle colors object if provided
    if (branding.colors) {
      branding = {
        ...branding,
        primaryColor: branding.colors.primary,
        secondaryColor: branding.colors.secondary,
      };
      delete branding.colors;
    }

    // Explicitly handle logo removal (empty string means cleared)
    const updatedBranding = { ...website.branding, ...branding };
    if ('logo' in branding && !branding.logo) {
      updatedBranding.logo = '';
    }
    website.branding = updatedBranding;
    await website.save();

    res.json({
      success: true,
      data: website,
      message: 'Branding updated successfully',
    });
  } catch (error) {
    console.error('Update branding error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const publishWebsite = async (req, res) => {
  try {
    const { websiteId } = req.params;
    const userEmail = req.user.email;

    const website = await Website.findById(websiteId);

    if (!website) {
      return res.status(404).json({
        success: false,
        message: 'Website not found',
      });
    }

    // Verify ownership
    if (website.creatorEmail !== userEmail) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    // Publish ALL pages (not just already published ones)
    await Page.updateMany(
      { websiteId },
      { 
        isPublished: true,
        publishedAt: new Date(),
        publishedBy: req.user.id
      }
    );

    website.isPublished = true;
    website.lastPublishedAt = new Date();
    await website.save();

    res.json({
      success: true,
      data: website,
      message: 'Website and all pages published successfully',
    });
  } catch (error) {
    console.error('Publish website error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteWebsite = async (req, res) => {
  try {
    const { websiteId } = req.params;
    const specialistId = req.user?.id || req.user?.userId || req.user?._id;
    const userEmail = req.user.email;

    console.log(`Deleting website: ${websiteId}`);
    console.log(`   Specialist ID: ${specialistId}`);
    console.log(`   User Email: ${userEmail}`);

    const website = await Website.findById(websiteId);

    if (!website) {
      console.error(`Website not found: ${websiteId}`);
      return res.status(404).json({
        success: false,
        message: 'Website not found',
      });
    }

    // Verify ownership - check both specialistId and creatorEmail for backward compatibility
    const websiteSpecialistId = website.specialistId?.toString() || website.specialistId;
    const userSpecialistId = specialistId?.toString ? specialistId.toString() : String(specialistId);
    const ownershipMatchesBySpecialistId = websiteSpecialistId === userSpecialistId;
    const ownershipMatchesByEmail = website.creatorEmail === userEmail;
    const isOwner = ownershipMatchesBySpecialistId || ownershipMatchesByEmail;

    console.log(`Ownership verification:`, {
      websiteSpecialistId,
      userSpecialistId,
      specialistIdMatch: ownershipMatchesBySpecialistId,
      emailMatch: ownershipMatchesByEmail,
      isOwner,
    });

    if (!isOwner) {
      console.error(`Ownership check failed for website ${websiteId}`);
      return res.status(403).json({
        success: false,
        message: 'Unauthorized - You do not own this website',
      });
    }

    console.log(`Ownership verified. Proceeding with deletion...`);

    // Delete all pages and sections for this website
    const pages = await Page.find({ websiteId });
    console.log(`   Deleting ${pages.length} page(s)...`);
    
    for (const page of pages) {
      const deletedSections = await PageSection.deleteMany({ pageId: page._id });
      console.log(`   - Deleted sections for page ${page._id}`);
    }
    await Page.deleteMany({ websiteId });

    // Delete website
    await Website.findByIdAndDelete(websiteId);
    console.log(`Website ${websiteId} deleted successfully`);

    res.json({
      success: true,
      message: 'Website deleted successfully',
      data: {
        websiteId,
        deletedPagesCount: pages.length,
      },
    });
  } catch (error) {
    console.error('Delete website error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============ Configure Subdomain for Existing Websites ============

export const ensureSubdomain = async (req, res) => {
  try {
    const { websiteId } = req.params;
    const userEmail = req.user.email;
    const { subdomain: proposedSubdomain } = req.body;

    const website = await Website.findById(websiteId);

    if (!website) {
      return res.status(404).json({
        success: false,
        message: 'Website not found',
      });
    }

    // Verify ownership
    if (website.creatorEmail !== userEmail) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    // If already has subdomain, return it
    if (website.subdomain) {
      return res.json({
        success: true,
        data: website,
        message: 'Website already has subdomain configured',
      });
    }

    // Generate subdomain from siteName or name
    let subdomain = proposedSubdomain;
    if (!subdomain) {
      subdomain = (website.branding?.siteName || 'website')
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w-]/g, '')
        .substring(0, 50);
    }

    // Make subdomain unique if needed
    let finalSubdomain = subdomain;
    let counter = 1;
    while (await Website.findOne({ subdomain: finalSubdomain, _id: { $ne: websiteId } })) {
      finalSubdomain = `${subdomain}-${counter}`;
      counter++;
    }

    website.subdomain = finalSubdomain;
    await website.save();

    res.json({
      success: true,
      data: website,
      message: `Subdomain configured: ${finalSubdomain}.specialistly.com`,
    });
  } catch (error) {
    console.error('Ensure subdomain error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateSubdomain = async (req, res) => {
  try {
    const { websiteId } = req.params;
    const userEmail = req.user.email;
    const { subdomain: newSubdomain } = req.body;

    // Validate subdomain format
    if (!newSubdomain || typeof newSubdomain !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Subdomain is required and must be a string',
      });
    }

    // Validate subdomain format (alphanumeric and hyphens only, 3-50 chars)
    const subdomainRegex = /^[a-z0-9]([a-z0-9-]{1,48}[a-z0-9])?$/;
    if (!subdomainRegex.test(newSubdomain)) {
      return res.status(400).json({
        success: false,
        message: 'Subdomain must be 3-50 characters, start/end with alphanumeric, and contain only letters, numbers, and hyphens',
      });
    }

    const website = await Website.findById(websiteId);

    if (!website) {
      return res.status(404).json({
        success: false,
        message: 'Website not found',
      });
    }

    // Verify ownership
    if (website.creatorEmail !== userEmail) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    // Check if subdomain already taken by another website
    const existingWebsite = await Website.findOne({ 
      subdomain: newSubdomain, 
      _id: { $ne: websiteId } 
    });

    if (existingWebsite) {
      return res.status(400).json({
        success: false,
        message: 'This subdomain is already taken. Please choose another.',
      });
    }

    website.subdomain = newSubdomain;
    await website.save();

    res.json({
      success: true,
      data: website,
      message: `Subdomain updated to: ${newSubdomain}.specialistly.com`,
    });
  } catch (error) {
    console.error('Update subdomain error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateCustomDomain = async (req, res) => {
  try {
    const { websiteId } = req.params;
    const userEmail = req.user.email;
    const { customDomain } = req.body;

    const website = await Website.findById(websiteId);

    if (!website) {
      return res.status(404).json({
        success: false,
        message: 'Website not found',
      });
    }

    // Verify ownership
    if (website.creatorEmail !== userEmail) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    if (customDomain) {
      // Validate domain format
      const domainRegex = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/;
      const normalizedDomain = customDomain.toLowerCase().trim().replace(/^www\./, '');
      
      if (!domainRegex.test(normalizedDomain)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid domain format. Example: example.com',
        });
      }

      // Check if domain already taken by another website
      const existingWebsite = await Website.findOne({
        customDomain: normalizedDomain,
        _id: { $ne: websiteId },
      });

      if (existingWebsite) {
        return res.status(400).json({
          success: false,
          message: 'This domain is already connected to another website.',
        });
      }

      website.customDomain = normalizedDomain;
    } else {
      // Remove custom domain
      website.customDomain = undefined;
    }

    await website.save();

    res.json({
      success: true,
      data: website,
      message: customDomain
        ? `Custom domain set to: ${website.customDomain}`
        : 'Custom domain removed',
    });
  } catch (error) {
    console.error('Update custom domain error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============ Page Operations ============

export const createPage = async (req, res) => {
  try {
    const { websiteId } = req.params;
    const userEmail = req.user.email;
    const { title, slug, description, isHomePage } = req.body;

    // Verify website ownership
    const website = await Website.findById(websiteId);
    if (!website) {
      return res.status(404).json({
        success: false,
        message: 'Website not found',
      });
    }

    if (website.creatorEmail !== userEmail) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    // Validate required fields
    if (!title || !slug) {
      return res.status(400).json({
        success: false,
        message: 'Title and slug are required',
      });
    }

    // Check if slug already exists for this website
    const existingPage = await Page.findOne({ websiteId, slug });
    if (existingPage) {
      return res.status(400).json({
        success: false,
        message: 'Page slug must be unique',
      });
    }

    const page = new Page({
      websiteId,
      title,
      slug,
      description: description || '',
      isHomePage: isHomePage || false,
      isPublished: false,
      order: 0,
    });

    await page.save();

    // Populate sections before returning
    const populatedPage = await Page.findById(page._id).populate('sections');

    res.status(201).json({
      success: true,
      data: populatedPage,
      message: 'Page created successfully',
    });
  } catch (error) {
    console.error('Create page error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create page',
    });
  }
};

export const getPages = async (req, res) => {
  try {
    const { websiteId } = req.params;
    const userEmail = req.user.email;

    // Verify website ownership
    const website = await Website.findById(websiteId);
    if (!website) {
      return res.status(404).json({
        success: false,
        message: 'Website not found',
      });
    }

    if (website.creatorEmail !== userEmail) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const pages = await Page.find({ websiteId })
      .populate('sections')
      .sort({ order: 1 });

    res.json({
      success: true,
      data: pages,
    });
  } catch (error) {
    console.error('Get pages error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getPageById = async (req, res) => {
  try {
    const { websiteId, pageId } = req.params;
    const userEmail = req.user.email;

    // Verify website ownership
    const website = await Website.findById(websiteId);
    if (!website) {
      return res.status(404).json({
        success: false,
        message: 'Website not found',
      });
    }

    if (website.creatorEmail !== userEmail) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const page = await Page.findById(pageId)
      .populate('sections');
    if (!page || page.websiteId.toString() !== websiteId) {
      return res.status(404).json({
        success: false,
        message: 'Page not found',
      });
    }

    res.json({
      success: true,
      data: page,
    });
  } catch (error) {
    console.error('Get page error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updatePage = async (req, res) => {
  try {
    const { websiteId, pageId } = req.params;
    const userEmail = req.user.email;
    const { title, slug, description, order, isHomePage } = req.body;

    // Verify website ownership
    const website = await Website.findById(websiteId);
    if (!website) {
      return res.status(404).json({
        success: false,
        message: 'Website not found',
      });
    }

    if (website.creatorEmail !== userEmail) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const page = await Page.findById(pageId);
    if (!page || page.websiteId.toString() !== websiteId) {
      return res.status(404).json({
        success: false,
        message: 'Page not found',
      });
    }

    // Update fields
    if (title !== undefined) page.title = title;
    if (slug) {
      // Check if new slug is unique
      const existingPage = await Page.findOne({ 
        websiteId, 
        slug, 
        _id: { $ne: pageId } 
      });
      if (existingPage) {
        return res.status(400).json({
          success: false,
          message: 'Page slug must be unique',
        });
      }
      page.slug = slug;
    }
    if (description !== undefined) page.description = description;
    if (order !== undefined) page.order = order;
    if (isHomePage !== undefined) page.isHomePage = isHomePage;

    await page.save();

    // Populate sections before returning
    const populatedPage = await Page.findById(page._id).populate('sections');

    res.json({
      success: true,
      data: populatedPage,
      message: 'Page updated successfully',
    });
  } catch (error) {
    console.error('Update page error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const publishPage = async (req, res) => {
  try {
    const { websiteId, pageId } = req.params;
    const userEmail = req.user.email;

    // Verify website ownership
    const website = await Website.findById(websiteId);
    if (!website) {
      return res.status(404).json({
        success: false,
        message: 'Website not found',
      });
    }

    if (website.creatorEmail !== userEmail) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const page = await Page.findById(pageId);
    if (!page || page.websiteId.toString() !== websiteId) {
      return res.status(404).json({
        success: false,
        message: 'Page not found',
      });
    }

    page.isPublished = true;
    page.publishedAt = new Date();
    await page.save();

    // Populate sections before returning
    const populatedPage = await Page.findById(page._id).populate('sections');

    res.json({
      success: true,
      data: populatedPage,
      message: 'Page published successfully',
    });
  } catch (error) {
    console.error('Publish page error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const deletePage = async (req, res) => {
  try {
    const { websiteId, pageId } = req.params;
    const userEmail = req.user.email;

    // Verify website ownership
    const website = await Website.findById(websiteId);
    if (!website) {
      return res.status(404).json({
        success: false,
        message: 'Website not found',
      });
    }

    if (website.creatorEmail !== userEmail) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const page = await Page.findById(pageId);
    if (!page || page.websiteId.toString() !== websiteId) {
      return res.status(404).json({
        success: false,
        message: 'Page not found',
      });
    }

    // Delete all sections for this page
    await PageSection.deleteMany({ pageId });

    // Delete the page
    await Page.findByIdAndDelete(pageId);

    res.json({
      success: true,
      message: 'Page deleted successfully',
    });
  } catch (error) {
    console.error('Delete page error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============ Section Operations ============

export const createSection = async (req, res) => {
  try {
    const { websiteId, pageId } = req.params;
    const userEmail = req.user.email;
    const { type, title, description, content, styling, visibility } = req.body;

    // Verify website ownership
    const website = await Website.findById(websiteId);
    if (!website) {
      return res.status(404).json({
        success: false,
        message: 'Website not found',
      });
    }

    if (website.creatorEmail !== userEmail) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    // Verify page exists and belongs to this website
    const page = await Page.findById(pageId);
    if (!page || page.websiteId.toString() !== websiteId) {
      return res.status(404).json({
        success: false,
        message: 'Page not found',
      });
    }

    // Validate required fields
    if (!type || !content) {
      return res.status(400).json({
        success: false,
        message: 'Section type and content are required',
      });
    }

    const section = new PageSection({
      pageId,
      websiteId,
      type,
      title: title || '',
      description: description || '',
      content,
      styling: styling || {},
      visibility: visibility || { hidden: false, hideOnMobile: false },
      isPublished: false,
    });

    await section.save();

    // Add section to page's sections array
    page.sections.push(section._id);
    await page.save();

    res.status(201).json({
      success: true,
      data: section,
      message: 'Section created successfully',
    });
  } catch (error) {
    console.error('Create section error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create section',
    });
  }
};

export const getSections = async (req, res) => {
  try {
    const { websiteId, pageId } = req.params;
    const userEmail = req.user.email;

    // Verify website ownership
    const website = await Website.findById(websiteId);
    if (!website) {
      return res.status(404).json({
        success: false,
        message: 'Website not found',
      });
    }

    if (website.creatorEmail !== userEmail) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    // Verify page exists and belongs to this website
    const page = await Page.findById(pageId);
    if (!page || page.websiteId.toString() !== websiteId) {
      return res.status(404).json({
        success: false,
        message: 'Page not found',
      });
    }

    const sections = await PageSection.find({ pageId })
      .sort({ order: 1 });

    res.json({
      success: true,
      data: sections,
    });
  } catch (error) {
    console.error('Get sections error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateSection = async (req, res) => {
  try {
    const { websiteId, pageId, sectionId } = req.params;
    const userEmail = req.user.email;
    const { type, title, description, content, styling, visibility, order } = req.body;

    console.log('Updating section:', { websiteId, pageId, sectionId });

    // Verify website ownership
    const website = await Website.findById(websiteId);
    if (!website) {
      return res.status(404).json({
        success: false,
        message: 'Website not found',
      });
    }

    if (website.creatorEmail !== userEmail) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    // Verify page exists and belongs to this website
    const page = await Page.findById(pageId);
    if (!page || page.websiteId.toString() !== websiteId) {
      return res.status(404).json({
        success: false,
        message: 'Page not found',
      });
    }

    // Verify section exists and belongs to this page
    const section = await PageSection.findById(sectionId);
    console.log('Section lookup result:', { found: !!section, sectionId, pageId, section_pageId: section?.pageId?.toString() });
    
    if (!section) {
      console.log('Section not found in database:', sectionId);
      return res.status(404).json({
        success: false,
        message: 'Section not found',
      });
    }

    if (section.pageId.toString() !== pageId) {
      console.log('Section belongs to different page:', { section_pageId: section.pageId.toString(), expected_pageId: pageId });
      return res.status(404).json({
        success: false,
        message: 'Section not found',
      });
    }

    // Update fields - preserve existing content and merge new content
    if (type) section.type = type;
    if (title !== undefined) section.title = title;
    if (description !== undefined) section.description = description;
    if (content) {
      // Merge content instead of replacing it completely
      section.content = {
        ...section.content,
        ...content,
      };
      section.markModified('content');
    }
    if (styling) {
      section.styling = { ...section.styling, ...styling };
      section.markModified('styling');
    }
    if (visibility) section.visibility = visibility;
    if (order !== undefined) section.order = order;

    await section.save();

    res.json({
      success: true,
      data: section,
      message: 'Section updated successfully',
    });
  } catch (error) {
    console.error('Update section error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteSection = async (req, res) => {
  try {
    const { websiteId, pageId, sectionId } = req.params;
    const userEmail = req.user.email;

    console.log('Deleting section:', { websiteId, pageId, sectionId, userEmail });

    // Verify website ownership
    const website = await Website.findById(websiteId);
    if (!website) {
      console.log('Website not found:', websiteId);
      return res.status(404).json({
        success: false,
        message: 'Website not found',
      });
    }

    if (website.creatorEmail !== userEmail) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    // Verify page exists and belongs to this website
    const page = await Page.findById(pageId);
    if (!page || page.websiteId.toString() !== websiteId) {
      return res.status(404).json({
        success: false,
        message: 'Page not found',
      });
    }

    // Verify section exists and belongs to this page
    const section = await PageSection.findById(sectionId);
    if (!section || section.pageId.toString() !== pageId) {
      return res.status(404).json({
        success: false,
        message: 'Section not found',
      });
    }

    // Delete the section
    await PageSection.findByIdAndDelete(sectionId);

    // Remove section from page's sections array
    page.sections = page.sections.filter(id => id.toString() !== sectionId);
    await page.save();

    res.json({
      success: true,
      message: 'Section deleted successfully',
    });
  } catch (error) {
    console.error('Delete section error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============ Public Routes ============

export const getPublicWebsite = async (req, res) => {
  try {
    const { domain } = req.params;

    // Find website by subdomain or custom domain that is published
    const website = await Website.findOne({
      $or: [
        { subdomain: domain },
        { customDomain: domain },
      ],
      isPublished: true,
    });

    if (!website) {
      return res.status(404).json({
        success: false,
        message: 'Website not found',
      });
    }

    // Get ALL published pages for this website, sorted by order
    const pages = await Page.find({ 
      websiteId: website._id, 
      isPublished: true 
    })
      .populate('sections')
      .sort({ order: 1 });

    // If no pages found, return success with empty array
    if (!pages || pages.length === 0) {
      return res.json({
        success: true,
        data: {
          website,
          pages: [],
        },
        message: 'Website found but no published pages',
      });
    }

    // Enrich courses sections with actual specialist course data
    const specialistCourses = await Course.find({
      specialistEmail: website.creatorEmail,
      status: 'published',
    })
      .select('_id title description thumbnail courseType price currency lessons startDate endDate schedule meetingPlatform zoomLink cohortSize liveSessions')
      .sort({ createdAt: -1 });

    // Enrich services sections with actual specialist service data
    const specialistServices = await Service.find({
      creator: website.creatorEmail,
      status: 'active',
    })
      .select('_id title type description price currency duration capacity thumbnail')
      .sort({ createdAt: -1 });

    const enrichedPages = pages.map((page) => {
      const pageObj = page.toObject();
      pageObj.sections = pageObj.sections.map((section) => {
        if (section.type === 'courses') {
          section.content = {
            ...section.content,
            fetchedCourses: specialistCourses,
          };
        }
        if (section.type === 'services') {
          section.content = {
            ...section.content,
            fetchedServices: specialistServices,
            specialistEmail: website.creatorEmail,
          };
        }
        return section;
      });
      return pageObj;
    });

    res.json({
      success: true,
      data: {
        website,
        pages: enrichedPages,
      },
      message: 'Website and pages fetched successfully',
    });
  } catch (error) {
    console.error('Get public website error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
