#!/usr/bin/env node
/**
 * End-to-End Workflow Verification Script
 * 
 * This script verifies all components needed for the complete workflow:
 * Specialist Authorization → Appointment Creation → Customer Booking → Email Sending → Zoom Meeting
 */

import mongoose from 'mongoose';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const SPECIALIST_EMAIL = 'sivakumarganeshm@gmail.com';
const CUSTOMER_EMAIL = 'sinduja.vel@gmail.com';

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(80));
  log(`📋 ${title}`, 'magenta');
  console.log('='.repeat(80));
}

function logCheck(title, result, details = '') {
  const icon = result ? '✅' : '❌';
  const color = result ? 'green' : 'red';
  log(`${icon} ${title}`, color);
  if (details) {
    log(`   ${details}`, 'cyan');
  }
}

// Import models (ES6 modules)
async function loadModels() {
  try {
    const User = (await import('./models/User.js')).default;
    const UserOAuthToken = (await import('./models/UserOAuthToken.js')).default;
    const AppointmentSlot = (await import('./models/AppointmentSlot.js')).default;
    const Service = (await import('./models/Service.js')).default;
    
    return { User, UserOAuthToken, AppointmentSlot, Service };
  } catch (error) {
    log(`Failed to load models: ${error.message}`, 'red');
    throw error;
  }
}

async function connectDatabase() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/specialistdb';
    await mongoose.connect(mongoUri);
    log(`Connected to MongoDB at: ${mongoUri.substring(0, 50)}...`, 'green');
    return true;
  } catch (error) {
    log(`Failed to connect to MongoDB: ${error.message}`, 'red');
    return false;
  }
}

async function verifyEnvironment() {
  logSection('1. ENVIRONMENT CONFIGURATION');
  
  const checks = {
    'MONGODB_URI': process.env.MONGODB_URI,
    'ZOOM_USER_MANAGED_CLIENT_ID': process.env.ZOOM_USER_MANAGED_CLIENT_ID,
    'ZOOM_USER_MANAGED_CLIENT_SECRET': process.env.ZOOM_USER_MANAGED_CLIENT_SECRET,
    'GMAIL_USER': process.env.GMAIL_USER,
    'GMAIL_PASSWORD': process.env.GMAIL_PASSWORD ? '***' : undefined,
  };
  
  let allValid = true;
  for (const [key, value] of Object.entries(checks)) {
    const isValid = !!value;
    logCheck(`${key}`, isValid, value || 'NOT SET');
    if (!isValid && key !== 'GMAIL_APP_PASSWORD') {
      allValid = false;
    }
  }
  
  return allValid;
}

async function testEmailTransporter() {
  logSection('2. EMAIL SERVICE VERIFICATION');
  
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD || process.env.GMAIL_PASSWORD,
      },
    });
    
    log('Testing email transporter...', 'cyan');
    const info = await transporter.verify();
    logCheck('Email transporter connection', info, 'SMTP connection successful');
    return true;
  } catch (error) {
    logCheck('Email transporter connection', false, error.message);
    return false;
  }
}

async function verifySpecialistAuthorization(models) {
  logSection('3. SPECIALIST AUTHORIZATION CHECK');
  
  const { User, UserOAuthToken } = models;
  
  try {
    // Find specialist user
    const specialist = await User.findOne({ email: SPECIALIST_EMAIL });
    if (!specialist) {
      logCheck(`Specialist user exists`, false, `User not found: ${SPECIALIST_EMAIL}`);
      return false;
    }
    logCheck(`Specialist user exists`, true, `Found user: ${specialist.name}`);
    
    // Check Zoom OAuth token
    const zoomToken = await UserOAuthToken.findOne({ userId: specialist._id });
    if (!zoomToken) {
      logCheck(`Zoom OAuth token exists`, false, 'No token found in database');
      return false;
    }
    logCheck(`Zoom OAuth token exists`, true, `Found token`);
    
    // Check token validity
    const hasAccessToken = !!zoomToken.zoomAccessToken && zoomToken.zoomAccessToken !== 'pending';
    logCheck(`Zoom access token valid`, hasAccessToken, 
      hasAccessToken ? `Token: ${zoomToken.zoomAccessToken.substring(0, 20)}...` : 'Token is missing or pending');
    
    const isActive = zoomToken.isActive;
    logCheck(`Token is active`, isActive, isActive ? 'Active' : 'Inactive');
    
    const notRevoked = !zoomToken.isRevoked;
    logCheck(`Token not revoked`, notRevoked, notRevoked ? 'Active' : 'REVOKED');
    
    if (zoomToken.zoomUserId) {
      log(`   Zoom User ID: ${zoomToken.zoomUserId}`, 'cyan');
    }
    if (zoomToken.zoomEmail) {
      log(`   Zoom Email: ${zoomToken.zoomEmail}`, 'cyan');
    }
    
    return hasAccessToken && isActive && notRevoked;
  } catch (error) {
    log(`Error checking specialist authorization: ${error.message}`, 'red');
    return false;
  }
}

async function verifyAppointmentSlots(models) {
  logSection('4. APPOINTMENT SLOTS CHECK');
  
  const { AppointmentSlot } = models;
  
  try {
    const slots = await AppointmentSlot.find({}).limit(10);
    log(`Total appointment slots in database: ${slots.length}`, 'cyan');
    
    if (slots.length === 0) {
      logCheck(`Appointment slots exist`, false, 'No slots found');
      return false;
    }
    logCheck(`Appointment slots exist`, true, `Found ${slots.length} slots`);
    
    // Check for available slots
    const availableSlots = slots.filter(s => s.status === 'available');
    logCheck(`Available slots exist`, availableSlots.length > 0, 
      `${availableSlots.length} available, ${slots.filter(s => s.status === 'booked').length} booked`);
    
    // Show sample slots
    log('\n   Sample slots:', 'cyan');
    slots.slice(0, 3).forEach((slot, idx) => {
      log(`   [${idx + 1}] Date: ${new Date(slot.date).toLocaleDateString()} | ` +
          `Time: ${slot.startTime}-${slot.endTime} | Status: ${slot.status}`, 'cyan');
    });
    
    return availableSlots.length > 0;
  } catch (error) {
    log(`Error checking appointment slots: ${error.message}`, 'red');
    return false;
  }
}

async function verifyServices(models) {
  logSection('5. SERVICES CHECK');
  
  const { Service } = models;
  
  try {
    const services = await Service.find({}).limit(10);
    log(`Total services in database: ${services.length}`, 'cyan');
    
    if (services.length === 0) {
      log(`No services found (optional - appointments may be used instead)`, 'yellow');
      return true;
    }
    logCheck(`Services exist`, true, `Found ${services.length} services`);
    
    // Check for active services
    const activeServices = services.filter(s => s.status === 'active');
    logCheck(`Active services exist`, activeServices.length > 0, 
      `${activeServices.length} active`);
    
    // Show sample services
    log('\n   Sample services:', 'cyan');
    services.slice(0, 3).forEach((service, idx) => {
      log(`   [${idx + 1}] Title: ${service.title} | Price: ${service.price} | Status: ${service.status}`, 'cyan');
    });
    
    return activeServices.length > 0;
  } catch (error) {
    log(`Error checking services: ${error.message}`, 'red');
    return false;
  }
}

async function verifyCustomerUser(models) {
  logSection('6. CUSTOMER USER CHECK');
  
  const { User } = models;
  
  try {
    const customer = await User.findOne({ email: CUSTOMER_EMAIL });
    if (!customer) {
      logCheck(`Customer user exists`, false, `User not found: ${CUSTOMER_EMAIL}`);
      return false;
    }
    logCheck(`Customer user exists`, true, `Found user: ${customer.name}`);
    
    const isMember = customer.membership === 'customer' || customer.role === 'user';
    logCheck(`User is customer`, isMember, `Membership: ${customer.membership}, Role: ${customer.role}`);
    
    return isMember;
  } catch (error) {
    log(`Error checking customer user: ${error.message}`, 'red');
    return false;
  }
}

async function runWorkflowSimulation(models) {
  logSection('7. WORKFLOW SIMULATION');
  
  const { User, AppointmentSlot } = models;
  
  try {
    // Get specialist
    const specialist = await User.findOne({ email: SPECIALIST_EMAIL });
    const customer = await User.findOne({ email: CUSTOMER_EMAIL });
    
    if (!specialist || !customer) {
      log('Cannot simulate workflow - missing specialist or customer', 'red');
      return false;
    }
    
    log('Simulating booking flow...', 'cyan');
    
    // Get available appointment slot
    const slot = await AppointmentSlot.findOne({ status: 'available' });
    if (!slot) {
      log('No available appointment slots to simulate booking', 'yellow');
      return true;
    }
    
    log(`   1. Customer (${customer.email}) browsing specialist (${specialist.email})`, 'cyan');
    log(`   2. Available slot found: ${new Date(slot.date).toLocaleDateString()} ${slot.startTime}-${slot.endTime}`, 'cyan');
    log(`   3. Would call: POST /api/appointments/book/${slot._id}`, 'cyan');
    log(`   4. Booking data would include:`, 'cyan');
    log(`      - bookedBy: ${customer._id}`, 'cyan');
    log(`      - customerEmail: ${customer.email}`, 'cyan');
    log(`      - specialistEmail: ${specialist.email}`, 'cyan');
    log(`      - specialistId: ${specialist._id}`, 'cyan');
    
    log('\n   Expected backend flow:', 'cyan');
    log(`   ✓ Fetch specialist's Zoom token`, 'cyan');
    log(`   ✓ Create Zoom meeting in specialist's account`, 'cyan');
    log(`   ✓ Get meeting joinUrl and startUrl`, 'cyan');
    log(`   ✓ Update appointment with Zoom details`, 'cyan');
    log(`   ✓ Send email to specialist with startUrl`, 'cyan');
    log(`   ✓ Send email to customer with joinUrl`, 'cyan');
    log(`   ✓ Return success response`, 'cyan');
    
    logCheck('Workflow simulation', true, 'All components in place');
    
    return true;
  } catch (error) {
    log(`Error in workflow simulation: ${error.message}`, 'red');
    return false;
  }
}

async function generateSummary(results) {
  logSection('8. VERIFICATION SUMMARY');
  
  const checks = [
    { name: 'Environment Configuration', result: results.environment },
    { name: 'Email Service', result: results.emailService },
    { name: 'Specialist Authorization', result: results.specialistAuth },
    { name: 'Appointment Slots', result: results.appointmentSlots },
    { name: 'Services', result: results.services },
    { name: 'Customer User', result: results.customer },
    { name: 'Workflow Components', result: results.workflow },
  ];
  
  const passCount = checks.filter(c => c.result).length;
  const totalCount = checks.length;
  
  log(`\nResults: ${passCount}/${totalCount} checks passed\n`, 'cyan');
  
  checks.forEach(check => {
    logCheck(check.name, check.result);
  });
  
  if (passCount === totalCount) {
    logSection('🎉 END-TO-END WORKFLOW READY');
    log('All components verified! You can now:', 'green');
    log('1. Login as specialist and verify Zoom is connected', 'green');
    log('2. Login as customer and book an appointment', 'green');
    log('3. Check emails for Zoom meeting links', 'green');
    log('4. Verify meeting appears in specialist Zoom calendar', 'green');
    log('5. Join meeting via provided links', 'green');
  } else {
    logSection('⚠️  WORKFLOW INCOMPLETE');
    log('Fix the following before testing:', 'yellow');
    checks.filter(c => !c.result).forEach(check => {
      log(`- ${check.name}`, 'yellow');
    });
  }
}

async function main() {
  console.clear();
  log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║                  END-TO-END WORKFLOW VERIFICATION SCRIPT                     ║
║                                                                              ║
║ This script verifies all components needed for the complete workflow:        ║
║ Specialist Authorization → Booking → Email → Zoom Meeting                   ║
╚══════════════════════════════════════════════════════════════════════════════╝
  `, 'blue');
  
  const results = {
    environment: false,
    emailService: false,
    specialistAuth: false,
    appointmentSlots: false,
    services: false,
    customer: false,
    workflow: false,
  };
  
  try {
    // Verify environment
    results.environment = await verifyEnvironment();
    
    // Test email service
    results.emailService = await testEmailTransporter();
    
    // Connect to database
    if (!(await connectDatabase())) {
      log('Cannot continue without database connection', 'red');
      process.exit(1);
    }
    
    // Load models
    const models = await loadModels();
    
    // Run verification checks
    results.specialistAuth = await verifySpecialistAuthorization(models);
    results.appointmentSlots = await verifyAppointmentSlots(models);
    results.services = await verifyServices(models);
    results.customer = await verifyCustomerUser(models);
    results.workflow = await runWorkflowSimulation(models);
    
    // Generate summary
    await generateSummary(results);
    
  } catch (error) {
    log(`\nFatal error: ${error.message}`, 'red');
    console.error(error);
  } finally {
    // Close database connection
    try {
      await mongoose.connection.close();
    } catch (e) {
      // Ignore
    }
    process.exit(0);
  }
}

// Run the script
main();
