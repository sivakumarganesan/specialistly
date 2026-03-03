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

/**
 * Send welcome email after successful signup
 * @param {Object} options - Email options
 * @param {string} options.email - User email address
 * @param {string} options.name - User name
 * @param {string} options.userType - 'specialist' or 'customer'
 * @param {Array} options.categories - Selected specialities (for specialist) or interests (for customer)
 */
export const sendWelcomeEmail = async (options) => {
  try {
    const { email, name, userType, categories = [] } = options;

    if (!email || !name || !userType) {
      console.warn('⚠️  Missing required email parameters for welcome email');
      return;
    }

    const transporter = createTransporter();

    const isSpecialist = userType === 'specialist';
    const categoryLabel = isSpecialist ? 'Specialities' : 'Interests';
    const categoryListHtml = categories && categories.length > 0
      ? categories.map(cat => `<li style="margin-bottom: 8px;">✓ ${cat}</li>`).join('')
      : '<li style="margin-bottom: 8px;"><em style="color: #999;">You haven\'t selected any yet. Complete your profile for better visibility!</em></li>';

    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: email,
      subject: `Welcome to Specialistly, ${name}! 🎉`,
      html: `
        <html>
          <body style="font-family: Arial, sans-serif; color: #333; margin: 20px;">
            <div style="max-width: 600px; margin: 0 auto; border: 1px solid #ddd; padding: 20px; border-radius: 8px; background-color: #f9fafb;">
              
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #4F46E5; margin: 0;">Welcome to Specialistly!</h1>
                <p style="color: #666; margin: 10px 0 0 0; font-size: 16px;">Your journey starts here 🚀</p>
              </div>

              <div style="background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%); color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                <p style="margin: 0; font-size: 16px;">
                  Hi <strong>${name}</strong>,
                </p>
                <p style="margin: 10px 0 0 0; font-size: 14px;">
                  Thank you for joining our community! We're excited to have you with us.
                </p>
              </div>

              <div style="background-color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #e5e7eb;">
                <h3 style="color: #1F2937; margin-top: 0; margin-bottom: 15px;">Your ${categoryLabel}</h3>
                <ul style="margin: 0; padding-left: 0; list-style: none;">
                  ${categoryListHtml}
                </ul>
              </div>

              <div style="background-color: #f3f4f6; padding: 15px; border-left: 4px solid #4F46E5; border-radius: 4px; margin-bottom: 20px;">
                <h4 style="color: #1F2937; margin-top: 0; margin-bottom: 10px;">📋 What's Next?</h4>
                <ul style="margin: 0; padding-left: 20px; color: #555; font-size: 14px;">
                  ${isSpecialist ? `
                    <li style="margin-bottom: 8px;">✓ Complete your profile with a bio and profile picture</li>
                    <li style="margin-bottom: 8px;">✓ Create your first course or service</li>
                    <li style="margin-bottom: 8px;">✓ Set up your availability and pricing</li>
                    <li style="margin-bottom: 8px;">✓ Start reaching out to students and building your community</li>
                  ` : `
                    <li style="margin-bottom: 8px;">✓ Complete your profile with your interests</li>
                    <li style="margin-bottom: 8px;">✓ Browse and explore courses from our specialists</li>
                    <li style="margin-bottom: 8px;">✓ Book consultation sessions with experts in your areas of interest</li>
                    <li style="margin-bottom: 8px;">✓ Start your learning journey Today!</li>
                  `}
                </ul>
              </div>

              <div style="background-color: #eff6ff; padding: 15px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #bfdbfe;">
                <h4 style="color: #1e40af; margin-top: 0; margin-bottom: 10px;">💡 Pro Tip</h4>
                <p style="margin: 0; color: #1e40af; font-size: 14px;">
                  ${isSpecialist
                    ? 'Complete your profile and set up your first availability to start accepting bookings right away!'
                    : 'Update your interests regularly to receive personalized recommendations tailored just for you!'}
                </p>
              </div>

              <div style="text-align: center; margin-bottom: 20px;">
                <a href="${process.env.FRONTEND_URL || 'https://specialistly.com'}/dashboard" style="display: inline-block; background-color: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 15px;">
                  Go to Dashboard
                </a>
              </div>

              <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; text-align: center; color: #666; font-size: 13px;">
                <p style="margin: 0 0 10px 0;">Have questions? Our support team is here to help!</p>
                <p style="margin: 0;">
                  <a href="mailto:support@specialistly.com" style="color: #4F46E5; text-decoration: none;">support@specialistly.com</a>
                </p>
                
                <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #999; font-size: 12px;">
                  <p style="margin: 0;">Best regards,<br/>The Specialistly Team</p>
                </div>
              </div>

            </div>
          </body>
        </html>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✓ Welcome email sent to ${email}`);
  } catch (error) {
    console.error('❌ Error sending welcome email:', error.message);
    // Don't throw - let the signup process continue even if email fails
  }
};

export default {
  sendEnrollmentConfirmation,
  sendSpecialistNotification,
  sendWelcomeEmail,
};
