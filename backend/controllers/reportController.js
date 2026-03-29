import ConsultingSlot from '../models/ConsultingSlot.js';
import Course from '../models/Course.js';
import SelfPacedEnrollment from '../models/SelfPacedEnrollment.js';
import User from '../models/User.js';

/**
 * GET /api/reports/specialist-overview
 * Returns all 1:1 appointment bookings and course enrollments for the authenticated specialist.
 */
export const getSpecialistOverview = async (req, res) => {
  try {
    const userId = req.user.userId;
    const userEmail = req.user.email;

    // Look up specialist to get email if not in token
    let specialistEmail = userEmail;
    if (!specialistEmail) {
      const user = await User.findById(userId).select('email');
      specialistEmail = user?.email;
    }

    if (!specialistEmail) {
      return res.status(400).json({ success: false, message: 'Specialist email not found' });
    }

    // 1. Fetch all consulting slots with bookings for this specialist
    const slots = await ConsultingSlot.find({
      specialistEmail,
      'bookings.0': { $exists: true }, // only slots that have at least one booking
    }).sort({ date: -1 }).lean();

    // Flatten embedded bookings into a flat list
    const appointments = [];
    for (const slot of slots) {
      for (const booking of slot.bookings) {
        appointments.push({
          slotId: slot._id,
          date: slot.date,
          startTime: slot.startTime,
          endTime: slot.endTime,
          duration: slot.duration,
          timezone: slot.timezone,
          price: slot.price,
          currency: slot.currency,
          customerName: booking.customerName || 'N/A',
          customerEmail: booking.customerEmail || '',
          customerPhone: booking.customerPhone || '',
          status: booking.status || 'booked',
          bookedAt: booking.bookedAt,
          notes: booking.additionalNotes || '',
          zoomLink: booking.zoomMeeting?.joinUrl || null,
        });
      }
    }

    // 2. Fetch all courses for this specialist
    const courses = await Course.find({
      $or: [
        { specialistId: userId },
        { specialistEmail },
      ],
      status: { $in: ['published', 'draft'] },
    }).select('_id title courseType price currency startDate endDate status').lean();

    // 3. Fetch enrollments for those courses
    const courseIds = courses.map(c => c._id);
    const enrollments = await SelfPacedEnrollment.find({
      courseId: { $in: courseIds },
    }).sort({ createdAt: -1 }).lean();

    // Build a map of courseId -> course details
    const courseMap = {};
    for (const c of courses) {
      courseMap[c._id.toString()] = c;
    }

    // Combine enrollments with course info
    const courseEnrollments = enrollments.map(e => ({
      enrollmentId: e._id,
      courseId: e.courseId,
      courseTitle: courseMap[e.courseId?.toString()]?.title || 'Unknown Course',
      courseType: courseMap[e.courseId?.toString()]?.courseType || 'self-paced',
      customerEmail: e.customerEmail || '',
      paymentStatus: e.paymentStatus || 'pending',
      status: e.status || 'active',
      amount: e.amount || 0,
      currency: courseMap[e.courseId?.toString()]?.currency || 'INR',
      enrolledAt: e.createdAt,
    }));

    // 4. Summary stats
    const now = new Date();
    const upcomingAppointments = appointments.filter(a => new Date(a.date) >= now && a.status === 'booked');
    const pastAppointments = appointments.filter(a => new Date(a.date) < now);

    const summary = {
      totalAppointments: appointments.length,
      upcomingAppointments: upcomingAppointments.length,
      pastAppointments: pastAppointments.length,
      cancelledAppointments: appointments.filter(a => a.status.includes('cancelled')).length,
      totalCourses: courses.length,
      totalEnrollments: courseEnrollments.length,
      activeEnrollments: courseEnrollments.filter(e => e.status === 'active').length,
    };

    res.status(200).json({
      success: true,
      data: {
        summary,
        appointments,
        courseEnrollments,
        courses: courses.map(c => ({
          id: c._id,
          title: c.title,
          courseType: c.courseType,
          price: c.price,
          currency: c.currency,
          status: c.status,
          startDate: c.startDate,
          endDate: c.endDate,
          enrollmentCount: courseEnrollments.filter(e => e.courseId?.toString() === c._id.toString()).length,
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching specialist overview:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching specialist overview',
      error: error.message,
    });
  }
};
