/**
 * Diagnostic Script - Check System Configuration
 * Run: node diagnostic.js
 */

import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import mongoose from 'mongoose';
import UserOAuthToken from './models/UserOAuthToken.js';

dotenv.config();

console.log('\n╔════════════════════════════════════════════╗');
console.log('║     SPECIALISTLY DIAGNOSTIC CHECK         ║');
console.log('╚════════════════════════════════════════════╝\n');

// 1. Check Email Configuration
console.log('📧 EMAIL CONFIGURATION');
console.log('─'.repeat(42));

const emailChecks = {
  'GMAIL_USER': process.env.GMAIL_USER,
  'GMAIL_PASSWORD': process.env.GMAIL_PASSWORD ? '***' : 'NOT SET',
  'EMAIL_SERVICE': process.env.EMAIL_SERVICE || 'gmail (default)',
};

for (const [key, value] of Object.entries(emailChecks)) {
  const status = value && value !== 'NOT SET' ? '✅' : '❌';
  console.log(`${status} ${key}: ${value || 'NOT SET'}`);
}

// Test email transporter
try {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASSWORD,
    },
  });

  transporter.verify((error, success) => {
    if (error) {
      console.log(`❌ Email Verification Failed: ${error.message}`);
    } else {
      console.log(`✅ Email Service Connected Successfully`);
    }
  });
} catch (error) {
  console.log(`❌ Email Configuration Error: ${error.message}`);
}

// 2. Check Database Configuration
console.log('\n🗄️  DATABASE CONFIGURATION');
console.log('─'.repeat(42));

const dbChecks = {
  'MONGO_URI': process.env.MONGO_URI ? '✅ SET' : '❌ NOT SET',
  'MongoDB URL': process.env.MONGO_URI ? process.env.MONGO_URI.substring(0, 50) + '...' : 'N/A',
};

for (const [key, value] of Object.entries(dbChecks)) {
  console.log(`${key}: ${value}`);
}

// 3. Check Zoom OAuth Configuration
console.log('\n🎥 ZOOM OAUTH CONFIGURATION');
console.log('─'.repeat(42));

const zoomChecks = {
  'ZOOM_CLIENT_ID': process.env.ZOOM_CLIENT_ID ? '✅ SET' : '❌ NOT SET',
  'ZOOM_CLIENT_SECRET': process.env.ZOOM_CLIENT_SECRET ? '✅ SET' : '❌ NOT SET',
  'ZOOM_REDIRECT_URI': process.env.ZOOM_REDIRECT_URI,
};

for (const [key, value] of Object.entries(zoomChecks)) {
  console.log(`${key}: ${value || 'NOT SET'}`);
}

// 4. Check Specialists with Zoom Authorization
console.log('\n👥 SPECIALIST ZOOM AUTHORIZATIONS');
console.log('─'.repeat(42));

try {
  // Connect to MongoDB
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ MongoDB Connected');

  const tokens = await UserOAuthToken.find();
  console.log(`\nFound ${tokens.length} OAuth token record(s):\n`);

  for (const token of tokens) {
    console.log(`User ID: ${token.userId}`);
    console.log(`  • Zoom Access Token: ${token.zoomAccessToken ? '✅ SET' : '❌ NOT SET'}`);
    console.log(`  • Zoom Refresh Token: ${token.zoomRefreshToken ? '✅ SET' : '❌ NOT SET'}`);
    console.log(`  • Zoom User ID: ${token.zoomUserId || '❌ NOT SET'}`);
    console.log(`  • Zoom Email: ${token.zoomEmail || 'NOT SET'}`);
    console.log(`  • Account ID: ${token.zoomAccountId || 'NOT SET'}`);
    console.log(`  • Is Active: ${token.isActive ? '✅ YES' : '❌ NO'}`);
    console.log(`  • Is Revoked: ${token.isRevoked ? '⚠️  YES' : '✅ NO'}`);
    console.log(`  • Created: ${token.createdAt}`);
    console.log(`  • Updated: ${token.updatedAt}\n`);
  }

  if (tokens.length === 0) {
    console.log('⚠️  No Zoom OAuth tokens found.');
    console.log('   Specialists need to authorize Zoom in Settings first.\n');
  }

  await mongoose.connection.close();
} catch (error) {
  console.log(`❌ Database Error: ${error.message}`);
}

// 5. Summary and Recommendations
console.log('\n📋 RECOMMENDATIONS');
console.log('─'.repeat(42));

const issues = [];

if (!process.env.GMAIL_USER || !process.env.GMAIL_PASSWORD) {
  issues.push('• Configure GMAIL_USER and GMAIL_PASSWORD in .env for email functionality');
}

if (!process.env.ZOOM_CLIENT_ID || !process.env.ZOOM_CLIENT_SECRET) {
  issues.push('• Configure ZOOM_CLIENT_ID and ZOOM_CLIENT_SECRET in .env');
}

if (issues.length === 0) {
  console.log('✅ All configurations appear to be set up correctly!');
  console.log('   • Email service: Ready');
  console.log('   • Zoom OAuth: Ready');
  console.log('   • Database: Ready');
  console.log('\n⚠️  Note: Specialists must still authorize Zoom individually');
  console.log('   in Settings → Zoom Integration before bookings can create meetings.');
} else {
  console.log('Issues found:\n');
  issues.forEach(issue => console.log(issue));
}

console.log('\n' + '═'.repeat(42));
console.log('For more details, check backend logs during booking attempts.\n');

process.exit(0);
