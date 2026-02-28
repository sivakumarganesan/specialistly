import mongoose from 'mongoose';

const commissionSchema = new mongoose.Schema(
  {
    // Commission percentage (e.g., 15 for 15%)
    platformPercentage: {
      type: Number,
      default: 15,
      min: 0,
      max: 100,
      required: true,
    },

    // Commission configuration per service type
    byServiceType: {
      course: {
        type: Number,
        default: 15,
        min: 0,
        max: 100,
      },
      consulting: {
        type: Number,
        default: 20,
        min: 0,
        max: 100,
      },
      webinar: {
        type: Number,
        default: 15,
        min: 0,
        max: 100,
      },
    },

    // Free courses threshold (don't charge commission on courses below this price)
    minimumChargeAmount: {
      type: Number,
      default: 0, // in cents
    },

    // Whether commission is active
    isActive: {
      type: Boolean,
      default: true,
    },

    // Last updated by admin
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },

    // Description of commission policy
    description: {
      type: String,
      default: 'Platform commission is charged on all paid services',
    },

    // Metadata
    effectiveDate: {
      type: Date,
      default: Date.now,
    },

    // Previous commission rate for audit trail
    previousRate: {
      type: Number,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'commission_config',
  }
);

/**
 * Calculate commission for a payment amount
 * @param {number} amount - Amount in cents
 * @param {string} serviceType - Type of service (course, consulting, webinar)
 * @returns {object} Commission breakdown
 */
commissionSchema.methods.calculateCommission = function (amount, serviceType = 'course') {
  if (!this.isActive) {
    return {
      gross: amount,
      platformCommission: 0,
      specialistEarnings: amount,
      commissionPercentage: 0,
    };
  }

  // Get commission percentage for service type
  const commissionRate = this.byServiceType?.[serviceType] || this.platformPercentage;

  // Calculate commission
  const platformCommission = Math.round(amount * (commissionRate / 100));
  const specialistEarnings = amount - platformCommission;

  return {
    gross: amount,
    platformCommission,
    specialistEarnings,
    commissionPercentage: commissionRate,
    serviceType,
  };
};

/**
 * Get current commission rates
 */
commissionSchema.statics.getCurrentRates = async function () {
  try {
    let config = await this.findOne().sort({ createdAt: -1 });

    // Create default if none exists
    if (!config) {
      config = await this.create({
        platformPercentage: 15,
      });
    }

    return config;
  } catch (error) {
    console.error('Error fetching commission config:', error);
    throw error;
  }
};

/**
 * Update commission rate
 */
commissionSchema.statics.updateRate = async function (newRate, serviceType = null, updatedBy = null) {
  try {
    const config = await this.findOne().sort({ createdAt: -1 });

    if (config) {
      config.previousRate = config.platformPercentage;
      if (serviceType) {
        if (!config.byServiceType) {
          config.byServiceType = {};
        }
        config.byServiceType[serviceType] = newRate;
      } else {
        config.platformPercentage = newRate;
      }
      if (updatedBy) {
        config.updatedBy = updatedBy;
      }
      config.effectiveDate = new Date();
      await config.save();
      return config;
    } else {
      return await this.create({
        platformPercentage: newRate,
        byServiceType: serviceType ? { [serviceType]: newRate } : {},
        updatedBy,
      });
    }
  } catch (error) {
    console.error('Error updating commission:', error);
    throw error;
  }
};

export default mongoose.model('CommissionConfig', commissionSchema);
