import gmailApiService from './gmailApiService.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Email Service using Resend API
 * All emails are sent via Resend API for reliability and consistency
 * No SMTP needed - works perfectly on Railway and cloud environments
 */

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

    const html = `
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
    `;

    await gmailApiService.sendEmail({
      to: customerEmail,
      subject: `✅ Enrollment Confirmed - ${courseName}`,
      html: html,
    });
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

    const html = `
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
    `;

    await gmailApiService.sendEmail({
      to: specialistEmail,
      subject: `📢 New Student Enrollment - ${courseName}`,
      html: html,
    });
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

    const isSpecialist = userType === 'specialist';
    const categoryLabel = isSpecialist ? 'Specialities' : 'Interests';
    const categoryListHtml = categories && categories.length > 0
      ? categories.map(cat => `<li style="margin-bottom: 8px;">✓ ${cat}</li>`).join('')
      : '<li style="margin-bottom: 8px;"><em style="color: #999;">You haven\'t selected any yet. Complete your profile for better visibility!</em></li>';

    const html = `
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
              <a href="${process.env.FRONTEND_URL || 'https://specialistly.com'}" style="display: inline-block; background-color: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 15px;">
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
    `;

    await gmailApiService.sendEmail({
      to: email,
      subject: `Welcome to Specialistly, ${name}! 🎉`,
      html: html,
    });
    console.log(`✓ Welcome email sent to ${email}`);
  } catch (error) {
    console.error('❌ Error sending welcome email:', error.message);
    // Don't throw - let the signup process continue even if email fails
  }
};

/**
 * Send password reset email
 * @param {Object} options - Email options
 * @param {string} options.email - User email address
 * @param {string} options.name - User name
 * @param {string} options.resetToken - Password reset token
 */
export const sendPasswordResetEmail = async (options) => {
  try {
    const { email, name, resetToken } = options;

    if (!email || !resetToken) {
      console.warn('⚠️  Missing required email parameters for password reset');
      return;
    }

    // Create reset password link using query parameters (frontend uses query params for navigation)
    const resetLink = `${process.env.FRONTEND_URL || 'https://specialistly.com'}/?page=resetPassword&token=${resetToken}`;

    const html = `
      <html>
        <body style="font-family: Arial, sans-serif; color: #333; margin: 20px;">
          <div style="max-width: 600px; margin: 0 auto; border: 1px solid #ddd; padding: 20px; border-radius: 8px; background-color: #f9fafb;">
            
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #DC2626; margin: 0;">Password Reset</h1>
              <p style="color: #666; margin: 10px 0 0 0; font-size: 14px;">You requested to reset your password</p>
            </div>

            <div style="background-color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #e5e7eb;">
              <p style="margin-top: 0; color: #555;">Hi ${name || 'there'},</p>
              
              <p style="color: #555; line-height: 1.6;">
                We received a request to reset your Specialistly account password. If you made this request, please click the button below to reset your password.
              </p>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetLink}" style="display: inline-block; background-color: #DC2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 15px;">
                  Reset Password
                </a>
              </div>

              <p style="color: #666; font-size: 13px; margin-bottom: 10px;">
                Or copy and paste this link in your browser:
              </p>
              <p style="color: #4F46E5; font-size: 12px; word-break: break-all; margin: 0;">
                ${resetLink}
              </p>
            </div>

            <div style="background-color: #fef2f2; padding: 15px; border-left: 4px solid #DC2626; border-radius: 4px; margin-bottom: 20px;">
              <h4 style="color: #7F1D1D; margin-top: 0; margin-bottom: 10px;">⏰ Important</h4>
              <ul style="margin: 0; padding-left: 20px; color: #7F1D1D; font-size: 14px;">
                <li style="margin-bottom: 8px;">This link will expire in 1 hour</li>
                <li style="margin-bottom: 8px;">If you didn't request this, please ignore this email</li>
                <li style="margin-bottom: 8px;">Never share this link with anyone else</li>
              </ul>
            </div>

            <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; text-align: center; color: #666; font-size: 13px;">
              <p style="margin: 0 0 10px 0;">Having trouble? Contact our support team</p>
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
    `;

    await gmailApiService.sendEmail({
      to: email,
      subject: 'Password Reset Request - Specialistly',
      html: html,
    });
    console.log(`✓ Password reset email sent to ${email}`);
  } catch (error) {
    console.error('❌ Error sending password reset email:', error.message);
    // Don't throw - let the request continue even if email fails
  }
};

/**
 * Send cohort/live course enrollment confirmation email with meeting link
 * @param {Object} options - Email options
 * @param {string} options.customerEmail - Customer email address
 * @param {string} options.customerName - Customer name
 * @param {string} options.courseName - Course name
 * @param {string} options.enrollmentId - Enrollment ID
 * @param {string} options.startDate - Course start date
 * @param {string} options.endDate - Course end date
 * @param {string} options.schedule - Course schedule
 * @param {string} options.meetingPlatform - Meeting platform (Zoom, Google Meet, etc.)
 * @param {string} options.zoomLink - Meeting/Zoom link
 */
export const sendCohortEnrollmentConfirmation = async (options) => {
  try {
    const { customerEmail, customerName, courseName, enrollmentId, startDate, endDate, schedule, meetingPlatform, zoomLink } = options;

    if (!customerEmail || !customerName || !courseName) {
      console.warn('⚠️  Missing required email parameters for cohort enrollment confirmation');
      return;
    }

    const formattedStartDate = startDate ? new Date(startDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'TBD';
    const formattedEndDate = endDate ? new Date(endDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'TBD';

    const html = `
      <html>
        <body style="font-family: Arial, sans-serif; color: #333; margin: 20px;">
          <div style="max-width: 600px; margin: 0 auto; border: 1px solid #ddd; padding: 20px; border-radius: 8px; background-color: #f9fafb;">
            
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #4CAF50; margin: 0;">Enrollment Confirmed! 🎓</h1>
              <p style="color: #666; margin: 10px 0 0 0; font-size: 16px;">You're in! Get ready for your live course.</p>
            </div>

            <div style="background-color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #e5e7eb;">
              <p style="margin-top: 0;">Hi <strong>${customerName}</strong>,</p>
              <p>Thank you for enrolling in <strong>${courseName}</strong>! Your payment has been processed successfully.</p>
            </div>

            <div style="background-color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #e5e7eb;">
              <h3 style="color: #1F2937; margin-top: 0; margin-bottom: 15px;">📋 Course Details</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #666; width: 40%;">Course:</td>
                  <td style="padding: 8px 0; font-weight: bold;">${courseName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666;">Enrollment ID:</td>
                  <td style="padding: 8px 0;">${enrollmentId}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666;">Start Date:</td>
                  <td style="padding: 8px 0; font-weight: bold; color: #4F46E5;">${formattedStartDate}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666;">End Date:</td>
                  <td style="padding: 8px 0;">${formattedEndDate}</td>
                </tr>
                ${schedule ? `
                <tr>
                  <td style="padding: 8px 0; color: #666;">Schedule:</td>
                  <td style="padding: 8px 0;">${schedule}</td>
                </tr>
                ` : ''}
                ${meetingPlatform ? `
                <tr>
                  <td style="padding: 8px 0; color: #666;">Platform:</td>
                  <td style="padding: 8px 0;">${meetingPlatform}</td>
                </tr>
                ` : ''}
              </table>
            </div>

            ${zoomLink ? `
            <div style="background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%); color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; text-align: center;">
              <h3 style="margin-top: 0; margin-bottom: 10px;">🔗 Your Meeting Link</h3>
              <p style="margin: 0 0 15px 0; font-size: 14px; opacity: 0.9;">Use this link to join your live sessions:</p>
              <a href="${zoomLink}" style="display: inline-block; background-color: white; color: #4F46E5; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 15px;">
                Join ${meetingPlatform || 'Meeting'}
              </a>
              <p style="margin: 15px 0 0 0; font-size: 12px; opacity: 0.8; word-break: break-all;">${zoomLink}</p>
            </div>
            ` : ''}

            <div style="background-color: #eff6ff; padding: 15px; border-left: 4px solid #4F46E5; border-radius: 4px; margin-bottom: 20px;">
              <h4 style="color: #1e40af; margin-top: 0; margin-bottom: 10px;">📝 What's Next?</h4>
              <ul style="margin: 0; padding-left: 20px; color: #1e40af; font-size: 14px;">
                <li style="margin-bottom: 8px;">Mark your calendar for <strong>${formattedStartDate}</strong></li>
                ${schedule ? `<li style="margin-bottom: 8px;">Sessions: ${schedule}</li>` : ''}
                ${zoomLink ? `<li style="margin-bottom: 8px;">Save the meeting link — you'll use it for all sessions</li>` : ''}
                <li style="margin-bottom: 8px;">Check your email for updates and reminders</li>
              </ul>
            </div>

            <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; text-align: center; color: #666; font-size: 13px;">
              <p style="margin: 0 0 10px 0;">Have questions? Contact our support team.</p>
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
    `;

    await gmailApiService.sendEmail({
      to: customerEmail,
      subject: `✅ Enrollment Confirmed - ${courseName} (Starts ${formattedStartDate})`,
      html: html,
    });
    console.log(`✓ Cohort enrollment confirmation email sent to ${customerEmail}`);
  } catch (error) {
    console.error('❌ Error sending cohort enrollment confirmation email:', error.message);
  }
};

export default {
  sendEnrollmentConfirmation,
  sendCohortEnrollmentConfirmation,
  sendSpecialistNotification,
  sendWelcomeEmail,
  sendPasswordResetEmail,
};
