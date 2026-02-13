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
    const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;

    if (!gmailUser || !gmailAppPassword) {
      initError = 'Gmail App Password not configured. Set GMAIL_USER and GMAIL_APP_PASSWORD environment variables.';
      console.error(`❌ ${initError}`);
      console.error('');
      console.error('📧 Setup Gmail App Password (Modern & Secure):');
      console.error('');
      console.error('Step 1: Enable 2-Factor Authentication');
      console.error('   Go to: https://myaccount.google.com/security');
      console.error('   Click "2-Step Verification" and follow the steps');
      console.error('');
      console.error('Step 2: Generate App Password');
      console.error('   Go to: https://myaccount.google.com/apppasswords');
      console.error('   Select: Mail / Windows Computer');
      console.error('   Google will generate a 16-character password');
      console.error('');
      console.error('Step 3: Set Environment Variables');
      console.error('   GMAIL_USER=your-email@gmail.com');
      console.error('   GMAIL_APP_PASSWORD=your-16-char-app-password (no spaces)');
      console.error('');
      console.error('⚠️  IMPORTANT:');
      console.error('   - Never use your actual Gmail password');
      console.error('   - Always use the 16-character App Password');
      console.error('   - Do not commit passwords to git');
      console.error('');
      return null;
    }

    console.log('📧 Initializing Gmail SMTP with App Password...');
    console.log(`   Email: ${gmailUser}`);
    console.log('   Authentication: OAuth via App Password (Secure)');

    // Create Gmail SMTP transporter with explicit configuration
    // Uses port 587 (STARTTLS) with extended timeouts for cloud environments like Railway
    transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // Use STARTTLS on port 587
      auth: {
        user: gmailUser,
        pass: gmailAppPassword,
      },
      // Connection pooling and timeout settings
      pool: {
        maxConnections: 5,
        maxMessages: 100,
        rateDelta: 2000,
        rateLimit: 5,
      },
      // Timeout values (in milliseconds)
      connectionTimeout: 10000, // 10 seconds to establish connection
      socketTimeout: 10000, // 10 seconds for socket operations
    });

    console.log('✅ Gmail SMTP service initialized successfully');
    console.log('   Host: smtp.gmail.com:587');
    console.log('   Connection timeout: 10s');
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
      console.error('Troubleshooting steps:');
      console.error('  1. Ensure 2FA is enabled on your Gmail account');
      console.error('  2. Go to: https://myaccount.google.com/apppasswords');
      console.error('  3. Re-generate a fresh App Password');
      console.error('  4. Use the FULL 16-character password (including any hyphens, no spaces)');
      console.error('  5. Set GMAIL_APP_PASSWORD to the new password');
      console.error('  6. Restart your application');
      console.error('  7. Wait 2-3 minutes before trying again (Google needs time to sync)');
      console.error('');
    } else if (error.message.includes('ETIMEDOUT') || error.message.includes('Connection timeout') || error.message.includes('EHOSTUNREACH')) {
      console.error('');
      console.error('⚠️  NETWORK ERROR - Cannot reach Gmail SMTP server');
      console.error('');
      console.error('Possible causes:');
      console.error('  1. Network firewall blocking port 587');
      console.error('  2. Hosting provider restricting outbound SMTP');
      console.error('  3. Gmail SMTP server temporarily unavailable');
      console.error('  4. DNS resolution failing');
      console.error('');
      console.error('Solutions to try:');
      console.error('  • Check network connectivity');
      console.error('  • Verify Gmail SMTP (smtp.gmail.com:587) is accessible');
      console.error('  • Contact hosting provider to enable SMTP on port 587');
      console.error('  • Wait a few minutes and retry');
      console.error('  • If using Railway, check deployment region');
      console.error('');
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
        title: 'Gmail App Password Setup Required',
        steps: [
          'Step 1: Ensure 2-Factor Authentication is enabled',
          '   Go to: https://myaccount.google.com/security',
          '   Click "2-Step Verification" and follow the steps',
          '',
          'Step 2: Generate an App Password',
          '   Go to: https://myaccount.google.com/apppasswords',
          '   Select: Mail / Windows Computer',
          '   Google will generate a 16-character password',
          '',
          'Step 3: Update Environment Variables',
          '   GMAIL_USER=your-email@gmail.com',
          '   GMAIL_APP_PASSWORD=paste-the-16-char-password-here',
          '',
          'Step 4: Important Notes',
          '   ✓ Use the FULL 16-character password (no spaces)',
          '   ✓ Do NOT use your actual Gmail password',
          '   ✓ Wait 2-3 minutes after changes for Gmail to sync',
          '   ✓ Restart your application after updating variables',
        ],
      };
    } else if (error.message.includes('ETIMEDOUT') || error.message.includes('Connection timeout') || error.message.includes('EHOSTUNREACH') || error.message.includes('ECONNREFUSED')) {
      response.troubleshooting = {
        title: 'Network Connection Failed - Cannot Reach Gmail SMTP',
        steps: [
          'This means your application cannot connect to Gmail\'s SMTP server (smtp.gmail.com:587)',
          '',
          'Possible causes:',
          '  • Firewall blocking port 587 (SMTP)',
          '  • Hosting provider (Railway) restricting outbound SMTP',
          '  • Network connectivity issue',
          '  • Gmail SMTP server temporarily unavailable',
          '',
          'Solutions to try:',
          '  1. Verify your internet connection is working',
          '  2. Check if port 587 is accessible from your network',
          '  3. If on Railway, enable outbound SMTP in security settings',
          '  4. Try again in a few minutes (server might be temporarily down)',
          '  5. Contact your hosting provider about SMTP restrictions',
          '',
          'If problem persists:',
          '  • Check Railway networking documentation',
          '  • Verify deployment region allows SMTP',
          '  • Consider using a different email service (SendGrid, Resend, etc.)',
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
