import express from 'express';
import gmailApiService from '../services/gmailApiService.js';

const router = express.Router();

/**
 * Health check endpoint
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
});

/**
 * Email service diagnostic endpoint
 * GET /api/health/email-test
 * Query params: ?sendTest=email@example.com (optional, to send test email)
 */
router.get('/email-test', async (req, res) => {
  try {
    const testEmail = req.query.sendTest;
    
    console.log('🧪 Email service diagnostic check...');
    
    // Verify the email service
    const result = await gmailApiService.verifyEmailService(testEmail);

    if (result.success) {
      return res.status(200).json(result);
    } else {
      return res.status(400).json(result);
    }
  } catch (error) {
    console.error('Email test endpoint error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Email service test failed',
      error: error.message,
    });
  }
});

export default router;
