import Website from '../models/Website.js';
import Page from '../models/Page.js';
import PageSection from '../models/PageSection.js';
import User from '../models/User.js';

// ============ Website Operations ============

export const createWebsite = async (req, res) => {
  try {
    const { displayName, description, theme } = req.body;
    const specialistId = req.user.id;

    // Generate subdomain from display name
    const subdomain = displayName
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]/g, '')
      .substring(0, 50);

    // Check if subdomain already exists
    const existing = await Website.findOne({ domainName: subdomain });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Website name already taken',
      });
    }

    const website = new Website({
      specialistId,
      displayName,
      description,
      domainName: `${subdomain}.specialistly.com`,
      theme: theme || { id: 'default', name: 'Default', version: '1.0' },
      pages: [],
      navigation: [],
    });

    // Create homepage
    const homepage = new Page({
      websiteId: website._id,
      title: 'Home',
      slug: 'home',
      isHomePage: true,
      order: 0,
      sections: [],
    });

    await homepage.save();
    website.pages.push({
      _id: homepage._id,
      title: 'Home',
      slug: 'home',
      isHomePage: true,
      isPublished: false,
      order: 0,
      sections: [],
    });

    // Add homepage to navigation
    website.navigation.push({
      id: `nav-${homepage._id}`,
      label: 'Home',
      pageId: homepage._id,
      order: 0,
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
      message: error.message,
    });
  }
};

export const getWebsites = async (req, res) => {
  try {
    const specialistId = req.user.id;

    const websites = await Website.find({ specialistId })
      .select('-notes')
      .sort({ createdAt: -1 });

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
    const specialistId = req.user.id;

    const website = await Website.findById(websiteId);

    if (!website) {
      return res.status(404).json({
        success: false,
        message: 'Website not found',
      });
    }

    // Verify ownership
    if (website.specialistId.toString() !== specialistId) {
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
    const specialistId = req.user.id;
    const { displayName, description, header, footer, navigation } = req.body;

    const website = await Website.findById(websiteId);

    if (!website) {
      return res.status(404).json({
        success: false,
        message: 'Website not found',
      });
    }

    // Verify ownership
    if (website.specialistId.toString() !== specialistId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    // Update fields
    if (displayName) website.displayName = displayName;
    if (description) website.description = description;
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
    const specialistId = req.user.id;
    const branding = req.body;

    const website = await Website.findById(websiteId);

    if (!website) {
      return res.status(404).json({
        success: false,
        message: 'Website not found',
      });
    }

    // Verify ownership
    if (website.specialistId.toString() !== specialistId) {
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
    const specialistId = req.user.id;

    const website = await Website.findById(websiteId);

    if (!website) {
      return res.status(404).json({
        success: false,
        message: 'Website not found',
      });
    }

    // Verify ownership
    if (website.specialistId.toString() !== specialistId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    // Publish all published pages
    await Page.updateMany(
      { websiteId, isPublished: true },
      { publishedAt: new Date() }
    );

    website.isPublished = true;
    website.lastPublishedAt = new Date();
    await website.save();

    res.json({
      success: true,
      data: website,
      message: 'Website published successfully',
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
    const specialistId = req.user.id;

    const website = await Website.findById(websiteId);

    if (!website) {
      return res.status(404).json({
        success: false,
        message: 'Website not found',
      });
    }

    // Verify ownership
    if (website.specialistId.toString() !== specialistId) {
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

// ============ Public Routes ============

export const getPublicWebsite = async (req, res) => {
  try {
    const { domain } = req.params;

    const website = await Website.findOne({
      $or: [
        { domainName: `${domain}.specialistly.com` },
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
