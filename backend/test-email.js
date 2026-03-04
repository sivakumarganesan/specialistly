import gmailApiService from './services/gmailApiService.js';
import dotenv from 'dotenv';

dotenv.config();

// Test Email Configuration with Resend API
const testEmail = async () => {
  console.log('\n📧 Testing Email Configuration (Resend API)...\n');
  
  console.log('Environment Variables:');
  console.log('  RESEND_API_KEY:', process.env.RESEND_API_KEY ? '✓ SET' : '✗ NOT SET');
  console.log('  FROM_EMAIL:', process.env.FROM_EMAIL ? process.env.FROM_EMAIL : '✓ USING DEFAULT (notifications@resend.dev)');
  
  try {
    // Test email using Resend API service
    console.log('\n📨 Sending test email via Resend API...');
    
    const result = await gmailApiService.sendEmail({
      to: process.env.RESEND_TEST_EMAIL || process.env.GMAIL_USER || 'test@example.com',
      subject: '✅ Specialistly Email Test - Resend API Configuration Verified',
      html: `
        <html>
          <body style="font-family: Arial, sans-serif; color: #333;">
            <h2>Email Service Test ✓</h2>
            <p>This is a test email from Specialistly backend server using <strong>Resend API</strong>.</p>
            <p><strong>Status:</strong> Email service is working correctly!</p>
            <p>Timestamp: ${new Date().toLocaleString()}</p>
            <p style="color: #666; font-size: 12px;">
              Sent via Resend (https://resend.com) - Modern email API
            </p>
          </body>
        </html>
      `,
    });

    if (result.success) {
      console.log('✅ Test email sent successfully via Resend API!');
      console.log('Message ID:', result.messageId);
      console.log('\n📬 Check your inbox for the test email');
      process.exit(0);
    } else {
      console.log('❌ Failed to send test email:', result);
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Email test failed:', error.message);
    process.exit(1);
  }
};

testEmail();
  } catch (error) {
    console.error('❌ Email test failed:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Verify GMAIL_USER and GMAIL_PASSWORD in .env file');
    console.error('2. Enable "Less secure app access" or use App Password');
    console.error('3. Check Gmail account settings');
    process.exit(1);
  }
};

testEmail();
