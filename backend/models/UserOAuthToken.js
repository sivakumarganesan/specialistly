import mongoose from 'mongoose';

const userOAuthTokenSchema = new mongoose.Schema(
  {
    // Link to the user account
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },

    // Zoom OAuth tokens
    zoomAccessToken: {
      type: String,
      required: true,
    },
    zoomRefreshToken: {
      type: String,
      required: true,
    },
    zoomAccessTokenExpiry: {
      type: Date,
      required: true,
    },

    // Zoom user info
    zoomUserId: {
      type: String,
      required: true,
    },
    zoomEmail: {
      type: String,
      required: true,
    },
    zoomAccountId: {
      type: String,
      required: false,
    },

    // OAuth state tracking
    oauthState: {
      type: String,
      default: null,
    },
    stateExpiresAt: {
      type: Date,
      default: null,
    },

    // Token refresh tracking
    lastRefreshAttempt: {
      type: Date,
      default: null,
    },
    refreshErrorCount: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isRevoked: {
      type: Boolean,
      default: false,
    },
    revokedAt: {
      type: Date,
      default: null,
    },

    // Scopes granted
    grantedScopes: [String],

    // Metadata
    authorizedAt: {
      type: Date,
      default: Date.now,
    },
    lastUsedAt: {
      type: Date,
      default: null,
    },
    deviceInfo: {
      userAgent: String,
      ipAddress: String,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
userOAuthTokenSchema.index({ userId: 1 });
userOAuthTokenSchema.index({ zoomUserId: 1 });
userOAuthTokenSchema.index({ oauthState: 1 });
userOAuthTokenSchema.index({ isActive: 1, isRevoked: 1 });

export default mongoose.model('UserOAuthToken', userOAuthTokenSchema);
