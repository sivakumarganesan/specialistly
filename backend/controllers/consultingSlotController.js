import ConsultingSlot from '../models/ConsultingSlot.js';
import User from '../models/User.js';
import AvailabilitySchedule from '../models/AvailabilitySchedule.js';
import CreatorProfile from '../models/CreatorProfile.js';
import mongoose from 'mongoose';
import { generateSlotsForDateRange } from '../utils/slotGenerationUtils.js';
import zoomService from '../services/zoomService.js';
import gmailApiService from '../services/gmailApiService.js';
import refundService from '../services/refundService.js';

// Helper function to calculate duration in minutes from time strings
const calculateDuration = (startTime, endTime) => {
  // Format: "14:00" or "2:30 PM"
  const parseTime = (timeStr) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };
  
  const startMinutes = parseTime(startTime);
  const endMinutes = parseTime(endTime);
  
  // Handle overnight slots (e.g., 23:00 to 01:00)
  if (endMinutes < startMinutes) {
    return (24 * 60) - startMinutes + endMinutes;
  }
  
  return endMinutes - startMinutes;
};

// ===== GET ROUTES =====

// Get all available slots for a specialist (Customer view)
export const getAvailableSlots = async (req, res) => {
  try {
    const { specialistEmail, startDate, endDate } = req.query;

    if (!specialistEmail) {
      return res.status(400).json({
        success: false,
        message: 'Specialist email is required',
      });
    }

    // Use the static method from schema
    const slots = await ConsultingSlot.getAvailableSlots(
      specialistEmail,
      startDate ? new Date(startDate) : null,
      endDate ? new Date(endDate) : null
    );

    res.status(200).json({
      success: true,
      data: slots,
      count: slots.length,
    });
  } catch (error) {
    console.error('Error fetching available slots:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching available slots',
      error: error.message,
    });
  }
};

// Get all slots for a specialist (Specialist view - includes inactive/booked)
export const getSpecialistSlots = async (req, res) => {
  try {
    const { specialistEmail } = req.params;
    const { status } = req.query;

    if (!specialistEmail) {
      return res.status(400).json({
        success: false,
        message: 'Specialist email is required',
      });
    }

    const query = { specialistEmail };

    // Filter by status if provided
    if (status) {
      query.status = status;
    }

    const slots = await ConsultingSlot.find(query)
      .sort({ date: 1, startTime: 1 })
      .exec();

    res.status(200).json({
      success: true,
      data: slots,
      count: slots.length,
    });
  } catch (error) {
    console.error('Error fetching specialist slots:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching specialist slots',
      error: error.message,
    });
  }
};

// Get single slot by ID
export const getSlotById = async (req, res) => {
  try {
    const { slotId } = req.params;

    if (!slotId) {
      return res.status(400).json({
        success: false,
        message: 'Slot ID is required',
      });
    }

    const slot = await ConsultingSlot.findById(slotId)
      .populate('customerId', 'name email')
      .populate('specialistId', 'name email')
      .exec();

    if (!slot) {
      return res.status(404).json({
        success: false,
        message: 'Slot not found',
      });
    }

    res.status(200).json({
      success: true,
      data: slot,
    });
  } catch (error) {
    console.error('Error fetching slot:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching slot',
      error: error.message,
    });
  }
};

// ===== POST ROUTES =====

// Create a new slot
export const createSlot = async (req, res) => {
  try {
    // Use email from authenticated user OR from body parameter
    const specialistEmail = req.user?.email || req.body?.specialistEmail;
    const {
      specialistId,
      serviceId,
      date,
      startTime,
      endTime,
      totalCapacity,
      timezone,
      notes,
    } = req.body;

    console.log(`📝 Creating consulting slot for specialist: ${specialistEmail}`);
    console.log(`   auth user ID: ${req.user?.userId}`);
    console.log(`   request specialistId: ${specialistId}`);

    // Validation
    if (!specialistEmail || !date || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: specialistEmail, date, startTime, endTime',
      });
    }

    if (startTime >= endTime) {
      return res.status(400).json({
        success: false,
        message: 'End time must be after start time',
      });
    }

    // Check if specialist exists
    const specialist = await User.findOne({ email: specialistEmail });
    if (!specialist) {
      return res.status(404).json({
        success: false,
        message: 'Specialist not found',
      });
    }

    console.log(`   specialist found in DB with ID: ${specialist._id}`);

    // Check for conflicts - prevent double booking
    const existingSlots = await ConsultingSlot.find({
      specialistEmail,
      date: new Date(date),
      status: 'active',
      $or: [
        {
          startTime: { $lt: endTime },
          endTime: { $gt: startTime },
        },
      ],
    });

    if (existingSlots.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Time slot conflict: Specialist already has a slot during this time',
        conflictingSlots: existingSlots,
      });
    }

    // Create slot
    // Use the specialist's ID from database, prefer authenticated user's ID if available
    const finalSpecialistId = req.user?.userId || specialistId || specialist._id;
    console.log(`   final specialistId to store: ${finalSpecialistId}`);
    
    const newSlot = new ConsultingSlot({
      specialistId: finalSpecialistId,
      specialistEmail,
      serviceId,
      date: new Date(date),
      startTime,
      endTime,
      totalCapacity: totalCapacity || 1,
      timezone: timezone || 'UTC',
      notes,
      // Calculate duration in minutes
      duration: calculateDuration(startTime, endTime),
    });

    await newSlot.save();

    res.status(201).json({
      success: true,
      message: 'Slot created successfully',
      data: newSlot,
    });
  } catch (error) {
    console.error('Error creating slot:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating slot',
      error: error.message,
    });
  }
};

// Book a slot
export const bookSlot = async (req, res) => {
  try {
    const { slotId } = req.params;
    const { customerId, customerEmail, customerName } = req.body;

    if (!customerId || !customerEmail || !customerName) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: customerId, customerEmail, customerName',
      });
    }

    const slot = await ConsultingSlot.findById(slotId);

    if (!slot) {
      return res.status(404).json({
        success: false,
        message: 'Slot not found',
      });
    }

    // Check if slot is available
    if (!slot.isAvailable()) {
      return res.status(409).json({
        success: false,
        message: 'Slot is not available for booking',
        reason: slot.isFullyBooked
          ? 'Slot is fully booked'
          : slot.status === 'inactive'
          ? 'Slot is inactive'
          : 'Slot is in the past',
      });
    }

    // Add booking WITHOUT creating Zoom meeting
    // Specialist will create Zoom meeting on-demand before the meeting
    const booking = {
      customerId,
      customerEmail,
      customerName,
      bookedAt: new Date(),
      // zoomMeeting field will be populated later when specialist generates it
    };

    slot.bookings.push(booking);
    slot.bookedCount += 1;
    slot.isFullyBooked = slot.bookedCount >= slot.totalCapacity;
    await slot.save();

    // Get specialist details for email
    const specialist = await CreatorProfile.findById(slot.specialistId);
    const specialistName = specialist?.creatorName || 'Specialist';
    const appointmentDate = new Date(slot.date);
    const dateLabel = appointmentDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    // Send simple confirmation email to customer (no Zoom link yet)
    const customerEmailHtml = `
      <html>
        <body style="font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #1a1a1a; margin-top: 0;">✅ Appointment Confirmed!</h2>
            
            <p style="color: #666; font-size: 14px;">Hi ${customerName},</p>
            
            <p style="color: #666; font-size: 14px;">
              Your consulting session with <strong>${specialistName}</strong> has been confirmed!
            </p>
            
            <div style="background-color: #e8f4f8; border-left: 4px solid #0284c7; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <h3 style="color: #0284c7; margin-top: 0;">📅 Appointment Details</h3>
              <p style="color: #026aa2; margin: 5px 0;"><strong>Date:</strong> ${dateLabel}</p>
              <p style="color: #026aa2; margin: 5px 0;"><strong>Time:</strong> ${slot.startTime} - ${slot.endTime}</p>
              <p style="color: #026aa2; margin: 5px 0;"><strong>Duration:</strong> ${slot.duration} minutes</p>
            </div>

            <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <h3 style="color: #856404; margin-top: 0;">🎥 Zoom Meeting Link</h3>
              <p style="color: #856404; margin: 10px 0;">
                Your specialist will create the Zoom meeting link shortly before your appointment. You'll receive the meeting link via email as soon as it's available.
              </p>
            </div>

            <div style="background-color: #f0f0f0; padding: 15px; border-radius: 4px; margin: 20px 0;">
              <h3 style="color: #333; margin-top: 0;">✨ What to Expect</h3>
              <ul style="color: #666; font-size: 13px;">
                <li>You'll receive a Zoom meeting link 30 minutes before the session</li>
                <li>Check your email (including spam folder) for the meeting details</li>
                <li>Join 5 minutes early to test your audio and video</li>
                <li>Make sure you have a stable internet connection</li>
              </ul>
            </div>

            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            <p style="color: #999; font-size: 12px;">
              If you need to reschedule or cancel, please do so at least 24 hours before the appointment.
            </p>
          </div>
        </body>
      </html>
    `;

    try {
      await gmailApiService.sendEmail({
        to: customerEmail,
        subject: `✅ Appointment Confirmed: Consulting Session on ${dateLabel}`,
        html: customerEmailHtml,
      });
      console.log(`📧 Confirmation email sent to customer: ${customerEmail}`);
    } catch (emailError) {
      console.error('⚠️ Failed to send customer confirmation email:', emailError.message);
    }

    // Send notification to specialist about the booking
    const specialistEmailHtml = `
      <html>
        <body style="font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #1a1a1a; margin-top: 0;">🎯 New Appointment Booked!</h2>
            
            <p style="color: #666; font-size: 14px;">Hi ${specialistName},</p>
            
            <p style="color: #666; font-size: 14px;">
              A new consulting session has been booked with <strong>${customerName}</strong>.
            </p>
            
            <div style="background-color: #dbeafe; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <h3 style="color: #1e40af; margin-top: 0;">📅 Session Details</h3>
              <p style="color: #1e40af; margin: 5px 0;"><strong>Customer:</strong> ${customerName} (${customerEmail})</p>
              <p style="color: #1e40af; margin: 5px 0;"><strong>Date:</strong> ${dateLabel}</p>
              <p style="color: #1e40af; margin: 5px 0;"><strong>Time:</strong> ${slot.startTime} - ${slot.endTime}</p>
              <p style="color: #1e40af; margin: 5px 0;"><strong>Duration:</strong> ${slot.duration} minutes</p>
            </div>

            <div style="background-color: #dcfce7; border-left: 4px solid #22c55e; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <h3 style="color: #166534; margin-top: 0;">🎥 Next Step: Create Zoom Meeting</h3>
              <p style="color: #166534; margin: 10px 0;">
                Log in to Specialistly to create the Zoom meeting link shortly before the appointment. Once created, the customer will automatically receive the meeting details.
              </p>
              <p style="color: #166534; font-size: 12px; margin: 10px 0;">
                <strong>Recommended:</strong> Create the meeting 30 minutes before the scheduled time.
              </p>
            </div>

            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            <p style="color: #999; font-size: 12px;">
              This is an automated message from Specialistly. Please do not reply to this email.
            </p>
          </div>
        </body>
      </html>
    `;

    try {
      await gmailApiService.sendEmail({
        to: slot.specialistEmail,
        subject: `🎯 New Appointment: ${customerName} on ${dateLabel} at ${slot.startTime}`,
        html: specialistEmailHtml,
      });
      console.log(`📧 Notification email sent to specialist: ${slot.specialistEmail}`);
    } catch (emailError) {
      console.error('⚠️ Failed to send specialist notification email:', emailError.message);
    }

    res.status(200).json({
      success: true,
      message: 'Slot booked successfully',
      data: slot,
    });
  } catch (error) {
    console.error('Error booking slot:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error booking slot',
    });
  }
};

// ===== PUT ROUTES =====

// Update slot (time and status only)
export const updateSlot = async (req, res) => {
  try {
    const { slotId } = req.params;
    const { startTime, endTime, status, notes, timezone } = req.body;

    const slot = await ConsultingSlot.findById(slotId);

    if (!slot) {
      return res.status(404).json({
        success: false,
        message: 'Slot not found',
      });
    }

    // Prevent updating if slot is already booked
    if (slot.bookedCount > 0 && (startTime || endTime)) {
      return res.status(409).json({
        success: false,
        message:
          'Cannot change time of a slot that already has bookings. Please cancel bookings first or delete the slot.',
      });
    }

    // Update allowed fields
    if (startTime) {
      slot.startTime = startTime;
    }
    if (endTime) {
      slot.endTime = endTime;
    }
    if (status) {
      slot.status = status;
    }
    if (notes !== undefined) {
      slot.notes = notes;
    }
    if (timezone) {
      slot.timezone = timezone;
    }

    // Recalculate duration if times changed
    if (startTime || endTime) {
      const start = new Date(`1970-01-01T${slot.startTime}:00Z`);
      const end = new Date(`1970-01-01T${slot.endTime}:00Z`);
      slot.duration = (end - start) / (1000 * 60);
    }

    slot.updatedAt = new Date();
    await slot.save();

    res.status(200).json({
      success: true,
      message: 'Slot updated successfully',
      data: slot,
    });
  } catch (error) {
    console.error('Error updating slot:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating slot',
    });
  }
};

// ===== DELETE ROUTES =====

// Delete slot
export const deleteSlot = async (req, res) => {
  try {
    const { slotId } = req.params;

    const slot = await ConsultingSlot.findById(slotId);

    if (!slot) {
      return res.status(404).json({
        success: false,
        message: 'Slot not found',
      });
    }

    // Prevent deleting if slot has bookings
    if (slot.bookedCount > 0) {
      return res.status(409).json({
        success: false,
        message: `Cannot delete slot with ${slot.bookedCount} booking(s). Please cancel all bookings first.`,
        bookings: slot.bookings,
      });
    }

    await ConsultingSlot.findByIdAndDelete(slotId);

    res.status(200).json({
      success: true,
      message: 'Slot deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting slot:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting slot',
      error: error.message,
    });
  }
};

// ===== UTILITY ROUTES =====

// Bulk create slots (for specialist to create multiple slots at once)
export const bulkCreateSlots = async (req, res) => {
  try {
    // Use email from authenticated user OR from body parameter
    const specialistEmail = req.user?.email || req.body?.specialistEmail;
    const { specialistId, slots } = req.body;

    if (!specialistEmail || !Array.isArray(slots) || slots.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request: specialistEmail and slots array required',
      });
    }

    // Check specialist exists
    const specialist = await User.findOne({ email: specialistEmail });
    if (!specialist) {
      return res.status(404).json({
        success: false,
        message: 'Specialist not found',
      });
    }

    const createdSlots = [];
    const errors = [];

    for (const slotData of slots) {
      try {
        // Check for conflicts
        const existingSlots = await ConsultingSlot.find({
          specialistEmail,
          date: new Date(slotData.date),
          status: 'active',
          $or: [
            {
              startTime: { $lt: slotData.endTime },
              endTime: { $gt: slotData.startTime },
            },
          ],
        });

        if (existingSlots.length > 0) {
          errors.push({
            slot: slotData,
            error: 'Time slot conflict',
          });
          continue;
        }

        const newSlot = new ConsultingSlot({
          specialistId: specialistId || specialist._id,
          specialistEmail,
          date: new Date(slotData.date),
          startTime: slotData.startTime,
          endTime: slotData.endTime,
          totalCapacity: slotData.totalCapacity || 1,
          serviceId: slotData.serviceId,
          timezone: slotData.timezone || 'UTC',
          notes: slotData.notes,
          // Calculate duration in minutes
          duration: calculateDuration(slotData.startTime, slotData.endTime),
        });

        await newSlot.save();
        createdSlots.push(newSlot);
      } catch (error) {
        errors.push({
          slot: slotData,
          error: error.message,
        });
      }
    }

    res.status(201).json({
      success: true,
      message: `${createdSlots.length} slots created successfully`,
      data: createdSlots,
      errors: errors.length > 0 ? errors : null,
    });
  } catch (error) {
    console.error('Error bulk creating slots:', error);
    res.status(500).json({
      success: false,
      message: 'Error bulk creating slots',
      error: error.message,
    });
  }
};

// Get slot availability stats for specialist
export const getSpecialistStats = async (req, res) => {
  try {
    const { specialistEmail } = req.params;

    const now = new Date();

    const stats = {
      totalSlots: await ConsultingSlot.countDocuments({ specialistEmail }),
      activeSlots: await ConsultingSlot.countDocuments({
        specialistEmail,
        status: 'active',
      }),
      inactiveSlots: await ConsultingSlot.countDocuments({
        specialistEmail,
        status: 'inactive',
      }),
      upcomingAvailable: await ConsultingSlot.countDocuments({
        specialistEmail,
        date: { $gte: now },
        status: 'active',
        isFullyBooked: false,
      }),
      upcomingBooked: await ConsultingSlot.countDocuments({
        specialistEmail,
        date: { $gte: now },
        status: 'active',
        isFullyBooked: true,
      }),
      pastSlots: await ConsultingSlot.countDocuments({
        specialistEmail,
        date: { $lt: now },
      }),
    };

    // Get total bookings from aggregation
    const bookingsResult = await ConsultingSlot.aggregate([
      { $match: { specialistEmail } },
      { $group: { _id: null, totalBookings: { $sum: '$bookedCount' } } },
    ]);
    stats.totalBookings = bookingsResult[0]?.totalBookings || 0;

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error getting specialist stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting specialist stats',
      error: error.message,
    });
  }
};

/**
 * Auto-generate consulting slots from availability schedule
 * This creates individual slot records based on the specialist's availability pattern
 */
export const generateSlotsFromAvailability = async (req, res) => {
  try {
    // Use email from authenticated user OR from body parameters
    const specialistEmail = req.user?.email || req.body?.specialistEmail;
    const { specialistId, startDate, numDays = 90, serviceId } = req.body;

    if (!specialistEmail && !specialistId) {
      return res.status(400).json({
        success: false,
        message: 'Specialist email or ID is required',
      });
    }

    // Get specialist by email or ID
    let specialist;
    if (specialistId) {
      specialist = await CreatorProfile.findById(specialistId);
    } else {
      // Try exact match first
      specialist = await CreatorProfile.findOne({ email: specialistEmail });
      // If not found, try case-insensitive
      if (!specialist) {
        specialist = await CreatorProfile.findOne({ email: new RegExp(`^${specialistEmail}$`, 'i') });
      }
    }

    if (!specialist) {
      return res.status(404).json({
        success: false,
        message: 'Specialist not found. Please ensure your profile is set up.',
        debug: {
          searchedEmail: specialistEmail,
          searchedId: specialistId,
        },
      });
    }

    // Get active availability schedule
    const schedule = await AvailabilitySchedule.findOne({
      specialistId: specialist._id,
      isActive: true,
    });

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'No active availability schedule found. Please set up your availability first.',
      });
    }

    // Generate slots using utility function
    const generateStartDate = startDate ? new Date(startDate) : new Date();
    const generatedSlots = generateSlotsForDateRange(
      schedule,
      generateStartDate,
      numDays,
      { duration: schedule.slotConfig.defaultDuration }
    );

    if (generatedSlots.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No slots could be generated. Check your availability settings.',
      });
    }

    // Add specialist info and service reference to slots
    const slotsToCreate = generatedSlots.map((slot) => ({
      ...slot,
      specialistId: specialist._id,
      specialistEmail: specialist.email,
      serviceId: serviceId || null,
      duration: slot.duration,
    }));

    // Create slots in batch
    const createdSlots = await ConsultingSlot.insertMany(slotsToCreate);

    res.status(201).json({
      success: true,
      message: `Successfully generated ${createdSlots.length} consulting slots`,
      data: {
        count: createdSlots.length,
        startDate: generateStartDate,
        endDate: new Date(new Date(generateStartDate).setDate(generateStartDate.getDate() + numDays)),
        slots: createdSlots,
      },
    });
  } catch (error) {
    console.error('Error generating slots from availability:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating slots from availability',
      error: error.message,
    });
  }
};

/**
 * Get available slots filtered by availability schedule
 * Returns only slots that match specialist's availability and are not fully booked
 */
export const getAvailableSlotsForCustomer = async (req, res) => {
  try {
    const { specialistEmail, startDate, endDate } = req.query;

    if (!specialistEmail) {
      return res.status(400).json({
        success: false,
        message: 'Specialist email is required',
      });
    }

    // Get specialist - try exact match first, then case-insensitive
    let specialist = await CreatorProfile.findOne({ email: specialistEmail });
    if (!specialist) {
      specialist = await CreatorProfile.findOne({ email: new RegExp(`^${specialistEmail}$`, 'i') });
    }
    
    if (!specialist) {
      return res.status(404).json({
        success: false,
        message: 'Specialist not found',
      });
    }

    // Build query for available slots
    const query = {
      specialistEmail,
      status: 'active',
      isFullyBooked: false,
    };

    // Add date range filter
    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        query.date.$gte = new Date(startDate);
      }
      if (endDate) {
        query.date.$lte = new Date(endDate);
      }
    }

    // Get active availability schedule to apply booking rules
    const schedule = await AvailabilitySchedule.findOne({
      specialistId: specialist._id,
      isActive: true,
    });

    const slots = await ConsultingSlot.find(query)
      .sort({ date: 1, startTime: 1 })
      .exec();

    // Filter slots based on booking rules
    const now = new Date();
    const filteredSlots = slots.filter((slot) => {
      if (!schedule) return true; // No schedule = no restrictions

      // Check minimum booking notice
      const minNoticeMs = schedule.bookingRules.minBookingNotice * 60 * 60 * 1000;
      const earliestBookTime = new Date(now.getTime() + minNoticeMs);
      if (new Date(slot.date) < earliestBookTime) {
        return false;
      }

      // Check max advance booking
      const maxAdvanceDays = schedule.bookingRules.maxAdvanceBooking;
      const latestBookTime = new Date(now.getTime() + maxAdvanceDays * 24 * 60 * 60 * 1000);
      if (new Date(slot.date) > latestBookTime) {
        return false;
      }

      return true;
    });

    res.status(200).json({
      success: true,
      data: filteredSlots,
      count: filteredSlots.length,
      total: slots.length,
      appliedRules: schedule
        ? {
            minBookingNotice: schedule.bookingRules.minBookingNotice,
            maxAdvanceBooking: schedule.bookingRules.maxAdvanceBooking,
          }
        : null,
    });
  } catch (error) {
    console.error('Error fetching available slots for customer:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching available slots',
      error: error.message,
    });
  }
};

// Create Zoom meeting for a booking (specialist only)
export const createZoomMeetingForBooking = async (req, res) => {
  try {
    const { slotId, bookingIndex } = req.params;
    // JWT payload contains userId (not id), from auth middleware
    const specialistId = req.user?.userId;

    if (!specialistId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized. Please login as a specialist.',
      });
    }

    const slot = await ConsultingSlot.findById(slotId);

    if (!slot) {
      return res.status(404).json({
        success: false,
        message: 'Slot not found',
      });
    }

    // Verify the specialist owns this slot
    // Check both by ID and by email for flexibility with legacy data
    const slotSpecialistId = slot.specialistId.toString();
    const requestingUserId = specialistId.toString();
    const requestingUserEmail = req.user?.email;
    
    console.log(`🔒 Authorization check:`);
    console.log(`   slot.specialistId=${slotSpecialistId}`);
    console.log(`   slot.specialistEmail=${slot.specialistEmail}`);
    console.log(`   req.user.userId=${requestingUserId}`);
    console.log(`   req.user.email=${requestingUserEmail}`);
    
    const isAuthorized = (slotSpecialistId === requestingUserId) || 
                         (slot.specialistEmail === requestingUserEmail);
    
    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You can only create Zoom meetings for your own slots.',
        debug: {
          slotSpecialistId,
          slotSpecialistEmail: slot.specialistEmail,
          requestingUserId,
          requestingUserEmail,
        },
      });
    }

    // Validate booking index
    const bookingIdx = parseInt(bookingIndex);
    if (isNaN(bookingIdx) || bookingIdx < 0 || bookingIdx >= slot.bookings.length) {
      return res.status(400).json({
        success: false,
        message: 'Invalid booking index',
      });
    }

    const booking = slot.bookings[bookingIdx];

    // Check if Zoom meeting already exists
    if (booking.zoomMeeting && booking.zoomMeeting.zoomMeetingId) {
      return res.status(409).json({
        success: false,
        message: 'Zoom meeting already created for this booking',
        data: booking.zoomMeeting,
      });
    }

    // Create Zoom meeting
    const appointmentDateTime = new Date(slot.date);
    const [hours, minutes] = slot.startTime.split(':').map(Number);
    appointmentDateTime.setHours(hours, minutes, 0);
    
    const endDateTime = new Date(appointmentDateTime);
    endDateTime.setMinutes(endDateTime.getMinutes() + slot.duration);

    console.log(`🎥 Creating Zoom meeting for booking with ${booking.customerName}...`);
    console.log(`   slotId: ${slotId}`);
    console.log(`   slot.specialistId: ${slot.specialistId} (type: ${typeof slot.specialistId})`);
    console.log(`   slot.specialistEmail: ${slot.specialistEmail}`);
    console.log(`   req.user.userId: ${req.user?.userId} (type: ${typeof req.user?.userId})`);
    console.log(`   req.user.email: ${req.user?.email}`);
    
    // Get specialist details for Zoom meeting
    const specialist = await CreatorProfile.findById(slot.specialistId);
    const specialistName = specialist?.creatorName || 'Specialist';
    
    console.log(`   specialist found: ${specialist ? 'YES' : 'NO'}`);
    console.log(`   specialistName: ${specialistName}`);
    
    // Use authenticated user's ID (JWT userId) as the source of truth for Zoom token lookup
    // This ensures we find the token that was created when THIS authenticated user authorized Zoom
    const zoomSpecialistId = req.user?.userId || slot.specialistId;
    console.log(`   Using for Zoom lookup: ${zoomSpecialistId}`);
    
    const zoomMeetingDetails = await zoomService.createZoomMeeting({
      specialistId: zoomSpecialistId,
      specialistEmail: slot.specialistEmail,
      specialistName: specialistName,
      customerEmail: booking.customerEmail,
      customerName: booking.customerName,
      serviceTitle: `Consulting Session - ${booking.customerName}`,
      startDateTime: appointmentDateTime,
      endDateTime: endDateTime,
    });

    console.log(`✅ Zoom meeting created: ${zoomMeetingDetails.zoomMeetingId}`);

    // Store meeting details in booking record
    booking.zoomMeeting = {
      zoomMeetingId: zoomMeetingDetails.zoomMeetingId,
      joinUrl: zoomMeetingDetails.joinUrl,
      startUrl: zoomMeetingDetails.startUrl,
      password: zoomMeetingDetails.eventDetails?.password || '',
      createdAt: new Date(),
    };

    await slot.save();

    // Send email to customer with Zoom meeting link
    const appointmentDate = new Date(slot.date);
    const dateLabel = appointmentDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const customerEmailHtml = `
      <html>
        <body style="font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #1a1a1a; margin-top: 0;">🎥 Your Zoom Meeting Is Ready!</h2>
            
            <p style="color: #666; font-size: 14px;">Hi ${booking.customerName},</p>
            
            <p style="color: #666; font-size: 14px;">
              Your Zoom meeting with <strong>${specialistName}</strong> has been created. Here are the details:
            </p>
            
            <div style="background-color: #e8f4f8; border-left: 4px solid #0284c7; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <h3 style="color: #0284c7; margin-top: 0;">📅 Appointment Details</h3>
              <p style="color: #026aa2; margin: 5px 0;"><strong>Date:</strong> ${dateLabel}</p>
              <p style="color: #026aa2; margin: 5px 0;"><strong>Time:</strong> ${slot.startTime} - ${slot.endTime}</p>
              <p style="color: #026aa2; margin: 5px 0;"><strong>Duration:</strong> ${slot.duration} minutes</p>
            </div>

            <div style="background-color: #dcfce7; border-left: 4px solid #22c55e; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <h3 style="color: #166534; margin-top: 0;">🎥 Join via Zoom</h3>
              <p style="color: #166534; margin: 10px 0;">
                Click the button below to join your meeting:
              </p>
              <div style="text-align: center; margin: 20px 0;">
                <a href="${zoomMeetingDetails.joinUrl}" style="background-color: #22c55e; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                  Join Zoom Meeting
                </a>
              </div>
              <p style="color: #166534; font-size: 12px; margin: 10px 0;">
                <strong>Meeting ID:</strong> ${zoomMeetingDetails.zoomMeetingId}<br>
                <strong>Password:</strong> ${zoomMeetingDetails.eventDetails?.password || 'Not required'}
              </p>
            </div>

            <div style="background-color: #f0f0f0; padding: 15px; border-radius: 4px; margin: 20px 0;">
              <h3 style="color: #333; margin-top: 0;">✨ Pro Tips</h3>
              <ul style="color: #666; font-size: 13px;">
                <li>Join 5 minutes early to test your audio and video</li>
                <li>Make sure you have a stable internet connection</li>
                <li>Close unnecessary tabs and programs for best performance</li>
              </ul>
            </div>

            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            <p style="color: #999; font-size: 12px;">
              See you at the meeting!
            </p>
          </div>
        </body>
      </html>
    `;

    try {
      await gmailApiService.sendEmail({
        to: booking.customerEmail,
        subject: `🎥 Zoom Meeting Ready: ${specialistName} on ${dateLabel}`,
        html: customerEmailHtml,
      });
      console.log(`📧 Zoom meeting email sent to customer: ${booking.customerEmail}`);
    } catch (emailError) {
      console.error('⚠️ Failed to send Zoom meeting email to customer:', emailError.message);
      // Don't fail the whole operation if email fails
    }

    res.status(200).json({
      success: true,
      message: 'Zoom meeting created successfully',
      data: {
        zoomMeeting: booking.zoomMeeting,
        bookingDetails: {
          customerName: booking.customerName,
          customerEmail: booking.customerEmail,
          bookedAt: booking.bookedAt,
        },
      },
    });
  } catch (error) {
    console.error('Error creating Zoom meeting:', error);

    // Handle Zoom authorization issues specifically
    if (error.message && error.message.includes('No Zoom OAuth token found')) {
      return res.status(403).json({
        success: false,
        message: 'Zoom account not authorized. Please connect your Zoom account to create meetings.',
        requiresZoomAuth: true,
        error: error.message,
      });
    }

    if (error.message && error.message.includes('Zoom access token not available')) {
      return res.status(403).json({
        success: false,
        message: 'Zoom authorization incomplete. Please re-authorize your Zoom account.',
        requiresZoomAuth: true,
        error: error.message,
      });
    }

    // Handle other Zoom-specific errors
    if (error.response?.status === 401) {
      return res.status(403).json({
        success: false,
        message: 'Zoom account authorization expired. Please re-authorize your Zoom account.',
        requiresZoomAuth: true,
        error: 'Zoom API returned 401 Unauthorized',
      });
    }

    // Generic error
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating Zoom meeting',
      error: process.env.NODE_ENV === 'development' ? error.toString() : undefined,
    });
  }
};

/**
 * Cancel a booking (specialist only)
 * Requirements:
 * - Only the specialist who owns the booking can cancel
 * - Status must be "booked"
 * - Session must start at least 1 hour in the future
 * - Updated status to "cancelled_by_specialist"
 * - Stores: cancelledBy, cancelledAt, cancellationReason, refundStatus="pending"
 */
export const cancelBooking = async (req, res) => {
  try {
    const { slotId, bookingIndex } = req.params;
    const { cancellationReason } = req.body;
    const specialistId = req.user?.userId;

    console.log(`🚫 Cancelling booking...`);
    console.log(`   slotId: ${slotId}`);
    console.log(`   bookingIndex: ${bookingIndex}`);
    console.log(`   specialistId: ${specialistId}`);

    // Validation
    if (!specialistId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized. Please login as a specialist.',
      });
    }

    if (bookingIndex === undefined || bookingIndex === null) {
      return res.status(400).json({
        success: false,
        message: 'Booking index is required',
      });
    }

    const slot = await ConsultingSlot.findById(slotId);

    if (!slot) {
      return res.status(404).json({
        success: false,
        message: 'Slot not found',
      });
    }

    // Verify the specialist owns this slot
    const slotSpecialistId = slot.specialistId.toString();
    const requestingUserId = specialistId.toString();
    const isAuthorized = (slotSpecialistId === requestingUserId) || 
                         (slot.specialistEmail === req.user?.email);
    
    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You can only cancel bookings for your own slots.',
      });
    }

    // Validate booking index
    const bookingIdx = parseInt(bookingIndex);
    if (isNaN(bookingIdx) || bookingIdx < 0 || bookingIdx >= slot.bookings.length) {
      return res.status(400).json({
        success: false,
        message: 'Invalid booking index',
      });
    }

    const booking = slot.bookings[bookingIdx];

    // Check current booking status
    if (booking.status !== 'booked') {
      return res.status(409).json({
        success: false,
        message: `Cannot cancel booking. Current status: ${booking.status}. Only "booked" bookings can be cancelled.`,
      });
    }

    // Check if booking already cancelled or completed
    if (booking.cancellation?.cancelledAt || booking.status === 'completed') {
      return res.status(409).json({
        success: false,
        message: 'This booking has already been cancelled or completed.',
      });
    }

    // Calculate time until session start
    const sessionDateTime = new Date(slot.date);
    const [hours, minutes] = slot.startTime.split(':').map(Number);
    sessionDateTime.setHours(hours, minutes, 0);

    const now = new Date();
    const timeUntilSessionMs = sessionDateTime.getTime() - now.getTime();
    const timeUntilSessionHours = timeUntilSessionMs / (1000 * 60 * 60);

    console.log(`   Session time: ${sessionDateTime.toISOString()}`);
    console.log(`   Current time: ${now.toISOString()}`);
    console.log(`   Hours until session: ${timeUntilSessionHours.toFixed(2)}`);

    // Check if session is at least 1 hour in the future
    if (timeUntilSessionHours < 1) {
      return res.status(409).json({
        success: false,
        message: `Cannot cancel booking. Session must start at least 1 hour in the future. Current time to session: ${timeUntilSessionHours.toFixed(2)} hours.`,
      });
    }

    // Update booking with cancellation details
    booking.status = 'cancelled_by_specialist';
    booking.cancellation = {
      cancelledBy: new mongoose.Types.ObjectId(specialistId),
      cancelledAt: new Date(),
      cancellationReason: cancellationReason || 'No reason provided',
      refundStatus: 'pending',
      refundAmount: slot.bookings[bookingIdx].price || 0, // Calculate from booking if you have pricing
    };

    await slot.save();

    console.log(`✅ Booking cancelled successfully`);
    console.log(`   Booking status: ${booking.status}`);
    console.log(`   Refund status: ${booking.cancellation.refundStatus}`);

    // Send cancellation email to customer
    try {
      const appointmentDate = new Date(slot.date);
      const dateLabel = appointmentDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      // Get specialist name
      const specialist = await CreatorProfile.findById(slot.specialistId);
      const specialistName = specialist?.creatorName || 'Specialist';

      const cancellationEmailHtml = `
        <html>
          <body style="font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <h2 style="color: #1a1a1a; margin-top: 0;">❌ Session Cancelled</h2>
              
              <p style="color: #666; font-size: 14px;">Hi ${booking.customerName},</p>
              
              <p style="color: #666; font-size: 14px;">
                We regret to inform you that your consulting session with <strong>${specialistName}</strong> has been cancelled.
              </p>
              
              <div style="background-color: #fee2e2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; border-radius: 4px;">
                <h3 style="color: #991b1b; margin-top: 0;">📅 Session Details</h3>
                <p style="color: #7f1d1d; margin: 5px 0;"><strong>Date:</strong> ${dateLabel}</p>
                <p style="color: #7f1d1d; margin: 5px 0;"><strong>Time:</strong> ${slot.startTime}</p>
                <p style="color: #7f1d1d; margin: 5px 0;"><strong>Duration:</strong> ${slot.duration} minutes</p>
              </div>

              <div style="background-color: #e0e7ff; border-left: 4px solid #4f46e5; padding: 15px; margin: 20px 0; border-radius: 4px;">
                <h3 style="color: #312e81; margin-top: 0;">💰 Refund Status</h3>
                <p style="color: #3730a3; margin: 10px 0;">
                  Your refund is being processed and will be returned to your original payment method within 3-5 business days.
                </p>
              </div>

              ${booking.cancellation.cancellationReason ? `
                <div style="background-color: #f3f4f6; padding: 15px; margin: 20px 0; border-radius: 4px;">
                  <h3 style="color: #374151; margin-top: 0;">📝 Cancellation Reason</h3>
                  <p style="color: #4b5563; margin: 10px 0;">${booking.cancellation.cancellationReason}</p>
                </div>
              ` : ''}

              <p style="color: #666; font-size: 14px;">
                <strong>Need help?</strong> Contact us or reach out to ${specialistName} for more information.
              </p>
              
              <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
              <p style="color: #999; font-size: 12px;">
                This is an automated message from Specialistly. Please do not reply to this email.
              </p>
            </div>
          </body>
        </html>
      `;

      await gmailApiService.sendEmail({
        to: booking.customerEmail,
        subject: `❌ Your Session with ${specialistName} Has Been Cancelled`,
        html: cancellationEmailHtml,
      });

      console.log(`📧 Cancellation email sent to customer: ${booking.customerEmail}`);
    } catch (emailError) {
      console.error('⚠️ Failed to send cancellation email:', emailError.message);
      // Don't fail the whole operation if email fails
    }

    // Process refund asynchronously (don't block response)
    // NOTE: This requires payment_intent_id to be stored with the booking
    // In production, you would:
    // 1. Retrieve the payment_intent_id from booking.paymentIntentId
    // 2. Call Stripe API to process refund via refundService
    // 3. Update refund status in booking.cancellation.refundStatus
    
    // For now, we'll queue the refund processing asynchronously
    if (booking.paymentIntentId) {
      setImmediate(async () => {
        try {
          console.log(`💰 Processing Stripe refund asynchronously...`);
          const refundResult = await refundService.processRefund(
            booking.paymentIntentId,
            Math.round(booking.cancellation.refundAmount * 100), // Convert to cents
            'requested_by_specialist'
          );

          if (refundResult.success) {
            // Update cancellation with refund details
            booking.cancellation.refundStatus = 'processed';
            booking.cancellation.stripeRefundId = refundResult.refundId;
            await slot.save();
            console.log(`✅ Refund processed and booking updated`);
          } else {
            console.error(`❌ Refund failed: ${refundResult.error}`);
            booking.cancellation.refundStatus = 'failed';
            await slot.save();
          }
        } catch (refundError) {
          console.error(`❌ Error processing refund:`, refundError.message);
          booking.cancellation.refundStatus = 'failed';
          await slot.save();
        }
      });
    } else {
      console.warn(`⚠️  No payment intent ID found for booking. Refund cannot be processed automatically.`);
      console.log(`   Note: Implement payment_intent_id storage in booking data to enable automatic refunds`);
    }

    res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully. Customer has been notified.',
      data: {
        slotId,
        bookingIndex,
        bookingStatus: booking.status,
        cancellation: booking.cancellation,
      },
    });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error cancelling booking',
      error: process.env.NODE_ENV === 'development' ? error.toString() : undefined,
    });
  }
};
