import CreatorProfile from '../models/CreatorProfile.js';

// Create or update creator profile
export const saveCreatorProfile = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required',
      });
    }

    console.log('Saving creator profile for email:', email);
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
    
    let profile = await CreatorProfile.findOne({ email });
    
    if (profile) {
      console.log('Updating existing profile...');
      profile = await CreatorProfile.findByIdAndUpdate(
        profile._id,
        { ...req.body, updatedAt: Date.now() },
        { new: true }
      );
    } else {
      console.log('Creating new profile...');
      profile = new CreatorProfile(req.body);
      await profile.save();
    }

    console.log('Profile saved successfully:', profile.email);

    res.status(200).json({
      success: true,
      message: 'Creator profile saved successfully',
      data: profile,
    });
  } catch (error) {
    console.error('Error saving creator profile:', error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Get creator profile by email
export const getCreatorProfile = async (req, res) => {
  try {
    const { email } = req.params;
    console.log('Fetching creator profile for email:', email);
    
    const profile = await CreatorProfile.findOne({ email });
    
    if (!profile) {
      console.log('Profile not found for email:', email);
      return res.status(404).json({
        success: false,
        message: 'Creator profile not found',
      });
    }

    console.log('Profile found:', email);
    res.status(200).json({
      success: true,
      data: profile,
    });
  } catch (error) {
    console.error('Error fetching creator profile:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};;

// Get all creator profiles
export const getAllCreatorProfiles = async (req, res) => {
  try {
    const profiles = await CreatorProfile.find();
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

// Get all specialists (from User collection)
export const getAllSpecialists = async (req, res) => {
  try {
    const User = (await import('../models/User.js')).default;
    const specialists = await User.find({ isSpecialist: true }).select(
      '_id name email isSpecialist membership subscription'
    );
    
    const specialistsData = specialists.map(specialist => ({
      _id: specialist._id,
      name: specialist.name,
      email: specialist.email,
      bio: 'Expert Specialist',
      specialization: 'Professional Services',
      profilePicture: specialist.profilePicture,
      rating: 4.5,
      totalStudents: 0,
      servicesCount: 0,
      coursesCount: 0,
      isSpecialist: specialist.isSpecialist,
      membership: specialist.membership,
    }));

    res.status(200).json({
      success: true,
      data: specialistsData,
    });
  } catch (error) {
    console.error('Error fetching specialists:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update creator availability
export const updateCreatorAvailability = async (req, res) => {
  try {
    const { email } = req.params;
    const { weeklyAvailability } = req.body;

    const profile = await CreatorProfile.findOneAndUpdate(
      { email },
      { weeklyAvailability, updatedAt: Date.now() },
      { new: true }
    );

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Creator profile not found',
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

// Delete creator profile
export const deleteCreatorProfile = async (req, res) => {
  try {
    const profile = await CreatorProfile.findByIdAndDelete(req.params.id);
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Creator profile not found',
      });
    }
    res.status(200).json({
      success: true,
      message: 'Creator profile deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
