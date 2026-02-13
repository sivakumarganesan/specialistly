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

    // Use a simple, bulletproof RFC 2822 format
    // Headers must end with CRLF, blank line separates headers from body
    const lines = [
      `From: ${serviceAccountEmail}`,
      `To: ${to}`,
      `Subject: ${subject}`,
      'MIME-Version: 1.0',
      'Content-Type: text/html; charset=UTF-8',
      'Content-Transfer-Encoding: base64',
    ];

    // Encode HTML content to base64
    const encodedContent = Buffer.from(html, 'utf-8').toString('base64');

    // Add the base64-encoded content
    // Split at 76 chars per line for email standards
    let wrappedContent = '';
    for (let i = 0; i < encodedContent.length; i += 76) {
      wrappedContent += encodedContent.substr(i, 76) + '\r\n';
    }

    // Build complete message: headers (CRLF separated) + CRLF + CRLF + body
    const message = lines.join('\r\n') + '\r\n\r\n' + wrappedContent.trimEnd();

    // Encode the entire message to base64 for the 'raw' field  
    // Gmail API RFC 2822 messages should be base64 (standard, not URL-safe)
    const encodedMessage = Buffer.from(message, 'utf-8').toString('base64');

    console.log(`📧 Sending email to ${to}...`);

    // Create and send the message
    const res = await gmailClient.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage,
      },
    });

    console.log(`✅ Email sent! ID: ${res.data.id}`);
    return { success: true, messageId: res.data.id };
  } catch (error) {
    console.error(`❌ Email failed: ${error.message}`);
    if (error.response?.data?.error) {
      console.error('Details:', error.response.data.error);
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
