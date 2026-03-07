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
    const userEmail = req.user.email;

    // Validate inputs
    if (!websiteId || !pageTitle) {
      return res.status(400).json({
        success: false,
        message: 'Website ID and page title are required',
      });
    }

    if (!userEmail) {
      return res.status(401).json({
        success: false,
        message: 'User email not found in token',
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

    // Check authorization - user must be the website creator
    if (website.creatorEmail !== userEmail) {
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

// ============ SEED TEMPLATES - Initialize sample templates ============

export const seedTemplates = async (req, res) => {
  try {
    // Check if templates already exist
    const existingCount = await PageTemplate.countDocuments();
    if (existingCount > 0) {
      return res.json({
        success: true,
        message: `Templates already exist (${existingCount} templates found)`,
        data: { created: 0, existing: existingCount },
      });
    }

    const seedData = [
      {
        name: 'Modern Landing Page',
        description: 'Clean, modern landing page with hero section and services showcase',
        category: 'landing',
        isActive: true,
        isDefault: true,
        sections: [
          {
            type: 'hero',
            title: 'Welcome to Your Business',
            subtitle: 'Professional Services Start Here',
            order: 0,
            defaultContent: {
              heading: 'Transform Your Expertise Into Revenue',
              subheading: 'Showcase your skills and connect with clients who need you',
              buttonText: 'Get Started',
              buttonLink: '#contact',
            },
            styling: {
              backgroundColor: '#ffffff',
              textColor: '#000000',
              alignment: 'center',
              padding: '120px 20px',
            },
          },
          {
            type: 'services',
            title: 'Services',
            subtitle: 'What We Offer',
            order: 1,
            defaultContent: {
              items: [
                {
                  title: 'Consulting',
                  description: 'Expert guidance on industry best practices',
                  icon: '💼',
                },
                {
                  title: 'Training',
                  description: 'Hands-on training sessions for your team',
                  icon: '🎓',
                },
                {
                  title: 'Support',
                  description: '24/7 support for all your needs',
                  icon: '🤝',
                },
              ],
            },
            styling: {
              backgroundColor: '#f9fafb',
              textColor: '#000000',
              padding: '80px 20px',
            },
          },
          {
            type: 'cta',
            title: 'Ready to Get Started?',
            order: 2,
            defaultContent: {
              heading: 'Transform Your Business Today',
              subheading: 'Join hundreds of satisfied clients',
              buttonText: 'Contact Us Now',
              buttonLink: '#contact',
            },
            styling: {
              backgroundColor: '#4f46e5',
              textColor: '#ffffff',
              padding: '80px 20px',
              alignment: 'center',
            },
          },
        ],
        branding: {
          primaryColor: '#4f46e5',
          secondaryColor: '#06b6d4',
          fontFamily: 'Inter',
          headerStyle: 'standard',
          footerStyle: 'simple',
        },
        layout: {
          headerType: 'sticky',
          footerIncluded: true,
          sidebarIncluded: false,
          containerWidth: 'standard',
        },
      },
      {
        name: 'About Page',
        description: 'Professional about page to showcase your background and expertise',
        category: 'about',
        isActive: true,
        sections: [
          {
            type: 'hero',
            title: 'About Us',
            order: 0,
            defaultContent: {
              heading: 'About Our Company',
              subheading: 'Our story, mission, and values',
            },
            styling: {
              backgroundColor: '#ffffff',
              padding: '80px 20px',
            },
          },
          {
            type: 'about',
            title: 'Our Story',
            order: 1,
            defaultContent: {
              content: 'Share your journey and what drives your passion for helping clients...',
            },
            styling: {
              backgroundColor: '#ffffff',
              padding: '60px 20px',
            },
          },
        ],
        branding: {
          primaryColor: '#4f46e5',
          secondaryColor: '#06b6d4',
          fontFamily: 'Inter',
          headerStyle: 'standard',
          footerStyle: 'simple',
        },
        layout: {
          headerType: 'sticky',
          footerIncluded: true,
          sidebarIncluded: false,
          containerWidth: 'standard',
        },
      },
      {
        name: 'Services Showcase',
        description: 'Detailed services page with service cards and descriptions',
        category: 'services',
        isActive: true,
        sections: [
          {
            type: 'hero',
            title: 'Our Services',
            order: 0,
            defaultContent: {
              heading: 'Professional Services',
              subheading: 'Choose the service that fits your needs',
            },
            styling: {
              backgroundColor: '#ffffff',
              padding: '80px 20px',
            },
          },
          {
            type: 'services',
            title: 'Services Offered',
            order: 1,
            defaultContent: {
              items: [
                { title: 'Service 1', description: 'Description of first service', icon: '✓' },
                { title: 'Service 2', description: 'Description of second service', icon: '✓' },
                { title: 'Service 3', description: 'Description of third service', icon: '✓' },
              ],
            },
            styling: {
              backgroundColor: '#f9fafb',
              padding: '80px 20px',
            },
          },
        ],
        branding: {
          primaryColor: '#4f46e5',
          secondaryColor: '#06b6d4',
          fontFamily: 'Inter',
          headerStyle: 'standard',
          footerStyle: 'simple',
        },
        layout: {
          headerType: 'sticky',
          footerIncluded: true,
          sidebarIncluded: false,
          containerWidth: 'standard',
        },
      },
      {
        name: 'Contact Page',
        description: 'Simple contact page with contact form',
        category: 'contact',
        isActive: true,
        sections: [
          {
            type: 'hero',
            title: 'Contact Us',
            order: 0,
            defaultContent: {
              heading: 'Get In Touch',
              subheading: 'We would love to hear from you',
            },
            styling: {
              backgroundColor: '#ffffff',
              padding: '80px 20px',
            },
          },
          {
            type: 'contact',
            title: 'Contact Form',
            order: 1,
            defaultContent: {
              email: 'contact@example.com',
              phone: '+1 (555) 123-4567',
              address: 'Your Address Here',
            },
            styling: {
              backgroundColor: '#ffffff',
              padding: '80px 20px',
            },
          },
        ],
        branding: {
          primaryColor: '#4f46e5',
          secondaryColor: '#06b6d4',
          fontFamily: 'Inter',
          headerStyle: 'standard',
          footerStyle: 'simple',
        },
        layout: {
          headerType: 'sticky',
          footerIncluded: true,
          sidebarIncluded: false,
          containerWidth: 'standard',
        },
      },
    ];

    const created = await PageTemplate.insertMany(seedData);

    res.status(201).json({
      success: true,
      message: `Successfully seeded ${created.length} templates`,
      data: {
        created: created.length,
        templates: created.map((t) => ({ id: t._id, name: t.name })),
      },
    });
  } catch (error) {
    console.error('Seed templates error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to seed templates',
    });
  }
};
