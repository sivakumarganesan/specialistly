import Service from '../models/Service.js';
import AppointmentSlot from '../models/AppointmentSlot.js';

// Helper: Generate appointment slots from webinar configuration
const generateWebinarSlots = async (service, specialistId, specialistEmail, specialistName) => {
  try {
    const slots = [];
    
    console.log(`\n📝 Generating slots for webinar: "${service.title}"`);
    console.log(`   Event Type: ${service.eventType}`);
    console.log(`   Session Frequency: ${service.sessionFrequency}`);
    console.log(`   WebinarDates count: ${service.webinarDates?.length || 0}`);
    console.log(`   WeeklySchedule count: ${service.weeklySchedule?.length || 0}`);

    // CASE 1: Single day event - one date, possibly multiple if added by user
    if (service.eventType === 'single') {
      if (service.webinarDates && service.webinarDates.length > 0) {
        console.log(`   ✓ Processing ${service.webinarDates.length} date(s) for single day event`);
        
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
          console.log(`     → Slot: ${date.date} @ ${date.time} (${date.duration}min, capacity: ${date.capacity})`);
        }
      } else {
        console.warn(`   ⚠️  Single day event but no webinarDates provided`);
      }
    }

    // CASE 2: Multiple days with selected/specific dates
    else if (service.eventType === 'multiple' && service.sessionFrequency === 'selected') {
      if (service.webinarDates && service.webinarDates.length > 0) {
        console.log(`   ✓ Processing ${service.webinarDates.length} selected date(s)`);
        
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
          console.log(`     → Slot: ${date.date} @ ${date.time} (${date.duration}min, capacity: ${date.capacity})`);
        }
      } else {
        console.warn(`   ⚠️  Multiple day (selected) but no webinarDates provided`);
      }
    }

    // CASE 3: Multiple days with recurring/repeat schedule
    else if (service.eventType === 'multiple' && service.sessionFrequency === 'repeat') {
      if (service.weeklySchedule && service.weeklySchedule.length > 0) {
        const enabledDays = service.weeklySchedule.filter(s => s.enabled);
        console.log(`   ✓ Processing ${enabledDays.length} recurring day(s) for 12 weeks`);
        
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Start from beginning of today
        const endDate = new Date(today.getTime() + 12 * 7 * 24 * 60 * 60 * 1000);
        
        for (const schedule of service.weeklySchedule) {
          if (!schedule.enabled) {
            console.log(`     → ${schedule.day} @ ${schedule.time}: disabled (skipped)`);
            continue;
          }
          
          const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
          const dayIndex = DAYS_OF_WEEK.indexOf(schedule.day);
          
          if (dayIndex === -1) {
            console.warn(`     ⚠️  Invalid day: ${schedule.day}`);
            continue;
          }
          
          const current = new Date(today);
          const currentDayOfWeek = current.getDay();
          
          // Calculate offset to next occurrence of target day
          let daysUntilTarget = (dayIndex - currentDayOfWeek + 7) % 7;
          // If it's 0 and we're checking now, we want next week's occurrence
          if (daysUntilTarget === 0 && current.getHours() > 0) {
            daysUntilTarget = 0; // Start from today if before the target time
          } else if (daysUntilTarget === 0) {
            daysUntilTarget = 7; // Start from next week if we've already passed today
          }
          
          current.setDate(current.getDate() + daysUntilTarget);
          
          let slotsCreatedForDay = 0;
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
            slotsCreatedForDay++;
            current.setDate(current.getDate() + 7); // Next week
          }
          
          console.log(`     → ${schedule.day} @ ${schedule.time}: ${slotsCreatedForDay} slots created`);
        }
      } else {
        console.warn(`   ⚠️  Multiple day (repeat) but no weeklySchedule provided`);
      }
    }

    // CATCH: No matching case
    else if (service.eventType) {
      console.warn(`   ⚠️  Unknown event type combination: ${service.eventType} + ${service.sessionFrequency}`);
    }

    console.log(`   ✅ Total slots generated: ${slots.length}\n`);
    return slots;
  } catch (error) {
    console.error('❌ Error generating webinar slots:', error);
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

    console.log(`\n🎬 Creating webinar: "${serviceData.title}"`);
    console.log(`   Specialist: ${specialistEmail}`);
    console.log(`   Status: ${serviceData.status}`);

    // Create service/webinar
    const service = new Service({
      ...serviceData,
      creator: specialistEmail,
    });

    await service.save();
    console.log(`   ✓ Webinar saved to database`);

    // Generate appointment slots if status is active
    if (service.status === 'active') {
      console.log(`   ✓ Status is 'active' - generating slots...`);
      const slots = await generateWebinarSlots(service, specialistId, specialistEmail, specialistName);
      
      if (slots.length > 0) {
        await AppointmentSlot.insertMany(slots);
        console.log(`   ✓ ${slots.length} slots inserted into database\n`);
      } else {
        console.warn(`   ⚠️  No slots were generated\n`);
      }
    } else {
      console.log(`   ℹ️  Status is '${service.status}' - slots will be generated when published\n`);
    }

    res.status(201).json({
      success: true,
      message: 'Webinar created successfully with available booking slots',
      data: service,
      slots: slots?.length || 0,
    });
  } catch (error) {
    console.error('❌ Webinar creation error:', error);
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
    // Validate required fields based on service type
    const { type, duration, capacity } = req.body;
    
    if (type === 'webinar') {
      if (!duration) {
        return res.status(400).json({
          success: false,
          message: 'Duration is required for webinar services',
          error: 'Duration field is mandatory for webinars'
        });
      }
      if (!capacity) {
        return res.status(400).json({
          success: false,
          message: 'Capacity is required for webinar services',
          error: 'Capacity field is mandatory for webinars'
        });
      }
    }
    // For consulting services, duration and capacity are optional
    
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
    const { specialistId, specialistEmail, specialistName, ...updateData } = req.body;
    
    // Get the service first to check its type
    const existingService = await Service.findById(req.params.id);
    if (!existingService) {
      return res.status(404).json({
        success: false,
        message: 'Service not found',
      });
    }
    
    // Determine which type to use: updated type or existing type
    const serviceType = updateData.type || existingService.type;
    
    // Validate required fields based on service type
    if (serviceType === 'webinar') {
      if (updateData.duration !== undefined && !updateData.duration) {
        return res.status(400).json({
          success: false,
          message: 'Duration is required for webinar services',
          error: 'Duration field cannot be empty for webinars'
        });
      }
      if (updateData.capacity !== undefined && !updateData.capacity) {
        return res.status(400).json({
          success: false,
          message: 'Capacity is required for webinar services',
          error: 'Capacity field cannot be empty for webinars'
        });
      }
    }
    
    const service = await Service.findByIdAndUpdate(
      req.params.id,
      { ...updateData, updatedAt: Date.now() },
      { new: true }
    );
    
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found',
      });
    }

    console.log(`\n📝 Updating webinar: "${service.title}"`);
    console.log(`   Event Type: ${service.eventType}`);
    console.log(`   Status: ${service.status}`);

    // If it's a webinar (has eventType) and is active, regenerate slots
    if (service.eventType && service.status === 'active') {
      try {
        console.log(`   ✓ Webinar is active - regenerating slots...`);
        
        // Delete old slots for this service
        const deletedCount = await AppointmentSlot.deleteMany({ serviceTitle: service.title });
        console.log(`   ✓ Deleted ${deletedCount.deletedCount} old slots`);

        // Generate new slots
        const slots = await generateWebinarSlots(
          service,
          specialistId || service.creator,
          specialistEmail || service.creator,
          specialistName || 'Specialist'
        );

        if (slots.length > 0) {
          await AppointmentSlot.insertMany(slots);
        }

        console.log(`   ✓ Created ${slots.length} new slots\n`);

        res.status(200).json({
          success: true,
          message: 'Service updated and booking slots regenerated',
          data: service,
          slotsRegeneratedCount: slots.length,
        });
      } catch (slotError) {
        console.error('❌ Slot regeneration error:', slotError);
        // Still return success for service update, but note the slots issue
        res.status(200).json({
          success: true,
          message: 'Service updated but slot regeneration failed',
          data: service,
          slotError: slotError.message,
        });
      }
    } else if (service.eventType && service.status === 'draft') {
      // Draft status - just delete old slots (user hasn't published yet)
      console.log(`   ℹ️  Webinar is in draft - updating without publishing slots\n`);
      await AppointmentSlot.deleteMany({ serviceTitle: service.title });
      
      res.status(200).json({
        success: true,
        message: 'Service updated successfully (not published yet)',
        data: service,
      });
    } else {
      console.log(`   ℹ️  Not a webinar or no eventType - standard service update\n`);
      res.status(200).json({
        success: true,
        message: 'Service updated successfully',
        data: service,
      });
    }
  } catch (error) {
    console.error('❌ Update error:', error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Publish a webinar (change from draft to active and generate slots)
export const publishWebinar = async (req, res) => {
  try {
    const { specialistId, specialistEmail, specialistName } = req.body;
    
    const service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found',
      });
    }

    if (!service.eventType) {
      return res.status(400).json({
        success: false,
        message: 'This is not a webinar',
      });
    }

    if (service.status === 'active') {
      return res.status(400).json({
        success: false,
        message: 'Webinar is already published',
      });
    }

    console.log(`\n🚀 Publishing webinar: "${service.title}"`);
    console.log(`   Event Type: ${service.eventType}`);
    console.log(`   Session Frequency: ${service.sessionFrequency}`);

    // Change status to active
    service.status = 'active';
    await service.save();

    console.log(`   ✓ Status changed to: active`);

    // Generate slots
    try {
      const slots = await generateWebinarSlots(
        service,
        specialistId || service.creator,
        specialistEmail || service.creator,
        specialistName || 'Specialist'
      );

      if (slots.length > 0) {
        await AppointmentSlot.insertMany(slots);
        console.log(`   ✓ Generated and saved ${slots.length} booking slots\n`);
      }

      res.status(200).json({
        success: true,
        message: 'Webinar published successfully with booking slots',
        data: service,
        slotsGenerated: slots.length,
      });
    } catch (slotError) {
      console.error('❌ Slot generation error:', slotError);
      res.status(500).json({
        success: false,
        message: 'Webinar published but slot generation failed',
        serviceData: service,
        error: slotError.message,
      });
    }
  } catch (error) {
    console.error('❌ Publish error:', error);
    res.status(500).json({
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
