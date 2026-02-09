import mongoose from 'mongoose';
import Customer from '../models/Customer.js';

// Create a new customer
export const createCustomer = async (req, res) => {
  try {
    const customer = new Customer(req.body);
    await customer.save();
    res.status(201).json({
      success: true,
      message: 'Customer created successfully',
      data: customer,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Get all customers
export const getAllCustomers = async (req, res) => {
  try {
    const { specialistEmail } = req.query;
    
    let query = {};
    if (specialistEmail) {
      // Filter customers by specialist email
      query = { 'specialists.specialistEmail': specialistEmail };
    }
    
    const customers = await Customer.find(query);
    res.status(200).json({
      success: true,
      data: customers,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get a single customer by ID
export const getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found',
      });
    }
    res.status(200).json({
      success: true,
      data: customer,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update a customer
export const updateCustomer = async (req, res) => {
  try {
    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true }
    );
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found',
      });
    }
    res.status(200).json({
      success: true,
      message: 'Customer updated successfully',
      data: customer,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete a customer
export const deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findByIdAndDelete(req.params.id);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found',
      });
    }
    res.status(200).json({
      success: true,
      message: 'Customer deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Add purchase to customer
export const addPurchaseToCustomer = async (req, res) => {
  try {
    const { customerId } = req.params;
    const { offeringTitle, offeringType, offeringId, price } = req.body;

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found',
      });
    }

    customer.purchases.push({
      offeringTitle,
      offeringType,
      offeringId,
      price,
      date: new Date(),
      status: 'completed',
    });

    customer.totalSpent += parseFloat(price.replace('$', ''));
    customer.purchaseCount += 1;
    customer.updatedAt = Date.now();

    await customer.save();

    res.status(200).json({
      success: true,
      message: 'Purchase added successfully',
      data: customer,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Enroll customer in a course
export const enrollCourse = async (req, res) => {
  try {
    const { userId, courseId, enrolledAt, status } = req.body;

    const customer = await Customer.findOne({ email: userId });
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found',
      });
    }

    // Add course enrollment
    if (!customer.enrollments) {
      customer.enrollments = [];
    }

    customer.enrollments.push({
      courseId,
      enrolledAt: new Date(enrolledAt),
      status: status || 'active',
    });

    customer.updatedAt = Date.now();
    await customer.save();

    res.status(200).json({
      success: true,
      message: 'Course enrollment successful',
      data: customer,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Book a service for customer
export const bookService = async (req, res) => {
  try {
    const { userId, serviceId, bookedAt, status } = req.body;

    const customer = await Customer.findOne({ email: userId });
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found',
      });
    }

    // Add service booking
    if (!customer.bookings) {
      customer.bookings = [];
    }

    customer.bookings.push({
      serviceId,
      bookedAt: new Date(bookedAt),
      status: status || 'pending',
    });

    customer.updatedAt = Date.now();
    await customer.save();

    res.status(200).json({
      success: true,
      message: 'Service booked successfully',
      data: customer,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Get customer enrollments by email
export const getEnrollmentsByEmail = async (req, res) => {
  try {
    const { email } = req.params;
    const customer = await Customer.findOne({ email });
    
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found',
        data: [],
      });
    }

    const enrollments = customer.enrollments || [];
    
    // Fetch course details for each enrollment
    const Course = mongoose.model('Course');
    const enrichedEnrollments = await Promise.all(
      enrollments.map(async (enrollment, index) => {
        try {
          const course = await Course.findById(enrollment.courseId);
          return {
            _id: `${customer._id}-enrollment-${index}`,
            courseId: enrollment.courseId,
            courseName: course?.title || 'Course',
            coursePrice: course?.price || 0,
            enrolledAt: enrollment.enrolledAt,
            status: enrollment.status,
            description: course?.description,
            progress: enrollment.progress || 0,
          };
        } catch (err) {
          return {
            _id: `${customer._id}-enrollment-${index}`,
            courseId: enrollment.courseId,
            courseName: 'Course',
            coursePrice: 0,
            enrolledAt: enrollment.enrolledAt,
            status: enrollment.status,
            progress: 0,
          };
        }
      })
    );
    
    res.status(200).json({
      success: true,
      data: enrichedEnrollments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      data: [],
    });
  }
};

// Get customer bookings by email
export const getBookingsByEmail = async (req, res) => {
  try {
    const { email } = req.params;
    const customer = await Customer.findOne({ email });
    
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found',
        data: [],
      });
    }

    const bookings = customer.bookings || [];
    
    // Fetch service details for each booking
    const Service = mongoose.model('Service');
    const enrichedBookings = await Promise.all(
      bookings.map(async (booking, index) => {
        try {
          const service = await Service.findById(booking.serviceId);
          return {
            _id: `${customer._id}-booking-${index}`,
            serviceId: booking.serviceId,
            serviceName: service?.title || 'Service',
            servicePrice: service?.price || 0,
            bookedAt: booking.bookedAt,
            status: booking.status,
            description: service?.description,
          };
        } catch (err) {
          return {
            _id: `${customer._id}-booking-${index}`,
            serviceId: booking.serviceId,
            serviceName: 'Service',
            servicePrice: 0,
            bookedAt: booking.bookedAt,
            status: booking.status,
          };
        }
      })
    );
    
    res.status(200).json({
      success: true,
      data: enrichedBookings,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      data: [],
    });
  }
};

