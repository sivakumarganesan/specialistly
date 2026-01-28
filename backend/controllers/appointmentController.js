import AppointmentSlot from '../models/AppointmentSlot.js';
import googleMeetService from '../services/googleMeetService.js';

// Create appointment slot
export const createAppointmentSlot = async (req, res) => {
  try {
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
    const slots = await AppointmentSlot.find({ status: 'available' });
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
      specialistName 
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
      // Create Google Meet event
      const startDateTime = new Date(slot.date);
      const [startHour, startMin] = slot.startTime.split(':');
      startDateTime.setHours(parseInt(startHour), parseInt(startMin));

      const endDateTime = new Date(slot.date);
      const [endHour, endMin] = slot.endTime.split(':');
      endDateTime.setHours(parseInt(endHour), parseInt(endMin));

      const meetData = await googleMeetService.createGoogleMeet({
        serviceTitle,
        startDateTime: startDateTime.toISOString(),
        endDateTime: endDateTime.toISOString(),
        specialistEmail,
        specialistName,
        customerEmail,
        customerName,
      });

      // Update slot with booking and Google Meet details
      slot.status = 'booked';
      slot.bookedBy = bookedBy;
      slot.serviceTitle = serviceTitle;
      slot.customerEmail = customerEmail;
      slot.customerName = customerName;
      slot.specialistEmail = specialistEmail;
      slot.googleEventId = meetData.googleEventId;
      slot.googleMeetLink = meetData.googleMeetLink;
      
      await slot.save();

      res.status(200).json({
        success: true,
        message: 'Slot booked successfully with Google Meet created',
        data: slot,
      });
    } catch (googleError) {
      console.error('Google Meet creation error:', googleError);
      // Still save the booking even if Google Meet fails
      slot.status = 'booked';
      slot.bookedBy = bookedBy;
      slot.serviceTitle = serviceTitle;
      slot.customerEmail = customerEmail;
      slot.customerName = customerName;
      slot.specialistEmail = specialistEmail;
      
      await slot.save();

      res.status(200).json({
        success: true,
        message: 'Slot booked but Google Meet creation failed',
        data: slot,
        warning: googleError.message,
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

    if (!appointment.googleMeetLink || !appointment.customerEmail) {
      return res.status(400).json({
        success: false,
        message: 'Appointment does not have meeting link or customer email',
      });
    }

    // Send reminder emails
    await googleMeetService.sendReminderEmail(appointment);

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
    await googleMeetService.sendRecordingEmail(appointment, recordingLink, expiryDays);

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

    const isExpired = googleMeetService.checkRecordingExpiry(appointment.recordingExpiryDate);

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
