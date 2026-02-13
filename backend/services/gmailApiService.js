import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Gmail SMTP Email Service
 * Uses Nodemailer with Gmail SMTP for reliability
 */

let transporter = null;
let initError = null;

const initializeEmailService = () => {
  try {
    // Get Gmail credentials from environment variables
    const gmailUser = process.env.GMAIL_USER;
    const gmailPassword = process.env.GMAIL_PASSWORD;

    if (!gmailUser || !gmailPassword) {
      initError = 'Gmail credentials not configured. Set GMAIL_USER and GMAIL_PASSWORD environment variables.';
      console.error(`❌ ${initError}`);
      console.error('   For Gmail SMTP:');
      console.error('   1. Enable 2FA on your Gmail account');
      console.error('   2. Generate an App Password: https://myaccount.google.com/apppasswords');
      console.error('   3. Set GMAIL_USER=your-email@gmail.com');
      console.error('   4. Set GMAIL_PASSWORD=your-app-password (16 chars, no spaces)');
      return null;
    }

    console.log('📧 Initializing Gmail SMTP service...');
    console.log(`   Email: ${gmailUser}`);

    // Create Gmail SMTP transporter
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: gmailUser,
        pass: gmailPassword,
      },
    });

    console.log('✅ Gmail SMTP service initialized successfully');
    return true;
  } catch (error) {
    initError = error.message;
    console.error('❌ Failed to initialize email service:', error.message);
    return false;
  }
};

// Initialize on module load
initializeEmailService();

/**
 * Send email using Gmail SMTP
 * @param {Object} emailData - { to, subject, html }
 */
export const sendEmail = async (emailData) => {
  try {
    if (!transporter) {
      const error = initError || 'Email service not initialized';
      console.error('❌ Cannot send email:', error);
      throw new Error(error);
    }

    const { to, subject, html } = emailData;

    if (!to || !subject || !html) {
      throw new Error('Missing required email fields: to, subject, html');
    }

    const gmailUser = process.env.GMAIL_USER;
    if (!gmailUser) {
      throw new Error('GMAIL_USER environment variable not set');
    }

    console.log(`📧 Sending email to ${to}...`);

    const mailOptions = {
      from: gmailUser,
      to: to,
      subject: subject,
      html: html,
    };

    const result = await transporter.sendMail(mailOptions);

    console.log(`✅ Email sent successfully!`);
    console.log(`   To: ${to}`);
    console.log(`   Subject: ${subject}`);
    console.log(`   Message ID: ${result.messageId}`);

    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error(`❌ Failed to send email: ${error.message}`);
    throw error;
  }
};

/**
 * Verify email service is working
 */
export const verifyGmailAPI = async () => {
  try {
    if (!transporter) {
      return {
        success: false,
        message: initError || 'Email service not initialized',
      };
    }

    await transporter.verify();

    console.log('✅ Email service verification successful');
    return {
      success: true,
      message: 'Gmail SMTP service is ready',
    };
  } catch (error) {
    console.error('❌ Email service verification failed:', error.message);
    return {
      success: false,
      message: error.message,
    };
  }
};

export default {
  sendEmail,
  verifyGmailAPI,
};
