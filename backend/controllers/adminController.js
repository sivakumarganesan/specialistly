import User from '../models/User.js';
import Course from '../models/Course.js';
import Service from '../models/Service.js';
import Customer from '../models/Customer.js';
import ConsultingSlot from '../models/ConsultingSlot.js';

// GET /api/admin/stats - Platform overview statistics
export const getPlatformStats = async (req, res) => {
  try {
    const [
      totalUsers,
      totalSpecialists,
      totalCustomers,
      totalAdmins,
      totalCourses,
      publishedCourses,
      totalServices,
      totalSlots,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isSpecialist: true }),
      User.countDocuments({ isSpecialist: false, role: { $ne: 'admin' } }),
      User.countDocuments({ role: 'admin' }),
      Course.countDocuments(),
      Course.countDocuments({ status: 'published' }),
      Service.countDocuments(),
      ConsultingSlot.countDocuments(),
    ]);

    // Recent signups (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentSignups = await User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } });

    // Active users (logged in last 7 days) - use updatedAt as proxy
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const activeUsers = await User.countDocuments({ updatedAt: { $gte: sevenDaysAgo } });

    res.json({
      totalUsers,
      totalSpecialists,
      totalCustomers,
      totalAdmins,
      totalCourses,
      publishedCourses,
      totalServices,
      totalSlots,
      recentSignups,
      activeUsers,
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ error: error.message });
  }
};

// GET /api/admin/users - List all users with filtering & pagination
export const getUsers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      role,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const filter = {};
    if (role && ['user', 'specialist', 'admin'].includes(role)) {
      if (role === 'specialist') {
        filter.isSpecialist = true;
      } else if (role === 'user') {
        filter.isSpecialist = false;
        filter.role = { $ne: 'admin' };
      } else {
        filter.role = role;
      }
    }

    if (search) {
      const sanitized = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { name: { $regex: sanitized, $options: 'i' } },
        { email: { $regex: sanitized, $options: 'i' } },
      ];
    }

    const sort = {};
    const allowedSortFields = ['createdAt', 'name', 'email', 'role', 'updatedAt'];
    if (allowedSortFields.includes(sortBy)) {
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
    } else {
      sort.createdAt = -1;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('name email role isSpecialist membership subscription specialityCategories customerInterests createdAt updatedAt profileImage phone bio location company')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      User.countDocuments(filter),
    ]);

    res.json({
      users,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Admin getUsers error:', error);
    res.status(500).json({ error: error.message });
  }
};

// GET /api/admin/users/:id - Get single user detail
export const getUserDetail = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get related data counts
    const [courseCount, serviceCount, customerCount] = await Promise.all([
      Course.countDocuments({ specialistEmail: user.email }),
      Service.countDocuments({ creator: user.email }),
      Customer.countDocuments({ specialistEmail: user.email }),
    ]);

    res.json({
      user,
      stats: { courseCount, serviceCount, customerCount },
    });
  } catch (error) {
    console.error('Admin getUserDetail error:', error);
    res.status(500).json({ error: error.message });
  }
};

// PUT /api/admin/users/:id/toggle-status - Enable/disable user
export const toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Don't allow disabling yourself
    if (user._id.toString() === req.user.userId) {
      return res.status(400).json({ error: 'Cannot disable your own account' });
    }

    user.isDisabled = !user.isDisabled;
    await user.save();

    res.json({
      message: `User ${user.isDisabled ? 'disabled' : 'enabled'} successfully`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isDisabled: user.isDisabled,
      },
    });
  } catch (error) {
    console.error('Admin toggleUserStatus error:', error);
    res.status(500).json({ error: error.message });
  }
};

// GET /api/admin/recent-activity - Recent platform activity
export const getRecentActivity = async (req, res) => {
  try {
    const [recentUsers, recentCourses, recentServices] = await Promise.all([
      User.find()
        .select('name email role isSpecialist createdAt')
        .sort({ createdAt: -1 })
        .limit(10),
      Course.find()
        .select('title specialistEmail status createdAt')
        .sort({ createdAt: -1 })
        .limit(10),
      Service.find()
        .select('title creator createdAt')
        .sort({ createdAt: -1 })
        .limit(10),
    ]);

    res.json({ recentUsers, recentCourses, recentServices });
  } catch (error) {
    console.error('Admin getRecentActivity error:', error);
    res.status(500).json({ error: error.message });
  }
};
