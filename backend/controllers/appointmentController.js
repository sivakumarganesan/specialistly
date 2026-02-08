import mongoose from 'mongoose';
import AppointmentSlot from '../models/AppointmentSlot.js';
import Customer from '../models/Customer.js';
import zoomService from '../services/zoomService.js';

// Helper function to calculate end time (add 1 hour to start time)
const getEndTime = (startTime) => {
  const [hours, minutes] = startTime.split(':').map(Number);
  const endHours = (hours + 1) % 24;
  return `${String(endHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

// Create appointment slot
export const createAppointmentSlot = async (req, res) => {
  try {
    // Auto-calculate endTime if not provided (1 hour after start time)
    if (!req.body.endTime && req.body.startTime) {
      req.body.endTime = getEndTime(req.body.startTime);
    }
    
    const slot = new AppointmentSlot(req.body);
    await slot.save();
    res.status(201).json({
      success: true,
      message: 'Appointment slot created successfully',
      data: slot,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Get all appointment slots
export const getAllAppointmentSlots = async (req, res) => {
  try {
    const slots = await AppointmentSlot.find();
    res.status(200).json({
      success: true,
      data: slots,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get available slots
export const getAvailableSlots = async (req, res) => {
  try {
    const { specialistEmail, specialistId } = req.query;
    
    // Build filter
    const filter = { status: 'available' };
    if (specialistEmail) {
      filter.specialistEmail = specialistEmail;
    } else if (specialistId) {
      filter.specialistId = specialistId;
    }
    
    const slots = await AppointmentSlot.find(filter).sort({ date: 1 });
    res.status(200).json({
      success: true,
      data: slots,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get scheduled webinars with Zoom details for specialist to start meetings
export const getScheduledWebinars = async (req, res) => {
  try {
    const { specialistEmail } = req.query;
    
    if (!specialistEmail) {
      return res.status(400).json({
        success: false,
        message: 'specialistEmail is required',
      });
    }
    
    // Get booked webinar appointments with Zoom data
    const webinars = await AppointmentSlot.find({
      specialistEmail,
      status: { $in: ['booked', 'in-progress', 'completed'] },
      zoomMeetingId: { $exists: true, $ne: null },
      zoomStartUrl: { $exists: true, $ne: null },
    }).sort({ date: 1 });
    
    res.status(200).json({
      success: true,
      data: webinars,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Book a slot
export const bookSlot = async (req, res) => {
  try {
    const { slotId } = req.params;
    const { 
      bookedBy, 
      serviceTitle, 
      customerEmail, 
      customerName, 
      specialistEmail, 
      specialistName,
      specialistId,
    } = req.body;

    const slot = await AppointmentSlot.findById(slotId);
    if (!slot) {
      return res.status(404).json({
        success: false,
        message: 'Slot not found',
      });
    }

    if (slot.status !== 'available') {
      return res.status(400).json({
        success: false,
        message: 'Slot is not available',
      });
    }

    try {
      // Calculate meeting times
      const startDateTime = new Date(slot.date);
      const [startHour, startMin] = slot.startTime.split(':');
      startDateTime.setHours(parseInt(startHour), parseInt(startMin));

      // Ensure endTime exists; if not, calculate it (1 hour after start)
      const endTime = slot.endTime || getEndTime(slot.startTime);
      const endDateTime = new Date(slot.date);
      const [endHour, endMin] = endTime.split(':');
      endDateTime.setHours(parseInt(endHour), parseInt(endMin));
      
      // If end time is earlier than start time (wrapped around midnight), add 1 day
      if (endDateTime <= startDateTime) {
        endDateTime.setDate(endDateTime.getDate() + 1);
      }
      
      // Validate that times are different
      if (startDateTime.getTime() === endDateTime.getTime()) {
        return res.status(400).json({
          success: false,
          message: 'Invalid meeting duration: start and end times must be different',
        });
      }

      // Create Zoom meeting using specialist's OAuth token
      if (!specialistId) {
        return res.status(400).json({
          success: false,
          message: 'Specialist ID is required to create Zoom meeting',
        });
      }

      // Validate Zoom authorization first
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
          message: `❌ The specialist hasn't connected their Zoom account yet. A notification has been sent to the specialist to authorize Zoom.`,
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

      console.log('🎥 Attempting to create Zoom meeting for specialist:', specialistId);
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
        console.log(`✅ Zoom meeting created successfully: ${meetData.zoomMeetingId}`);
      } catch (zoomError) {
        console.error('❌ Zoom meeting creation error:', zoomError.message);
        
        // Send re-authorization notification email to specialist
        try {
          await zoomService.sendZoomReAuthNotification(
            specialistEmail,
            specialistName,
            customerName,
            serviceTitle
          );
          console.log(`✓ Zoom re-auth notification sent to specialist`);
        } catch (emailError) {
          console.error('❌ Failed to send re-auth notification:', emailError.message);
        }
        
        return res.status(400).json({
          success: false,
          message: `❌ Failed to create Zoom meeting: ${zoomError.message}. A notification has been sent to the specialist to re-authorize their Zoom account.`,
          requiresReAuth: true,
        });
      }

      // Update slot with booking and meeting details
      slot.status = 'booked';
      slot.bookedBy = bookedBy;
      slot.serviceTitle = serviceTitle;
      slot.customerEmail = customerEmail;
      slot.customerName = customerName;
      slot.specialistEmail = specialistEmail;
      slot.specialistName = specialistName;
      slot.specialistId = specialistId;
      slot.endTime = endTime; // Ensure endTime is saved (in case it was calculated)
      slot.zoomMeetingId = meetData.zoomMeetingId;
      slot.zoomJoinUrl = meetData.joinUrl;
      slot.zoomStartUrl = meetData.startUrl;
      slot.zoomHostId = meetData.hostId;
      
      await slot.save();

      // Add booking record to customer
      try {
        const customer = await Customer.findOne({ email: customerEmail });
        if (customer) {
          if (!customer.bookings) {
            customer.bookings = [];
          }
          customer.bookings.push({
            serviceId: slot._id,
            serviceName: serviceTitle,
            bookedAt: new Date(),
            status: 'confirmed',
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
        }
      } catch (customerError) {
        console.warn('⚠️  Failed to add booking to customer record:', customerError.message);
      }
      try {
        console.log('📧 Sending Zoom meeting invitations...');
        await zoomService.sendMeetingInvitation({
          specialistEmail,
          specialistName,
          customerEmail,
          customerName,
          serviceTitle,
          date: slot.date,
          startTime: slot.startTime,
          joinUrl: meetData.joinUrl,
          zoomMeetingId: meetData.zoomMeetingId,
        });
      } catch (emailError) {
        console.error('⚠️  Email sending error (non-critical):', emailError);
        // Don't fail the booking if email fails
      }

      res.status(200).json({
        success: true,
        message: 'Slot booked successfully with Zoom meeting created and invitation sent',
        data: slot,
      });
    } catch (meetingError) {
      console.error('❌ Meeting creation failed:', meetingError.message);
      // Still save the booking even if meeting creation fails
      slot.status = 'booked';
      slot.bookedBy = bookedBy;
      slot.serviceTitle = serviceTitle;
      slot.customerEmail = customerEmail;
      slot.customerName = customerName;
      slot.specialistEmail = specialistEmail;
      slot.specialistName = specialistName;
      slot.specialistId = specialistId;
      
      await slot.save();

      // Add booking record to customer
      try {
        const customer = await Customer.findOne({ email: customerEmail });
        if (customer) {
          if (!customer.bookings) {
            customer.bookings = [];
          }
          customer.bookings.push({
            serviceId: slot._id,
            serviceName: serviceTitle,
            bookedAt: new Date(),
            status: 'confirmed',
          });
          await customer.save();
        }
      } catch (customerError) {
        console.warn('⚠️  Failed to add booking to customer record:', customerError.message);
      }

      res.status(200).json({
        success: true,
        message: 'Slot booked but meeting platform creation failed. Backup arrangements may be needed.',
        data: slot,
        warning: meetingError.message,
      });
    }
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete appointment slot
export const deleteAppointmentSlot = async (req, res) => {
  try {
    const slot = await AppointmentSlot.findByIdAndDelete(req.params.id);
    if (!slot) {
      return res.status(404).json({
        success: false,
        message: 'Slot not found',
      });
    }
    res.status(200).json({
      success: true,
      message: 'Appointment slot deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Send reminder email
export const sendReminder = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    
    const appointment = await AppointmentSlot.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found',
      });
    }

    if (!appointment.zoomJoinUrl || !appointment.customerEmail) {
      return res.status(400).json({
        success: false,
        message: 'Appointment does not have meeting link or customer email',
      });
    }

    // Send reminder emails
    // Reminder email sending removed - use Zoom reminder instead

    appointment.reminderSent = true;
    appointment.reminderSentAt = new Date();
    await appointment.save();

    res.status(200).json({
      success: true,
      message: 'Reminder emails sent successfully',
      data: appointment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Share recording with participants
export const shareRecording = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { recordingLink, expiryDays = 7 } = req.body;

    if (!recordingLink) {
      return res.status(400).json({
        success: false,
        message: 'Recording link is required',
      });
    }

    const appointment = await AppointmentSlot.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found',
      });
    }

    // Set recording expiry date
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + expiryDays);

    // Send recording email
    // Recording email sending removed - use Zoom recording instead

    appointment.recordingLink = recordingLink;
    appointment.recordingExpiryDate = expiryDate;
    appointment.recordingExpired = false;
    appointment.recordingSentAt = new Date();
    appointment.status = 'completed';
    await appointment.save();

    res.status(200).json({
      success: true,
      message: `Recording shared successfully. It will expire on ${expiryDate.toLocaleDateString()}`,
      data: appointment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get recording details
export const getRecording = async (req, res) => {
  try {
    const { appointmentId } = req.params;

    const appointment = await AppointmentSlot.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found',
      });
    }

    if (!appointment.recordingLink) {
      return res.status(404).json({
        success: false,
        message: 'No recording found for this appointment',
      });
    }

    // Expiry check handled separately

    if (isExpired) {
      appointment.recordingExpired = true;
      await appointment.save();
    }

    res.status(200).json({
      success: true,
      data: {
        recordingLink: appointment.recordingLink,
        expiryDate: appointment.recordingExpiryDate,
        isExpired,
        expiresIn: !isExpired ? Math.ceil((new Date(appointment.recordingExpiryDate) - new Date()) / (1000 * 60 * 60 * 24)) : 0,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update appointment status (for meeting in progress/completed)
export const updateAppointmentStatus = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { status, attendanceStatus, meetingNotes } = req.body;

    const validStatuses = ['available', 'booked', 'in-progress', 'completed'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status',
      });
    }

    const appointment = await AppointmentSlot.findByIdAndUpdate(
      appointmentId,
      {
        ...(status && { status }),
        ...(attendanceStatus && { attendanceStatus }),
        ...(meetingNotes && { meetingNotes }),
        updatedAt: new Date(),
      },
      { new: true }
    );

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Appointment status updated successfully',
      data: appointment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
