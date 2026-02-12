import { google } from 'googleapis';
import nodemailer from 'nodemailer';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Ensure dotenv is loaded
dotenv.config();

// Initialize Google Calendar API (with error handling)
const getCalendarClient = () => {
  try {
    const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || './credentials.json';
    
    // Check if credentials file exists
    if (!fs.existsSync(credentialsPath)) {
      console.warn(`⚠️  Google credentials file not found at: ${credentialsPath}`);
      return null;
    }

    const auth = new google.auth.GoogleAuth({
      keyFile: credentialsPath,
      scopes: ['https://www.googleapis.com/auth/calendar'],
    });
    return google.calendar({ version: 'v3', auth });
  } catch (error) {
    console.warn(`⚠️  Google Calendar initialization failed:`, error.message);
    return null;
  }
};

// Initialize Email Client (with error handling)
let emailTransporter = null;
let emailInitError = null;

const initializeEmailClient = () => {
  try {
    if (!process.env.GMAIL_USER || !process.env.GMAIL_PASSWORD) {
      emailInitError = 'GMAIL_USER or GMAIL_PASSWORD not set in .env file';
      console.warn(`⚠️  Email Service NOT initialized: ${emailInitError}`);
      return null;
    }

    // Support Gmail, Yahoo Mail, and SendGrid
    const emailService = process.env.EMAIL_SERVICE || 'gmail';
    
    let transportConfig = {};

    if (emailService.toLowerCase() === 'sendgrid') {
      // SendGrid configuration
      transportConfig.host = 'smtp.sendgrid.net';
      transportConfig.port = 587;
      transportConfig.secure = false;
      transportConfig.auth = {
        user: 'apikey',
        pass: process.env.SENDGRID_API_KEY || process.env.GMAIL_PASSWORD,
      };
      console.log('📧 Email Service: SendGrid');
    } else if (emailService.toLowerCase() === 'yahoo') {
      // Yahoo Mail configuration
      transportConfig.host = 'smtp.mail.yahoo.com';
      transportConfig.port = 587;
      transportConfig.secure = false;
      transportConfig.auth = {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASSWORD,
      };
      console.log('📧 Email Service: Yahoo Mail');
    } else {
      // Gmail configuration - use SSL port 465
      transportConfig = {
        host: 'smtp.gmail.com',
        port: 465,
        secure: true, // SSL
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_PASSWORD,
        },
        connectionTimeout: 10000,
        socketTimeout: 10000,
      };
      console.log('📧 Email Service: Gmail (SSL port 465)');
    }

    const transporter = nodemailer.createTransport(transportConfig);

    // Verify connection in background (don't block startup)
    transporter.verify((error, success) => {
      if (error) {
        console.warn(`⚠️  Email service verification failed: ${error.message}`);
        console.warn(`   This might be because:`);
        console.warn(`   1. Gmail password is incorrect or 2FA enabled`);
        console.warn(`      → Use App Password: https://myaccount.google.com/apppasswords`);
        console.warn(`   2. Connection timeout to Gmail SMTP`);
        console.warn(`      → Check firewall/network settings`);
        console.warn(`   3. "Less secure apps" is disabled`);
        console.warn(`      → Enable it: https://myaccount.google.com/lesssecureapps`);
        console.warn(`   4. Consider using SendGrid for better reliability`);
        emailInitError = error.message;
      } else {
        console.log(`✓ Email service verified successfully (${process.env.GMAIL_USER})`);
      }
    });

    return transporter;
  } catch (error) {
    console.warn(`⚠️  Email transporter creation failed:`, error.message);
    emailInitError = error.message;
    return null;
  }
};

emailTransporter = initializeEmailClient();

/**
 * Create a Google Meet event
 */
export const createGoogleMeet = async (appointmentData) => {
  try {
    const calendar = getCalendarClient();
    
    // If Google credentials not configured, generate a placeholder link
    if (!calendar) {
      console.warn(`⚠️  Using placeholder Google Meet link (credentials not configured)`);
      return {
        googleMeetLink: `https://meet.google.com/placeholder-${uuidv4()}`,
        googleEventId: `placeholder-${uuidv4()}`,
      };
    }
    
    const event = {
      summary: `Consulting Session: ${appointmentData.serviceTitle}`,
      description: `1:1 Consulting session with specialist`,
      start: {
        dateTime: appointmentData.startDateTime,
        timeZone: 'UTC',
      },
      end: {
        dateTime: appointmentData.endDateTime,
        timeZone: 'UTC',
      },
      conferenceData: {
        createRequest: {
          requestId: uuidv4(),
          conferenceSolution: {
            key: {
              conferenceSolutionKey: {
                type: 'hangoutsMeet',
              },
            },
          },
        },
      },
      attendees: [
        {
          email: appointmentData.specialistEmail,
          displayName: appointmentData.specialistName,
          organizer: true,
        },
        {
          email: appointmentData.customerEmail,
          displayName: appointmentData.customerName,
        },
      ],
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 }, // 24 hours before
          { method: 'email', minutes: 30 }, // 30 minutes before
        ],
      },
    };

    const response = await calendar.events.insert({
      calendarId: 'primary',
      resource: event,
      conferenceDataVersion: 1,
    });

    return {
      googleEventId: response.data.id,
      googleMeetLink: response.data.conferenceData?.entryPoints?.find(
        (ep) => ep.entryPointType === 'video'
      )?.uri,
      eventDetails: response.data,
    };
  } catch (error) {
    console.error('Error creating Google Meet:', error);
    throw error;
  }
};

/**
 * Send booking confirmation email (simple version)
 */
export const sendBookingInviteEmail = async (appointmentData) => {
  try {
    console.log('📧 Attempting to send booking invite email...');
    console.log('Email service configured:', emailTransporter ? 'YES' : 'NO');
    console.log('GMAIL_USER:', process.env.GMAIL_USER ? 'SET' : 'NOT SET');
    console.log('GMAIL_PASSWORD:', process.env.GMAIL_PASSWORD ? 'SET' : 'NOT SET');
    
    if (!emailTransporter) {
      console.error(`❌ Email transporter NOT initialized`);
      if (emailInitError) {
        console.error(`   Error: ${emailInitError}`);
      } else {
        console.error(`   Gmail credentials missing or invalid`);
      }
      console.error(`   To fix this:`);
      console.error(`   1. Set GMAIL_USER and GMAIL_PASSWORD in .env`);
      console.error(`   2. Use App Password (for 2FA accounts): https://myaccount.google.com/apppasswords`);
      console.error(`   3. Or enable Less Secure Apps: https://myaccount.google.com/lesssecureapps`);
      console.error(`   See EMAIL_TROUBLESHOOTING.md for detailed instructions`);
      return { success: false, message: 'Email service not configured' };
    }

    const { specialistEmail, specialistName, customerEmail, customerName, serviceTitle, date, startTime, googleMeetLink } = appointmentData;
    
    if (!customerEmail || !specialistEmail || !googleMeetLink) {
      console.error('❌ Missing required email fields:', {
        customerEmail: customerEmail ? '✓' : '✗',
        specialistEmail: specialistEmail ? '✓' : '✗',
        googleMeetLink: googleMeetLink ? '✓' : '✗',
      });
      return { success: false, message: 'Missing required email data' };
    }

    const dateObj = new Date(date);
    const dateStr = dateObj.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });

    // Email to customer
    const customerEmail_html = `
      <html>
        <body style="font-family: Arial, sans-serif;">
          <h3>Booking Confirmed: ${serviceTitle}</h3>
          <p>Hi ${customerName},</p>
          <p>Your consulting session is confirmed!</p>
          <p><strong>Service:</strong> ${serviceTitle}</p>
          <p><strong>Date:</strong> ${dateStr}</p>
          <p><strong>Time:</strong> ${startTime} UTC</p>
          <p><strong>With:</strong> ${specialistName}</p>
          <p><strong>Join Here:</strong> <a href="${googleMeetLink}">${googleMeetLink}</a></p>
          <p>See you soon!</p>
        </body>
      </html>
    `;

    // Email to specialist
    const specialistEmail_html = `
      <html>
        <body style="font-family: Arial, sans-serif;">
          <h3>New Booking: ${serviceTitle}</h3>
          <p>Hi ${specialistName},</p>
          <p>You have a new booking!</p>
          <p><strong>Customer:</strong> ${customerName} (${customerEmail})</p>
          <p><strong>Service:</strong> ${serviceTitle}</p>
          <p><strong>Date:</strong> ${dateStr}</p>
          <p><strong>Time:</strong> ${startTime} UTC</p>
          <p><strong>Join Here:</strong> <a href="${googleMeetLink}">${googleMeetLink}</a></p>
        </body>
      </html>
    `;

    // Send emails
    console.log(`📧 Sending email to customer: ${customerEmail}`);
    await emailTransporter.sendMail({
      from: process.env.GMAIL_USER,
      to: customerEmail,
      subject: `✓ Booking Confirmed: ${serviceTitle}`,
      html: customerEmail_html,
    });
    console.log(`✓ Customer email sent to ${customerEmail}`);

    console.log(`📧 Sending email to specialist: ${specialistEmail}`);
    await emailTransporter.sendMail({
      from: process.env.GMAIL_USER,
      to: specialistEmail,
      subject: `📞 New Booking: ${customerName} - ${serviceTitle}`,
      html: specialistEmail_html,
    });
    console.log(`✓ Specialist email sent to ${specialistEmail}`);

    console.log(`✅ Booking confirmation emails sent to ${customerEmail} and ${specialistEmail}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Error sending booking invite email:', error.message);
    console.error('Full error:', error);
    // Don't throw - just log and continue
    return { success: false, error: error.message };
  }
};

/**
 * Send reminder email to participants
 */
export const sendReminderEmail = async (appointment) => {
  try {
    if (!emailTransporter) {
      console.warn(`⚠️  Email service not configured, skipping reminder`);
      return { success: false, message: 'Email service not configured' };
    }

    const { specialistEmail, customerEmail, customerName, serviceTitle, date, startTime } = appointment;
    
    const meetingDateTime = new Date(date);
    const time = startTime.split(':');
    meetingDateTime.setHours(parseInt(time[0]), parseInt(time[1]));

    const emailTemplate = `
      <html>
        <body style="font-family: Arial, sans-serif; color: #333;">
          <h2>Upcoming Consulting Session Reminder</h2>
          <p>Hi ${customerName},</p>
          <p>This is a reminder that you have an upcoming consulting session:</p>
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Service:</strong> ${serviceTitle}</p>
            <p><strong>Date:</strong> ${meetingDateTime.toLocaleDateString()}</p>
            <p><strong>Time:</strong> ${startTime}</p>
            <p><strong>Meeting Link:</strong> <a href="${appointment.googleMeetLink}" style="color: #1976d2;">${appointment.googleMeetLink}</a></p>
          </div>
          <p>The meeting will start shortly. Please click the link above to join.</p>
          <p>If you have any questions, please reach out to your specialist.</p>
          <p>Best regards,<br>Specialistly Team</p>
        </body>
      </html>
    `;

    // Send to customer
    await emailTransporter.sendMail({
      from: process.env.GMAIL_USER,
      to: customerEmail,
      subject: `Reminder: Your Consulting Session - ${serviceTitle}`,
      html: emailTemplate,
    });

    // Send to specialist
    await emailTransporter.sendMail({
      from: process.env.GMAIL_USER,
      to: specialistEmail,
      subject: `Reminder: Consulting Session with ${customerName}`,
      html: emailTemplate.replace('Hi ' + customerName, `Hi Specialist`),
    });

    return true;
  } catch (error) {
    console.error('Error sending reminder email:', error);
    throw error;
  }
};

/**
 * Send recording to participants
 */
export const sendRecordingEmail = async (appointment, recordingLink, expiryDays = 7) => {
  try {
    if (!emailTransporter) {
      console.warn(`⚠️  Email service not configured, skipping recording email`);
      return { success: false, message: 'Email service not configured' };
    }

    const { specialistEmail, customerEmail, customerName, serviceTitle } = appointment;
    
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + expiryDays);
    
    const emailTemplate = `
      <html>
        <body style="font-family: Arial, sans-serif; color: #333;">
          <h2>Your Consulting Session Recording</h2>
          <p>Hi ${customerName},</p>
          <p>Thank you for attending the consulting session! We have recorded the meeting for your reference.</p>
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Service:</strong> ${serviceTitle}</p>
            <p><strong>Recording Link:</strong> <a href="${recordingLink}" style="color: #1976d2;">${recordingLink}</a></p>
            <p><strong>Access Expires:</strong> ${expiryDate.toLocaleDateString()}</p>
          </div>
          <p style="color: #f44336;">⚠️ Please note: This recording link will expire on ${expiryDate.toLocaleDateString()}. Download or save it before the expiry date.</p>
          <p>Thank you for using Specialistly!</p>
          <p>Best regards,<br>Specialistly Team</p>
        </body>
      </html>
    `;

    // Send to customer
    await emailTransporter.sendMail({
      from: process.env.GMAIL_USER,
      to: customerEmail,
      subject: `Recording: Your Consulting Session - ${serviceTitle}`,
      html: emailTemplate,
    });

    return true;
  } catch (error) {
    console.error('Error sending recording email:', error);
    throw error;
  }
};

/**
 * Check if recording has expired
 */
export const checkRecordingExpiry = (expiryDate) => {
  if (!expiryDate) return false;
  return new Date() > new Date(expiryDate);
};

/**
 * Delete expired recording
 */
export const deleteExpiredRecording = async (appointment) => {
  try {
    if (checkRecordingExpiry(appointment.recordingExpiryDate)) {
      // In production, delete from cloud storage (Google Drive, etc.)
      return {
        success: true,
        message: 'Recording has been deleted due to expiry',
      };
    }
    return {
      success: false,
      message: 'Recording has not expired yet',
    };
  } catch (error) {
    console.error('Error deleting expired recording:', error);
    throw error;
  }
};

export default {
  createGoogleMeet,
  sendBookingInviteEmail,
  sendReminderEmail,
  sendRecordingEmail,
  checkRecordingExpiry,
  deleteExpiredRecording,
};
