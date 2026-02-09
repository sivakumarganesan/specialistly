import express from 'express';
import {
  initializeZoomOAuth,
  handleZoomCallback,
  getZoomUser,
  listZoomMeetings,
  getZoomRecording,
} from '../controllers/zoomController.js';
import {
  initiateUserOAuth,
  handleUserOAuthCallback,
  getUserOAuthStatus,
  revokeUserOAuth,
  refreshUserAccessToken,
  getUserZoomProfile,
  getUserZoomMeetings,
} from '../controllers/userOAuthController.js';

const router = express.Router();

// ===== Server-to-Server OAuth (App-Level) =====
router.get('/oauth/authorize', initializeZoomOAuth);
router.get('/oauth/callback', handleZoomCallback);

// ===== User-Managed OAuth (User-Level) =====
// Authorization flow
router.get('/oauth/user/authorize', initiateUserOAuth);
router.get('/oauth/user-callback', handleUserOAuthCallback);

// Token management
router.get('/oauth/user/status', getUserOAuthStatus);
router.post('/oauth/user/revoke', revokeUserOAuth);
router.post('/oauth/user/refresh', refreshUserAccessToken);

// User Zoom resources (requires valid OAuth token)
router.get('/oauth/user/profile', getUserZoomProfile);
router.get('/oauth/user/meetings', getUserZoomMeetings);

// ===== Legacy Routes =====
router.get('/user/:userId', getZoomUser);
router.get('/meetings/:specialistId', listZoomMeetings);
router.get('/recording/:meetingId', getZoomRecording);

export default router;
