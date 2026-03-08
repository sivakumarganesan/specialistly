import CommissionConfig from '../models/CommissionConfig.js';
import Payment from '../models/Payment.js';
import mongoose from 'mongoose';

/**
 * Get current commission rates
 * GET /api/commission/rates
 */
export const getCommissionRates = async (req, res) => {
  try {
    const config = await CommissionConfig.getCurrentRates();
    res.json({
      success: true,
      data: {
        platform: config.platformPercentage,
        byServiceType: config.byServiceType,
        isActive: config.isActive,
        minimumChargeAmount: config.minimumChargeAmount,
        effectiveDate: config.effectiveDate,
      },
    });
  } catch (error) {
    console.error('Error fetching commission rates:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch commission rates',
    });
  }
};

/**
 * Calculate commission breakdown
 * POST /api/commission/calculate
 */
export const calculateCommissionBreakdown = async (req, res) => {
  try {
    const { amount, serviceType = 'course' } = req.body;

    if (!amount || amount < 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid amount',
      });
    }

    const config = await CommissionConfig.getCurrentRates();
    const breakdown = config.calculateCommission(amount, serviceType);

    res.json({
      success: true,
      data: {
        ...breakdown,
        currency: 'usd',
        displayGross: `$${(breakdown.gross / 100).toFixed(2)}`,
        displayCommission: `$${(breakdown.platformCommission / 100).toFixed(2)}`,
        displayEarnings: `$${(breakdown.specialistEarnings / 100).toFixed(2)}`,
      },
    });
  } catch (error) {
    console.error('Error calculating commission:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate commission',
    });
  }
};

/**
 * Update commission rate (Admin only)
 * POST /api/commission/update
 */
export const updateCommissionRate = async (req, res) => {
  try {
    // Check if user is admin (middleware should handle this)
    if (req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can update commission rates',
      });
    }

    const { percentage, serviceType } = req.body;

    if (percentage === undefined || percentage < 0 || percentage > 100) {
      return res.status(400).json({
        success: false,
        message: 'Commission percentage must be between 0 and 100',
      });
    }

    const config = await CommissionConfig.updateRate(
      percentage,
      serviceType,
      req.user.userId
    );

    res.json({
      success: true,
      message: `Commission rate updated successfully`,
      data: {
        previous: config.previousRate,
        current: percentage,
        serviceType: serviceType || 'all',
        effectiveDate: config.effectiveDate,
      },
    });
  } catch (error) {
    console.error('Error updating commission:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update commission rate',
    });
  }
};

/**
 * Get commission payment history
 * GET /api/commission/payments
 */
export const getCommissionPayments = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const { startDate, endDate, limit = 50, offset = 0 } = req.query;

    const filter = {
      status: 'completed',
    };

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        filter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.createdAt.$lte = new Date(endDate);
      }
    }

    // Get completed payments
    const payments = await Payment.find(filter)
      .select('amount commissionAmount specialistEarnings customerId specialistId serviceType createdAt')
      .limit(parseInt(limit))
      .skip(parseInt(offset))
      .lean();

    const total = await Payment.countDocuments(filter);

    // Calculate totals
    const totals = await Payment.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$amount' },
          totalCommission: { $sum: '$commissionAmount' },
          totalSpecialistEarnings: { $sum: '$specialistEarnings' },
          paymentCount: { $sum: 1 },
        },
      },
    ]);

    res.json({
      success: true,
      data: {
        payments,
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: offset + limit < total,
        },
        totals: totals[0] || {
          totalRevenue: 0,
          totalCommission: 0,
          totalSpecialistEarnings: 0,
          paymentCount: 0,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching commission payments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch commission payments',
    });
  }
};

/**
 * Get commission breakdown statistics
 * GET /api/commission/statistics
 */
export const getCommissionStatistics = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    // Get statistics
    const stats = await Payment.aggregate([
      {
        $match: {
          status: 'completed',
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          },
          revenue: { $sum: '$amount' },
          commission: { $sum: '$commissionAmount' },
          earnings: { $sum: '$specialistEarnings' },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { '_id.date': 1 },
      },
    ]);

    // Get totals
    const totals = await Payment.aggregate([
      {
        $match: {
          status: 'completed',
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$amount' },
          totalCommission: { $sum: '$commissionAmount' },
          totalEarnings: { $sum: '$specialistEarnings' },
          totalPayments: { $sum: 1 },
        },
      },
    ]);

    // Get by service type
    const byServiceType = await Payment.aggregate([
      {
        $match: {
          status: 'completed',
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: '$serviceType',
          revenue: { $sum: '$amount' },
          commission: { $sum: '$commissionAmount' },
          count: { $sum: 1 },
        },
      },
    ]);

    res.json({
      success: true,
      data: {
        dailyStats: stats,
        totals: totals[0] || {
          totalRevenue: 0,
          totalCommission: 0,
          totalEarnings: 0,
          totalPayments: 0,
        },
        byServiceType,
        period: `${days} days`,
      },
    });
  } catch (error) {
    console.error('Error fetching commission statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch commission statistics',
    });
  }
};

/**
 * Get specialist earnings
 * GET /api/commission/specialist/:specialistId/earnings
 */
export const getSpecialistEarnings = async (req, res) => {
  try {
    const { specialistId } = req.params;
    const { startDate, endDate } = req.query;

    // Verify user is specialist or admin
    if (req.user?.userId !== specialistId && req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const filter = {
      specialistId: new mongoose.Types.ObjectId(specialistId),
      status: 'completed',
    };

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        filter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.createdAt.$lte = new Date(endDate);
      }
    }

    // Get earnings
    const earnings = await Payment.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalEarnings: { $sum: '$specialistEarnings' },
          totalPayments: { $sum: 1 },
          totalRevenue: { $sum: '$amount' },
        },
      },
    ]);

    // Get by service type
    const byServiceType = await Payment.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$serviceType',
          earnings: { $sum: '$specialistEarnings' },
          count: { $sum: 1 },
        },
      },
    ]);

    res.json({
      success: true,
      data: {
        specialists: earnings[0] || {
          totalEarnings: 0,
          totalPayments: 0,
          totalRevenue: 0,
        },
        byServiceType,
      },
    });
  } catch (error) {
    console.error('Error fetching specialist earnings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch specialist earnings',
    });
  }
};
