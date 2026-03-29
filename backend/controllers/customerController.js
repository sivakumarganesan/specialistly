import mongoose from 'mongoose';
import Customer from '../models/Customer.js';
import SelfPacedEnrollment from '../models/SelfPacedEnrollment.js';
import CohortEnrollment from '../models/CohortEnrollment.js';
import Course from '../models/Course.js';
import ConsultingSlot from '../models/ConsultingSlot.js';
import { sendEmail } from '../services/gmailApiService.js';
import zoomService from '../services/zoomService.js';

// Create a new customer
export const createCustomer = async (req, res) => {
  try {
    const customer = new Customer(req.body);
    await customer.save();
    res.status(201).json({
      success: true,
      message: 'Customer created successfully',
      data: customer,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Get all customers
export const getAllCustomers = async (req, res) => {
  try {
    const { specialistEmail } = req.query;
    console.log('getAllCustomers called with specialistEmail:', specialistEmail);
    
    let query = {};
    if (specialistEmail) {
      // Filter customers by specialist email
      query = { 'specialists.specialistEmail': specialistEmail };
    }
    
    console.log('Query:', query);
    const customers = await Customer.find(query);
    console.log('Found customers:', customers.length);
    res.status(200).json({
      success: true,
      data: customers,
    });
  } catch (error) {
    console.error('Error in getAllCustomers:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get a single customer by ID
export const getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found',
      });
    }
    res.status(200).json({
      success: true,
      data: customer,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update a customer
export const updateCustomer = async (req, res) => {
  try {
    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true }
    );
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found',
      });
    }
    res.status(200).json({
      success: true,
      message: 'Customer updated successfully',
      data: customer,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete a customer
export const deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findByIdAndDelete(req.params.id);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found',
      });
    }
    res.status(200).json({
      success: true,
      message: 'Customer deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Add purchase to customer
export const addPurchaseToCustomer = async (req, res) => {
  try {
    const { customerId } = req.params;
    const { offeringTitle, offeringType, offeringId, price } = req.body;

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found',
      });
    }

    customer.purchases.push({
      offeringTitle,
      offeringType,
      offeringId,
      price,
      date: new Date(),
      status: 'completed',
    });

    customer.totalSpent += parseFloat(price.replace('$', ''));
    customer.purchaseCount += 1;
    customer.updatedAt = Date.now();

    await customer.save();

    res.status(200).json({
      success: true,
      message: 'Purchase added successfully',
      data: customer,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Enroll customer in a course
export const enrollCourse = async (req, res) => {
  try {
    const { userId, courseId, enrolledAt, status } = req.body;

    const customer = await Customer.findOne({ email: userId });
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found',
      });
    }

    // Add course enrollment
    if (!customer.enrollments) {
      customer.enrollments = [];
    }

    customer.enrollments.push({
      courseId,
      enrolledAt: new Date(enrolledAt),
      status: status || 'active',
    });

    customer.updatedAt = Date.now();
    await customer.save();

    res.status(200).json({
      success: true,
      message: 'Course enrollment successful',
      data: customer,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Book a service for customer
export const bookService = async (req, res) => {
  try {
    const { customerEmail, serviceId, bookedAt, status } = req.body;

    // Find customer by email, or create if doesn't exist
    let customer = await Customer.findOne({ email: customerEmail });
    
    if (!customer) {
      // Create a new customer record with the provided info
      const { customerEmail, customerName } = req.body;
      customer = new Customer({
        email: customerEmail,
        name: customerName || customerEmail.split('@')[0],
      });
      await customer.save();
    }

    // Add service booking
    if (!customer.bookings) {
      customer.bookings = [];
    }

    customer.bookings.push({
      serviceId,
      bookedAt: bookedAt ? new Date(bookedAt) : new Date(),
      status: status || 'pending',
    });

    customer.updatedAt = Date.now();
    await customer.save();

    res.status(200).json({
      success: true,
      message: 'Service booked successfully',
      data: customer,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Book a webinar session with Zoom meeting creation and email notifications
 * @route POST /api/customer/book-webinar
 */
export const bookWebinar = async (req, res) => {
  try {
    const {
      customerEmail,
      customerName,
      specialistEmail,
      specialistName,
      specialistId,
      serviceId,
      serviceTitle,
      webinarDate,
      webinarTime,
    } = req.body;

    // Validate required fields
    if (!customerEmail || !specialistId || !webinarDate || !webinarTime) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: customerEmail, specialistId, webinarDate, webinarTime',
      });
    }

    try {
      // Get specialist's Zoom OAuth token
      const UserOAuthToken = (await import('../models/UserOAuthToken.js')).default;
      const zoomToken = await UserOAuthToken.findOne({ userId: specialistId });
      
      if (!zoomToken) {
        console.error(`❌ No Zoom OAuth token found for specialist ${specialistId}`);
        
        // Send re-auth notification
        try {
          await zoomService.sendZoomReAuthNotification(
            specialistEmail,
            specialistName,
            customerName,
            serviceTitle
          );
        } catch (emailError) {
          console.error('❌ Failed to send re-auth notification:', emailError.message);
        }
        
        return res.status(400).json({
          success: false,
          message: `❌ The specialist hasn't connected their Zoom account. A notification has been sent.`,
          requiresReAuth: true,
        });
      }

      if (!zoomToken.zoomAccessToken || zoomToken.zoomAccessToken === 'pending') {
        console.error(`❌ Zoom access token not available for specialist ${specialistId}`);
        
        // Send re-auth notification
        try {
          await zoomService.sendZoomReAuthNotification(
            specialistEmail,
            specialistName,
            customerName,
            serviceTitle
          );
        } catch (emailError) {
          console.error('❌ Failed to send re-auth notification:', emailError.message);
        }
        
        return res.status(400).json({
          success: false,
          message: `❌ The specialist's Zoom authorization needs to be re-completed. A notification has been sent.`,
          requiresReAuth: true,
        });
      }

      // Calculate meeting times  
      const startDateTime = new Date(webinarDate);
      const [startHour, startMin] = webinarTime.split(':');
      startDateTime.setHours(parseInt(startHour), parseInt(startMin));

      // End time: 1 hour after start time
      const endDateTime = new Date(startDateTime);
      endDateTime.setHours(endDateTime.getHours() + 1);

      console.log('🎥 Creating Zoom meeting for webinar:', serviceTitle);
      let meetData;
      try {
        meetData = await zoomService.createZoomMeeting({
          specialistEmail,
          specialistName,
          specialistId,
          customerEmail,
          customerName,
          serviceTitle,
          startDateTime: startDateTime.toISOString(),
          endDateTime: endDateTime.toISOString(),
        });
        console.log(`✅ Zoom meeting created: ${meetData.zoomMeetingId}`);
      } catch (zoomError) {
        console.error('❌ Zoom meeting creation error:', zoomError.message);
        
        // Send re-auth notification
        try {
          await zoomService.sendZoomReAuthNotification(
            specialistEmail,
            specialistName,
            customerName,
            serviceTitle
          );
        } catch (emailError) {
          console.error('❌ Failed to send re-auth notification:', emailError.message);
        }
        
        return res.status(400).json({
          success: false,
          message: `❌ Failed to create Zoom meeting: ${zoomError.message}`,
          requiresReAuth: true,
        });
      }

      // Create or update customer
      let customer = await Customer.findOne({ email: customerEmail });
      if (!customer) {
        customer = new Customer({
          email: customerEmail,
          name: customerName || customerEmail.split('@')[0],
        });
      }

      // Add booking to customer
      if (!customer.bookings) {
        customer.bookings = [];
      }
      customer.bookings.push({
        serviceId: serviceId,
        serviceName: serviceTitle,
        bookedAt: new Date(),
        status: 'confirmed',
        zoomMeetingId: meetData.zoomMeetingId,
        zoomJoinUrl: meetData.joinUrl,
      });

      // Add specialist to customer's specialists list if not already there
      if (!customer.specialists) {
        customer.specialists = [];
      }
      const existingSpecialist = customer.specialists.find(
        (s) => s.specialistEmail === specialistEmail
      );
      if (!existingSpecialist) {
        customer.specialists.push({
          specialistId: specialistId,
          specialistEmail: specialistEmail,
          specialistName: specialistName,
          firstBookedDate: new Date(),
        });
      }

      await customer.save();

      // Send confirmation emails
      try {
        console.log('📧 Sending webinar confirmation emails...');
        await zoomService.sendMeetingInvitation({
          specialistEmail,
          specialistName,
          customerEmail,
          customerName,
          serviceTitle,
          date: webinarDate,
          startTime: webinarTime,
          joinUrl: meetData.joinUrl,
          zoomMeetingId: meetData.zoomMeetingId,
        });
        console.log('✅ Webinar confirmation emails sent');
      } catch (emailError) {
        console.error('❌ Email sending error:', emailError.message);
        // Log but don't fail the booking
      }

      res.status(200).json({
        success: true,
        message: 'Webinar booked successfully with Zoom meeting created and confirmation sent',
        data: {
          customerId: customer._id,
          customerEmail: customerEmail,
          serviceTitle: serviceTitle,
          zoomMeetingId: meetData.zoomMeetingId,
          zoomJoinUrl: meetData.joinUrl,
        },
      });
    } catch (error) {
      console.error('❌ Webinar booking error:', error.message);
      res.status(400).json({
        success: false,
        message: `Failed to book webinar: ${error.message}`,
      });
    }
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Get customer enrollments by email
export const getEnrollmentsByEmail = async (req, res) => {
  try {
    const { email } = req.params;
    const customer = await Customer.findOne({ email });
    
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found',
        data: [],
      });
    }

    const enrollments = customer.enrollments || [];
    
    // Fetch course details for each enrollment
    const Course = mongoose.model('Course');
    const enrichedEnrollments = await Promise.all(
      enrollments.map(async (enrollment, index) => {
        try {
          const course = await Course.findById(enrollment.courseId);
          return {
            _id: `${customer._id}-enrollment-${index}`,
            courseId: enrollment.courseId,
            courseName: course?.title || 'Course',
            coursePrice: course?.price || 0,
            enrolledAt: enrollment.enrolledAt,
            status: enrollment.status,
            description: course?.description,
            progress: enrollment.progress || 0,
          };
        } catch (err) {
          return {
            _id: `${customer._id}-enrollment-${index}`,
            courseId: enrollment.courseId,
            courseName: 'Course',
            coursePrice: 0,
            enrolledAt: enrollment.enrolledAt,
            status: enrollment.status,
            progress: 0,
          };
        }
      })
    );
    
    res.status(200).json({
      success: true,
      data: enrichedEnrollments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      data: [],
    });
  }
};

// Get customer bookings by email
export const getBookingsByEmail = async (req, res) => {
  try {
    const { email } = req.params;
    const customer = await Customer.findOne({ email });
    
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found',
        data: [],
      });
    }

    const bookings = customer.bookings || [];
    
    // Fetch service details for each booking
    const Service = mongoose.model('Service');
    const enrichedBookings = await Promise.all(
      bookings.map(async (booking, index) => {
        try {
          const service = await Service.findById(booking.serviceId);
          return {
            _id: `${customer._id}-booking-${index}`,
            serviceId: booking.serviceId,
            serviceName: service?.title || 'Service',
            servicePrice: service?.price || 0,
            bookedAt: booking.bookedAt,
            status: booking.status,
            description: service?.description,
          };
        } catch (err) {
          return {
            _id: `${customer._id}-booking-${index}`,
            serviceId: booking.serviceId,
            serviceName: 'Service',
            servicePrice: 0,
            bookedAt: booking.bookedAt,
            status: booking.status,
          };
        }
      })
    );
    
    res.status(200).json({
      success: true,
      data: enrichedBookings,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      data: [],
    });
  }
};

/**
 * Update customer interests
 * PUT /api/customer/interests
 */
export const updateCustomerInterests = async (req, res) => {
  try {
    const { email, interests } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required',
      });
    }

    if (!Array.isArray(interests)) {
      return res.status(400).json({
        success: false,
        message: 'Interests must be an array',
      });
    }

    // Validate interests against allowed categories
    const ALLOWED_CATEGORIES = [
      'Healthcare',
      'Sports',
      'Dietitian',
      'Entertainment',
      'Astrology/Numerology',
      'Coaching',
      'Medical',
      'Law & Legal Services',
      'Technology & IT',
      'Design & Arts',
      'Digital Marketing',
      'Fitness & Nutrition',
      'Education & Career',
    ];

    const invalidInterests = interests.filter(
      interest => !ALLOWED_CATEGORIES.includes(interest)
    );

    if (invalidInterests.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Invalid interests: ${invalidInterests.join(', ')}`,
      });
    }

    // Update interests in the Customer document
    const customer = await Customer.findOneAndUpdate(
      { email },
      { 
        interests,
        interestsUpdatedAt: new Date(),
      },
      { new: true }
    );

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found',
      });
    }

    res.json({
      success: true,
      message: 'Interests updated successfully',
      data: {
        email: customer.email,
        interests: customer.interests,
        interestsUpdatedAt: customer.interestsUpdatedAt,
      },
    });
  } catch (error) {
    console.error('Error updating customer interests:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get customer interests
 * GET /api/customer/interests/:email
 */
export const getCustomerInterests = async (req, res) => {
  try {
    const { email } = req.params;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required',
      });
    }

    const customer = await Customer.findOne({ email });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found',
      });
    }

    res.json({
      success: true,
      interests: customer.interests || [],
    });
  } catch (error) {
    console.error('Error getting customer interests:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get customers with enriched enrollment/booking data for segmentation
 * GET /api/customers/enriched?specialistEmail=...&segment=all|course-enrolled|appointment-booked|no-activity
 */
export const getEnrichedCustomers = async (req, res) => {
  try {
    const { specialistEmail, segment } = req.query;
    if (!specialistEmail) {
      return res.status(400).json({ success: false, message: 'specialistEmail is required' });
    }

    // Get all customers for this specialist
    const customers = await Customer.find({ 'specialists.specialistEmail': specialistEmail }).lean();

    // Get all courses by this specialist
    const courses = await Course.find({ specialistEmail }).lean();
    const courseMap = {};
    courses.forEach(c => { courseMap[c._id.toString()] = c; });
    const courseIds = courses.map(c => c._id);

    // Get all self-paced enrollments for specialist's courses
    const selfPacedEnrollments = await SelfPacedEnrollment.find({
      courseId: { $in: courseIds },
    }).lean();

    // Get all cohort enrollments — need cohorts for specialist's courses
    const Cohort = mongoose.models.Cohort;
    let cohortEnrollments = [];
    if (Cohort) {
      const cohorts = await Cohort.find({ courseId: { $in: courseIds } }).lean();
      const cohortIds = cohorts.map(c => c._id);
      const cohortMap = {};
      cohorts.forEach(c => { cohortMap[c._id.toString()] = c; });
      if (cohortIds.length > 0) {
        const rawCohortEnrollments = await CohortEnrollment.find({
          cohortId: { $in: cohortIds },
        }).lean();
        cohortEnrollments = rawCohortEnrollments.map(e => ({
          ...e,
          courseId: cohortMap[e.cohortId.toString()]?.courseId,
        }));
      }
    }

    // Get all consulting slot bookings for this specialist
    const slots = await ConsultingSlot.find({ specialistEmail }).lean();
    const allBookings = [];
    slots.forEach(slot => {
      (slot.bookings || []).forEach(b => {
        allBookings.push({
          customerEmail: b.customerEmail,
          customerName: b.customerName,
          slotDate: slot.date,
          startTime: slot.startTime,
          endTime: slot.endTime,
          status: b.status,
          bookedAt: b.bookedAt,
          title: slot.title || '1:1 Consultation',
        });
      });
    });

    // Build a lookup by customer email
    const enrollmentsByEmail = {};
    const bookingsByEmail = {};

    [...selfPacedEnrollments, ...cohortEnrollments].forEach(e => {
      const email = e.customerEmail?.toLowerCase();
      if (!email) return;
      if (!enrollmentsByEmail[email]) enrollmentsByEmail[email] = [];
      const course = courseMap[e.courseId?.toString()];
      enrollmentsByEmail[email].push({
        courseTitle: course?.title || 'Unknown Course',
        courseType: course?.courseType || 'self-paced',
        enrolledAt: e.createdAt || e.paidAt,
        status: e.completed ? 'completed' : (e.status || 'active'),
        amount: e.amount || 0,
      });
    });

    allBookings.forEach(b => {
      const email = b.customerEmail?.toLowerCase();
      if (!email) return;
      if (!bookingsByEmail[email]) bookingsByEmail[email] = [];
      bookingsByEmail[email].push({
        title: b.title,
        date: b.slotDate,
        startTime: b.startTime,
        endTime: b.endTime,
        status: b.status,
        bookedAt: b.bookedAt,
      });
    });

    // Enrich customers
    let enriched = customers.map(c => {
      const email = c.email?.toLowerCase();
      const courseEnrollments = enrollmentsByEmail[email] || [];
      const appointments = bookingsByEmail[email] || [];
      return {
        ...c,
        id: c._id,
        courseEnrollments,
        appointments,
        hasEnrollments: courseEnrollments.length > 0,
        hasAppointments: appointments.length > 0,
      };
    });

    // Apply segment filter
    if (segment === 'course-enrolled') {
      enriched = enriched.filter(c => c.hasEnrollments);
    } else if (segment === 'appointment-booked') {
      enriched = enriched.filter(c => c.hasAppointments);
    } else if (segment === 'no-activity') {
      enriched = enriched.filter(c => !c.hasEnrollments && !c.hasAppointments);
    }

    res.json({ success: true, data: enriched });
  } catch (error) {
    console.error('Error in getEnrichedCustomers:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Send email to selected customers
 * POST /api/customers/send-email
 * Body: { emails: string[], subject: string, body: string, specialistName: string }
 */
export const sendBulkEmail = async (req, res) => {
  try {
    const { emails, subject, body, specialistName } = req.body;

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one email is required' });
    }
    if (!subject || !body) {
      return res.status(400).json({ success: false, message: 'Subject and body are required' });
    }

    // Limit to prevent abuse
    if (emails.length > 50) {
      return res.status(400).json({ success: false, message: 'Maximum 50 recipients per batch' });
    }

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="white-space: pre-wrap; line-height: 1.6; color: #333;">${body.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>')}</div>
        <hr style="margin-top: 30px; border: none; border-top: 1px solid #eee;" />
        <p style="color: #888; font-size: 12px;">Sent by ${(specialistName || 'Your Specialist').replace(/</g, '&lt;').replace(/>/g, '&gt;')} via Specialistly</p>
      </div>
    `;

    const results = { sent: 0, failed: 0, errors: [] };

    for (const email of emails) {
      try {
        await sendEmail({ to: email, subject, html });
        results.sent++;
      } catch (err) {
        results.failed++;
        results.errors.push({ email, error: err.message });
      }
    }

    res.json({
      success: true,
      message: `${results.sent} email(s) sent successfully${results.failed > 0 ? `, ${results.failed} failed` : ''}`,
      data: results,
    });
  } catch (error) {
    console.error('Error in sendBulkEmail:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
