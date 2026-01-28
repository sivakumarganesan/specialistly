import AppointmentSlot from '../models/AppointmentSlot.js';

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
    const { bookedBy, serviceTitle } = req.body;

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

    slot.status = 'booked';
    slot.bookedBy = bookedBy;
    slot.serviceTitle = serviceTitle;
    await slot.save();

    res.status(200).json({
      success: true,
      message: 'Slot booked successfully',
      data: slot,
    });
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
