#!/usr/bin/env node
/**
 * End-to-End Workflow Setup Script
 * 
 * Creates test users (specialist and customer) and appointment slots
 * for the complete workflow verification
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcrypt';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Color codes
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

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

async function loadModels() {
  try {
    const User = (await import('./models/User.js')).default;
    const UserOAuthToken = (await import('./models/UserOAuthToken.js')).default;
    const AppointmentSlot = (await import('./models/AppointmentSlot.js')).default;
    const Service = (await import('./models/Service.js')).default;
    
    return { User, UserOAuthToken, AppointmentSlot, Service };
  } catch (error) {
    logError(`Failed to load models: ${error.message}`);
    throw error;
  }
}

async function connectDatabase() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    await mongoose.connect(mongoUri);
    logSuccess(`Connected to MongoDB`);
    return true;
  } catch (error) {
    logError(`Failed to connect to MongoDB: ${error.message}`);
    return false;
  }
}

async function createOrUpdateSpecialist(models) {
  logSection('CREATING SPECIALIST USER');
  
  const { User } = models;
  const specialistEmail = 'sivakumarganeshm@gmail.com';
  const password = 'password123';
  
  try {
    // Check if specialist already exists
    let specialist = await User.findOne({ email: specialistEmail });
    
    if (specialist) {
      logSuccess(`Specialist already exists: ${specialistEmail}`);
      log(`  ID: ${specialist._id}`, 'cyan');
      log(`  Name: ${specialist.name}`, 'cyan');
      log(`  Role: ${specialist.role}`, 'cyan');
      return specialist;
    }
    
    // Create specialist
    const hashedPassword = await bcrypt.hash(password, 10);
    specialist = new User({
      name: 'Sivakumar Ganeshm',
      email: specialistEmail,
      password: hashedPassword,
      role: 'specialist',
      membership: 'pro',
      isSpecialist: true,
      specialization: 'Technology Consulting',
      bio: 'Expert in technology and business consulting',
      experience: '10+ years',
      profilePicture: null,
      isEmailVerified: true,
      isPhoneVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    
    await specialist.save();
    logSuccess(`Created specialist user`);
    log(`  Email: ${specialist.email}`, 'cyan');
    log(`  ID: ${specialist._id}`, 'cyan');
    
    return specialist;
  } catch (error) {
    logError(`Failed to create specialist: ${error.message}`);
    throw error;
  }
}

async function createOrUpdateCustomer(models) {
  logSection('CREATING CUSTOMER USER');
  
  const { User } = models;
  const customerEmail = 'sinduja.vel@gmail.com';
  const password = 'password123';
  
  try {
    // Check if customer already exists
    let customer = await User.findOne({ email: customerEmail });
    
    if (customer) {
      logSuccess(`Customer already exists: ${customerEmail}`);
      log(`  ID: ${customer._id}`, 'cyan');
      log(`  Name: ${customer.name}`, 'cyan');
      log(`  Membership: ${customer.membership}`, 'cyan');
      return customer;
    }
    
    // Create customer
    const hashedPassword = await bcrypt.hash(password, 10);
    customer = new User({
      name: 'Sinduja Vel',
      email: customerEmail,
      password: hashedPassword,
      role: 'user',
      membership: 'customer',
      bio: 'Technology professional',
      profilePicture: null,
      isEmailVerified: true,
      isPhoneVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    
    await customer.save();
    logSuccess(`Created customer user`);
    log(`  Email: ${customer.email}`, 'cyan');
    log(`  ID: ${customer._id}`, 'cyan');
    
    return customer;
  } catch (error) {
    logError(`Failed to create customer: ${error.message}`);
    throw error;
  }
}

async function createAppointmentSlots(models, specialist) {
  logSection('CREATING APPOINTMENT SLOTS');
  
  const { AppointmentSlot } = models;
  
  try {
    // Check existing slots
    const existingSlots = await AppointmentSlot.find({ specialistId: specialist._id });
    
    if (existingSlots.length > 0) {
      logSuccess(`Specialist already has ${existingSlots.length} appointment slots`);
      existingSlots.forEach((slot, idx) => {
        log(`  [${idx + 1}] ${new Date(slot.date).toLocaleDateString()} ${slot.startTime}-${slot.endTime} (${slot.status})`, 'cyan');
      });
      return;
    }
    
    // Create appointment slots for next 7 days
    const slots = [];
    const today = new Date();
    
    for (let day = 1; day <= 7; day++) {
      const slotDate = new Date(today);
      slotDate.setDate(slotDate.getDate() + day);
      
      // Create 2 slots per day
      const times = [
        { start: '10:00 AM', end: '11:00 AM' },
        { start: '02:00 PM', end: '03:00 PM' },
      ];
      
      for (const time of times) {
        const slot = new AppointmentSlot({
          specialistId: specialist._id,
          specialistEmail: specialist.email,
          date: slotDate,
          startTime: time.start,
          endTime: time.end,
          status: 'available',
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        
        slots.push(slot);
      }
    }
    
    // Save all slots
    await AppointmentSlot.insertMany(slots);
    logSuccess(`Created ${slots.length} appointment slots`);
    
    // Show created slots
    log('\n  Sample slots:', 'cyan');
    slots.slice(0, 3).forEach((slot, idx) => {
      log(`  [${idx + 1}] ${new Date(slot.date).toLocaleDateString()} ${slot.startTime}-${slot.endTime}`, 'cyan');
    });
    
  } catch (error) {
    logError(`Failed to create appointment slots: ${error.message}`);
    throw error;
  }
}

async function createTestService(models, specialist) {
  logSection('CREATING TEST SERVICE');
  
  const { Service } = models;
  
  try {
    // Check existing services
    const existingService = await Service.findOne({ creator: specialist.email });
    
    if (existingService) {
      logSuccess(`Specialist already has a service`);
      log(`  Title: ${existingService.title}`, 'cyan');
      log(`  Price: ${existingService.price}`, 'cyan');
      log(`  Duration: ${existingService.duration} min`, 'cyan');
      return;
    }
    
    // Create test service
    const service = new Service({
      title: 'Technology Consulting Session',
      description: 'One-on-one consultation for technology and business strategy',
      price: '100',
      duration: '60',
      capacity: '1',
      type: 'consulting',
      creator: specialist.email,
      status: 'active',
      schedule: 'Flexible',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    
    await service.save();
    logSuccess(`Created test service`);
    log(`  Title: ${service.title}`, 'cyan');
    log(`  Price: $${service.price}`, 'cyan');
    log(`  Duration: ${service.duration} minutes`, 'cyan');
    
  } catch (error) {
    logError(`Failed to create service: ${error.message}`);
    throw error;
  }
}

async function main() {
  console.clear();
  log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║           END-TO-END WORKFLOW SETUP - CREATE TEST DATA                       ║
║                                                                              ║
║ This script creates:                                                         ║
║  • Specialist user (sivakumarganeshm@gmail.com)                              ║
║  • Customer user (sinduja.vel@gmail.com)                                     ║
║  • Appointment slots for next 7 days                                         ║
║  • Sample service for testing                                               ║
╚══════════════════════════════════════════════════════════════════════════════╝
  `, 'blue');
  
  try {
    // Connect to database
    if (!(await connectDatabase())) {
      logError('Cannot continue without database connection');
      process.exit(1);
    }
    
    // Load models
    const models = await loadModels();
    
    // Create or update users
    const specialist = await createOrUpdateSpecialist(models);
    const customer = await createOrUpdateCustomer(models);
    
    // Create appointment slots
    await createAppointmentSlots(models, specialist);
    
    // Create test service
    await createTestService(models, specialist);
    
    // Summary
    logSection('✅ SETUP COMPLETE');
    log('\nTest Data Created:', 'green');
    log(`  Specialist: ${specialist.email}`, 'cyan');
    log(`  Customer: ${customer.email}`, 'cyan');
    log(`\nNext Steps:`, 'yellow');
    log(`  1. Specialist must authorize Zoom in Settings`, 'yellow');
    log(`     → Settings → Zoom Integration → Connect Zoom Account`, 'yellow');
    log(`  2. Customer can then book an appointment`, 'yellow');
    log(`  3. System will create Zoom meeting and send emails`, 'yellow');
    log(`  4. Meeting will appear in specialist's Zoom calendar`, 'yellow');
    log(`\nTest the workflow:`, 'yellow');
    log(`  node verify-workflow.js  (to verify all components)`, 'yellow');
    
  } catch (error) {
    logError(`Setup failed: ${error.message}`);
    console.error(error);
  } finally {
    try {
      await mongoose.connection.close();
      logSuccess('Database connection closed');
    } catch (e) {
      // Ignore
    }
    process.exit(0);
  }
}

// Run the setup
main();
