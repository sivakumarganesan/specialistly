import mongoose from 'mongoose';

const consultingSlotSchema = new mongoose.Schema(
  {
    // Specialist info
    specialistId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    specialistEmail: {
      type: String,
      required: true,
      index: true,
    },

    // Service reference (optional - can apply to all consulting)
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      default: null,
    },

    // Slot timing
    date: {
      type: Date,
      required: true,
      index: true,
    },
    startTime: {
      type: String, // "14:00" format
      required: true,
    },
    endTime: {
      type: String, // "15:00" format
      required: true,
    },
    duration: {
      type: Number, // in minutes
      required: true,
    },

    // Capacity management
    totalCapacity: {
      type: Number,
      default: 1,
      min: 1,
    },
    bookedCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    isFullyBooked: {
      type: Boolean,
      default: false,
      index: true,
    },

    // Status
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
      index: true,
    },

    // Booking details
    bookings: [
      {
        customerId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        customerEmail: String,
        customerName: String,
        bookedAt: {
          type: Date,
          default: Date.now,
        },
        // Booking status
        status: {
          type: String,
          enum: ['booked', 'cancelled_by_specialist', 'cancelled_by_customer', 'completed'],
          default: 'booked',
        },
        // Zoom meeting details
        zoomMeeting: {
          zoomMeetingId: String,
          joinUrl: String,
          startUrl: String, // For host to start meeting
          password: String,
          createdAt: Date,
        },
        // Cancellation details
        cancellation: {
          cancelledBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
          },
          cancelledAt: Date,
          cancellationReason: String,
          refundStatus: {
            type: String,
            enum: ['pending', 'processed', 'failed'],
            default: null,
          },
          refundAmount: Number,
          stripeRefundId: String,
        },
      },
    ],

    // Metadata
    timezone: {
      type: String,
      default: 'UTC',
    },
    notes: String,

    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Indexes for efficient querying
consultingSlotSchema.index({ specialistId: 1, date: 1 });
consultingSlotSchema.index({ date: 1, status: 1, isFullyBooked: 1 });
consultingSlotSchema.index({ specialistId: 1, status: 1 });

// Pre-save middleware to validate slot times
consultingSlotSchema.pre('save', async function (next) {
  // Validate end time is after start time
  if (this.startTime >= this.endTime) {
    throw new Error('End time must be after start time');
  }

  // Calculate duration if not provided
  if (!this.duration) {
    const start = new Date(`1970-01-01T${this.startTime}:00Z`);
    const end = new Date(`1970-01-01T${this.endTime}:00Z`);
    this.duration = (end - start) / (1000 * 60); // in minutes
  }

  // Update isFullyBooked flag
  this.isFullyBooked = this.bookedCount >= this.totalCapacity;

  next();
});

// Method to check if slot is available for booking
consultingSlotSchema.methods.isAvailable = function () {
  const now = new Date();
  const slotDate = new Date(this.date);
  
  // Check if date is in the future
  if (slotDate <= now) {
    return false;
  }

  // Check if status is active
  if (this.status !== 'active') {
    return false;
  }

  // Check if slot is fully booked
  if (this.isFullyBooked) {
    return false;
  }

  return true;
};

// Method to add a booking
consultingSlotSchema.methods.addBooking = function (customerId, customerEmail, customerName) {
  // Check if already booked by this customer
  const alreadyBooked = this.bookings.some(
    (booking) => booking.customerId.toString() === customerId.toString()
  );

  if (alreadyBooked) {
    throw new Error('Customer has already booked this slot');
  }

  // Check capacity
  if (this.bookedCount >= this.totalCapacity) {
    throw new Error('Slot is fully booked');
  }

  // Add booking
  this.bookings.push({
    customerId,
    customerEmail,
    customerName,
    bookedAt: new Date(),
  });

  this.bookedCount += 1;
  this.isFullyBooked = this.bookedCount >= this.totalCapacity;

  return this;
};

// Method to remove a booking
consultingSlotSchema.methods.removeBooking = function (customerId) {
  const bookingIndex = this.bookings.findIndex(
    (booking) => booking.customerId.toString() === customerId.toString()
  );

  if (bookingIndex === -1) {
    throw new Error('Booking not found');
  }

  this.bookings.splice(bookingIndex, 1);
  this.bookedCount -= 1;
  this.isFullyBooked = this.bookedCount >= this.totalCapacity;

  return this;
};

// Method to get available slots for a specialist between dates
consultingSlotSchema.statics.getAvailableSlots = async function (
  specialistEmail,
  startDate,
  endDate
) {
  const now = new Date();
  const actualStartDate = startDate || now;

  const slots = await this.find({
    specialistEmail,
    date: {
      $gte: actualStartDate,
      $lte: endDate || new Date(actualStartDate.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days default
    },
    status: 'active',
    isFullyBooked: false,
  })
    .sort({ date: 1, startTime: 1 })
    .exec();

  return slots;
};

export default mongoose.model('ConsultingSlot', consultingSlotSchema);
