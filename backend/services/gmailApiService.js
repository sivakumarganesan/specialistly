import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Email Service using Resend API
 * Modern email API that works reliably on Railway (no SMTP needed)
 * Free tier: 100 emails/day
 */

let resend = null;
let initError = null;

const initializeEmailService = () => {
  try {
    const resendApiKey = process.env.RESEND_API_KEY;

    if (!resendApiKey) {
      initError = 'Resend API key not configured. Set RESEND_API_KEY environment variable.';
      console.error(`❌ ${initError}`);
      console.error('');
      console.error('📧 Setup Resend Email Service (Modern & Reliable):');
      console.error('');
      console.error('Step 1: Sign up at Resend');
      console.error('   Go to: https://resend.com');
      console.error('   Sign up with your email (takes 1 minute)');
      console.error('');
      console.error('Step 2: Get API Key');
      console.error('   Go to: https://resend.com/api-keys');
      console.error('   Click "Create API Key"');
      console.error('   Copy the API key');
      console.error('');
      console.error('Step 3: Set Environment Variable');
      console.error('   RESEND_API_KEY=your_api_key_here');
      console.error('');
      console.error('Step 4: Verify Domain (Optional)');
      console.error('   Resend gives you a free @resend.dev subdomain');
      console.error('   For production, verify your domain: https://resend.com/domains');
      console.error('');
      console.error('✅ Benefits:');
      console.error('   • Works on Railway (no SMTP needed)');
      console.error('   • Free tier: 100 emails/day');
      console.error('   • Simple API, no SMTP complications');
      console.error('   • Spam protection built-in');
      console.error('');
      return null;
    }

    console.log('📧 Initializing Resend Email Service...');
    console.log('   API: Resend (https://resend.com)');
    console.log('   Authentication: API Key');

    // Initialize Resend client
    resend = new Resend(resendApiKey);

    console.log('✅ Resend email service initialized successfully');
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
 * Send email using Resend API
 * @param {Object} emailData - { to, subject, html }
 */
export const sendEmail = async (emailData) => {
  try {
    if (!resend) {
      const error = initError || 'Email service not initialized';
      console.error('❌ Cannot send email:', error);
      throw new Error(error);
    }

    const { to, subject, html, attachments } = emailData;

    if (!to || !subject || !html) {
      throw new Error('Missing required email fields: to, subject, html');
    }

    console.log(`📧 Sending email to ${to}...`);

    // Use Resend's free @resend.dev domain by default
    // Production: Update to your verified domain
    const fromEmail = process.env.FROM_EMAIL || 'notifications@resend.dev';

    const emailPayload = {
      from: fromEmail,
      to: to,
      subject: subject,
      html: html,
    };

    if (attachments && attachments.length > 0) {
      emailPayload.attachments = attachments;
    }

    const result = await resend.emails.send(emailPayload);

    // Check if Resend API returned an error
    if (result.error) {
      throw new Error(`Resend API error: ${result.error.message || JSON.stringify(result.error)}`);
    }

    console.log(`✅ Email sent successfully!`);
    console.log(`   To: ${to}`);
    console.log(`   Subject: ${subject}`);
    console.log(`   Message ID: ${result.data?.id || 'N/A'}`);

    return { success: true, messageId: result.data?.id };
  } catch (error) {
    console.error(`❌ Failed to send email: ${error.message}`);

    // Provide specific guidance for common errors
    if (error.message.includes('invalid API key') || error.message.includes('401')) {
      console.error('');
      console.error('⚠️  AUTHENTICATION ERROR - Invalid Resend API key');
      console.error('');
      console.error('Troubleshooting steps:');
      console.error('  1. Go to: https://resend.com/api-keys');
      console.error('  2. Verify your API key is correct');
      console.error('  3. Make sure the key hasn\'t been revoked');
      console.error('  4. Create a new API key if needed');
      console.error('  5. Update RESEND_API_KEY environment variable');
      console.error('  6. Restart your application');
      console.error('');
    } else if (error.message.includes('rate limit') || error.message.includes('429')) {
      console.error('');
      console.error('⚠️  RATE LIMIT - Too many emails sent');
      console.error('');
      console.error('Free tier limits:');
      console.error('  • 100 emails per day');
      console.error('  • If you need more, upgrade your plan at resend.com');
      console.error('');
    } else if (error.message.includes('invalid email') || error.message.includes('invalid recipient')) {
      console.error('');
      console.error('⚠️  INVALID EMAIL ADDRESS');
      console.error('');
      console.error('Check that:');
      console.error('  • Email address is properly formatted');
      console.error('  • Email is not a typo');
      console.error('  • Domain exists and can receive mail');
      console.error('');
    }

    throw error;
  }
};

/**
 * Verify email service is working
 */
export const verifyEmailService = async (testEmail) => {
  try {
    if (!resend) {
      return {
        success: false,
        message: initError || 'Email service not initialized',
      };
    }

    console.log('🧪 Testing Resend email service...');

    // If test email provided, send a test email
    if (testEmail) {
      console.log(`📧 Sending test email to ${testEmail}...`);
      
      const fromEmail = process.env.FROM_EMAIL || 'notifications@resend.dev';
      
      const result = await resend.emails.send({
        from: fromEmail,
        to: testEmail,
        subject: '✅ Specialistly Email Service Test',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2 style="color: #10b981;">✅ Email Service is Working!</h2>
            <p>Your Specialistly email configuration is set up correctly using Resend.</p>
            <hr style="border: 1px solid #ddd; margin: 20px 0;">
            <p style="color: #666; font-size: 12px;">
              This is a test email from Specialistly. 
              If you received this, your email service is working perfectly.
            </p>
          </div>
        `,
      });

      if (result.error) {
        throw new Error(`Resend API error: ${result.error.message || JSON.stringify(result.error)}`);
      }

      console.log(`✅ Test email sent! Message ID: ${result.data?.id}`);

      return {
        success: true,
        message: 'Email service is working correctly',
        testEmailSent: true,
        messageId: result.data?.id,
        service: 'Resend',
        info: {
          apiEndpoint: 'https://api.resend.com/emails',
          fromEmail: fromEmail,
        },
      };
    }

    return {
      success: true,
      message: 'Email service (Resend) is configured and ready',
      testEmailSent: false,
      service: 'Resend',
    };
  } catch (error) {
    console.error('❌ Email service verification failed:', error.message);

    const response = {
      success: false,
      message: error.message,
      error: error.message,
      service: 'Resend',
    };

    if (error.message.includes('invalid API key') || error.message.includes('401')) {
      response.troubleshooting = {
        title: 'Invalid Resend API Key',
        steps: [
          'Step 1: Verify your API key',
          '   Go to: https://resend.com/api-keys',
          '   Copy your active API key',
          '',
          'Step 2: Update environment variable',
          '   Set: RESEND_API_KEY=your_api_key_here',
          '',
          'Step 3: Restart your application',
          '   The change will take effect immediately',
          '',
          'If you don\'t have an account:',
          '   1. Go to: https://resend.com',
          '   2. Sign up (it\'s free)',
          '   3. Create your first API key',
          '   4. Set it as RESEND_API_KEY',
        ],
      };
    } else if (error.message.includes('rate limit') || error.message.includes('429')) {
      response.troubleshooting = {
        title: 'Rate Limit Exceeded',
        steps: [
          'Free tier limit reached:',
          '  • Resend free tier: 100 emails per day',
          '  • You\'ve used up your daily limit',
          '',
          'Solutions:',
          '  1. Wait until tomorrow (limit resets daily)',
          '  2. Upgrade to a paid plan: https://resend.com/pricing',
          '  3. Or use environment-specific API keys for testing',
        ],
      };
    } else if (
      error.message.includes('invalid email') ||
      error.message.includes('invalid recipient')
    ) {
      response.troubleshooting = {
        title: 'Invalid Email Address',
        steps: [
          'The email address format is invalid',
          '',
          'Check that:',
          '  • Email has correct format (user@example.com)',
          '  • No spaces or special characters',
          '  • Domain is real (e.g., gmail.com, company.com)',
          '  • Not a test/fake address',
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
