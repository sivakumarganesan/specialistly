import Cohort from '../models/Cohort.js';
import CohortEnrollment from '../models/CohortEnrollment.js';
import Course from '../models/Course.js';
import Certificate from '../models/Certificate.js';

const generateCertificateId = () => {
  const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `CERT-${new Date().getFullYear()}-${randomStr}`;
};

// Create cohort
export const createCohort = async (req, res) => {
  try {
    const {
      courseId,
      batchName,
      startDate,
      endDate,
      enrollmentDeadline,
      maxStudents,
    } = req.body;

    const specialistId = req.user?.id || req.body.specialistId;
    const specialistEmail = req.user?.email;

    // Validate course exists and is cohort type
    const course = await Course.findById(courseId);
    if (!course || course.courseType !== 'cohort') {
      return res.status(404).json({
        success: false,
        message: 'Course not found or not cohort type',
      });
    }

    if (course.specialistId !== specialistId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to create cohort for this course',
      });
    }

    const cohort = new Cohort({
      courseId,
      specialistId,
      specialistEmail,
      batchName,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      enrollmentDeadline: new Date(enrollmentDeadline),
      maxStudents,
      enrolledCount: 0,
      sessions: [],
      status: 'draft',
    });

    await cohort.save();

    res.status(201).json({
      success: true,
      message: 'Cohort created successfully',
      cohortId: cohort._id,
      data: cohort,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Publish cohort (make available for enrollment)
export const publishCohort = async (req, res) => {
  try {
    const { cohortId } = req.params;
    const cohort = await Cohort.findById(cohortId);

    if (!cohort) {
      return res.status(404).json({
        success: false,
        message: 'Cohort not found',
      });
    }

    const sessionsCount = cohort.sessions && cohort.sessions.length ? cohort.sessions.length : 0;
    if (sessionsCount === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cohort must have at least one session',
      });
    }

    cohort.status = 'published';
    await cohort.save();

    res.status(200).json({
      success: true,
      message: 'Cohort published successfully',
      data: cohort,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Add session to cohort
export const addSession = async (req, res) => {
  try {
    const { cohortId } = req.params;
    const { sessionNumber, title, date, time, zoomLink } = req.body;

    const cohort = await Cohort.findById(cohortId);
    if (!cohort) {
      return res.status(404).json({
        success: false,
        message: 'Cohort not found',
      });
    }

    const session = {
      sessionNumber,
      title,
      date: new Date(date),
      time,
      zoomLink,
      completed: false,
    };

    cohort.sessions.push(session);
    await cohort.save();

    res.status(200).json({
      success: true,
      message: 'Session added successfully',
      data: cohort,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Mark session as attended by student
export const markSessionAttended = async (req, res) => {
  try {
    const { enrollmentId, sessionId } = req.params;

    const enrollment = await CohortEnrollment.findById(enrollmentId);
    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found',
      });
    }

    // Add session to attended
    if (!enrollment.attendedSessions.includes(sessionId)) {
      enrollment.attendedSessions.push(sessionId);
    }

    // Get cohort for total sessions
    const cohort = await Cohort.findById(enrollment.cohortId);
    if (!cohort) {
      return res.status(404).json({
        success: false,
        message: 'Cohort not found or deleted',
      });
    }

    const totalSessions = cohort.sessions && cohort.sessions.length ? cohort.sessions.length : 0;
    const attendedCount = enrollment.attendedSessions && enrollment.attendedSessions.length ? enrollment.attendedSessions.length : 0;

    // Check if all sessions attended
    if (totalSessions > 0 && attendedCount === totalSessions) {
      enrollment.completed = true;

      // Auto-generate certificate
      const course = await Course.findById(cohort.courseId);
      if (course) {
        const certificateId = generateCertificateId();
        const certificate = new Certificate({
          certificateId,
          courseId: course._id,
          courseName: course.title,
          courseType: 'cohort',
          customerId: enrollment.customerId,
          customerName: enrollment.customerEmail,
          customerEmail: enrollment.customerEmail,
          specialistId: cohort.specialistId,
          specialistName: cohort.specialistEmail,
          enrollmentId: enrollment._id,
          pdfUrl: `https://specialistly.com/certificates/${certificateId}.pdf`,
          verifyUrl: `https://specialistly.com/verify/${certificateId}`,
        });

        await certificate.save();

        enrollment.certificate = {
          issued: true,
          certificateId,
          issuedDate: new Date(),
          downloadUrl: `https://specialistly.com/certificates/${certificateId}/download`,
        };
      }
    }

    enrollment.updatedAt = new Date();
    await enrollment.save();

    const percentComplete = totalSessions > 0 ? Math.round((attendedCount / totalSessions) * 100) : 0;

    res.status(200).json({
      success: true,
      message: 'Attendance recorded',
      percentComplete,
      completed: enrollment.completed,
      certificate: enrollment.certificate,
    });
  } catch (error) {
    console.error("Error marking session attended:", error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Get available cohorts for a course (published only)
export const getCohortsByCourse = async (req, res) => {
  try {
    const { courseId } = req.params;

    const cohorts = await Cohort.find({
      courseId,
      status: 'published',
    }); // Get full cohort data including sessions for counting

    const formatted = cohorts.map((c) => ({
      cohortId: c._id,
      batchName: c.batchName,
      startDate: c.startDate,
      enrollmentDeadline: c.enrollmentDeadline,
      maxStudents: c.maxStudents,
      enrolledCount: c.enrolledCount,
      spotsAvailable: c.maxStudents - c.enrolledCount,
      sessionsCount: c.sessions && c.sessions.length ? c.sessions.length : 0,
    }));

    res.status(200).json({
      success: true,
      data: formatted,
    });
  } catch (error) {
    console.error("Error getting cohorts by course:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get cohort sessions
export const getCohortSessions = async (req, res) => {
  try {
    const { cohortId } = req.params;

    const cohort = await Cohort.findById(cohortId);
    if (!cohort) {
      return res.status(404).json({
        success: false,
        message: 'Cohort not found',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        cohortId: cohort._id,
        batchName: cohort.batchName,
        status: cohort.status,
        sessions: cohort.sessions,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get zoom link for specific session (authenticated)
export const getSessionJoinLink = async (req, res) => {
  try {
    const { cohortId, sessionId } = req.params;

    const cohort = await Cohort.findById(cohortId);
    if (!cohort) {
      return res.status(404).json({
        success: false,
        message: 'Cohort not found',
      });
    }

    const sessions = cohort.sessions || [];
    const session = sessions.find(
      (s) => s._id.toString() === sessionId
    );

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        sessionId: session._id,
        title: session.title,
        date: session.date,
        time: session.time,
        zoomLink: session.zoomLink,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get my cohorts (customer's enrolled cohorts)
export const getMyCohorts = async (req, res) => {
  try {
    const customerId = req.user?.id || req.query.customerId;

    if (!customerId) {
      return res.status(400).json({
        success: false,
        message: 'Customer ID is required',
      });
    }

    const enrollments = await CohortEnrollment.find({ customerId })
      .populate('cohortId') // Get full cohort data
      .sort({ createdAt: -1 });

    // Filter out enrollments where cohort doesn't exist (deleted cohorts)
    const validEnrollments = enrollments.filter(e => e.cohortId && e.cohortId._id);

    const formatted = validEnrollments.map((e) => {
      const sessionsTotal = e.cohortId.sessions && e.cohortId.sessions.length ? e.cohortId.sessions.length : 0;
      const sessionsAttended = e.attendedSessions && e.attendedSessions.length ? e.attendedSessions.length : 0;

      return {
        enrollmentId: e._id,
        cohortId: e.cohortId._id,
        batchName: e.cohortId.batchName,
        startDate: e.cohortId.startDate,
        sessionsTotal: sessionsTotal,
        sessionsAttended: sessionsAttended,
        percentComplete: sessionsTotal > 0 ? Math.round((sessionsAttended / sessionsTotal) * 100) : 0,
        completed: e.completed,
        certificate: e.certificate,
      };
    });

    res.status(200).json({
      success: true,
      data: formatted,
    });
  } catch (error) {
    console.error("Error fetching my cohorts:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
