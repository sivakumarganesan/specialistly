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
    const finalCustomerId = customerId || req.user?.userId;
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
    const customerId = req.user?.userId || req.query.customerId;

    if (!customerId) {
      return res.status(400).json({
        success: false,
        message: 'Customer ID is required',
      });
    }

    const enrollments = await SelfPacedEnrollment.find({ customerId })
      .populate('courseId', 'title thumbnail lessons')
      .sort({ createdAt: -1 });

    if (!enrollments || enrollments.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
      });
    }

    // Filter out enrollments where course doesn't exist (deleted courses)
    const validEnrollments = enrollments.filter((e) => {
      // Check if courseId exists after populate
      if (!e.courseId) {
        console.warn(`Enrollment ${e._id} has null courseId - course may have been deleted`);
        return false;
      }
      return true;
    });

    const formatted = validEnrollments.map((e) => {
      try {
        // Double-check course exists before accessing properties
        if (!e.courseId || !e.courseId._id) {
          throw new Error(`Course reference invalid for enrollment ${e._id}`);
        }

        const lessonsTotal = (e.courseId.lessons && Array.isArray(e.courseId.lessons)) ? e.courseId.lessons.length : 0;
        const lessonsCompleted = (e.completedLessons && Array.isArray(e.completedLessons)) ? e.completedLessons.length : 0;
        
        return {
          enrollmentId: e._id,
          courseId: e.courseId._id,
          title: e.courseId.title || 'Untitled Course',
          thumbnail: e.courseId.thumbnail || null,
          lessonsTotal: lessonsTotal,
          lessonsCompleted: lessonsCompleted,
          percentComplete: lessonsTotal > 0 ? Math.round((lessonsCompleted / lessonsTotal) * 100) : 0,
          completed: e.completed || false,
          certificate: e.certificate || null,
        };
      } catch (mapError) {
        console.error(`Error mapping enrollment:`, mapError.message);
        throw mapError;
      }
    });

    res.status(200).json({
      success: true,
      data: formatted,
    });
  } catch (error) {
    console.error("Error fetching my courses:", error);
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
    
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found. It may have been deleted.',
      });
    }

    const lessonsTotal = course.lessons && course.lessons.length ? course.lessons.length : 0;
    const completedCount = enrollment.completedLessons && enrollment.completedLessons.length ? enrollment.completedLessons.length : 0;
    const percentComplete = lessonsTotal > 0 ? Math.round((completedCount / lessonsTotal) * 100) : 0;

    const lessons = ((course.lessons && Array.isArray(course.lessons)) ? course.lessons : []).map((lesson) => {
      if (!lesson) {
        return null;
      }
      return {
        _id: lesson._id,
        title: lesson.title || 'Untitled Lesson',
        order: lesson.order || 0,
        videoUrl: lesson.videoUrl || null,
        files: lesson.files || [],
        completed: enrollment.completedLessons && enrollment.completedLessons.includes(lesson._id),
      };
    }).filter(l => l !== null);

    res.status(200).json({
      success: true,
      data: {
        enrollmentId: enrollment._id,
        courseId: course._id,
        courseTitle: course.title,
        courseDescription: course.description,
        lessons,
        percentComplete,
        completed: enrollment.completed,
        certificate: enrollment.certificate,
      },
    });
  } catch (error) {
    console.error("Error fetching enrollment details:", error);
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
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    const totalLessons = course.lessons && course.lessons.length ? course.lessons.length : 0;
    const completedCount = enrollment.completedLessons && enrollment.completedLessons.length ? enrollment.completedLessons.length : 0;
    const percentComplete = totalLessons > 0 ? (completedCount / totalLessons) * 100 : 0;

    // Check if all lessons done
    if (totalLessons > 0 && completedCount === totalLessons) {
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
    console.error("Error marking lesson complete:", error);
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
    
    // Check if course exists (may be deleted)
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found or deleted',
      });
    }

    const totalLessons = course.lessons && course.lessons.length ? course.lessons.length : 0;
    const completedCount = enrollment.completedLessons && enrollment.completedLessons.length ? enrollment.completedLessons.length : 0;
    const allDone = totalLessons > 0 && completedCount === totalLessons;

    res.status(200).json({
      success: true,
      data: {
        eligible: allDone && enrollment.completed,
        allLessonsDone: allDone,
        certificate: enrollment.certificate,
      },
    });
  } catch (error) {
    console.error("Error checking certificate eligibility:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
