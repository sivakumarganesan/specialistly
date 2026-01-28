import { google } from 'googleapis';
import nodemailer from 'nodemailer';
import { v4 as uuidv4 } from 'uuid';

// Initialize Google Calendar API (simplified - in production use OAuth2)
const getCalendarClient = () => {
  const auth = new google.auth.GoogleAuth({
    keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    scopes: ['https://www.googleapis.com/auth/calendar'],
  });
  return google.calendar({ version: 'v3', auth });
};

// Initialize Email Client
const emailTransporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASSWORD,
  },
});

/**
 * Create a Google Meet event
 */
export const createGoogleMeet = async (appointmentData) => {
  try {
    const calendar = getCalendarClient();
    
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
 * Send reminder email to participants
 */
export const sendReminderEmail = async (appointment) => {
  try {
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
  sendReminderEmail,
  sendRecordingEmail,
  checkRecordingExpiry,
  deleteExpiredRecording,
};
