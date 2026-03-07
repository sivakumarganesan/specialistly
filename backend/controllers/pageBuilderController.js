import Website from '../models/Website.js';
import Page from '../models/Page.js';
import PageSection from '../models/PageSection.js';
import User from '../models/User.js';

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
    const branding = req.body;

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

    website.branding = { ...website.branding, ...branding };
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

    // Delete all pages and sections for this website
    const pages = await Page.find({ websiteId });
    for (const page of pages) {
      await PageSection.deleteMany({ pageId: page._id });
    }
    await Page.deleteMany({ websiteId });

    // Delete website
    await Website.findByIdAndDelete(websiteId);

    res.json({
      success: true,
      message: 'Website deleted successfully',
    });
  } catch (error) {
    console.error('Delete website error:', error);
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
    if (!section || section.pageId.toString() !== pageId) {
      return res.status(404).json({
        success: false,
        message: 'Section not found',
      });
    }

    // Update fields
    if (type) section.type = type;
    if (title !== undefined) section.title = title;
    if (description !== undefined) section.description = description;
    if (content) section.content = content;
    if (styling) section.styling = styling;
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

    // Get published pages and their sections
    const pages = await Page.find({ websiteId: website._id, isPublished: true })
      .sort({ order: 1 });

    // Get sections for each page
    const pageData = await Promise.all(
      pages.map(async (page) => {
        const sections = await PageSection.find({ pageId: page._id })
          .sort({ order: 1 });
        return { ...page.toObject(), sections };
      })
    );

    res.json({
      success: true,
      data: {
        website,
        pages: pageData,
      },
    });
  } catch (error) {
    console.error('Get public website error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
