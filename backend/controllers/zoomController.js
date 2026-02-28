import axios from 'axios';
import zoomService from '../services/zoomService.js';

const ZOOM_API_BASE = 'https://api.zoom.us/v2';
const ZOOM_OAUTH_URL = 'https://zoom.us/oauth/authorize';
const ZOOM_TOKEN_URL = 'https://zoom.us/oauth/token';

/**
 * Initialize Zoom OAuth flow
 */
export const initializeZoomOAuth = async (req, res) => {
  try {
    if (!process.env.ZOOM_CLIENT_ID) {
      return res.status(500).json({
        success: false,
        message: 'Zoom client ID not configured',
      });
    }

    const redirectUri = `${process.env.API_URL || 'http://localhost:5001'}/api/zoom/oauth/callback`;
    const state = require('crypto').randomBytes(32).toString('hex');

    // Store state in session or temporary cache (you might want to add redis)
    // For now, we'll pass it through URL

    const authUrl = `${ZOOM_OAUTH_URL}?response_type=code&client_id=${process.env.ZOOM_CLIENT_ID}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&state=${state}`;

    res.json({
      success: true,
      authUrl,
    });
  } catch (error) {
    console.error('Error initializing Zoom OAuth:', error.message);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Handle Zoom OAuth callback
 */
export const handleZoomCallback = async (req, res) => {
  try {
    const { code, state } = req.query;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Authorization code not provided',
      });
    }

    // Exchange code for access token
    const redirectUri = `${process.env.API_URL || 'http://localhost:5001'}/api/zoom/oauth/callback`;
    const auth = Buffer.from(
      `${process.env.ZOOM_CLIENT_ID}:${process.env.ZOOM_CLIENT_SECRET}`
    ).toString('base64');

    const tokenResponse = await axios.post(ZOOM_TOKEN_URL, null, {
      headers: {
        Authorization: `Basic ${auth}`,
      },
      params: {
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
      },
    });

    const { access_token, refresh_token, expires_in } = tokenResponse.data;

    // Get user info
    const userResponse = await axios.get(`${ZOOM_API_BASE}/users/me`, {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    console.log(`✅ Zoom OAuth successful for user: ${userResponse.data.email}`);

    // TODO: Store tokens in database linked to specialist
    // This is where you would save to User or SpecialistProfile model

    res.json({
      success: true,
      message: 'Zoom authorization successful',
      data: {
        zoomUserId: userResponse.data.id,
        email: userResponse.data.email,
        displayName: userResponse.data.first_name + ' ' + userResponse.data.last_name,
        accessToken, // In production, encrypt and store securely
        refreshToken,
        expiresIn,
      },
    });
  } catch (error) {
    console.error('Error handling Zoom callback:', error.message);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get Zoom user profile
 */
export const getZoomUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const accessToken = await zoomService.getZoomAccessToken();
    if (!accessToken) {
      return res.status(500).json({
        success: false,
        message: 'Failed to obtain Zoom access token',
      });
    }

    const response = await axios.get(`${ZOOM_API_BASE}/users/${userId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    res.json({
      success: true,
      data: response.data,
    });
  } catch (error) {
    console.error('Error fetching Zoom user:', error.message);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * List Zoom meetings for a specialist
 */
export const listZoomMeetings = async (req, res) => {
  try {
    const { specialistId } = req.params;

    const accessToken = await zoomService.getZoomAccessToken();
    if (!accessToken) {
      return res.status(500).json({
        success: false,
        message: 'Failed to obtain Zoom access token',
      });
    }

    const response = await axios.get(
      `${ZOOM_API_BASE}/users/${specialistId}/meetings`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    res.json({
      success: true,
      data: response.data.meetings || [],
    });
  } catch (error) {
    console.error('Error listing Zoom meetings:', error.message);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get Zoom meeting recording
 */
export const getZoomRecording = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const { specialistId } = req.query;

    if (!specialistId) {
      return res.status(400).json({
        success: false,
        message: 'specialistId is required',
      });
    }

    const recordings = await zoomService.getZoomRecordings(specialistId, meetingId);

    res.json({
      success: true,
      data: recordings,
    });
  } catch (error) {
    console.error('Error fetching Zoom recording:', error.message);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export default {
  initializeZoomOAuth,
  handleZoomCallback,
  getZoomUser,
  listZoomMeetings,
  getZoomRecording,
};
