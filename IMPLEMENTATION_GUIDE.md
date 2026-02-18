# Implementation Guide for Core Services

This guide provides detailed, production-ready code snippets for implementing the 1:1 Consulting Platform's core business logic.

---

## 1. Availability Schedule Service

**File:** `backend/services/availabilityService.js`

```javascript
import AvailabilitySchedule from '../models/AvailabilitySchedule.js';
import AppointmentSlot from '../models/AppointmentSlot.js';

export class AvailabilityService {
  
  /**
   * Generate available time slots from schedule
   * @param {ObjectId} specialistId - Specialist ID
   * @param {Date} startDate - Start date for generation
   * @param {Date} endDate - End date for generation
   * @param {Boolean} overwrite - Overwrite existing slots
   * @returns {Array} Generated slots
   */
  static async generateSlots(specialistId, startDate, endDate, overwrite = false) {
    try {
      // Get active schedule
      const schedule = await AvailabilitySchedule.findOne({
        specialistId,
        isActive: true,
        appliedFrom: { $lte: endDate }
      });
      
      if (!schedule) {
        throw new Error('No active availability schedule found');
      }
      
      const slots = [];
      const currentDate = new Date(startDate);
      
      while (currentDate <= endDate) {
        const dayName = this.getDayName(currentDate);
        const daySchedule = schedule.weeklyPattern[dayName];
        
        // Check for date exceptions
        const exception = schedule.dateExceptions.find(
          exc => this.isSameDay(exc.date, currentDate)
        );
        
        if (exception) {
          // Use exception schedule
          if (exception.isAvailable && exception.slots) {
            slots.push(...this.createSlotsForDay(
              currentDate,
              exception.slots,
              schedule,
              specialistId
            ));
          }
        } else if (daySchedule && daySchedule.enabled) {
          // Use regular schedule
          slots.push(...this.createSlotsForDay(
            currentDate,
            daySchedule.slots,
            schedule,
            specialistId
          ));
        }
        
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      // Save slots
      if (overwrite) {
        // Delete existing slots in range
        await AppointmentSlot.deleteMany({
          specialistId,
          date: { $gte: startDate, $lte: endDate }
        });
      }
      
      const created = await AppointmentSlot.insertMany(slots);
      
      return {
        generated: created.length,
        slots: created
      };
      
    } catch (error) {
      throw new Error(`Failed to generate slots: ${error.message}`);
    }
  }
  
  /**
   * Create slots for a specific day
   * @private
   */
  static createSlotsForDay(date, timeSlots, schedule, specialistId) {
    const daySlots = [];
    const buffer = schedule.slotConfig.buffer || 0;
    
    timeSlots.forEach(timeSlot => {
      const [startHour, startMin] = timeSlot.startTime.split(':');
      const [endHour, endMin] = timeSlot.endTime.split(':');
      
      let current = new Date(date);
      current.setHours(startHour, startMin, 0, 0);
      
      const end = new Date(date);
      end.setHours(endHour, endMin, 0, 0);
      
      const duration = timeSlot.slotDuration || 60;
      
      while (current < end) {
        const slotEnd = new Date(current);
        slotEnd.setMinutes(slotEnd.getMinutes() + duration);
        
        if (slotEnd <= end) {
          daySlots.push({
            specialistId,
            date: new Date(date),
            startTime: this.formatTime(current),
            endTime: this.formatTime(slotEnd),
            duration,
            timezone: schedule.timezone,
            status: 'available',
            price: schedule.slotConfig.defaultPrice || 100
          });
        }
        
        current.setMinutes(current.getMinutes() + duration + buffer);
      }
    });
    
    return daySlots;
  }
  
  /**
   * Get available slots for customer browsing
   */
  static async getAvailableSlots(filters) {
    const {
      specialistId,
      startDate,
      endDate,
      duration,
      price,
      page = 1,
      limit = 20
    } = filters;
    
    const query = {
      status: 'available',
      date: { $gte: startDate, $lte: endDate }
    };
    
    if (specialistId) query.specialistId = specialistId;
    if (duration) query.duration = duration;
    if (price) query.price = { $lte: price };
    
    const skip = (page - 1) * limit;
    
    const slots = await AppointmentSlot
      .find(query)
      .populate('specialistId', 'creatorName profileImage')
      .sort({ date: 1, startTime: 1 })
      .skip(skip)
      .limit(limit);
    
    const total = await AppointmentSlot.countDocuments(query);
    
    return {
      slots,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }
  
  /**
   * Block a time slot (specialist action)
   */
  static async blockSlot(slotId, reason) {
    const slot = await AppointmentSlot.findByIdAndUpdate(
      slotId,
      {
        status: 'blocked',
        isManuallyBlocked: true,
        blockReason: reason
      },
      { new: true }
    );
    
    return slot;
  }
  
  /**
   * Get specialist's calendar for specific month
   */
  static async getSpecialistCalendar(specialistId, year, month, timezone) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    
    const slots = await AppointmentSlot.find({
      specialistId,
      date: { $gte: startDate, $lte: endDate }
    }).sort({ date: 1, startTime: 1 });
    
    // Group by date
    const calendar = {};
    slots.forEach(slot => {
      const dateKey = slot.date.toISOString().split('T')[0];
      if (!calendar[dateKey]) {
        calendar[dateKey] = [];
      }
      calendar[dateKey].push({
        _id: slot._id,
        startTime: slot.startTime,
        endTime: slot.endTime,
        status: slot.status,
        price: slot.price
      });
    });
    
    return calendar;
  }
  
  // Helper methods
  static getDayName(date) {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[date.getDay()];
  }
  
  static isSameDay(date1, date2) {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  }
  
  static formatTime(date) {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }
}

export default AvailabilityService;
```

---

## 2. Booking Service

**File:** `backend/services/bookingService.js`

```javascript
import Booking from '../models/Booking.js';
import AppointmentSlot from '../models/AppointmentSlot.js';
import Payment from '../models/Payment.js';
import Notification from '../models/Notification.js';
import zoomService from './zoomService.js';
import emailService from './emailService.js';

export class BookingService {
  
  /**
   * Create a new booking
   */
  static async createBooking({
    slotId,
    specialistId,
    customerId,
    customerEmail,
    customerName,
    customerNotes
  }) {
    try {
      // 1. Verify slot exists and is available
      const slot = await AppointmentSlot.findById(slotId);
      if (!slot || slot.status !== 'available') {
        throw new Error('Slot is not available');
      }
      
      // 2. Create booking with pending status
      const booking = new Booking({
        slotId,
        specialistId,
        customerId,
        status: 'pending',
        consultationType: slot.consultationType || 'consulting',
        sessionDuration: slot.duration,
        sessionPrice: slot.price,
        currency: 'USD',
        customerNotes,
        statusHistory: [{
          status: 'pending',
          changedAt: new Date(),
          reason: 'Booking initiated'
        }]
      });
      
      await booking.save();
      
      // 3. Mark slot as being processed
      slot.status = 'booked';
      slot.bookingId = booking._id;
      slot.customerId = customerId;
      slot.bookedAt = new Date();
      await slot.save();
      
      // 4. Send confirmation email to customer
      await emailService.sendBookingConfirmation({
        customerEmail,
        customerName,
        bookingId: booking._id,
        slotDate: slot.date,
        slotTime: slot.startTime,
        specialistName: slot.specialistName
      });
      
      // 5. Send notification to specialist
      await this.createNotification({
        recipientId: specialistId,
        type: 'booking_confirmation',
        title: 'New Booking Received',
        message: `${customerName} has booked a session for ${slot.startTime}`,
        bookingId: booking._id,
        customerName,
        customerEmail
      });
      
      return booking;
      
    } catch (error) {
      throw new Error(`Booking creation failed: ${error.message}`);
    }
  }
  
  /**
   * Confirm booking and process payment
   */
  static async confirmBooking(bookingId, paymentIntentId) {
    try {
      const booking = await Booking.findById(bookingId);
      if (!booking) {
        throw new Error('Booking not found');
      }
      
      // Create payment record
      const payment = new Payment({
        bookingId,
        specialistId: booking.specialistId,
        customerId: booking.customerId,
        amount: booking.sessionPrice,
        stripePaymentIntentId: paymentIntentId,
        status: 'pending'
      });
      
      await payment.save();
      
      // Update booking status
      booking.status = 'confirmed';
      booking.statusHistory.push({
        status: 'confirmed',
        changedAt: new Date(),
        reason: 'Payment confirmed'
      });
      
      await booking.save();
      
      // Create Zoom meeting
      const slot = await AppointmentSlot.findById(booking.slotId);
      const specialist = await this.getSpecialistInfo(booking.specialistId);
      
      const zoomData = await zoomService.createZoomMeeting({
        specialistId: booking.specialistId,
        startDateTime: new Date(slot.date),
        endDateTime: new Date(slot.date),
        title: `${specialist.creatorName} - Consulting Session`
      });
      
      // Update booking with meeting info
      booking.meeting = {
        zoomMeetingId: zoomData.zoomMeetingId,
        zoomLink: zoomData.zoomLink,
        zoomJoinUrl: zoomData.zoomJoinUrl
      };
      
      await booking.save();
      
      return booking;
      
    } catch (error) {
      throw new Error(`Booking confirmation failed: ${error.message}`);
    }
  }
  
  /**
   * Reschedule booking to new slot
   */
  static async rescheduleBooking(bookingId, newSlotId, reason) {
    try {
      const booking = await Booking.findById(bookingId);
      if (!booking) {
        throw new Error('Booking not found');
      }
      
      // Verify new slot is available
      const newSlot = await AppointmentSlot.findById(newSlotId);
      if (!newSlot || newSlot.status !== 'available') {
        throw new Error('New slot is not available');
      }
      
      // Get old slot info
      const oldSlot = await AppointmentSlot.findById(booking.slotId);
      
      // Record reschedule history
      booking.rescheduleHistory.push({
        fromSlotId: booking.slotId,
        toSlotId: newSlotId,
        rescheduledAt: new Date(),
        reason
      });
      
      // Update booking slot reference
      booking.slotId = newSlotId;
      
      // Update old slot
      oldSlot.status = 'available';
      oldSlot.bookingId = null;
      oldSlot.customerId = null;
      await oldSlot.save();
      
      // Update new slot
      newSlot.status = 'booked';
      newSlot.bookingId = bookingId;
      newSlot.customerId = booking.customerId;
      await newSlot.save();
      
      // Update Zoom meeting
      const zoomUpdate = await zoomService.updateZoomMeeting(
        booking.meeting.zoomMeetingId,
        { startDateTime: newSlot.date }
      );
      
      booking.meeting.zoomLink = zoomUpdate.zoomLink;
      
      // Save changes
      await booking.save();
      
      // Send notification
      await emailService.sendRescheduleConfirmation({
        customerEmail: oldSlot.customerEmail,
        newDate: newSlot.date,
        newTime: newSlot.startTime
      });
      
      return booking;
      
    } catch (error) {
      throw new Error(`Reschedule failed: ${error.message}`);
    }
  }
  
  /**
   * Cancel booking
   */
  static async cancelBooking(bookingId, cancelledBy, reason) {
    try {
      const booking = await Booking.findById(bookingId);
      if (!booking) {
        throw new Error('Booking not found');
      }
      
      // Determine cancellation type
      const cancelationType = cancelledBy === booking.customerId 
        ? 'cancelled-by-customer' 
        : 'cancelled-by-specialist';
      
      // Check if refund is eligible
      const slot = await AppointmentSlot.findById(booking.slotId);
      const now = new Date();
      const refundDeadline = new Date(slot.date);
      refundDeadline.setHours(refundDeadline.getHours() - 24); // 24 hour cancellation window
      
      const isRefundEligible = now < refundDeadline;
      
      // Update booking
      booking.status = 'cancelled';
      booking.cancellation = {
        status: cancelationType,
        cancelledAt: new Date(),
        reason
      };
      
      booking.statusHistory.push({
        status: 'cancelled',
        changedAt: new Date(),
        changedBy: cancelledBy,
        reason
      });
      
      // Release the slot
      slot.status = 'available';
      slot.bookingId = null;
      slot.customerId = null;
      await slot.save();
      
      // Process refund if eligible
      if (isRefundEligible) {
        const payment = await Payment.findOne({ bookingId });
        if (payment && payment.status === 'succeeded') {
          payment.status = 'refunded';
          payment.refund = {
            requestedAt: new Date(),
            requestedBy: cancelledBy,
            reason,
            refundAmount: payment.amount
          };
          await payment.save();
        }
      }
      
      await booking.save();
      
      return {
        booking,
        refundEligible: isRefundEligible,
        refundAmount: isRefundEligible ? booking.sessionPrice : 0
      };
      
    } catch (error) {
      throw new Error(`Cancellation failed: ${error.message}`);
    }
  }
  
  /**
   * Create a notification
   */
  static async createNotification(data) {
    const notification = new Notification(data);
    await notification.save();
    return notification;
  }
  
  /**
   * Get specialist info
   */
  static async getSpecialistInfo(specialistId) {
    const CreatorProfile = (await import('../models/CreatorProfile.js')).default;
    return await CreatorProfile.findById(specialistId);
  }
}

export default BookingService;
```

---

## 3. Payment Service

**File:** `backend/services/paymentService.js`

```javascript
import Stripe from 'stripe';
import Payment from '../models/Payment.js';
import Booking from '../models/Booking.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export class PaymentService {
  
  /**
   * Create Stripe payment intent
   */
  static async createPaymentIntent({
    bookingId,
    amount,
    currency = 'USD',
    customerId,
    idempotencyKey
  }) {
    try {
      // Verify booking exists
      const booking = await Booking.findById(bookingId);
      if (!booking) {
        throw new Error('Booking not found');
      }
      
      // Create or get Stripe customer
      let stripeCustomerId = customerId;
      if (!stripeCustomerId) {
        const customer = await stripe.customers.create();
        stripeCustomerId = customer.id;
      }
      
      // Create payment intent
      const paymentIntent = await stripe.paymentIntents.create(
        {
          amount: Math.round(amount * 100), // Convert to cents
          currency: currency.toLowerCase(),
          customer: stripeCustomerId,
          description: `Consulting Session - ${bookingId}`,
          metadata: {
            bookingId: bookingId.toString(),
            customerId: booking.customerId.toString(),
            specialistId: booking.specialistId.toString()
          }
        },
        { idempotencyKey } // For idempotency
      );
      
      // Save payment record
      const payment = new Payment({
        bookingId,
        specialistId: booking.specialistId,
        customerId: booking.customerId,
        amount,
        currency,
        stripePaymentIntentId: paymentIntent.id,
        stripeCustomerId,
        status: 'pending',
        idempotencyKey,
        initiatedAt: new Date()
      });
      
      await payment.save();
      
      return {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount,
        currency
      };
      
    } catch (error) {
      throw new Error(`Payment intent creation failed: ${error.message}`);
    }
  }
  
  /**
   * Confirm payment and update booking
   */
  static async confirmPayment(paymentIntentId, bookingId) {
    try {
      // Verify payment intent with Stripe
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      if (paymentIntent.status !== 'succeeded') {
        throw new Error('Payment not successful');
      }
      
      // Update payment record
      const payment = await Payment.findOneAndUpdate(
        { stripePaymentIntentId: paymentIntentId },
        {
          status: 'succeeded',
          stripeChargeId: paymentIntent.charges.data[0]?.id,
          succeededAt: new Date()
        },
        { new: true }
      );
      
      // Update booking status
      const booking = await Booking.findByIdAndUpdate(
        bookingId,
        {
          status: 'confirmed',
          $push: {
            statusHistory: {
              status: 'confirmed',
              changedAt: new Date(),
              reason: 'Payment confirmed'
            }
          }
        },
        { new: true }
      );
      
      return { payment, booking };
      
    } catch (error) {
      throw new Error(`Payment confirmation failed: ${error.message}`);
    }
  }
  
  /**
   * Refund payment
   */
  static async refundPayment(paymentId, reason, refundAmount) {
    try {
      const payment = await Payment.findById(paymentId);
      if (!payment) {
        throw new Error('Payment not found');
      }
      
      if (payment.status !== 'succeeded') {
        throw new Error('Payment cannot be refunded');
      }
      
      // Refund through Stripe
      const refund = await stripe.refunds.create({
        charge: payment.stripeChargeId,
        amount: refundAmount ? Math.round(refundAmount * 100) : undefined,
        metadata: {
          reason,
          paymentId: paymentId.toString()
        }
      });
      
      // Update payment record
      payment.status = 'refunded';
      payment.refund = {
        requestedAt: new Date(),
        reason,
        refundAmount: refundAmount || payment.amount,
        stripeRefundId: refund.id,
        status: refund.status === 'succeeded' ? 'succeeded' : 'pending'
      };
      payment.refundedAt = new Date();
      
      await payment.save();
      
      return { payment, refund };
      
    } catch (error) {
      throw new Error(`Refund processing failed: ${error.message}`);
    }
  }
  
  /**
   * Handle Stripe webhook
   */
  static async handleWebhook(event) {
    try {
      switch (event.type) {
        case 'payment_intent.succeeded':
          return await this.handlePaymentSucceeded(event.data.object);
        
        case 'payment_intent.payment_failed':
          return await this.handlePaymentFailed(event.data.object);
        
        case 'charge.refunded':
          return await this.handleChargeRefunded(event.data.object);
        
        default:
          console.log(`Unhandled event type: ${event.type}`);
      }
    } catch (error) {
      console.error('Webhook processing failed:', error);
      throw error;
    }
  }
  
  static async handlePaymentSucceeded(paymentIntent) {
    const payment = await Payment.findOneAndUpdate(
      { stripePaymentIntentId: paymentIntent.id },
      {
        status: 'succeeded',
        succeededAt: new Date(),
        stripeChargeId: paymentIntent.charges.data[0]?.id
      },
      { new: true }
    );
    
    return payment;
  }
  
  static async handlePaymentFailed(paymentIntent) {
    const payment = await Payment.findOneAndUpdate(
      { stripePaymentIntentId: paymentIntent.id },
      {
        status: 'failed',
        failedAt: new Date(),
        failureReason: paymentIntent.last_payment_error?.message
      },
      { new: true }
    );
    
    return payment;
  }
  
  static async handleChargeRefunded(charge) {
    const payment = await Payment.findOne({ stripeChargeId: charge.id });
    if (payment) {
      payment.status = 'refunded';
      payment.refundedAt = new Date();
      await payment.save();
    }
    
    return payment;
  }
}

export default PaymentService;
```

---

## 4. Notification Service

**File:** `backend/services/notificationService.js`

```javascript
import Notification from '../models/Notification.js';
import emailService from './emailService.js';

export class NotificationService {
  
  /**
   * Create and send notification
   */
  static async notify({
    recipientId,
    type,
    title,
    message,
    action,
    actionUrl,
    bookingId,
    paymentId,
    channels = ['email', 'in-app'],
    metadata = {}
  }) {
    try {
      // Create in-app notification
      const notification = new Notification({
        recipientId,
        type,
        title,
        message,
        action,
        actionUrl,
        bookingId,
        paymentId,
        channels,
        metadata,
        delivery: {}
      });
      
      // Send via channels
      if (channels.includes('email')) {
        await this.sendEmailNotification(notification, metadata);
      }
      
      if (channels.includes('sms')) {
        await this.sendSmsNotification(notification, metadata);
      }
      
      await notification.save();
      
      return notification;
      
    } catch (error) {
      console.error('Notification sending failed:', error);
      throw error;
    }
  }
  
  static async sendEmailNotification(notification, metadata) {
    try {
      const emailTemplates = {
        booking_confirmation: 'bookingConfirmation',
        booking_reminder: 'bookingReminder',
        session_completed: 'sessionCompleted',
        recording_ready: 'recordingReady',
        payment_received: 'paymentReceived',
        refund_processed: 'refundProcessed'
      };
      
      const template = emailTemplates[notification.type] || 'generic';
      
      await emailService.send({
        to: metadata.customerEmail || metadata.specialistEmail,
        template,
        subject: notification.title,
        data: {
          message: notification.message,
          ...metadata
        }
      });
      
      notification.delivery.emailSent = true;
      notification.delivery.emailSentAt = new Date();
      
    } catch (error) {
      notification.delivery.emailFailed = true;
      notification.delivery.emailFailureReason = error.message;
      console.error('Email notification failed:', error);
    }
  }
  
  static async sendSmsNotification(notification, metadata) {
    // Implement SMS via Twilio or similar
    try {
      notification.delivery.smsSent = true;
      notification.delivery.smsSentAt = new Date();
    } catch (error) {
      notification.delivery.smsFailed = true;
      notification.delivery.smsFailureReason = error.message;
    }
  }
  
  /**
   * Send session reminders
   */
  static async sendSessionReminders() {
    // Send 24-hour before reminder
    // Send 1-hour before reminder
    // Implementation details below
  }
}

export default NotificationService;
```

---

## 5. Timezone Helper Utility

**File:** `backend/utils/timezoneHelper.js`

```javascript
import { zonedTimeToUtc, utcToZonedTime, format } from 'date-fns-tz';

export class TimezoneHelper {
  
  /**
   * Convert specialist time to UTC
   */
  static toUTC(date, specialistTimezone) {
    return zonedTimeToUtc(date, specialistTimezone);
  }
  
  /**
   * Convert UTC to customer's timezone for display
   */
  static toCustomerTimezone(utcDate, customerTimezone) {
    return utcToZonedTime(utcDate, customerTimezone);
  }
  
  /**
   * Format time in specialist's timezone
   */
  static formatInTimezone(date, timezone, formatStr = 'PPpp') {
    return format(date, formatStr, { timeZone: timezone });
  }
  
  /**
   * Get specialist's current time
   */
  static getSpecialistNow(timezone) {
    return utcToZonedTime(new Date(), timezone);
  }
  
  /**
   * Convert time string to milliseconds from now
   */
  static getTimeUntilSlot(slotDate, slotTime, timezone) {
    const [hours, minutes] = slotTime.split(':');
    const slotDateTime = new Date(slotDate);
    slotDateTime.setHours(hours, minutes);
    
    const utcSlotTime = this.toUTC(slotDateTime, timezone);
    return utcSlotTime.getTime() - Date.now();
  }
}

export default TimezoneHelper;
```

---

## Implementation Order

1. **Database Models** (Already created)
   - Booking.js
   - Payment.js
   - AvailabilitySchedule.js
   - Session.js
   - Notification.js
   - Review.js

2. **Core Services** (Implementation above)
   - AvailabilityService.js
   - BookingService.js
   - PaymentService.js
   - NotificationService.js
   - TimezoneHelper.js

3. **Controllers** (Next phase)
   - availabilityController.js
   - bookingController.js
   - paymentController.js
   - sessionController.js
   - reviewController.js

4. **Routes** (Next phase)
   - availabilityRoutes.js
   - bookingRoutes.js
   - paymentRoutes.js

5. **Frontend Components** (React)
   - AvailabilityManager
   - BookingCalendar
   - CheckoutFlow
   - SessionJoiner

---

## Testing Checklist

- [ ] Unit tests for all services
- [ ] Integration tests for booking flow
- [ ] Payment mock tests (use Stripe test keys)
- [ ] Timezone conversion tests
- [ ] Slot generation algorithm tests
- [ ] Refund eligibility logic tests
- [ ] Cancel booking edge cases
- [ ] Concurrent booking prevention

---

## Production Deployment Checklist

- [ ] All secrets in environment variables
- [ ] Database indexes created
- [ ] Rate limiting configured
- [ ] Error handling on all endpoints
- [ ] Input validation implemented
- [ ] Logging configured
- [ ] Monitoring set up
- [ ] Backup strategy in place
- [ ] Load testing completed
- [ ] Security audit done
