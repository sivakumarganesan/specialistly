import Course from '../models/Course.js';
import SelfPacedEnrollment from '../models/SelfPacedEnrollment.js';
import CohortEnrollment from '../models/CohortEnrollment.js';
import EnrollmentAuditLog from '../models/EnrollmentAuditLog.js';
import Customer from '../models/Customer.js';
import Cohort from '../models/Cohort.js';

/**
 * Get all enrolled customers for a specific course
 * GET /api/admin/enrollments/course/:courseId
 */
export const getCourseEnrollments = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { courseType } = req.query;

    // Verify course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    let enrollments = [];

    if (course.courseType === 'self-paced' || courseType === 'self-paced') {
      // Get self-paced enrollments
      enrollments = await SelfPacedEnrollment.find({ courseId })
        .populate('courseId', 'title price currency courseType')
        .lean();

      // Add customer details
      enrollments = await Promise.all(
        enrollments.map(async (enrollment) => {
          const customer = await Customer.findOne({ email: enrollment.customerEmail }).lean();
          return {
            ...enrollment,
            type: 'self-paced',
            customerName: customer?.name || 'Unknown',
            customerPhone: customer?.phone || '',
          };
        })
      );
    } else if (course.courseType === 'cohort' || course.courseType === 'cohort-based' || courseType === 'cohort-based') {
      // Get cohort enrollments
      const cohorts = await Cohort.find({ courseId }).lean();
      const cohortIds = cohorts.map(c => c._id);

      enrollments = await CohortEnrollment.find({ cohortId: { $in: cohortIds } })
        .populate('cohortId', 'batchName')
        .lean();

      // Add customer and cohort details
      enrollments = await Promise.all(
        enrollments.map(async (enrollment) => {
          const customer = await Customer.findOne({ email: enrollment.customerEmail }).lean();
          const cohort = await Cohort.findById(enrollment.cohortId).lean();
          return {
            ...enrollment,
            type: 'cohort-based',
            batchName: cohort?.batchName || 'Unknown',
            customerName: customer?.name || 'Unknown',
            customerPhone: customer?.phone || '',
          };
        })
      );
    }

    res.status(200).json({
      success: true,
      data: enrollments,
      total: enrollments.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Manually add a customer to a self-paced course
 * POST /api/admin/enrollments/self-paced/add
 */
export const addSelfPacedEnrollment = async (req, res) => {
  try {
    const { courseId, customerId, customerEmail, reason, notes } = req.body;
    const adminId = req.user?.userId;
    const adminEmail = req.user?.email;

    // Validate required fields
    if (!courseId || !customerId || !customerEmail) {
      return res.status(400).json({
        success: false,
        message: 'courseId, customerId, and customerEmail are required',
      });
    }

    // Verify course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    // Check if customer already enrolled
    const existingEnrollment = await SelfPacedEnrollment.findOne({
      courseId,
      customerId,
    });

    if (existingEnrollment) {
      return res.status(400).json({
        success: false,
        message: 'Customer is already enrolled in this course',
      });
    }

    // Get customer info for audit
    const customer = await Customer.findOne({ email: customerEmail }).lean();
    const customerName = customer?.name || 'Unknown';

    // Create enrollment
    const enrollment = new SelfPacedEnrollment({
      courseId,
      customerId,
      customerEmail,
      paymentStatus: 'completed', // Mark as completed since admin added it
      paymentGateway: 'admin',
      completedLessons: [],
      completed: false,
      enrolledAt: new Date(),
    });

    await enrollment.save();

    // Link specialist to customer (for visibility in specialist's customer list)
    if (course.specialistEmail) {
      await Customer.updateOne(
        { email: customerEmail },
        {
          $addToSet: {
            specialists: {
              specialistId: course.specialistId,
              specialistEmail: course.specialistEmail,
              specialistName: course.specialistName || 'Unknown Specialist',
              firstBookedDate: new Date(),
            },
          },
        }
      );
    }

    // Log the action
    const auditLog = new EnrollmentAuditLog({
      action: 'add',
      enrollmentId: enrollment._id,
      courseId,
      courseTitle: course.title,
      customerId,
      customerEmail,
      customerName,
      adminId,
      adminEmail,
      courseType: 'self-paced',
      reason: reason || 'Manual administrative action',
      notes,
      newState: {
        paymentStatus: 'completed',
        enrolledAt: enrollment.createdAt,
      },
    });

    await auditLog.save();

    res.status(201).json({
      success: true,
      message: 'Customer added to course successfully',
      data: {
        enrollment,
        auditLog,
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Manually remove a customer from a self-paced course
 * DELETE /api/admin/enrollments/self-paced/:enrollmentId
 */
export const removeSelfPacedEnrollment = async (req, res) => {
  try {
    const { enrollmentId } = req.params;
    const { reason, notes } = req.body;
    const adminId = req.user?.userId;
    const adminEmail = req.user?.email;

    // Find enrollment
    const enrollment = await SelfPacedEnrollment.findById(enrollmentId);
    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found',
      });
    }

    // Get course and customer info
    const course = await Course.findById(enrollment.courseId);
    const customer = await Customer.findOne({ email: enrollment.customerEmail }).lean();
    const customerName = customer?.name || 'Unknown';

    // Store previous state before deletion
    const previousState = {
      paymentStatus: enrollment.paymentStatus,
      enrolledAt: enrollment.createdAt,
    };

    // Delete enrollment
    await SelfPacedEnrollment.findByIdAndDelete(enrollmentId);

    // Log the action
    const auditLog = new EnrollmentAuditLog({
      action: 'remove',
      enrollmentId: null,
      courseId: enrollment.courseId,
      courseTitle: course?.title || 'Unknown',
      customerId: enrollment.customerId,
      customerEmail: enrollment.customerEmail,
      customerName,
      adminId,
      adminEmail,
      courseType: 'self-paced',
      reason: reason || 'Manual administrative action',
      notes,
      previousState,
    });

    await auditLog.save();

    res.status(200).json({
      success: true,
      message: 'Customer removed from course successfully',
      data: {
        auditLog,
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Manually add a customer to a cohort course
 * POST /api/admin/enrollments/cohort/add
 */
export const addCohortEnrollment = async (req, res) => {
  try {
    const { cohortId, customerId, customerEmail, reason, notes } = req.body;
    const adminId = req.user?.userId;
    const adminEmail = req.user?.email;

    // Validate required fields
    if (!cohortId || !customerId || !customerEmail) {
      return res.status(400).json({
        success: false,
        message: 'cohortId, customerId, and customerEmail are required',
      });
    }

    // Verify cohort exists
    const cohort = await Cohort.findById(cohortId).populate('courseId');
    if (!cohort) {
      return res.status(404).json({
        success: false,
        message: 'Cohort not found',
      });
    }

    // Check if customer already enrolled
    const existingEnrollment = await CohortEnrollment.findOne({
      cohortId,
      customerId,
    });

    if (existingEnrollment) {
      return res.status(400).json({
        success: false,
        message: 'Customer is already enrolled in this cohort',
      });
    }

    // Get customer info for audit
    const customer = await Customer.findOne({ email: customerEmail }).lean();
    const customerName = customer?.name || 'Unknown';

    // Get course info to access specialist
    const course = await Course.findById(cohort.courseId);

    // Create enrollment
    const enrollment = new CohortEnrollment({
      cohortId,
      customerId,
      customerEmail,
      paidAt: new Date(),
      amount: 0, // Admin-added enrollments
      certificate: {
        issued: false,
      },
    });

    await enrollment.save();

    // Link specialist to customer (for visibility in specialist's customer list)
    if (course?.specialistEmail) {
      await Customer.updateOne(
        { customerId },
        {
          $addToSet: {
            specialists: {
              specialistId: course.specialistId,
              specialistEmail: course.specialistEmail,
              specialistName: course.specialistName || 'Unknown Specialist',
              firstBookedDate: new Date(),
            },
          },
        },
        { upsert: true }
      );
    }

    // Update cohort enrolled count
    cohort.enrolledCount = (cohort.enrolledCount || 0) + 1;
    await cohort.save();

    // Log the action
    const auditLog = new EnrollmentAuditLog({
      action: 'add',
      cohortEnrollmentId: enrollment._id,
      courseId: cohort.courseId._id,
      courseTitle: cohort.courseId?.title || 'Unknown',
      customerId,
      customerEmail,
      customerName,
      adminId,
      adminEmail,
      courseType: 'cohort-based',
      reason: reason || 'Manual administrative action',
      notes,
      newState: {
        enrolledAt: enrollment.createdAt,
      },
    });

    await auditLog.save();

    res.status(201).json({
      success: true,
      message: 'Customer added to cohort successfully',
      data: {
        enrollment,
        auditLog,
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Manually remove a customer from a cohort course
 * DELETE /api/admin/enrollments/cohort/:enrollmentId
 */
export const removeCohortEnrollment = async (req, res) => {
  try {
    const { enrollmentId } = req.params;
    const { reason, notes } = req.body;
    const adminId = req.user?.userId;
    const adminEmail = req.user?.email;

    // Find enrollment
    const enrollment = await CohortEnrollment.findById(enrollmentId);
    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found',
      });
    }

    // Get cohort and course info
    const cohort = await Cohort.findById(enrollment.cohortId).populate('courseId');
    const customer = await Customer.findOne({ email: enrollment.customerEmail }).lean();
    const customerName = customer?.name || 'Unknown';

    // Store previous state
    const previousState = {
      enrolledAt: enrollment.createdAt,
    };

    // Delete enrollment
    await CohortEnrollment.findByIdAndDelete(enrollmentId);

    // Update cohort enrolled count
    if (cohort) {
      cohort.enrolledCount = Math.max(0, (cohort.enrolledCount || 1) - 1);
      await cohort.save();
    }

    // Log the action
    const auditLog = new EnrollmentAuditLog({
      action: 'remove',
      cohortEnrollmentId: null,
      courseId: cohort?.courseId?._id || enrollment.courseId,
      courseTitle: cohort?.courseId?.title || 'Unknown',
      customerId: enrollment.customerId,
      customerEmail: enrollment.customerEmail,
      customerName,
      adminId,
      adminEmail,
      courseType: 'cohort-based',
      reason: reason || 'Manual administrative action',
      notes,
      previousState,
    });

    await auditLog.save();

    res.status(200).json({
      success: true,
      message: 'Customer removed from cohort successfully',
      data: {
        auditLog,
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get enrollment audit logs
 * GET /api/admin/enrollments/audit-logs?courseId=xxx&customerId=xxx&limit=50&skip=0
 */
export const getAuditLogs = async (req, res) => {
  try {
    const { courseId, customerId, limit = '50', skip = '0' } = req.query;
    const filter = {};

    if (courseId) filter.courseId = courseId;
    if (customerId) filter.customerId = customerId;

    const auditLogs = await EnrollmentAuditLog.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .lean();

    const total = await EnrollmentAuditLog.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: auditLogs,
      total,
      limit: parseInt(limit),
      skip: parseInt(skip),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get enrollment audit logs for a specific course
 * GET /api/admin/enrollments/:courseId/audit-logs
 */
export const getCourseAuditLogs = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { limit = '50', skip = '0' } = req.query;

    const auditLogs = await EnrollmentAuditLog.find({ courseId })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .lean();

    const total = await EnrollmentAuditLog.countDocuments({ courseId });

    res.status(200).json({
      success: true,
      data: auditLogs,
      total,
      limit: parseInt(limit),
      skip: parseInt(skip),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
