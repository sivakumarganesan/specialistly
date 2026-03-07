import PageTemplate from '../models/PageTemplate.js';
import Page from '../models/Page.js';
import PageSection from '../models/PageSection.js';
import Website from '../models/Website.js';
import User from '../models/User.js';

// ============ PUBLIC - List Available Templates ============

export const listTemplates = async (req, res) => {
  try {
    const { category, limit = 12, page = 1 } = req.query;

    const query = { isActive: true };
    if (category) {
      query.category = category;
    }

    const skip = (page - 1) * limit;

    const templates = await PageTemplate.find(query)
      .select('name description category thumbnail branding layout')
      .limit(limit)
      .skip(skip)
      .sort({ isDefault: -1, createdAt: -1 });

    const total = await PageTemplate.countDocuments(query);

    res.json({
      success: true,
      data: templates,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('List templates error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to list templates',
    });
  }
};

export const getTemplate = async (req, res) => {
  try {
    const { templateId } = req.params;

    const template = await PageTemplate.findById(templateId);
    if (!template || !template.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Template not found',
      });
    }

    res.json({
      success: true,
      data: template,
    });
  } catch (error) {
    console.error('Get template error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get template',
    });
  }
};

// ============ CREATE PAGE FROM TEMPLATE (Protected) ============

export const createPageFromTemplate = async (req, res) => {
  try {
    const { templateId } = req.params;
    const { websiteId, pageTitle } = req.body;
    const userId = req.user.id;

    // Validate inputs
    if (!websiteId || !pageTitle) {
      return res.status(400).json({
        success: false,
        message: 'Website ID and page title are required',
      });
    }

    // Verify template exists
    const template = await PageTemplate.findById(templateId);
    if (!template || !template.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Template not found',
      });
    }

    // Verify website exists and user has access
    const website = await Website.findById(websiteId);
    if (!website) {
      return res.status(404).json({
        success: false,
        message: 'Website not found',
      });
    }

    // Check authorization
    const user = await User.findById(userId);
    if (website.creatorEmail !== user.email) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to modify this website',
      });
    }

    // Generate slug from title
    const slug = pageTitle
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]/g, '')
      .substring(0, 100);

    // Check if slug already exists for this website
    const existingPage = await Page.findOne({ websiteId, slug });
    if (existingPage) {
      return res.status(400).json({
        success: false,
        message: 'A page with this title already exists',
      });
    }

    // Create page
    const page = new Page({
      websiteId,
      title: pageTitle,
      slug,
      description: template.description,
      isHomePage: false,
      isPublished: false,
      sections: [],
      seo: template.seoDefaults || {},
    });

    await page.save();

    // Create sections from template
    const createdSections = [];
    for (const templateSection of template.sections || []) {
      const section = new PageSection({
        pageId: page._id,
        type: templateSection.type,
        title: templateSection.title,
        subtitle: templateSection.subtitle,
        content: templateSection.defaultContent || {},
        styling: templateSection.styling || {},
        order: templateSection.order || 0,
      });

      await section.save();
      createdSections.push(section._id);
    }

    // Update page with sections
    page.sections = createdSections;
    await page.save();

    // Increment template usage
    await PageTemplate.findByIdAndUpdate(templateId, { $inc: { usageCount: 1 } });

    // Fetch full page with sections
    const fullPage = await Page.findById(page._id).populate('sections');

    res.status(201).json({
      success: true,
      data: fullPage,
      message: 'Page created from template successfully',
    });
  } catch (error) {
    console.error('Create page from template error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create page from template',
    });
  }
};

// ============ ADMIN - Template Management ============

export const getAllTemplates = async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Only admins can view all templates',
      });
    }

    const templates = await PageTemplate.find()
      .populate('createdBy', 'name email')
      .sort({ isDefault: -1, createdAt: -1 });

    res.json({
      success: true,
      data: templates,
    });
  } catch (error) {
    console.error('Get all templates error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get all templates',
    });
  }
};

export const createTemplate = async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Only admins can create templates',
      });
    }

    const { name, description, category, sections, branding, layout } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Template name is required',
      });
    }

    // Check if name exists
    const existing = await PageTemplate.findOne({ name });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Template with this name already exists',
      });
    }

    const template = new PageTemplate({
      name,
      description,
      category,
      sections: sections || [],
      branding,
      layout,
      createdBy: req.user.id,
    });

    await template.save();

    res.status(201).json({
      success: true,
      data: template,
      message: 'Template created successfully',
    });
  } catch (error) {
    console.error('Create template error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create template',
    });
  }
};

export const updateTemplate = async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Only admins can update templates',
      });
    }

    const { templateId } = req.params;
    const { name, description, category, sections, branding, layout, isActive } = req.body;

    const template = await PageTemplate.findByIdAndUpdate(
      templateId,
      {
        name,
        description,
        category,
        sections,
        branding,
        layout,
        isActive,
      },
      { new: true, runValidators: true }
    );

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found',
      });
    }

    res.json({
      success: true,
      data: template,
      message: 'Template updated successfully',
    });
  } catch (error) {
    console.error('Update template error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update template',
    });
  }
};

export const deleteTemplate = async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Only admins can delete templates',
      });
    }

    const { templateId } = req.params;

    const template = await PageTemplate.findByIdAndDelete(templateId);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found',
      });
    }

    res.json({
      success: true,
      message: 'Template deleted successfully',
    });
  } catch (error) {
    console.error('Delete template error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete template',
    });
  }
};
