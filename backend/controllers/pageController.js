import Page from '../models/Page.js';
import PageSection from '../models/PageSection.js';
import Website from '../models/Website.js';
import Course from '../models/Course.js';

// ============ Page Operations ============

export const createPage = async (req, res) => {
  try {
    const { websiteId } = req.params;
    const { title, slug } = req.body;
    const specialistId = req.user.id;

    // Verify website ownership
    const website = await Website.findById(websiteId);
    if (!website || website.specialistId.toString() !== specialistId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    // Check if slug already exists for this website
    const existing = await Page.findOne({ websiteId, slug });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Page slug already exists',
      });
    }

    // Get max order
    const maxOrder = await Page.findOne({ websiteId })
      .sort({ order: -1 })
      .select('order');

    const page = new Page({
      websiteId,
      title,
      slug: slug.toLowerCase().replace(/\s+/g, '-'),
      order: (maxOrder?.order || 0) + 1,
      sections: [],
    });

    await page.save();

    // Add to website pages
    website.pages.push({
      _id: page._id,
      title,
      slug: page.slug,
      isHomePage: false,
      isPublished: false,
      order: page.order,
      sections: [],
    });

    // Add to navigation
    website.navigation.push({
      id: `nav-${page._id}`,
      label: title,
      pageId: page._id,
      order: page.order,
    });

    await website.save();

    res.status(201).json({
      success: true,
      data: page,
      message: 'Page created successfully',
    });
  } catch (error) {
    console.error('Create page error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getPages = async (req, res) => {
  try {
    const { websiteId } = req.params;
    const specialistId = req.user.id;

    // Verify website ownership
    const website = await Website.findById(websiteId);
    if (!website || website.specialistId.toString() !== specialistId) {
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
    const specialistId = req.user.id;

    // Verify website ownership
    const website = await Website.findById(websiteId);
    if (!website || website.specialistId.toString() !== specialistId) {
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
    const specialistId = req.user.id;
    const { title, description, seo } = req.body;

    // Verify website ownership
    const website = await Website.findById(websiteId);
    if (!website || website.specialistId.toString() !== specialistId) {
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

    if (title) page.title = title;
    if (description) page.description = description;
    if (seo) page.seo = { ...page.seo, ...seo };

    await page.save();

    res.json({
      success: true,
      data: page,
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
    const specialistId = req.user.id;

    // Verify website ownership
    const website = await Website.findById(websiteId);
    if (!website || website.specialistId.toString() !== specialistId) {
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
    page.publishedBy = specialistId;
    await page.save();

    res.json({
      success: true,
      data: page,
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
    const specialistId = req.user.id;

    // Verify website ownership
    const website = await Website.findById(websiteId);
    if (!website || website.specialistId.toString() !== specialistId) {
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

    // Don't allow deleting homepage
    if (page.isHomePage) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete homepage',
      });
    }

    // Delete all sections for this page
    await PageSection.deleteMany({ pageId });

    // Delete page
    await Page.findByIdAndDelete(pageId);

    // Remove from website pages array
    website.pages = website.pages.filter(p => p._id.toString() !== pageId);
    // Remove from navigation
    website.navigation = website.navigation.filter(n => n.pageId?.toString() !== pageId);
    await website.save();

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

export const reorderPages = async (req, res) => {
  try {
    const { websiteId } = req.params;
    const specialistId = req.user.id;
    const { pageOrder } = req.body;

    // Verify website ownership
    const website = await Website.findById(websiteId);
    if (!website || website.specialistId.toString() !== specialistId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    // Update order for each page
    for (let i = 0; i < pageOrder.length; i++) {
      await Page.findByIdAndUpdate(pageOrder[i], { order: i });
    }

    const pages = await Page.find({ websiteId }).sort({ order: 1 });

    res.json({
      success: true,
      data: pages,
      message: 'Pages reordered successfully',
    });
  } catch (error) {
    console.error('Reorder pages error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============ Section Operations ============

export const addSection = async (req, res) => {
  try {
    const { websiteId, pageId } = req.params;
    const specialistId = req.user.id;
    const { type, title, description, content, styling, order } = req.body;

    // Verify website ownership
    const website = await Website.findById(websiteId);
    if (!website || website.specialistId.toString() !== specialistId) {
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

    const section = new PageSection({
      websiteId,
      pageId,
      type,
      title: title || '',
      description: description || '',
      content: content || {},
      styling: styling || {},
      order: order || page.sections.length,
    });

    await section.save();

    // Add to page sections
    page.sections.push(section._id);
    await page.save();

    res.status(201).json({
      success: true,
      data: section,
      message: 'Section added successfully',
    });
  } catch (error) {
    console.error('Add section error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateSection = async (req, res) => {
  try {
    const { websiteId, pageId, sectionId } = req.params;
    const specialistId = req.user.id;
    const { title, description, content, styling } = req.body;

    // Verify website ownership
    const website = await Website.findById(websiteId);
    if (!website || website.specialistId.toString() !== specialistId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const section = await PageSection.findById(sectionId);
    if (!section || section.websiteId.toString() !== websiteId) {
      return res.status(404).json({
        success: false,
        message: 'Section not found',
      });
    }

    if (title !== undefined) section.title = title;
    if (description !== undefined) section.description = description;
    if (content) section.content = { ...section.content, ...content };
    if (styling) section.styling = { ...section.styling, ...styling };

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
    const specialistId = req.user.id;

    // Verify website ownership
    const website = await Website.findById(websiteId);
    if (!website || website.specialistId.toString() !== specialistId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const section = await PageSection.findById(sectionId);
    if (!section || section.websiteId.toString() !== websiteId) {
      return res.status(404).json({
        success: false,
        message: 'Section not found',
      });
    }

    const page = await Page.findById(pageId);
    page.sections = page.sections.filter(s => s.toString() !== sectionId);
    await page.save();

    await PageSection.findByIdAndDelete(sectionId);

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

export const reorderSections = async (req, res) => {
  try {
    const { websiteId, pageId } = req.params;
    const specialistId = req.user.id;
    const { sectionOrder } = req.body;

    // Verify website ownership
    const website = await Website.findById(websiteId);
    if (!website || website.specialistId.toString() !== specialistId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    // Update order for each section
    for (let i = 0; i < sectionOrder.length; i++) {
      await PageSection.findByIdAndUpdate(sectionOrder[i], { order: i });
    }

    const sections = await PageSection.find({ pageId }).sort({ order: 1 });

    res.json({
      success: true,
      data: sections,
      message: 'Sections reordered successfully',
    });
  } catch (error) {
    console.error('Reorder sections error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============ Public Page Access (NO AUTH REQUIRED) ============

export const getPublicPage = async (req, res) => {
  try {
    const { subdomain, pageSlug } = req.params;

    // Find website by subdomain
    const website = await Website.findOne({ subdomain, isPublished: true });
    if (!website) {
      return res.status(404).json({
        success: false,
        message: 'Website not found or not published',
      });
    }

    // Find page by slug and check if published
    const page = await Page.findOne({ websiteId: website._id, slug: pageSlug, isPublished: true });
    if (!page) {
      return res.status(404).json({
        success: false,
        message: 'Page not found or not published',
      });
    }

    // Get all sections for the page
    const sections = await PageSection.find({ pageId: page._id }).sort({ order: 1 });

    // Enrich courses sections with actual course data from the specialist
    const enrichedSections = await Promise.all(
      sections.map(async (section) => {
        if (section.type === 'courses') {
          try {
            const specialistCourses = await Course.find({
              specialistEmail: website.creatorEmail,
              status: 'published',
            })
              .select('_id title description thumbnail courseType price currency lessons startDate endDate schedule meetingPlatform zoomLink cohortSize liveSessions')
              .sort({ createdAt: -1 });

            const sectionObj = section.toObject();
            sectionObj.content = {
              ...sectionObj.content,
              fetchedCourses: specialistCourses,
            };
            return sectionObj;
          } catch (err) {
            console.error('Error enriching courses section:', err);
            return section;
          }
        }
        return section;
      })
    );

    res.json({
      success: true,
      data: {
        website: {
          _id: website._id,
          subdomain: website.subdomain,
          branding: website.branding,
          theme: website.theme,
        },
        page: {
          _id: page._id,
          title: page.title,
          slug: page.slug,
        },
        sections: enrichedSections,
      },
      message: 'Public page retrieved successfully',
    });
  } catch (error) {
    console.error('Get public page error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get public page via subdomain routing
 * Used when user accesses https://subdomain.specialistly.com/:pageSlug
 */
export const getPublicPageViaSubdomain = async (req, res) => {
  try {
    const subdomain = req.subdomain;
    const pageSlug = (req.params.pageSlug || 'home').toLowerCase();

    console.log(`[Public Page] Subdomain: ${subdomain}, Page: ${pageSlug}`);

    // Validate subdomain exists
    if (!subdomain) {
      return res.status(404).json({
        success: false,
        message: 'No subdomain provided',
      });
    }

    // Find website by subdomain (don't require isPublished for now - let's debug)
    const website = await Website.findOne({ subdomain });
    if (!website) {
      console.log(`[Public Page] Website not found for subdomain: ${subdomain}`);
      return res.status(404).json({
        success: false,
        message: 'Website not found',
        debug: { subdomain },
      });
    }

    console.log(`[Public Page] Website found: ${website._id}, isPublished: ${website.isPublished}`);

    // Find page by slug (don't require isPublished for now - let's debug)
    const page = await Page.findOne({ websiteId: website._id, slug: pageSlug });
    if (!page) {
      // List available pages for debugging
      const availablePages = await Page.find({ websiteId: website._id });
      console.log(`[Public Page] Page not found: ${pageSlug}`);
      console.log(`[Public Page] Available pages: ${availablePages.map(p => p.slug).join(', ')}`);
      
      return res.status(404).json({
        success: false,
        message: 'Page not found',
        debug: {
          subdomain,
          pageRequested: pageSlug,
          availablePages: availablePages.map(p => ({
            slug: p.slug,
            title: p.title,
            isPublished: p.isPublished,
          })),
        },
      });
    }

    console.log(`[Public Page] Page found: ${page._id}, isPublished: ${page.isPublished}`);

    // Get all sections for the page
    const sections = await PageSection.find({ pageId: page._id }).sort({ order: 1 });

    // Enrich courses sections with actual course data from the specialist
    console.log('[Public Page] Enriching sections, creatorEmail:', website.creatorEmail);
    const enrichedSections = await Promise.all(
      sections.map(async (section) => {
        if (section.type === 'courses') {
          try {
            console.log('[Public Page] Found courses section, fetching courses for:', website.creatorEmail);
            const specialistCourses = await Course.find({
              specialistEmail: website.creatorEmail,
              status: 'published',
            })
              .select('_id title description thumbnail courseType price currency lessons startDate endDate schedule meetingPlatform zoomLink cohortSize liveSessions')
              .sort({ createdAt: -1 });

            console.log('[Public Page] Found', specialistCourses.length, 'published courses');

            const sectionObj = section.toObject();
            sectionObj.content = {
              ...sectionObj.content,
              fetchedCourses: specialistCourses,
            };
            return sectionObj;
          } catch (err) {
            console.error('Error enriching courses section:', err);
            return section;
          }
        }
        return section;
      })
    );

    res.json({
      success: true,
      data: {
        website: {
          _id: website._id,
          subdomain: website.subdomain,
          isPublished: website.isPublished,
          branding: website.branding,
          theme: website.theme,
        },
        page: {
          _id: page._id,
          title: page.title,
          slug: page.slug,
          isPublished: page.isPublished,
        },
        sections: enrichedSections,
      },
      message: 'Public page retrieved successfully',
    });
  } catch (error) {
    console.error('Get public page via subdomain error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
