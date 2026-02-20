import AvailabilitySchedule from '../models/AvailabilitySchedule.js';
import CreatorProfile from '../models/CreatorProfile.js';

/**
 * Get specialist's availability schedule
 */
export const getAvailabilitySchedule = async (req, res) => {
  try {
    const { specialistEmail } = req.params;

    const specialist = await CreatorProfile.findOne({ email: specialistEmail });
    if (!specialist) {
      return res.status(404).json({
        success: false,
        message: 'Specialist not found',
      });
    }

    const schedule = await AvailabilitySchedule.findOne({
      specialistId: specialist._id,
      isActive: true,
    });

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'No active availability schedule found',
      });
    }

    res.status(200).json({
      success: true,
      data: schedule,
    });
  } catch (error) {
    console.error('Error fetching availability schedule:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching availability schedule',
      error: error.message,
    });
  }
};

/**
 * Create new availability schedule
 */
export const createAvailabilitySchedule = async (req, res) => {
  try {
    const { specialistEmail, weeklyPattern, slotConfig, bookingRules, timezone } = req.body;

    if (!specialistEmail) {
      return res.status(400).json({
        success: false,
        message: 'Specialist email is required',
      });
    }

    const specialist = await CreatorProfile.findOne({ email: specialistEmail });
    if (!specialist) {
      return res.status(404).json({
        success: false,
        message: 'Specialist not found',
      });
    }

    // Deactivate previous schedule
    await AvailabilitySchedule.updateMany(
      { specialistId: specialist._id },
      { isActive: false }
    );

    // Create new schedule
    const schedule = new AvailabilitySchedule({
      specialistId: specialist._id,
      type: 'weekly',
      weeklyPattern,
      slotConfig: {
        defaultDuration: slotConfig?.defaultDuration || 60,
        availableDurations: slotConfig?.availableDurations || [30, 45, 60, 90],
        buffer: slotConfig?.buffer || 0,
      },
      bookingRules: {
        minBookingNotice: bookingRules?.minBookingNotice || 24,
        maxAdvanceBooking: bookingRules?.maxAdvanceBooking || 90,
        cancellationDeadline: bookingRules?.cancellationDeadline || 24,
      },
      timezone: timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      isActive: true,
    });

    await schedule.save();

    res.status(201).json({
      success: true,
      message: 'Availability schedule created successfully',
      data: schedule,
    });
  } catch (error) {
    console.error('Error creating availability schedule:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating availability schedule',
      error: error.message,
    });
  }
};

/**
 * Update availability schedule
 */
export const updateAvailabilitySchedule = async (req, res) => {
  try {
    const { scheduleId } = req.params;
    const { weeklyPattern, slotConfig, bookingRules, timezone } = req.body;

    const schedule = await AvailabilitySchedule.findByIdAndUpdate(
      scheduleId,
      {
        weeklyPattern,
        slotConfig: {
          defaultDuration: slotConfig?.defaultDuration || 60,
          availableDurations: slotConfig?.availableDurations || [30, 45, 60, 90],
          buffer: slotConfig?.buffer || 0,
        },
        bookingRules: {
          minBookingNotice: bookingRules?.minBookingNotice || 24,
          maxAdvanceBooking: bookingRules?.maxAdvanceBooking || 90,
          cancellationDeadline: bookingRules?.cancellationDeadline || 24,
        },
        timezone: timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
        updatedAt: new Date(),
      },
      { new: true }
    );

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Schedule not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Availability schedule updated successfully',
      data: schedule,
    });
  } catch (error) {
    console.error('Error updating availability schedule:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating availability schedule',
      error: error.message,
    });
  }
};

/**
 * Delete availability schedule
 */
export const deleteAvailabilitySchedule = async (req, res) => {
  try {
    const { scheduleId } = req.params;

    const schedule = await AvailabilitySchedule.findByIdAndUpdate(
      scheduleId,
      { isActive: false },
      { new: true }
    );

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Schedule not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Availability schedule deactivated successfully',
      data: schedule,
    });
  } catch (error) {
    console.error('Error deleting availability schedule:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting availability schedule',
      error: error.message,
    });
  }
};

/**
 * Get available time slots for a specific date
 * This returns the available TIME RANGES based on availability schedule
 * (not the actual ConsultingSlot records)
 */
export const getAvailableTimeSlotsForDate = async (req, res) => {
  try {
    const { specialistEmail, date } = req.params;

    const specialist = await CreatorProfile.findOne({ email: specialistEmail });
    if (!specialist) {
      return res.status(404).json({
        success: false,
        message: 'Specialist not found',
      });
    }

    const schedule = await AvailabilitySchedule.findOne({
      specialistId: specialist._id,
      isActive: true,
    });

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'No active availability schedule found',
      });
    }

    // Parse the date
    const targetDate = new Date(date);
    const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][
      targetDate.getDay()
    ];

    // Check for date exceptions first
    const exception = schedule.dateExceptions.find(
      (exc) => new Date(exc.date).toDateString() === targetDate.toDateString()
    );

    let availableSlots = [];

    if (exception && !exception.isAvailable) {
      // Date is blocked
      availableSlots = [];
    } else if (exception && exception.isAvailable && exception.slots.length > 0) {
      // Use exception slots
      availableSlots = exception.slots;
    } else {
      // Use weekly pattern
      const daySchedule = schedule.weeklyPattern[dayOfWeek];
      if (daySchedule && daySchedule.enabled) {
        availableSlots = daySchedule.slots;
      }
    }

    // Filter available slots
    const filteredSlots = availableSlots.filter((slot) => slot.isAvailable);

    // Apply break times
    const breakTimesForDay = schedule.breakTimes.filter(
      (breakTime) =>
        breakTime.day === dayOfWeek && (!breakTime.recurring || breakTime.recurring === true)
    );

    // Remove break time periods from available slots
    let slotsAfterBreaks = filteredSlots;
    if (breakTimesForDay.length > 0) {
      slotsAfterBreaks = filteredSlots
        .map((slot) => {
          let slots = [slot];
          for (const breakTime of breakTimesForDay) {
            slots = slots.flatMap((s) => excludeTimeRange(s, breakTime.startTime, breakTime.endTime));
          }
          return slots;
        })
        .flat();
    }

    res.status(200).json({
      success: true,
      date: targetDate.toISOString().split('T')[0],
      dayOfWeek,
      availableSlots: slotsAfterBreaks,
      slotConfig: schedule.slotConfig,
    });
  } catch (error) {
    console.error('Error getting available time slots:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting available time slots',
      error: error.message,
    });
  }
};

/**
 * Helper function to exclude a time range from a slot
 */
function excludeTimeRange(slot, breakStart, breakEnd) {
  const slotStart = timeToMinutes(slot.startTime);
  const slotEnd = timeToMinutes(slot.endTime);
  const breakStartMin = timeToMinutes(breakStart);
  const breakEndMin = timeToMinutes(breakEnd);

  // No overlap
  if (breakEndMin <= slotStart || breakStartMin >= slotEnd) {
    return [slot];
  }

  const result = [];

  // Before break
  if (slotStart < breakStartMin) {
    result.push({
      ...slot,
      endTime: minutesToTime(breakStartMin),
    });
  }

  // After break
  if (breakEndMin < slotEnd) {
    result.push({
      ...slot,
      startTime: minutesToTime(breakEndMin),
    });
  }

  return result;
}

/**
 * Helper: Convert time string "HH:mm" to minutes
 */
function timeToMinutes(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Helper: Convert minutes to time string "HH:mm"
 */
function minutesToTime(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}
