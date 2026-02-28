import User from '../models/User.js';
import Course from '../models/Course.js';
import Service from '../models/Service.js';
import { SPECIALITY_CATEGORIES, isValidCategory } from '../constants/specialityCategories.js';

// Create or update specialist profile (unified Creator/Specialist)
export const saveCreatorProfile = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required',
      });
    }

    console.log('Saving specialist profile for email:', email);
    console.log('Profile data:', {
      creatorName: req.body.creatorName,
      email: req.body.email,
      bio: req.body.bio,
      phone: req.body.phone,
      location: req.body.location,
      company: req.body.company,
      website: req.body.website,
      hasProfileImage: !!req.body.profileImage,
    });
    
    // Update the User document with specialist profile fields
    const profile = await User.findOneAndUpdate(
      { email },
      { 
        ...req.body, 
        isSpecialist: true,
        updatedAt: Date.now() 
      },
      { new: true }
    );

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    console.log('Profile saved successfully:', profile.email);

    res.status(200).json({
      success: true,
      message: 'Specialist profile saved successfully',
      data: profile,
    });
  } catch (error) {
    console.error('Error saving specialist profile:', error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Get specialist profile by email
export const getCreatorProfile = async (req, res) => {
  try {
    const { email } = req.params;
    console.log('Fetching specialist profile for email:', email);
    
    const profile = await User.findOne({ email });
    
    if (!profile) {
      console.log('User not found for email:', email);
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    console.log('Profile found:', email);
    res.status(200).json({
      success: true,
      data: profile,
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get all specialist profiles
export const getAllCreatorProfiles = async (req, res) => {
  try {
    const profiles = await User.find({ isSpecialist: true });
    res.status(200).json({
      success: true,
      data: profiles,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get specialist by ID
export const getCreatorById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const specialist = await User.findById(id);
    
    if (!specialist || !specialist.isSpecialist) {
      return res.status(404).json({
        success: false,
        message: 'Specialist not found',
      });
    }

    res.status(200).json({
      success: true,
      data: specialist,
    });
  } catch (error) {
    console.error('Error fetching specialist:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get all specialists
export const getAllSpecialists = async (req, res) => {
  try {
    const specialists = await User.find({ isSpecialist: true });

    // Enrich specialists with service and course counts
    const enrichedSpecialists = await Promise.all(
      specialists.map(async (specialist) => {
        const servicesCount = await Service.countDocuments({ creator: specialist.email, status: 'active' });
        const coursesCount = await Course.countDocuments({ specialistEmail: specialist.email, status: 'published' });
        
        return {
          ...specialist.toObject(),
          servicesCount,
          coursesCount,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: enrichedSpecialists,
    });
  } catch (error) {
    console.error('Error fetching specialists:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update specialist availability
export const updateCreatorAvailability = async (req, res) => {
  try {
    const { email } = req.params;
    const { weeklyAvailability } = req.body;

    const profile = await User.findOneAndUpdate(
      { email },
      { weeklyAvailability, updatedAt: Date.now() },
      { new: true }
    );

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Availability updated successfully',
      data: profile,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete specialist profile (just set isSpecialist to false)
export const deleteCreatorProfile = async (req, res) => {
  try {
    const profile = await User.findByIdAndUpdate(
      req.params.id,
      { isSpecialist: false, updatedAt: Date.now() },
      { new: true }
    );
    
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Specialist profile deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get all predefined speciality categories
export const getAllCategories = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: SPECIALITY_CATEGORIES,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update specialist's speciality categories
export const updateSpecialityCategories = async (req, res) => {
  try {
    const { email } = req.params;
    const { categories } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required',
      });
    }

    // Validate categories
    if (!Array.isArray(categories)) {
      return res.status(400).json({
        success: false,
        message: 'Categories must be an array',
      });
    }

    // Check if all categories are valid
    const invalidCategories = categories.filter(cat => !isValidCategory(cat));
    if (invalidCategories.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Invalid categories: ${invalidCategories.join(', ')}`,
      });
    }

    // Update user with new categories
    const specialist = await User.findOneAndUpdate(
      { email, isSpecialist: true },
      { 
        specialityCategories: categories,
        updatedAt: Date.now() 
      },
      { new: true }
    );

    if (!specialist) {
      return res.status(404).json({
        success: false,
        message: 'Specialist not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Speciality categories updated successfully',
      data: specialist.specialityCategories,
    });
  } catch (error) {
    console.error('Error updating speciality categories:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get specialist's speciality categories
export const getSpecialistCategories = async (req, res) => {
  try {
    const { email } = req.params;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required',
      });
    }

    const specialist = await User.findOne(
      { email, isSpecialist: true },
      'specialityCategories'
    );

    if (!specialist) {
      return res.status(404).json({
        success: false,
        message: 'Specialist not found',
      });
    }

    res.status(200).json({
      success: true,
      categories: specialist.specialityCategories || [],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get specialists filtered by category
export const getSpecialistsByCategory = async (req, res) => {
  try {
    const { category } = req.params;

    if (!category) {
      return res.status(400).json({
        success: false,
        message: 'Category is required',
      });
    }

    if (!isValidCategory(category)) {
      return res.status(400).json({
        success: false,
        message: `Invalid category: ${category}`,
      });
    }

    // Find specialists with this category
    const specialists = await User.find(
      { 
        isSpecialist: true,
        specialityCategories: category
      },
      'name email bio specialization profilePicture rating totalStudents specialityCategories'
    ).sort({ createdAt: -1 });

    // Enrich with service and course counts
    const enriched = await Promise.all(
      specialists.map(async (specialist) => {
        const servicesCount = await Service.countDocuments({ creator: specialist.email, status: 'active' });
        const coursesCount = await Course.countDocuments({ specialistEmail: specialist.email, status: 'published' });
        
        return {
          ...specialist.toObject(),
          servicesCount,
          coursesCount,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: enriched,
    });
  } catch (error) {
    console.error('Error fetching specialists by category:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
