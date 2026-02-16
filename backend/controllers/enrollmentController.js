import SelfPacedEnrollment from '../models/SelfPacedEnrollment.js';
import Course from '../models/Course.js';
import Certificate from '../models/Certificate.js';

const generateCertificateId = () => {
  const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `CERT-${new Date().getFullYear()}-${randomStr}`;
};

// Enroll in self-paced course
export const enrollSelfPaced = async (req, res) => {
  try {
    const { courseId, customerId, customerEmail } = req.body;
    
    // Use values from body or from auth middleware if available
    const finalCustomerId = customerId || req.user?.id;
    const finalCustomerEmail = customerEmail || req.user?.email;

    if (!courseId) {
      return res.status(400).json({
        success: false,
        message: 'Course ID is required',
      });
    }

    if (!finalCustomerId || !finalCustomerEmail) {
      return res.status(400).json({
        success: false,
        message: 'Customer ID and email are required',
      });
    }

    // Check if course exists and is published
    const course = await Course.findById(courseId);
    if (!course || course.status !== 'published') {
      return res.status(404).json({
        success: false,
        message: 'Course not found or not published',
      });
    }

    // Check for existing enrollment
    const existingEnrollment = await SelfPacedEnrollment.findOne({
      courseId,
      customerId: finalCustomerId,
    });

    if (existingEnrollment) {
      return res.status(400).json({
        success: false,
        message: 'Already enrolled in this course',
      });
    }

    // Create enrollment
    const enrollment = new SelfPacedEnrollment({
      courseId,
      customerId: finalCustomerId,
      customerEmail: finalCustomerEmail,
      completedLessons: [],
      completed: false,
      paidAt: course.price > 0 ? new Date() : null,
      amount: course.price,
    });

    await enrollment.save();

    res.status(201).json({
      success: true,
      message: 'Enrolled successfully',
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

// Get self-paced enrollments (my courses)
export const getMyCourses = async (req, res) => {
  try {
    const customerId = req.user?.id || req.query.customerId;

    const enrollments = await SelfPacedEnrollment.find({ customerId })
      .populate('courseId', 'title thumbnail lessons')
      .sort({ createdAt: -1 });

    const formatted = enrollments.map((e) => ({
      enrollmentId: e._id,
      courseId: e.courseId._id,
      title: e.courseId.title,
      thumbnail: e.courseId.thumbnail,
      lessonsTotal: e.courseId.lessons.length,
      lessonsCompleted: e.completedLessons.length,
      percentComplete: Math.round(
        (e.completedLessons.length / e.courseId.lessons.length) * 100
      ),
      completed: e.completed,
      certificate: e.certificate,
    }));

    res.status(200).json({
      success: true,
      data: formatted,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get enrollment details
export const getEnrollmentDetails = async (req, res) => {
  try {
    const { enrollmentId } = req.params;

    const enrollment = await SelfPacedEnrollment.findById(enrollmentId).populate(
      'courseId'
    );

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found',
      });
    }

    const course = enrollment.courseId;
    const percentComplete = Math.round(
      (enrollment.completedLessons.length / course.lessons.length) * 100
    );

    const lessons = course.lessons.map((lesson) => ({
      _id: lesson._id,
      title: lesson.title,
      order: lesson.order,
      videoUrl: lesson.videoUrl,
      completed: enrollment.completedLessons.includes(lesson._id),
    }));

    res.status(200).json({
      success: true,
      data: {
        enrollmentId: enrollment._id,
        courseTitle: course.title,
        lessons,
        percentComplete,
        completed: enrollment.completed,
        certificate: enrollment.certificate,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Mark lesson complete
export const markLessonComplete = async (req, res) => {
  try {
    const { enrollmentId, lessonId } = req.params;

    const enrollment = await SelfPacedEnrollment.findById(enrollmentId);
    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found',
      });
    }

    // Add lesson to completed
    if (!enrollment.completedLessons.includes(lessonId)) {
      enrollment.completedLessons.push(lessonId);
    }

    // Get course for total count
    const course = await Course.findById(enrollment.courseId);
    const totalLessons = course.lessons.length;
    const completedCount = enrollment.completedLessons.length;
    const percentComplete = (completedCount / totalLessons) * 100;

    // Check if all lessons done
    if (completedCount === totalLessons) {
      enrollment.completed = true;

      // Auto-generate certificate
      const certificateId = generateCertificateId();
      const certificate = new Certificate({
        certificateId,
        courseId: course._id,
        courseName: course.title,
        courseType: 'self-paced',
        customerId: enrollment.customerId,
        customerName: enrollment.customerEmail, // Can improve with user lookup
        customerEmail: enrollment.customerEmail,
        specialistId: course.specialistId,
        specialistName: course.specialistEmail,
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

    enrollment.updatedAt = new Date();
    await enrollment.save();

    res.status(200).json({
      success: true,
      message: 'Lesson marked complete',
      percentComplete: Math.round(percentComplete),
      completed: enrollment.completed,
      certificate: enrollment.certificate,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Check certificate eligibility
export const checkCertificateEligibility = async (req, res) => {
  try {
    const { enrollmentId } = req.params;

    const enrollment = await SelfPacedEnrollment.findById(enrollmentId).populate(
      'courseId'
    );

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found',
      });
    }

    const course = enrollment.courseId;
    const totalLessons = course.lessons.length;
    const completedCount = enrollment.completedLessons.length;
    const allDone = completedCount === totalLessons;

    res.status(200).json({
      success: true,
      data: {
        eligible: allDone && enrollment.completed,
        allLessonsDone: allDone,
        certificate: enrollment.certificate,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
