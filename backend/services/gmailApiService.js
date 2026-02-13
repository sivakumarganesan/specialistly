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
    const useAppPassword = process.env.USE_APP_PASSWORD !== 'false'; // Default: true

    if (!gmailUser || !gmailPassword) {
      initError = 'Gmail credentials not configured. Set GMAIL_USER and GMAIL_PASSWORD environment variables.';
      console.error(`❌ ${initError}`);
      console.error('');
      console.error('📧 Setup Options:');
      console.error('');
      console.error('Option 1: Use App Password (RECOMMENDED & MORE SECURE):');
      console.error('   1. Enable 2FA on your Gmail account');
      console.error('   2. Generate an App Password: https://myaccount.google.com/apppasswords');
      console.error('   3. Set GMAIL_USER=your-email@gmail.com');
      console.error('   4. Set GMAIL_PASSWORD=your-app-password (16 chars, no spaces)');
      console.error('   5. Set USE_APP_PASSWORD=true (or omit, this is default)');
      console.error('');
      console.error('Option 2: Use Gmail Password (LESS SECURE, BEING PHASED OUT):');
      console.error('   1. Go to: https://myaccount.google.com/lesssecureapps');
      console.error('   2. Turn ON "Allow less secure app access"');
      console.error('   3. Set GMAIL_USER=your-email@gmail.com');
      console.error('   4. Set GMAIL_PASSWORD=your-gmail-password');
      console.error('   5. Set USE_APP_PASSWORD=false');
      console.error('');
      return null;
    }

    console.log('📧 Initializing Gmail SMTP service...');
    console.log(`   Email: ${gmailUser}`);
    if (useAppPassword) {
      console.log('   Mode: App Password (Secure)');
    } else {
      console.log('   Mode: Gmail Password (Less Secure)');
    }

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
    
    // Provide specific guidance for common errors
    if (error.message.includes('Invalid login') || error.message.includes('535') || error.message.includes('auth fail')) {
      console.error('');
      console.error('⚠️  AUTHENTICATION ERROR - Gmail login failed');
      console.error('');
      console.error('If using Gmail Password (USE_APP_PASSWORD=false):');
      console.error('  1. Go to: https://myaccount.google.com/lesssecureapps');
      console.error('  2. Ensure "Allow less secure app access" is ENABLED');
      console.error('  3. Wait 2-3 minutes for changes to take effect');
      console.error('  4. Try again');
      console.error('');
      console.error('If using App Password (USE_APP_PASSWORD=true):');
      console.error('  1. Make sure you have 2FA enabled');
      console.error('  2. Regenerate the app password: https://myaccount.google.com/apppasswords');
      console.error('  3. Use the full 16-character password (no spaces)');
      console.error('  4. Try again');
    }
    
    throw error;
  }
};

/**
 * Verify email service is working with a test email
 */
export const verifyEmailService = async (testEmail) => {
  try {
    if (!transporter) {
      return {
        success: false,
        message: initError || 'Email service not initialized',
      };
    }

    console.log('🧪 Testing email service...');
    
    // First verify connection
    await transporter.verify();
    console.log('✅ SMTP connection verified');

    // Send a test email if testEmail provided
    if (testEmail) {
      console.log(`📧 Sending test email to ${testEmail}...`);
      const result = await transporter.sendMail({
        from: process.env.GMAIL_USER,
        to: testEmail,
        subject: 'Specialistly Email Service Test',
        html: '<h2>✅ Email Service is Working!</h2><p>Your Specialistly email configuration is set up correctly.</p>',
      });
      
      console.log(`✅ Test email sent! Message ID: ${result.messageId}`);
      
      return {
        success: true,
        message: 'Email service is working correctly',
        testEmailSent: true,
        messageId: result.messageId,
      };
    }

    return {
      success: true,
      message: 'Email service SMTP connection verified',
      testEmailSent: false,
    };
  } catch (error) {
    console.error('❌ Email service verification failed:', error.message);
    
    // Provide specific error guidance
    const response = {
      success: false,
      message: error.message,
      error: error.message,
    };

    if (error.message.includes('Invalid login') || error.message.includes('535') || error.message.includes('auth fail')) {
      response.troubleshooting = {
        title: 'Authentication Failed',
        options: [
          {
            option: 'Gmail Password (USE_APP_PASSWORD=false)',
            steps: [
              'Go to: https://myaccount.google.com/lesssecureapps',
              'Enable "Allow less secure app access"',
              'Wait 2-3 minutes',
              'Try again',
            ],
          },
          {
            option: 'App Password (USE_APP_PASSWORD=true)',
            steps: [
              'Go to: https://myaccount.google.com/apppasswords',
              'Select Mail and Windows Computer',
              'Copy the 16-character password',
              'Ensure 2FA is enabled first',
              'Set GMAIL_PASSWORD to the new app password',
            ],
          },
        ],
      };
    } else if (error.message.includes('ECONNREFUSED') || error.message.includes('EHOSTUNREACH')) {
      response.troubleshooting = {
        title: 'Network Connection Failed',
        steps: [
          'Check your internet connection',
          'Ensure Gmail SMTP (smtp.gmail.com:587) is accessible',
          'Check firewall rules if behind corporate network',
        ],
      };
    }

    return response;
  }
};

export default {
  sendEmail,
  verifyEmailService,
  verifyGmailAPI: verifyEmailService, // Alias for backwards compatibility
};
