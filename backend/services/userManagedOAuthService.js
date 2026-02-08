import axios from 'axios';
import crypto from 'crypto';
import dotenv from 'dotenv';
import UserOAuthToken from '../models/UserOAuthToken.js';

dotenv.config();

const ZOOM_API_BASE = 'https://api.zoom.us/v2';
const ZOOM_OAUTH_BASE = 'https://zoom.us/oauth';
const ZOOM_CLIENT_ID = process.env.ZOOM_USER_MANAGED_CLIENT_ID;
const ZOOM_CLIENT_SECRET = process.env.ZOOM_USER_MANAGED_CLIENT_SECRET;
const REDIRECT_URI = process.env.ZOOM_REDIRECT_URI || 'http://localhost:5001/api/zoom/oauth/user-callback';

/**
 * Generate OAuth authorization URL for user
 * @param {string} userId - User ID
 * @returns {object} - Authorization URL and state token
 */
export const generateAuthorizationUrl = async (userId) => {
  try {
    if (!ZOOM_CLIENT_ID || !ZOOM_CLIENT_SECRET) {
      throw new Error(
        'ZOOM_USER_MANAGED_CLIENT_ID or ZOOM_USER_MANAGED_CLIENT_SECRET not configured'
      );
    }

    // Generate random state token
    const state = crypto.randomBytes(32).toString('hex');
    const stateExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store state token temporarily
    let tokenRecord = await UserOAuthToken.findOne({ userId });
    if (!tokenRecord) {
      tokenRecord = new UserOAuthToken({
        userId,
        zoomAccessToken: 'pending',
        zoomRefreshToken: 'pending',
        zoomAccessTokenExpiry: new Date(),
        zoomUserId: 'pending',
        zoomEmail: 'pending',
      });
    }
    tokenRecord.oauthState = state;
    tokenRecord.stateExpiresAt = stateExpiresAt;
    await tokenRecord.save();

    // Build authorization URL
    // Scopes required: Zoom needs meeting:write:meeting and meeting:write:meeting:admin to create meetings
    const scopes = [
      'meeting:write:meeting',           // Create and update meetings
      'meeting:write:meeting:admin',     // Admin meeting permissions
      'meeting:read:meeting',            // Read meeting details
      'user:read:user',                  // Read user information
    ].join(' ');

    const authUrl = `${ZOOM_OAUTH_BASE}/authorize?client_id=${ZOOM_CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(
      REDIRECT_URI
    )}&scope=${encodeURIComponent(scopes)}&state=${state}`;

    return {
      success: true,
      authUrl,
      state,
    };
  } catch (error) {
    console.error('❌ Error generating authorization URL:', error.message);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Exchange authorization code for access token
 * @param {string} code - Authorization code from Zoom
 * @param {string} state - State token for verification
 * @param {string} userId - User ID
 * @returns {object} - Token data or error
 */
export const exchangeCodeForToken = async (code, state, userId) => {
  try {
    if (!code || !state) {
      throw new Error('Missing authorization code or state');
    }

    // Verify state token
    let tokenRecord = await UserOAuthToken.findOne({ userId });
    if (!tokenRecord) {
      throw new Error('No OAuth state found for user');
    }

    if (tokenRecord.oauthState !== state) {
      console.warn('⚠️  State token mismatch');
      throw new Error('Invalid state token');
    }

    if (new Date() > tokenRecord.stateExpiresAt) {
      throw new Error('State token expired');
    }

    // Exchange code for token
    console.log(`🔄 Exchanging authorization code for tokens...`);
    console.log(`   Code: ${code.substring(0, 30)}...`);
    console.log(`   Redirect URI: ${REDIRECT_URI}`);
    
    let response;
    try {
      response = await axios.post(`${ZOOM_OAUTH_BASE}/token`, null, {
        params: {
          grant_type: 'authorization_code',
          code,
          redirect_uri: REDIRECT_URI,
        },
        auth: {
          username: ZOOM_CLIENT_ID,
          password: ZOOM_CLIENT_SECRET,
        },
      });
    } catch (axiosError) {
      console.error(`❌ Zoom token exchange failed:`);
      console.error(`   Status: ${axiosError.response?.status}`);
      console.error(`   Error: ${axiosError.response?.data?.error}`);
      console.error(`   Reason: ${axiosError.response?.data?.reason}`);
      console.error(`   Full error response:`, axiosError.response?.data);
      throw new Error(`Zoom token exchange failed: ${axiosError.response?.data?.error || axiosError.message}`);
    }

    console.log(`✓ Token response received`);

    const {
      access_token,
      refresh_token,
      expires_in,
      scope,
    } = response.data;

    // Get user info from Zoom
    console.log(`📝 Fetching Zoom user info...`);
    let userResponse;
    try {
      userResponse = await axios.get(`${ZOOM_API_BASE}/users/me`, {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      });
    } catch (userError) {
      console.error(`❌ Failed to fetch Zoom user info:`);
      console.error(`   Status: ${userError.response?.status}`);
      console.error(`   Error:`, userError.response?.data);
      throw new Error(`Failed to fetch Zoom user info: ${userError.message}`);
    }

    console.log(`✓ Zoom user info retrieved: ${userResponse.data.email}`);
    const { id: zoomUserId, email: zoomEmail, account_id: accountId } = userResponse.data;

    // Calculate expiry time
    const accessTokenExpiry = new Date(Date.now() + expires_in * 1000);

    // Update token record
    tokenRecord.zoomAccessToken = access_token;
    tokenRecord.zoomRefreshToken = refresh_token;
    tokenRecord.zoomAccessTokenExpiry = accessTokenExpiry;
    tokenRecord.zoomUserId = zoomUserId;
    tokenRecord.zoomEmail = zoomEmail;
    tokenRecord.zoomAccountId = accountId;
    tokenRecord.grantedScopes = scope.split(' ');
    tokenRecord.oauthState = null;
    tokenRecord.stateExpiresAt = null;
    tokenRecord.isActive = true;
    tokenRecord.isRevoked = false;
    tokenRecord.lastUsedAt = new Date();

    await tokenRecord.save();

    console.log(`✅ OAuth token exchanged successfully for user ${userId}`);

    return {
      success: true,
      zoomUserId,
      zoomEmail,
      scopes: scope.split(' '),
      expiresIn: expires_in,
    };
  } catch (error) {
    console.error('❌ Error exchanging authorization code:', error.message);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Refresh access token using refresh token
 * @param {string} userId - User ID
 * @returns {object} - New token data or error
 */
export const refreshAccessToken = async (userId) => {
  try {
    const tokenRecord = await UserOAuthToken.findOne({ userId });

    if (!tokenRecord) {
      throw new Error('No OAuth token found for user');
    }

    if (tokenRecord.isRevoked) {
      throw new Error('OAuth token has been revoked');
    }

    if (!tokenRecord.zoomRefreshToken || tokenRecord.zoomRefreshToken === 'pending') {
      throw new Error('No refresh token available');
    }

    console.log(`🔄 Refreshing access token for user ${userId}`);

    // Refresh the token
    const response = await axios.post(`${ZOOM_OAUTH_BASE}/token`, null, {
      params: {
        grant_type: 'refresh_token',
        refresh_token: tokenRecord.zoomRefreshToken,
      },
      auth: {
        username: ZOOM_CLIENT_ID,
        password: ZOOM_CLIENT_SECRET,
      },
    });

    const { access_token, refresh_token, expires_in } = response.data;

    // Update token record
    const accessTokenExpiry = new Date(Date.now() + expires_in * 1000);

    tokenRecord.zoomAccessToken = access_token;
    if (refresh_token) {
      tokenRecord.zoomRefreshToken = refresh_token;
    }
    tokenRecord.zoomAccessTokenExpiry = accessTokenExpiry;
    tokenRecord.lastRefreshAttempt = new Date();
    tokenRecord.refreshErrorCount = 0;
    tokenRecord.lastUsedAt = new Date();

    await tokenRecord.save();

    console.log(`✅ Access token refreshed successfully for user ${userId}`);

    return {
      success: true,
      accessToken: access_token,
      expiresIn: expires_in,
    };
  } catch (error) {
    console.error('❌ Error refreshing access token:', error.message);

    // Track refresh errors
    try {
      const tokenRecord = await UserOAuthToken.findOne({ userId });
      if (tokenRecord) {
        tokenRecord.refreshErrorCount = (tokenRecord.refreshErrorCount || 0) + 1;
        if (tokenRecord.refreshErrorCount >= 5) {
          tokenRecord.isActive = false;
        }
        await tokenRecord.save();
      }
    } catch (dbError) {
      console.error('Error updating refresh error count:', dbError.message);
    }

    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Get valid access token, refreshing if needed
 * @param {string} userId - User ID
 * @returns {string} - Valid access token or null
 */
export const getValidAccessToken = async (userId) => {
  try {
    const tokenRecord = await UserOAuthToken.findOne({ userId });

    if (!tokenRecord || !tokenRecord.isActive) {
      throw new Error('No active OAuth token for user');
    }

    if (tokenRecord.isRevoked) {
      throw new Error('OAuth token has been revoked');
    }

    // Check if token needs refresh (within 5 minutes of expiry)
    const refreshThreshold = 5 * 60 * 1000;
    const timeUntilExpiry = tokenRecord.zoomAccessTokenExpiry - Date.now();

    if (timeUntilExpiry < refreshThreshold) {
      console.log(`🔄 Token expiring soon, refreshing for user ${userId}`);
      const refreshResult = await refreshAccessToken(userId);
      if (!refreshResult.success) {
        throw new Error(`Token refresh failed: ${refreshResult.error}`);
      }
      return refreshResult.accessToken;
    }

    // Token is still valid
    return tokenRecord.zoomAccessToken;
  } catch (error) {
    console.error('❌ Error getting valid access token:', error.message);
    return null;
  }
};

/**
 * Revoke user OAuth token
 * @param {string} userId - User ID
 * @returns {object} - Success or error
 */
export const revokeUserToken = async (userId) => {
  try {
    const tokenRecord = await UserOAuthToken.findOne({ userId });

    if (!tokenRecord) {
      throw new Error('No OAuth token found for user');
    }

    // Revoke token with Zoom
    try {
      const accessToken = await getValidAccessToken(userId);
      if (accessToken) {
        await axios.post(`${ZOOM_API_BASE}/oauth/revoke`, null, {
          params: {
            token: tokenRecord.zoomRefreshToken,
          },
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
      }
    } catch (revokeError) {
      console.warn('⚠️  Error revoking token with Zoom:', revokeError.message);
      // Continue with local revocation even if Zoom revocation fails
    }

    // Mark as revoked locally
    tokenRecord.isRevoked = true;
    tokenRecord.isActive = false;
    tokenRecord.revokedAt = new Date();
    await tokenRecord.save();

    // Update User model to reflect disconnection
    const User = (await import('../models/User.js')).default;
    await User.findByIdAndUpdate(userId, {
      zoomConnected: false,
      zoomConnectedAt: null,
      zoomAccessToken: null,
      zoomRefreshToken: null,
      zoomAccountId: null,
    });

    console.log(`✅ OAuth token revoked for user ${userId}`);

    return {
      success: true,
      message: 'Token revoked successfully',
    };
  } catch (error) {
    console.error('❌ Error revoking token:', error.message);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Get user's OAuth token info
 * @param {string} userId - User ID
 * @returns {object} - Token info or null
 */
export const getUserTokenInfo = async (userId) => {
  try {
    const tokenRecord = await UserOAuthToken.findOne({ userId });

    if (!tokenRecord) {
      return null;
    }

    return {
      zoomUserId: tokenRecord.zoomUserId,
      zoomEmail: tokenRecord.zoomEmail,
      isActive: tokenRecord.isActive,
      isRevoked: tokenRecord.isRevoked,
      authorizedAt: tokenRecord.authorizedAt,
      lastUsedAt: tokenRecord.lastUsedAt,
      expiresAt: tokenRecord.zoomAccessTokenExpiry,
      grantedScopes: tokenRecord.grantedScopes,
    };
  } catch (error) {
    console.error('❌ Error getting token info:', error.message);
    return null;
  }
};

/**
 * Verify user has valid OAuth token
 * @param {string} userId - User ID
 * @returns {boolean} - True if valid token exists
 */
export const hasValidToken = async (userId) => {
  try {
    const tokenRecord = await UserOAuthToken.findOne({
      userId,
      isActive: true,
      isRevoked: false,
    });
    return !!tokenRecord && tokenRecord.zoomAccessToken !== 'pending';
  } catch (error) {
    console.error('❌ Error checking token validity:', error.message);
    return false;
  }
};

export default {
  generateAuthorizationUrl,
  exchangeCodeForToken,
  refreshAccessToken,
  getValidAccessToken,
  revokeUserToken,
  getUserTokenInfo,
  hasValidToken,
};
