import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Create email transporter
 */
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASSWORD,
    },
  });
};

/**
 * Send enrollment confirmation email to customer
 * @param {Object} options - Email options
 * @param {string} options.customerEmail - Customer email address
 * @param {string} options.customerName - Customer name
 * @param {string} options.courseName - Course name
 * @param {string} options.enrollmentId - Enrollment ID
 */
export const sendEnrollmentConfirmation = async (options) => {
  try {
    const { customerEmail, customerName, courseName, enrollmentId } = options;

    if (!customerEmail || !customerName || !courseName) {
      console.warn('⚠️  Missing required email parameters for enrollment confirmation');
      return;
    }

    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: customerEmail,
      subject: `✅ Enrollment Confirmed - ${courseName}`,
      html: `
        <html>
          <body style="font-family: Arial, sans-serif; color: #333; margin: 20px;">
            <div style="max-width: 600px; margin: 0 auto; border: 1px solid #ddd; padding: 20px; border-radius: 8px;">
              <h2 style="color: #4CAF50;">Enrollment Confirmed! 🎓</h2>
              
              <p>Hi ${customerName},</p>
              
              <p>Thank you for enrolling in <strong>${courseName}</strong>!</p>
              
              <p>Your payment has been processed successfully and your enrollment is now active.</p>
              
              <div style="background-color: #f5f5f5; padding: 15px; margin: 20px 0; border-radius: 5px;">
                <p><strong>Enrollment Details:</strong></p>
                <ul>
                  <li>Course: ${courseName}</li>
                  <li>Enrollment ID: ${enrollmentId}</li>
                  <li>Enrollment Date: ${new Date().toLocaleDateString()}</li>
                  <li>Status: Active</li>
                </ul>
              </div>
              
              <p>You can now access all course materials and start learning at your own pace.</p>
              
              <p style="margin-top: 30px;">If you have any questions, please don't hesitate to contact our support team.</p>
              
              <p>Best regards,<br/>The Specialistly Team</p>
            </div>
          </body>
        </html>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✓ Enrollment confirmation email sent to ${customerEmail}`);
  } catch (error) {
    console.error('❌ Error sending enrollment confirmation email:', error.message);
    // Don't throw - let the payment process continue even if email fails
  }
};

/**
 * Send specialist notification email
 * @param {Object} options - Email options
 * @param {string} options.specialistEmail - Specialist email address
 * @param {string} options.specialistName - Specialist name
 * @param {string} options.enrollmentEmail - Customer email who enrolled
 * @param {string} options.courseName - Course name
 */
export const sendSpecialistNotification = async (options) => {
  try {
    const { specialistEmail, specialistName, enrollmentEmail, courseName } = options;

    if (!specialistEmail || !enrollmentEmail || !courseName) {
      console.warn('⚠️  Missing required email parameters for specialist notification');
      return;
    }

    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: specialistEmail,
      subject: `📢 New Student Enrollment - ${courseName}`,
      html: `
        <html>
          <body style="font-family: Arial, sans-serif; color: #333; margin: 20px;">
            <div style="max-width: 600px; margin: 0 auto; border: 1px solid #ddd; padding: 20px; border-radius: 8px;">
              <h2 style="color: #2196F3;">New Student Enrolled! 🎉</h2>
              
              <p>Hello ${specialistName || 'Specialist'},</p>
              
              <p>Great news! A new student has enrolled in your course.</p>
              
              <div style="background-color: #f5f5f5; padding: 15px; margin: 20px 0; border-radius: 5px;">
                <p><strong>Enrollment Details:</strong></p>
                <ul>
                  <li>Course: ${courseName}</li>
                  <li>Student Email: ${enrollmentEmail}</li>
                  <li>Enrollment Date: ${new Date().toLocaleDateString()}</li>
                  <li>Status: Active</li>
                </ul>
              </div>
              
              <p>The student can now access your course materials and begin their learning journey.</p>
              
              <p style="margin-top: 30px;">If you have any questions or need to manage this enrollment, please log into your Specialistly dashboard.</p>
              
              <p>Best regards,<br/>The Specialistly Team</p>
            </div>
          </body>
        </html>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✓ Specialist notification email sent to ${specialistEmail}`);
  } catch (error) {
    console.error('❌ Error sending specialist notification email:', error.message);
    // Don't throw - let the payment process continue even if email fails
  }
};

export default {
  sendEnrollmentConfirmation,
  sendSpecialistNotification,
};
