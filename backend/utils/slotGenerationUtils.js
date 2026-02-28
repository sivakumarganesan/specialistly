/**
 * Utility functions for generating consulting slots from availability schedule
 */

/**
 * Generate consulting slots for a entire week based on availability schedule
 * @param {Object} availabilitySchedule - The AvailabilitySchedule document
 * @param {Date} startDate - The start date for generating slots
 * @param {Object} serviceConfig - Service configuration with duration
 * @returns {Array} Array of slot objects ready to be saved
 */
export function generateSlotsForWeek(availabilitySchedule, startDate, serviceConfig = {}) {
  const slots = [];
  const durationMinutes = serviceConfig.duration || availabilitySchedule.slotConfig.defaultDuration || 60;
  const bufferMinutes = availabilitySchedule.slotConfig.buffer || 0;

  // Generate slots for 7 days starting from startDate
  for (let i = 0; i < 7; i++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(currentDate.getDate() + i);

    const daySlots = generateSlotsForDate(
      availabilitySchedule,
      currentDate,
      durationMinutes,
      bufferMinutes
    );

    slots.push(...daySlots);
  }

  return slots;
}

/**
 * Generate consulting slots for a specific date
 * @param {Object} availabilitySchedule - The AvailabilitySchedule document
 * @param {Date} date - The date to generate slots for
 * @param {Number} durationMinutes - Duration of each slot in minutes
 * @param {Number} bufferMinutes - Buffer time between slots in minutes
 * @returns {Array} Array of slot objects
 */
export function generateSlotsForDate(availabilitySchedule, date, durationMinutes = 60, bufferMinutes = 0) {
  const slots = [];
  const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][
    date.getDay()
  ];

  // Check for date exceptions
  const exception = availabilitySchedule.dateExceptions?.find(
    (exc) => new Date(exc.date).toDateString() === date.toDateString()
  );

  // If date is blocked, return empty array
  if (exception && !exception.isAvailable) {
    return [];
  }

  // Get available time slots
  let availableSlots = [];
  
  if (exception && exception.isAvailable && exception.slots?.length > 0) {
    // Use exception slots
    availableSlots = exception.slots;
  } else {
    // Use weekly pattern
    const daySchedule = availabilitySchedule.weeklyPattern?.[dayOfWeek];
    if (!daySchedule || !daySchedule.enabled) {
      return [];
    }
    availableSlots = daySchedule.slots || [];
  }

  // Filter available slots
  availableSlots = availableSlots.filter((slot) => slot.isAvailable !== false);

  // Apply break times
  const breakTimesForDay = availabilitySchedule.breakTimes?.filter(
    (breakTime) => breakTime.day === dayOfWeek
  ) || [];

  // Remove break time periods from available slots
  let slotsAfterBreaks = availableSlots;
  if (breakTimesForDay.length > 0) {
    slotsAfterBreaks = availableSlots
      .map((slot) => {
        let processedSlots = [slot];
        for (const breakTime of breakTimesForDay) {
          processedSlots = processedSlots.flatMap((s) =>
            excludeTimeRange(s, breakTime.startTime, breakTime.endTime)
          );
        }
        return processedSlots;
      })
      .flat();
  }

  // Generate individual slots within each available time range
  for (const timeRange of slotsAfterBreaks) {
    const rangeSlots = generateSlotsInRange(
      date,
      timeRange.startTime,
      timeRange.endTime,
      durationMinutes,
      bufferMinutes
    );
    slots.push(...rangeSlots);
  }

  return slots;
}

/**
 * Generate individual slots within a time range
 * @param {Date} date - The date
 * @param {String} startTime - Start time in "HH:mm" format
 * @param {String} endTime - End time in "HH:mm" format
 * @param {Number} durationMinutes - Duration of each slot
 * @param {Number} bufferMinutes - Buffer time between slots
 * @returns {Array} Array of slot objects
 */
function generateSlotsInRange(date, startTime, endTime, durationMinutes, bufferMinutes) {
  const slots = [];
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);
  const totalSlotMinutes = durationMinutes + bufferMinutes;

  let currentMinutes = startMinutes;

  while (currentMinutes + durationMinutes <= endMinutes) {
    const slotStartTime = minutesToTime(currentMinutes);
    const slotEndTime = minutesToTime(currentMinutes + durationMinutes);

    slots.push({
      date,
      startTime: slotStartTime,
      endTime: slotEndTime,
      duration: durationMinutes,
      status: 'active',
      totalCapacity: 1,
      bookedCount: 0,
      isFullyBooked: false,
    });

    currentMinutes += totalSlotMinutes;
  }

  return slots;
}

/**
 * Helper: Exclude a time range from a slot
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
 * Helper: Convert time string "HH:mm" to minutes since midnight
 */
function timeToMinutes(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Helper: Convert minutes since midnight to "HH:mm" format
 */
function minutesToTime(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

/**
 * Batch generate slots for multiple dates
 * @param {Object} availabilitySchedule - The AvailabilitySchedule document
 * @param {Date} startDate - The start date
 * @param {Number} numDays - Number of days to generate slots for
 * @param {Object} serviceConfig - Service configuration
 * @returns {Array} Array of slot objects
 */
export function generateSlotsForDateRange(
  availabilitySchedule,
  startDate,
  numDays = 90,
  serviceConfig = {}
) {
  const slots = [];

  for (let i = 0; i < numDays; i++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(currentDate.getDate() + i);

    // Only generate for future dates
    if (currentDate < new Date()) {
      continue;
    }

    const durationMinutes = serviceConfig.duration || availabilitySchedule.slotConfig.defaultDuration || 60;
    const bufferMinutes = availabilitySchedule.slotConfig.buffer || 0;

    const daySlots = generateSlotsForDate(
      availabilitySchedule,
      currentDate,
      durationMinutes,
      bufferMinutes
    );

    slots.push(...daySlots);
  }

  return slots;
}
