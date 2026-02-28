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

// Wrapper for async error handling
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// ===== Server-to-Server OAuth (App-Level) =====
router.get('/oauth/authorize', asyncHandler(initializeZoomOAuth));
router.get('/oauth/callback', asyncHandler(handleZoomCallback));

// ===== User-Managed OAuth (User-Level) =====
// Authorization flow
router.get('/oauth/user/authorize', asyncHandler(initiateUserOAuth));
router.get('/oauth/user-callback', asyncHandler(handleUserOAuthCallback));

// Token management
router.get('/oauth/user/status', asyncHandler(getUserOAuthStatus));
router.post('/oauth/user/revoke', asyncHandler(revokeUserOAuth));
router.post('/oauth/user/refresh', asyncHandler(refreshUserAccessToken));

// User Zoom resources (requires valid OAuth token)
router.get('/oauth/user/profile', asyncHandler(getUserZoomProfile));
router.get('/oauth/user/meetings', asyncHandler(getUserZoomMeetings));

// ===== Legacy Routes =====
router.get('/user/:userId', asyncHandler(getZoomUser));
router.get('/meetings/:specialistId', asyncHandler(listZoomMeetings));
router.get('/recording/:meetingId', asyncHandler(getZoomRecording));

export default router;
