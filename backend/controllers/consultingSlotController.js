import ConsultingSlot from '../models/ConsultingSlot.js';
import User from '../models/User.js';
import AvailabilitySchedule from '../models/AvailabilitySchedule.js';
import CreatorProfile from '../models/CreatorProfile.js';
import { generateSlotsForDateRange } from '../utils/slotGenerationUtils.js';

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
    const {
      specialistEmail,
      specialistId,
      serviceId,
      date,
      startTime,
      endTime,
      totalCapacity,
      timezone,
      notes,
    } = req.body;

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
    const newSlot = new ConsultingSlot({
      specialistId: specialistId || specialist._id,
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

    // Add booking
    slot.addBooking(customerId, customerEmail, customerName);
    await slot.save();

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

// Cancel a booking
export const cancelBooking = async (req, res) => {
  try {
    const { slotId, customerId } = req.params;

    const slot = await ConsultingSlot.findById(slotId);

    if (!slot) {
      return res.status(404).json({
        success: false,
        message: 'Slot not found',
      });
    }

    // Remove booking
    slot.removeBooking(customerId);
    await slot.save();

    res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully',
      data: slot,
    });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error cancelling booking',
    });
  }
};

// ===== UTILITY ROUTES =====

// Bulk create slots (for specialist to create multiple slots at once)
export const bulkCreateSlots = async (req, res) => {
  try {
    const { specialistEmail, specialistId, slots } = req.body;

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
    const { specialistEmail, specialistId, startDate, numDays = 90, serviceId } = req.body;

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
      specialistEmail,
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
