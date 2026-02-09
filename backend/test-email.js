import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Test Email Configuration
const testEmail = async () => {
  console.log('\n📧 Testing Email Configuration...\n');
  
  console.log('Environment Variables:');
  console.log('  GMAIL_USER:', process.env.GMAIL_USER ? '✓ SET' : '✗ NOT SET');
  console.log('  GMAIL_PASSWORD:', process.env.GMAIL_PASSWORD ? '✓ SET' : '✗ NOT SET');
  
  try {
    // Create transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASSWORD,
      },
    });

    console.log('\n🔍 Verifying transporter connection...');
    await transporter.verify();
    console.log('✅ Email transporter verified successfully!');

    // Send test email
    console.log('\n📨 Sending test email...');
    const info = await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: process.env.GMAIL_USER, // Send to self for testing
      subject: '✅ Specialistly Email Test - Server Configuration Verified',
      html: `
        <html>
          <body style="font-family: Arial, sans-serif; color: #333;">
            <h2>Email Service Test ✓</h2>
            <p>This is a test email from Specialistly backend server.</p>
            <p><strong>Status:</strong> Email service is working correctly!</p>
            <p>Gmail User: ${process.env.GMAIL_USER}</p>
            <p>Timestamp: ${new Date().toLocaleString()}</p>
          </body>
        </html>
      `,
    });

    console.log('✅ Test email sent successfully!');
    console.log('Message ID:', info.messageId);
    console.log('\n📬 Check your inbox for the test email');
    process.exit(0);
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
