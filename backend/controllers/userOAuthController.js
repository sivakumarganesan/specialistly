import axios from 'axios';
import userManagedOAuthService from '../services/userManagedOAuthService.js';
import UserOAuthToken from '../models/UserOAuthToken.js';
import User from '../models/User.js';

/**
 * Initiate OAuth authorization flow for user
 * GET /api/zoom/oauth/user/authorize
 */
export const initiateUserOAuth = async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'userId is required',
      });
    }

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    const result = await userManagedOAuthService.generateAuthorizationUrl(userId);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error,
      });
    }

    // Redirect directly to Zoom authorization URL
    res.redirect(result.authUrl);
  } catch (error) {
    console.error('❌ Error initiating user OAuth:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Handle OAuth callback from Zoom
 * GET /api/zoom/oauth/user-callback
 */
export const handleUserOAuthCallback = async (req, res) => {
  try {
    const { code, state, error: zoomError } = req.query;

    // Log callback received
    console.log('📍 OAuth Callback Handler Triggered');
    console.log('   URL:', req.originalUrl);
    console.log('   Method:', req.method);
    console.log('   Code present:', !!code);
    console.log('   State present:', !!state);
    console.log('   Error present:', !!zoomError);

    // Get frontend URL from environment variables
    // For local dev: http://localhost:5173, for prod: https://www.specialistly.com
    const frontendUrl = process.env.FRONTEND_URL || 
                       (process.env.NODE_ENV === 'production' 
                         ? 'https://www.specialistly.com' 
                         : 'http://localhost:5173');

    // Check for Zoom API errors
    if (zoomError) {
      console.error('❌ Zoom OAuth error:', zoomError);
      return res.redirect(
        `${frontendUrl}/?oauth_error=${encodeURIComponent(zoomError)}`
      );
    }

    if (!code || !state) {
      return res.redirect(
        `${frontendUrl}/?oauth_error=Missing code or state`
      );
    }

    // Debug logging
    console.log('📝 OAuth Callback received:');
    console.log('  State token:', state);
    console.log('  Code:', code.substring(0, 20) + '...');

    // Extract userId from state (or get from session/cookie)
    // For now, we'll get it from the OAuth token record
    const tokenRecord = await UserOAuthToken.findOne({ oauthState: state });

    if (!tokenRecord) {
      // Log all states for debugging
      const allTokens = await UserOAuthToken.find({ oauthState: { $ne: null } });
      console.warn('⚠️  No token record found for state:', state);
      console.warn('  Available states:', allTokens.map(t => ({ userId: t.userId, state: t.oauthState })));
      return res.redirect(
        `${frontendUrl}/?oauth_error=Invalid state token`
      );
    }

    const userId = tokenRecord.userId;
    console.log('✅ Found token record for userId:', userId);

    // Exchange code for token
    console.log('🔄 Attempting token exchange...');
    const result = await userManagedOAuthService.exchangeCodeForToken(
      code,
      state,
      userId
    );

    if (!result.success) {
      console.error('❌ Token exchange failed:', result.error);
      console.log('⚠️  Check backend logs above for detailed error information');
      return res.redirect(
        `${frontendUrl}/?oauth_error=${encodeURIComponent(result.error)}`
      );
    }
    
    console.log('✅ Token exchange successful')

    // Update User document with Zoom connection status
    const user = await User.findById(userId);
    if (user) {
      user.zoomEmail = result.zoomEmail;
      user.zoomUserId = result.zoomUserId;
      user.zoomConnected = true;
      user.zoomConnectedAt = new Date();
      await user.save();
      console.log(`✅ Updated Zoom status for user ${userId}: ${result.zoomEmail}`);
    }

    // Redirect to root with success (let React Router handle navigation to dashboard)
    res.redirect(
      `${frontendUrl}/?oauth_success=true&zoom_email=${encodeURIComponent(
        result.zoomEmail
      )}`
    );
  } catch (error) {
    console.error('❌ Error handling OAuth callback:', error.message);
    const frontendUrl = process.env.FRONTEND_URL || 
                       (process.env.NODE_ENV === 'production' 
                         ? 'https://www.specialistly.com' 
                         : 'http://localhost:5173');
    res.redirect(
      `${frontendUrl}/?oauth_error=${encodeURIComponent(error.message)}`
    );
  }
};

/**
 * Get user's OAuth token status
 * GET /api/zoom/oauth/user/status
 */
export const getUserOAuthStatus = async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'userId is required',
      });
    }

    // Get user document for quick status check
    const user = await User.findById(userId).select(
      'zoomConnected zoomEmail zoomUserId zoomConnectedAt'
    );

    const tokenInfo = await userManagedOAuthService.getUserTokenInfo(userId);

    if (!tokenInfo && (!user || !user.zoomConnected)) {
      return res.json({
        success: true,
        authorized: false,
        zoomConnected: false,
        message: 'User has not authorized Zoom access',
      });
    }

    res.json({
      success: true,
      authorized: true,
      zoomConnected: user?.zoomConnected || false,
      zoomEmail: user?.zoomEmail || null,
      zoomUserId: user?.zoomUserId || null,
      zoomConnectedAt: user?.zoomConnectedAt || null,
      tokenInfo,
    });
  } catch (error) {
    console.error('❌ Error getting OAuth status:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Revoke user's OAuth token
 * POST /api/zoom/oauth/user/revoke
 */
export const revokeUserOAuth = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'userId is required',
      });
    }

    const result = await userManagedOAuthService.revokeUserToken(userId);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error,
      });
    }

    res.json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    console.error('❌ Error revoking OAuth token:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Refresh user's access token (manual refresh)
 * POST /api/zoom/oauth/user/refresh
 */
export const refreshUserAccessToken = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'userId is required',
      });
    }

    const result = await userManagedOAuthService.refreshAccessToken(userId);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error,
      });
    }

    res.json({
      success: true,
      message: 'Access token refreshed successfully',
      expiresIn: result.expiresIn,
    });
  } catch (error) {
    console.error('❌ Error refreshing access token:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Get user's Zoom profile (requires valid OAuth token)
 * GET /api/zoom/oauth/user/profile
 */
export const getUserZoomProfile = async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'userId is required',
      });
    }

    // Get valid access token
    const accessToken = await userManagedOAuthService.getValidAccessToken(
      userId
    );

    if (!accessToken) {
      return res.status(401).json({
        success: false,
        error: 'User not authorized or token expired',
      });
    }

    // Fetch user profile from Zoom
    const response = await axios.get('https://api.zoom.us/v2/users/me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    // Update last used timestamp
    await UserOAuthToken.updateOne(
      { userId },
      { lastUsedAt: new Date() }
    );

    res.json({
      success: true,
      profile: response.data,
    });
  } catch (error) {
    console.error('❌ Error getting Zoom profile:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * List user's Zoom meetings (requires valid OAuth token)
 * GET /api/zoom/oauth/user/meetings
 */
export const getUserZoomMeetings = async (req, res) => {
  try {
    const { userId } = req.query;
    const { type = 'live', page_size = 30, page_number = 1 } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'userId is required',
      });
    }

    // Get valid access token
    const accessToken = await userManagedOAuthService.getValidAccessToken(
      userId
    );

    if (!accessToken) {
      return res.status(401).json({
        success: false,
        error: 'User not authorized or token expired',
      });
    }

    // Fetch meetings from Zoom
    const response = await axios.get('https://api.zoom.us/v2/users/me/meetings', {
      params: {
        type,
        page_size,
        page_number,
      },
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    // Update last used timestamp
    await UserOAuthToken.updateOne(
      { userId },
      { lastUsedAt: new Date() }
    );

    res.json({
      success: true,
      meetings: response.data.meetings || [],
      totalRecords: response.data.total_records,
      pageCount: response.data.page_count,
    });
  } catch (error) {
    console.error('❌ Error getting Zoom meetings:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

export default {
  initiateUserOAuth,
  handleUserOAuthCallback,
  getUserOAuthStatus,
  revokeUserOAuth,
  refreshUserAccessToken,
  getUserZoomProfile,
  getUserZoomMeetings,
};
