import Service from '../models/Service.js';
import AppointmentSlot from '../models/AppointmentSlot.js';

// Helper: Generate appointment slots from webinar configuration
const generateWebinarSlots = async (service, specialistId, specialistEmail, specialistName) => {
  try {
    const slots = [];

    // Single day event - create slots for the specified date/time
    if (service.eventType === 'single' && service.webinarDates && service.webinarDates.length > 0) {
      for (const date of service.webinarDates) {
        const dateObj = new Date(date.date);
        
        const slot = new AppointmentSlot({
          date: dateObj,
          startTime: date.time,
          endTime: calculateEndTime(date.time, parseInt(date.duration)),
          status: 'available',
          serviceTitle: service.title,
          specialistName,
          specialistId,
          specialistEmail,
          capacity: date.capacity,
        });
        
        slots.push(slot);
      }
    }

    // Multiple days - selected dates
    if (service.eventType === 'multiple' && service.sessionFrequency === 'selected' && service.webinarDates) {
      for (const date of service.webinarDates) {
        const dateObj = new Date(date.date);
        
        const slot = new AppointmentSlot({
          date: dateObj,
          startTime: date.time,
          endTime: calculateEndTime(date.time, parseInt(date.duration)),
          status: 'available',
          serviceTitle: service.title,
          specialistName,
          specialistId,
          specialistEmail,
          capacity: date.capacity,
        });
        
        slots.push(slot);
      }
    }

    // Multiple days - recurring weekly schedule
    if (service.eventType === 'multiple' && service.sessionFrequency === 'repeat' && service.weeklySchedule) {
      const today = new Date();
      // Generate slots for next 12 weeks
      const endDate = new Date(today.getTime() + 12 * 7 * 24 * 60 * 60 * 1000);
      
      for (const schedule of service.weeklySchedule) {
        if (!schedule.enabled) continue;
        
        // Find all occurrences of this day within the date range
        const dayIndex = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].indexOf(schedule.day);
        
        const current = new Date(today);
        // Move to the next occurrence of the desired day
        const startDayOffset = (dayIndex - current.getDay() + 7) % 7;
        if (startDayOffset > 0) {
          current.setDate(current.getDate() + startDayOffset);
        }
        
        // Generate slots for each week
        while (current < endDate) {
          const slot = new AppointmentSlot({
            date: new Date(current),
            startTime: schedule.time,
            endTime: calculateEndTime(schedule.time, parseInt(schedule.duration)),
            status: 'available',
            serviceTitle: service.title,
            specialistName,
            specialistId,
            specialistEmail,
            capacity: schedule.capacity,
          });
          
          slots.push(slot);
          current.setDate(current.getDate() + 7); // Next week
        }
      }
    }

    return slots;
  } catch (error) {
    console.error('Error generating webinar slots:', error);
    throw error;
  }
};

// Helper: Calculate end time based on duration
const calculateEndTime = (startTime, durationMinutes) => {
  const [hours, minutes] = startTime.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes + durationMinutes;
  const endHours = Math.floor(totalMinutes / 60) % 24;
  const endMinutes = totalMinutes % 60;
  return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
};

// Create webinar and generate slots
export const createWebinarWithSlots = async (req, res) => {
  try {
    const { specialistId, specialistEmail, specialistName, ...serviceData } = req.body;

    // Create service/webinar
    const service = new Service({
      ...serviceData,
      creator: specialistEmail,
    });

    await service.save();

    // Generate appointment slots if status is active
    if (service.status === 'active') {
      const slots = await generateWebinarSlots(service, specialistId, specialistEmail, specialistName);
      
      if (slots.length > 0) {
        await AppointmentSlot.insertMany(slots);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Webinar created successfully with available booking slots',
      data: service,
      slots: slots?.length || 0,
    });
  } catch (error) {
    console.error('Webinar creation error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to create webinar',
      error: error.errors || error.message,
    });
  }
};

// Create a new service
export const createService = async (req, res) => {
  try {
    const service = new Service(req.body);
    await service.save();
    res.status(201).json({
      success: true,
      message: 'Service created successfully',
      data: service,
    });
  } catch (error) {
    console.error('Service creation error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to create service',
      error: error.errors || error.message,
    });
  }
};

// Get all services
export const getAllServices = async (req, res) => {
  try {
    // Get optional creator filter from query
    const { creator, status } = req.query;
    const filter = {};
    
    // Apply creator filter if provided
    if (creator) {
      filter.creator = creator;
    }
    
    // If status is explicitly requested, use that filter
    if (status) {
      filter.status = status;
    } else if (!creator) {
      // If no creator and no status specified (public browsing), only return active services
      filter.status = 'active';
    }
    // If creator is specified without status, return ALL their services (both active and draft)
    
    console.log('📋 Fetching services with filter:', JSON.stringify(filter));
    const services = await Service.find(filter);
    console.log(`✅ Found ${services.length} services for creator: ${creator}`);
    if (services.length > 0) {
      console.log('📝 Sample service:', JSON.stringify(services[0], null, 2));
    }
    res.status(200).json({
      success: true,
      data: services,
    });
  } catch (error) {
    console.error('❌ Error fetching services:', error.message);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get a single service by ID
export const getServiceById = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found',
      });
    }
    res.status(200).json({
      success: true,
      data: service,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update a service/webinar and regenerate slots if needed
export const updateService = async (req, res) => {
  try {
    const service = await Service.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true }
    );
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found',
      });
    }

    // If webinar configuration changed and it's active, regenerate slots
    if (service.eventType && service.status === 'active') {
      try {
        // Delete old slots for this service
        await AppointmentSlot.deleteMany({ serviceTitle: service.title });

        // Generate new slots
        const slots = await generateWebinarSlots(
          service,
          req.body.specialistId || service.creator,
          req.body.specialistEmail || service.creator,
          req.body.specialistName || 'Specialist'
        );

        if (slots.length > 0) {
          await AppointmentSlot.insertMany(slots);
        }

        res.status(200).json({
          success: true,
          message: 'Service updated and booking slots regenerated',
          data: service,
          slotsRegeneratedCount: slots.length,
        });
      } catch (slotError) {
        console.error('Slot regeneration error:', slotError);
        // Still return success for service update, but note the slots issue
        res.status(200).json({
          success: true,
          message: 'Service updated but slot regeneration failed',
          data: service,
          slotError: slotError.message,
        });
      }
    } else {
      res.status(200).json({
        success: true,
        message: 'Service updated successfully',
        data: service,
      });
    }
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete a service
export const deleteService = async (req, res) => {
  try {
    const service = await Service.findByIdAndDelete(req.params.id);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found',
      });
    }
    res.status(200).json({
      success: true,
      message: 'Service deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
