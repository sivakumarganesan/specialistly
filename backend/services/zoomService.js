import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import UserOAuthToken from '../models/UserOAuthToken.js';

dotenv.config();

// Zoom API base URL
const ZOOM_API_BASE = 'https://api.zoom.us/v2';

// Email transporter setup
let emailTransporter = null;
let emailInitError = null;

const initializeEmailClient = () => {
  try {
    if (!process.env.GMAIL_USER || !process.env.GMAIL_PASSWORD) {
      emailInitError = 'GMAIL_USER or GMAIL_PASSWORD not set in .env file';
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
      // Gmail configuration - try SSL first (port 465), fallback to TLS (port 587)
      transportConfig = {
        host: 'smtp.gmail.com',
        port: 465,
        secure: true, // SSL
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_PASSWORD,
        },
        connectionTimeout: 10000, // 10 seconds
        socketTimeout: 10000, // 10 seconds
      };
      console.log('📧 Email Service: Gmail (SSL port 465)');
    }

    const transporter = nodemailer.createTransport(transportConfig);

    transporter.verify((error, success) => {
      if (error) {
        console.warn(`⚠️  Email service verification failed: ${error.message}`);
        console.warn(`   Service: ${emailService}`);
        console.warn(`   Port: ${transportConfig.port}`);
        console.warn(`   Secure: ${transportConfig.secure}`);
        console.warn(`   TROUBLESHOOTING:`);
        console.warn(`   1. If Gmail: Use App Password (not regular password)`);
        console.warn(`      https://myaccount.google.com/apppasswords`);
        console.warn(`   2. Check GMAIL_USER and GMAIL_PASSWORD in .env`);
        console.warn(`   3. Try PORT 587 by setting: EMAIL_PORT=587 in .env`);
        console.warn(`   4. Consider SendGrid for better reliability`);
        emailInitError = error.message;
      } else {
        console.log(`✓ Email service verified successfully`);
        console.log(`  Provider: ${emailService}`);
        console.log(`  User: ${process.env.GMAIL_USER}`);
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
 * Refresh Zoom access token using refresh token
 * @param {string} specialistId - Specialist user ID
 * @returns {Promise<string>} - New access token
 */
const refreshZoomAccessToken = async (specialistId) => {
  try {
    const tokenRecord = await UserOAuthToken.findOne({ userId: specialistId });
    
    if (!tokenRecord || !tokenRecord.zoomRefreshToken) {
      throw new Error('No refresh token available');
    }

    const auth = Buffer.from(
      `${process.env.ZOOM_CLIENT_ID}:${process.env.ZOOM_CLIENT_SECRET}`
    ).toString('base64');

    const response = await axios.post('https://zoom.us/oauth/token', null, {
      headers: {
        Authorization: `Basic ${auth}`,
      },
      params: {
        grant_type: 'refresh_token',
        refresh_token: tokenRecord.zoomRefreshToken,
      },
    });

    const newAccessToken = response.data.access_token;
    const expiryTime = new Date();
    expiryTime.setSeconds(expiryTime.getSeconds() + response.data.expires_in);

    // Update token in database
    tokenRecord.zoomAccessToken = newAccessToken;
    tokenRecord.zoomAccessTokenExpiry = expiryTime;
    if (response.data.refresh_token) {
      tokenRecord.zoomRefreshToken = response.data.refresh_token;
    }
    await tokenRecord.save();

    console.log('✓ Zoom access token refreshed successfully');
    return newAccessToken;
  } catch (error) {
    console.error('❌ Failed to refresh Zoom token:', error.message);
    throw new Error('Failed to refresh Zoom access token. Please reconnect your Zoom account.');
  }
};

/**
 * Get specialist's Zoom access token from OAuth
 * @param {string} specialistId - Specialist user ID
 * @returns {string} - Access token
 */
export const getSpecialistZoomToken = async (specialistId) => {
  try {
    if (!specialistId) {
      throw new Error('Specialist ID is required');
    }

    const tokenRecord = await UserOAuthToken.findOne({ userId: specialistId });
    
    if (!tokenRecord) {
      throw new Error(`No Zoom token found for specialist ${specialistId}. User must authorize Zoom access first.`);
    }

    if (!tokenRecord.zoomAccessToken || tokenRecord.zoomAccessToken === 'pending') {
      throw new Error('Zoom access token not available');
    }

    // Check if token is expired and refresh if needed
    if (tokenRecord.zoomAccessTokenExpiry && new Date() > tokenRecord.zoomAccessTokenExpiry) {
      console.log('🔄 Zoom token expired, attempting refresh...');
      return await refreshZoomAccessToken(specialistId);
    }

    return tokenRecord.zoomAccessToken;
  } catch (error) {
    console.error('❌ Error getting specialist Zoom token:', error.message);
    throw error;
  }
};

/**
 * Get Zoom OAuth access token
 */
export const getZoomAccessToken = async () => {
  try {
    if (!process.env.ZOOM_CLIENT_ID || !process.env.ZOOM_CLIENT_SECRET) {
      console.error('❌ ZOOM_CLIENT_ID or ZOOM_CLIENT_SECRET not set');
      return null;
    }

    const auth = Buffer.from(
      `${process.env.ZOOM_CLIENT_ID}:${process.env.ZOOM_CLIENT_SECRET}`
    ).toString('base64');

    const response = await axios.post('https://zoom.us/oauth/token', null, {
      headers: {
        Authorization: `Basic ${auth}`,
      },
      params: {
        grant_type: 'client_credentials',
        scope: 'meeting:write meeting:read recording:read user:read',
      },
    });

    return response.data.access_token;
  } catch (error) {
    console.error('Error getting Zoom access token:', error.message);
    throw error;
  }
};

/**
 * Create a Zoom meeting
 * @param {Object} appointmentData - Appointment details
 * @returns {Object} - Meeting details including join_url and meeting_id
 */
export const createZoomMeeting = async (appointmentData) => {
  let meetingPayload; // Initialize early to avoid reference errors in catch block
  try {
    console.log('🎥 Creating Zoom meeting...');

    const {
      specialistEmail,
      specialistName,
      customerEmail,
      customerName,
      serviceTitle,
      startDateTime,
      endDateTime,
      specialistId,
    } = appointmentData;

    // Get specialist's Zoom access token (user-managed OAuth)
    let accessToken;
    try {
      accessToken = await getSpecialistZoomToken(specialistId);
      console.log(`✅ Using specialist's Zoom token for user ID: ${specialistId}`);
    } catch (tokenError) {
      console.warn(`⚠️  Could not get specialist's token: ${tokenError.message}`);
      throw tokenError;
    }

    if (!accessToken) {
      throw new Error('Failed to obtain Zoom access token from specialist');
    }

    // Create meeting payload
    // Format date as YYYY-MM-DD HH:mm:ss for Zoom API
    const startDate = new Date(startDateTime);
    const endDate = new Date(endDateTime);
    const startTimeFormatted = startDate.toISOString().replace('T', ' ').split('.')[0];
    
    // Calculate duration in minutes
    const durationMs = endDate - startDate;
    const durationMinutes = Math.ceil(durationMs / (1000 * 60));
    
    if (durationMinutes <= 0) {
      throw new Error(`Invalid meeting duration: start and end times must be different. Start: ${startDateTime}, End: ${endDateTime}`);
    }
    
    if (durationMinutes > 1440) { // Max 24 hours
      throw new Error(`Meeting duration exceeds 24 hours: ${durationMinutes} minutes`);
    }
    
    meetingPayload = {
      topic: `${serviceTitle} - ${customerName}`,
      type: 2, // Scheduled meeting
      start_time: startTimeFormatted,
      duration: durationMinutes,
      timezone: 'UTC',
      agenda: `Consultation session: ${serviceTitle}`,
      settings: {
        host_video: true,
        participant_video: true,
        join_before_host: false,
        mute_upon_entry: false,
        approval_type: 0, // Automatically approve meeting join requests
        audio: 'both', // Both VoIP and phone
        auto_recording: 'none', // Disable recording to avoid 400 errors
        waiting_room: false, // Disable waiting room to simplify
        email_notification: true,
      },
    };

    // Get specialist's Zoom user ID from the OAuth token
    const tokenRecord = await UserOAuthToken.findOne({ userId: specialistId });
    if (!tokenRecord) {
      throw new Error('Zoom OAuth token not found for specialist');
    }

    const zoomUserId = tokenRecord.zoomUserId;
    console.log(`✅ Using Zoom user ID: ${zoomUserId}`);
    console.log('📋 Meeting payload:', JSON.stringify(meetingPayload, null, 2));

    // Create meeting for the specialist (using their Zoom user ID)
    const meetingResponse = await axios.post(
      `${ZOOM_API_BASE}/users/${zoomUserId}/meetings`,
      meetingPayload,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log(`✅ Zoom meeting created: ${meetingResponse.data.id}`);

    return {
      zoomMeetingId: meetingResponse.data.id,
      joinUrl: meetingResponse.data.join_url,
      startUrl: meetingResponse.data.start_url,
      hostEmail: specialistEmail,
      hostId: specialistId,
      zoomUserId: zoomUserId,
      participantEmails: [customerEmail],
      recordingEnabled: true,
      eventDetails: meetingResponse.data,
    };
  } catch (error) {
    // Log detailed error information
    if (error.response?.data) {
      console.error('❌ Zoom API Error Details:');
      console.error('Status:', error.response.status);
      console.error('Error Data:', JSON.stringify(error.response.data, null, 2));
      if (meetingPayload) {
        console.error('📋 Request payload that failed:', JSON.stringify(meetingPayload, null, 2));
      }
    } else {
      console.error('❌ Error creating Zoom meeting:', error.message);
    }
    throw error;
  }
};

/**
 * Get meeting details from Zoom
 */
export const getZoomMeetingDetails = async (specialistId, meetingId) => {
  try {
    const accessToken = await getZoomAccessToken();
    if (!accessToken) {
      throw new Error('Failed to obtain Zoom access token');
    }

    const response = await axios.get(
      `${ZOOM_API_BASE}/users/${specialistId}/meetings/${meetingId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error fetching Zoom meeting details:', error.message);
    throw error;
  }
};

/**
 * Get meeting recordings
 */
export const getZoomRecordings = async (specialistId, meetingId) => {
  try {
    const accessToken = await getZoomAccessToken();
    if (!accessToken) {
      throw new Error('Failed to obtain Zoom access token');
    }

    const response = await axios.get(
      `${ZOOM_API_BASE}/users/${specialistId}/recordings?meeting_id=${meetingId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    return response.data.recording_files || [];
  } catch (error) {
    console.error('Error fetching Zoom recordings:', error.message);
    throw error;
  }
};

/**
 * Send meeting invitation emails
 */
export const sendMeetingInvitation = async (appointmentData) => {
  try {
    console.log('📧 Sending Zoom meeting invitations...');

    if (!emailTransporter) {
      console.error(`❌ EMAIL SERVICE NOT CONFIGURED`);
      console.error(`   Reason: ${emailInitError || 'Unknown'}`);
      console.error(`   FIX: Verify in .env:`);
      console.error(`   - GMAIL_USER = ${process.env.GMAIL_USER || '❌ NOT SET'}`);
      console.error(`   - GMAIL_PASSWORD = ${process.env.GMAIL_PASSWORD ? '✓ SET' : '❌ NOT SET'}`);
      console.error(`   - If 2FA enabled, use App Password from: https://myaccount.google.com/apppasswords`);
      return { success: false, message: 'Email service not configured. Check server logs.' };
    }

    const {
      specialistEmail,
      specialistName,
      customerEmail,
      customerName,
      serviceTitle,
      date,
      startTime,
      joinUrl,
      zoomMeetingId,
    } = appointmentData;

    if (!customerEmail || !specialistEmail || !joinUrl) {
      console.error('❌ Missing required meeting invitation fields');
      return { success: false, message: 'Missing required meeting data' };
    }

    const dateObj = new Date(date);
    const dateStr = dateObj.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

    // Email template for participant
    const participantEmailHtml = `
      <html>
        <body style="font-family: Arial, sans-serif; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 20px auto; background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #2c3e50;">🎥 Zoom Meeting Invitation</h2>
            <p>Hi ${customerName},</p>
            
            <p>You have been invited to join a <strong>${serviceTitle}</strong> session with <strong>${specialistName}</strong>.</p>
            
            <div style="background-color: #f0f8ff; padding: 20px; border-left: 4px solid #2196F3; margin: 20px 0; border-radius: 4px;">
              <p><strong>📅 Date:</strong> ${dateStr}</p>
              <p><strong>⏰ Time:</strong> ${startTime} UTC</p>
              <p><strong>👤 Host:</strong> ${specialistName}</p>
              <p><strong>📞 Meeting ID:</strong> ${zoomMeetingId}</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${joinUrl}" style="display: inline-block; background-color: #2196F3; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; font-weight: bold;">
                Join Zoom Meeting
              </a>
            </div>
            
            <p style="color: #666; font-size: 14px;">
              <strong>📝 Note:</strong> Please join 5 minutes before the scheduled time. You can also join directly using the Meeting ID ${zoomMeetingId} if the link doesn't work.
            </p>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            <p style="color: #999; font-size: 12px;">This is an automated message from Specialistly. Please do not reply to this email.</p>
          </div>
        </body>
      </html>
    `;

    // Email template for specialist (host)
    const hostEmailHtml = `
      <html>
        <body style="font-family: Arial, sans-serif; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 20px auto; background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #2c3e50;">🎥 Your Zoom Meeting is Ready</h2>
            <p>Hi ${specialistName},</p>
            
            <p>Your upcoming <strong>${serviceTitle}</strong> meeting with <strong>${customerName}</strong> is scheduled and ready to start.</p>
            
            <div style="background-color: #f0f8ff; padding: 20px; border-left: 4px solid #2196F3; margin: 20px 0; border-radius: 4px;">
              <p><strong>📅 Date:</strong> ${dateStr}</p>
              <p><strong>⏰ Time:</strong> ${startTime} UTC</p>
              <p><strong>👥 Participant:</strong> ${customerName} (${customerEmail})</p>
              <p><strong>📞 Meeting ID:</strong> ${zoomMeetingId}</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${joinUrl}" style="display: inline-block; background-color: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; font-weight: bold; margin-right: 10px;">
                Start Zoom Meeting
              </a>
            </div>
            
            <p style="color: #666; font-size: 14px;">
              <strong>📹 Recording:</strong> This meeting will be automatically recorded in the cloud. After the session, the recording will be available in your Zoom account.
            </p>
            
            <p style="color: #666; font-size: 14px;">
              <strong>💡 Tips:</strong>
              <ul>
                <li>Test your audio and video before the meeting starts</li>
                <li>Ensure you have a stable internet connection</li>
                <li>You can start the meeting up to 15 minutes early</li>
                <li>Share the join link with the participant if needed</li>
              </ul>
            </p>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            <p style="color: #999; font-size: 12px;">This is an automated message from Specialistly. Please do not reply to this email.</p>
          </div>
        </body>
      </html>
    `;

    // Send emails
    try {
      console.log(`📧 Sending to participant: ${customerEmail}`);
      await emailTransporter.sendMail({
        from: process.env.GMAIL_USER,
        to: customerEmail,
        subject: `🎥 Zoom Meeting Invitation: ${serviceTitle}`,
        html: participantEmailHtml,
      });
      console.log(`✓ Participant email sent to ${customerEmail}`);
    } catch (participantEmailError) {
      console.error(`❌ Failed to send participant email to ${customerEmail}:`, participantEmailError.message);
      throw participantEmailError;
    }

    try {
      console.log(`📧 Sending to host: ${specialistEmail}`);
      await emailTransporter.sendMail({
        from: process.env.GMAIL_USER,
        to: specialistEmail,
        subject: `🎥 Your Zoom Meeting: ${customerName} - ${serviceTitle}`,
        html: hostEmailHtml,
      });
      console.log(`✓ Host email sent to ${specialistEmail}`);
    } catch (hostEmailError) {
      console.error(`❌ Failed to send host email to ${specialistEmail}:`, hostEmailError.message);
      throw hostEmailError;
    }

    console.log(`✅ Zoom meeting invitations sent successfully`);
    return { success: true };
  } catch (error) {
    console.error('❌ ERROR sending meeting invitation:', error.message);
    console.error('   This is why customer did NOT receive the Zoom appointment email');
    return { success: false, message: error.message, error: error.toString() };
  }
};

/**
 * Send recording link to participant
 */
export const sendRecordingLink = async (appointmentData, recordingUrl) => {
  try {
    console.log('📧 Sending recording link to participant...');

    if (!emailTransporter) {
      console.error(`❌ Email service not configured`);
      return { success: false, message: 'Email service not configured' };
    }

    const { customerEmail, customerName, serviceTitle, specialistName } = appointmentData;

    const recordingEmailHtml = `
      <html>
        <body style="font-family: Arial, sans-serif; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 20px auto; background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #2c3e50;">📹 Your Recording is Ready</h2>
            <p>Hi ${customerName},</p>
            
            <p>Thank you for attending the <strong>${serviceTitle}</strong> session with <strong>${specialistName}</strong>. Your recording is now available!</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${recordingUrl}" style="display: inline-block; background-color: #FF6B6B; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; font-weight: bold;">
                View Recording
              </a>
            </div>
            
            <p style="color: #666; font-size: 14px;">
              <strong>⏱️ Note:</strong> The recording link will be available for 30 days. Please download or save it before the expiry date.
            </p>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            <p style="color: #999; font-size: 12px;">This is an automated message from Specialistly. Please do not reply to this email.</p>
          </div>
        </body>
      </html>
    `;

    await emailTransporter.sendMail({
      from: process.env.GMAIL_USER,
      to: customerEmail,
      subject: `📹 Your Recording: ${serviceTitle}`,
      html: recordingEmailHtml,
    });

    console.log(`✅ Recording link sent to ${customerEmail}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Error sending recording link:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send meeting reminder
 */
export const sendMeetingReminder = async (appointmentData, hoursUntilMeeting) => {
  try {
    console.log(`📧 Sending ${hoursUntilMeeting}h reminder for meeting...`);

    if (!emailTransporter) {
      console.error(`❌ Email service not configured`);
      return { success: false, message: 'Email service not configured' };
    }

    const {
      customerEmail,
      customerName,
      specialistName,
      serviceTitle,
      startTime,
      joinUrl,
    } = appointmentData;

    const reminderEmailHtml = `
      <html>
        <body style="font-family: Arial, sans-serif; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 20px auto; background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #2c3e50;">⏰ Meeting Reminder</h2>
            <p>Hi ${customerName},</p>
            
            <p>This is a reminder that your <strong>${serviceTitle}</strong> session with <strong>${specialistName}</strong> is starting in <strong>${hoursUntilMeeting} hours</strong>.</p>
            
            <div style="background-color: #fff3cd; padding: 20px; border-left: 4px solid #ffc107; margin: 20px 0; border-radius: 4px;">
              <p><strong>⏰ Time:</strong> ${startTime} UTC</p>
              <p style="margin: 0;">Please make sure you're ready to join on time!</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${joinUrl}" style="display: inline-block; background-color: #2196F3; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; font-weight: bold;">
                Join Meeting
              </a>
            </div>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            <p style="color: #999; font-size: 12px;">This is an automated message from Specialistly. Please do not reply to this email.</p>
          </div>
        </body>
      </html>
    `;

    await emailTransporter.sendMail({
      from: process.env.GMAIL_USER,
      to: customerEmail,
      subject: `⏰ Reminder: Your ${serviceTitle} Session Starts in ${hoursUntilMeeting} Hours`,
      html: reminderEmailHtml,
    });

    console.log(`✅ Reminder sent to ${customerEmail}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Error sending reminder:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send Zoom re-authorization notification to specialist
 */
export const sendZoomReAuthNotification = async (specialistEmail, specialistName, customerName, serviceTitle) => {
  try {
    console.log(`📧 Sending Zoom re-auth notification to ${specialistEmail}...`);

    if (!emailTransporter) {
      console.error(`❌ Email service not configured`);
      return { success: false, message: 'Email service not configured' };
    }

    const zoomAuthUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/settings`;
    
    const reAuthEmailHtml = `
      <html>
        <body style="font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #1a1a1a; margin-top: 0;">🔄 Action Required: Re-authorize Zoom</h2>
            
            <p style="color: #666; font-size: 14px;">Hi ${specialistName},</p>
            
            <p style="color: #666; font-size: 14px;">
              A customer (<strong>${customerName}</strong>) tried to book a <strong>${serviceTitle}</strong> appointment with you, but the booking failed because your Zoom account authorization has expired or is invalid.
            </p>
            
            <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <p style="color: #856404; margin: 0; font-size: 14px;">
                <strong>⚠️ Your Zoom integration needs to be re-authorized immediately</strong> to continue accepting bookings.
              </p>
            </div>
            
            <p style="color: #666; font-size: 14px;">
              Please re-authorize your Zoom account in your Specialistly settings:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${zoomAuthUrl}" style="background-color: #4285F4; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                Re-authorize Zoom Account
              </a>
            </div>
            
            <p style="color: #666; font-size: 14px;">
              <strong>Steps to re-authorize:</strong>
            </p>
            <ol style="color: #666; font-size: 14px;">
              <li>Go to your Settings page</li>
              <li>Find the "Zoom Integration" section</li>
              <li>Click the "Re-authorize" button</li>
              <li>Follow the Zoom authorization process</li>
            </ol>
            
            <p style="color: #666; font-size: 14px;">
              Once re-authorized, customers will be able to book appointments with you again.
            </p>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            <p style="color: #999; font-size: 12px;">This is an automated message from Specialistly. Please do not reply to this email.</p>
          </div>
        </body>
      </html>
    `;

    await emailTransporter.sendMail({
      from: process.env.GMAIL_USER,
      to: specialistEmail,
      subject: `⚠️ Action Required: Re-authorize Your Zoom Account - ${serviceTitle}`,
      html: reAuthEmailHtml,
    });
    
    console.log(`✓ Zoom re-auth notification sent to ${specialistEmail}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Error sending Zoom re-auth notification:', error.message);
    return { success: false, error: error.message };
  }
};

export default {
  getZoomAccessToken,
  createZoomMeeting,
  getZoomMeetingDetails,
  getZoomRecordings,
  sendMeetingInvitation,
  sendRecordingLink,
  sendMeetingReminder,
  sendZoomReAuthNotification,
};
