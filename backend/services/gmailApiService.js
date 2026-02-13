import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Gmail API Email Service
 * Uses Google Service Account instead of SMTP for better reliability on Railway
 */

let gmailClient = null;
let gmailInitError = null;
let serviceAccountEmail = null; // Store the service account email

const initializeGmailAPI = () => {
  try {
    let authConfig = null;

    // In production, REQUIRE base64 credentials (no file fallback)
    const isProduction = process.env.NODE_ENV === 'production';

    if (process.env.GOOGLE_CREDENTIALS_BASE64) {
      console.log('📧 Loading Google credentials from environment variable (GOOGLE_CREDENTIALS_BASE64)');
      try {
        const credentialsJson = Buffer.from(process.env.GOOGLE_CREDENTIALS_BASE64, 'base64').toString('utf-8');
        authConfig = JSON.parse(credentialsJson);
      } catch (error) {
        console.error('❌ Failed to parse GOOGLE_CREDENTIALS_BASE64:', error.message);
        gmailInitError = 'Invalid GOOGLE_CREDENTIALS_BASE64 format';
        return null;
      }
    } else if (isProduction) {
      // In production, don't fall back to files
      gmailInitError = `Gmail API not configured: Set GOOGLE_CREDENTIALS_BASE64 environment variable in Railway`;
      console.error(`❌ ${gmailInitError}`);
      console.error(`   Go to Railway Dashboard → Variables → Add: GOOGLE_CREDENTIALS_BASE64`);
      return null;
    } else {
      // Local development: try to read credentials.json file
      const credentialsPath = './credentials.json';
      console.log(`📧 Loading Google credentials from file: ${credentialsPath}`);
      
      if (!fs.existsSync(credentialsPath)) {
        gmailInitError = `Google credentials file not found at: ${credentialsPath}`;
        console.error(`❌ ${gmailInitError}`);
        console.error(`   For production (Railway): Set GOOGLE_CREDENTIALS_BASE64 environment variable`);
        console.error(`   For local development: Ensure credentials.json exists in backend folder`);
        return null;
      }

      try {
        const credentialsContent = fs.readFileSync(credentialsPath, 'utf-8');
        authConfig = JSON.parse(credentialsContent);
      } catch (error) {
        gmailInitError = `Failed to read credentials: ${error.message}`;
        console.error(`❌ ${gmailInitError}`);
        return null;
      }
    }

    // Extract service account email from credentials
    serviceAccountEmail = authConfig.client_email;
    if (!serviceAccountEmail) {
      gmailInitError = 'Service account email not found in credentials';
      console.error(`❌ ${gmailInitError}`);
      return null;
    }
    console.log(`✅ Service Account Email: ${serviceAccountEmail}`);

    const auth = new google.auth.GoogleAuth({
      credentials: authConfig,
      scopes: ['https://www.googleapis.com/auth/gmail.send'],
    });

    gmailClient = google.gmail({ version: 'v1', auth });
    console.log('✅ Gmail API service initialized successfully');
    console.log('   Method: Service Account (no SMTP timeout issues)');
    console.log('   Scope: Gmail Send API');
    return true;
  } catch (error) {
    gmailInitError = error.message;
    console.error('❌ Gmail API initialization failed:', error.message);
    return false;
  }
};

// Initialize on module load
initializeGmailAPI();

/**
 * Send email using Gmail API
 * @param {Object} emailData - { to, subject, html }
 */
export const sendEmail = async (emailData) => {
  try {
    if (!gmailClient) {
      const error = gmailInitError || 'Gmail API not initialized';
      console.error('❌ Cannot send email:', error);
      throw new Error(error);
    }

    if (!serviceAccountEmail) {
      throw new Error('Service account email not configured');
    }

    const { to, subject, html } = emailData;

    if (!to || !subject || !html) {
      throw new Error('Missing required email fields: to, subject, html');
    }

    console.log('📧 Building RFC 2822 message...');

    // Build message manually with proper MIME structure
    const messageLines = [];
    
    // Headers
    messageLines.push(`From: ${serviceAccountEmail}`);
    messageLines.push(`To: ${to}`);
    messageLines.push(`Subject: ${subject}`);
    messageLines.push('MIME-Version: 1.0');
    messageLines.push('Content-Type: text/html; charset=UTF-8');
    messageLines.push('Content-Transfer-Encoding: base64');
    
    // Blank line separating headers from body
    messageLines.push('');
    
    // Body - encode the HTML to base64
    const htmlBase64 = Buffer.from(html, 'utf-8').toString('base64');
    
    // Break base64 string into lines of 76 characters (RFC 2822 requirement)
    const wrappedBase64 = htmlBase64.replace(/(.{76})/g, '$1\r\n');
    messageLines.push(wrappedBase64);

    // Join everything with CRLF
    const message = messageLines.join('\r\n');

    console.log('📧 Encoding complete message to base64...');
    
    // Encode the entire RFC 2822 message to base64 for Gmail API
    const encodedMessage = Buffer.from(message, 'utf-8').toString('base64');

    console.log('📧 Sending to:', to);

    // Send via Gmail API with the raw base64-encoded message
    const response = await gmailClient.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage,
      },
    });

    console.log(`✅ Email sent successfully!`);
    console.log(`   Message ID: ${response.data.id}`);
    return { success: true, messageId: response.data.id };
  } catch (error) {
    console.error(`❌ Failed to send email: ${error.message}`);
    if (error.response?.data) {
      console.error('   Details:', error.response.data);
    }
    throw error;
  }
};

/**
 * Verify Gmail API is working
 */
export const verifyGmailAPI = async () => {
  try {
    if (!gmailClient) {
      return {
        success: false,
        message: gmailInitError || 'Gmail API not initialized',
      };
    }

    // Try to get Gmail profile
    const profile = await gmailClient.users.getProfile({
      userId: 'me',
    });

    console.log('✅ Gmail API verification successful');
    console.log(`   Email: ${profile.data.emailAddress}`);
    console.log(`   Messages total: ${profile.data.messagesTotal}`);

    return {
      success: true,
      email: profile.data.emailAddress,
      messagesTotal: profile.data.messagesTotal,
    };
  } catch (error) {
    console.error('❌ Gmail API verification failed:', error.message);
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
