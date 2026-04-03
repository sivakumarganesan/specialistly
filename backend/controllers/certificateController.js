import Certificate from '../models/Certificate.js';
import CohortEnrollment from '../models/CohortEnrollment.js';
import Cohort from '../models/Cohort.js';
import Customer from '../models/Customer.js';

// Enroll in cohort course
export const enrollCohort = async (req, res) => {
  try {
    const { cohortId } = req.body;
    let customerId = req.user?.userId || req.body.customerId;
    const customerEmail = req.user?.email || req.body.customerEmail;

    // Check if cohort exists
    const cohort = await Cohort.findById(cohortId);
    if (!cohort || cohort.status !== 'published') {
      return res.status(404).json({
        success: false,
        message: 'Cohort not found or not published',
      });
    }

    // Check capacity
    if (cohort.enrolledCount >= cohort.maxStudents) {
      return res.status(400).json({
        success: false,
        message: 'Cohort is full',
      });
    }

    // IMPORTANT: Get or create Customer record and use its _id
    // This ensures consistency - all enrollments store Customer._id, not User._id
    let customer = await Customer.findOne({ email: customerEmail });
    if (!customer) {
      customer = await Customer.create({
        name: customerEmail.split('@')[0],
        email: customerEmail,
        status: 'active',
      });
    }
    // Use Customer._id for the enrollment (not User._id)
    customerId = customer._id.toString();

    // Check for existing enrollment
    const existingEnrollment = await CohortEnrollment.findOne({
      cohortId,
      customerId,
    });

    if (existingEnrollment) {
      return res.status(400).json({
        success: false,
        message: 'Already enrolled in this cohort',
      });
    }

    // Create enrollment with Customer._id
    const enrollment = new CohortEnrollment({
      cohortId,
      customerId,
      customerEmail,
      attendedSessions: [],
      completed: false,
      paidAt: new Date(),
      amount: cohort.price || 0,
    });

    await enrollment.save();

    // Increment enrolled count
    cohort.enrolledCount += 1;
    await cohort.save();

    res.status(201).json({
      success: true,
      message: 'Enrolled in cohort successfully',
      enrollmentId: enrollment._id,
      data: enrollment,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Download certificate
export const downloadCertificate = async (req, res) => {
  try {
    const { certificateId } = req.params;

    const certificate = await Certificate.findOne({ certificateId });
    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: 'Certificate not found',
      });
    }

    // In production, would generate PDF here
    // For now, return certificate data
    res.status(200).json({
      success: true,
      data: {
        certificateId: certificate.certificateId,
        courseName: certificate.courseName,
        customerName: certificate.customerName,
        specialistName: certificate.specialistName,
        issueDate: certificate.issueDate,
        courseType: certificate.courseType,
        pdfUrl: certificate.pdfUrl,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Verify certificate (public endpoint)
export const verifyCertificate = async (req, res) => {
  try {
    const { certificateId } = req.params;

    const certificate = await Certificate.findOne({ certificateId });
    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: 'Certificate not found or invalid',
      });
    }

    res.status(200).json({
      success: true,
      verified: true,
      data: {
        certificateId: certificate.certificateId,
        courseName: certificate.courseName,
        customerName: certificate.customerName,
        specialistName: certificate.specialistName,
        courseType: certificate.courseType,
        issueDate: certificate.issueDate,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get certificate by ID
export const getCertificate = async (req, res) => {
  try {
    const { certificateId } = req.params;

    const certificate = await Certificate.findOne({ certificateId });
    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: 'Certificate not found',
      });
    }

    res.status(200).json({
      success: true,
      data: certificate,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// List my certificates
export const getMyCertificates = async (req, res) => {
  try {
    // Get customer ID - need to find by email since User and Customer are separate collections
    const userEmail = req.user?.email;
    const userId = req.user?.userId;
    let customerIdList = [];

    // Priority 1: If authenticated user with email, look up Customer by email (gets correct Customer._id)
    if (userEmail) {
      const customer = await Customer.findOne({ email: userEmail });
      if (customer) {
        customerIdList.push(customer._id.toString());
      }
    }

    // For backward compatibility: also include User._id to find old enrollments
    if (userId && !customerIdList.includes(userId)) {
      customerIdList.push(userId);
    }

    // Priority 2: Fallback to query parameter (for backward compatibility)
    if (req.query.customerId && !customerIdList.includes(req.query.customerId)) {
      customerIdList.push(req.query.customerId);
    }

    // Query using $in to find certificates with ANY of the possible customer IDs
    // This handles both new (Customer._id) and old (User._id) certificates
    const certificates = await Certificate.find({ customerId: { $in: customerIdList } }).sort({
      issueDate: -1,
    });

    res.status(200).json({
      success: true,
      data: certificates,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
