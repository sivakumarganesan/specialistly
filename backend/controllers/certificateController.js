import Certificate from '../models/Certificate.js';
import CohortEnrollment from '../models/CohortEnrollment.js';
import Cohort from '../models/Cohort.js';

// Enroll in cohort course
export const enrollCohort = async (req, res) => {
  try {
    const { cohortId } = req.body;
    const customerId = req.user?.userId || req.body.customerId;
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

    // Create enrollment
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
    const customerId = req.user?.userId || req.query.customerId;

    const certificates = await Certificate.find({ customerId }).sort({
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
