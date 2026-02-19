import ConsultingSlot from '../models/ConsultingSlot.js';
import User from '../models/User.js';

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
    const { specialistEmail, status } = req.query;

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
      totalBookings: await ConsultingSlot.aggregate([
        { $match: { specialistEmail } },
        { $group: { _id: null, totalBookings: { $sum: '$bookedCount' } } },
      ]),
    };

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
