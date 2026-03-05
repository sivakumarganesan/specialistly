import CreatorProfile from '../models/CreatorProfile.js';
import SpecialistPayout from '../models/SpecialistPayout.js';
import mongoose from 'mongoose';

/**
 * Update specialist bank account details
 * POST /api/specialist/bank-account
 */
export const updateBankAccount = async (req, res) => {
  try {
    const specialistId = req.user?.userId;
    const {
      accountHolderName,
      accountNumber,
      ifscCode,
      accountType,
      bankName,
    } = req.body;

    // Validate inputs
    if (!accountHolderName || !accountNumber || !ifscCode || !accountType || !bankName) {
      return res.status(400).json({
        success: false,
        message: 'All bank details are required',
      });
    }

    // Validate IFSC code format (11 characters, alphanumeric)
    if (!/^[A-Z0-9]{11}$/.test(ifscCode)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid IFSC code format. Must be 11 characters.',
      });
    }

    // Validate account number (8-18 digits)
    if (!/^\d{8,18}$/.test(accountNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid account number. Must be 8-18 digits.',
      });
    }

    // Find specialist and update
    const specialist = await CreatorProfile.findById(specialistId);
    if (!specialist) {
      return res.status(404).json({
        success: false,
        message: 'Specialist profile not found',
      });
    }

    specialist.bankAccount = {
      accountHolderName,
      accountNumber,
      ifscCode,
      accountType,
      bankName,
      isVerified: false,
      verificationStatus: 'unverified',
      verificationDate: null,
      razorpayContactId: specialist.bankAccount?.razorpayContactId || null,
      addedAt: new Date(),
      updatedAt: new Date(),
    };

    await specialist.save();

    console.log('[Bank Account Update]', {
      specialistId,
      accountHolderName,
      message: 'Bank account details updated',
    });

    return res.status(200).json({
      success: true,
      message: 'Bank account details saved successfully',
      bankAccount: {
        accountHolderName: specialist.bankAccount.accountHolderName,
        accountType: specialist.bankAccount.accountType,
        bankName: specialist.bankAccount.bankName,
        ifscCode: specialist.bankAccount.ifscCode,
        isVerified: specialist.bankAccount.isVerified,
        verificationStatus: specialist.bankAccount.verificationStatus,
      },
    });
  } catch (error) {
    console.error('[Bank Account Update] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating bank account',
      error: error.message,
    });
  }
};

/**
 * Get specialist bank account details
 * GET /api/specialist/bank-account
 */
export const getBankAccount = async (req, res) => {
  try {
    const specialistId = req.user?.userId;

    const specialist = await CreatorProfile.findById(specialistId);
    if (!specialist) {
      return res.status(404).json({
        success: false,
        message: 'Specialist profile not found',
      });
    }

    if (!specialist.bankAccount || !specialist.bankAccount.accountNumber) {
      return res.status(404).json({
        success: false,
        message: 'Bank account not set up',
        bankAccount: null,
      });
    }

    // Return masked account number for security
    const maskedAccountNumber = specialist.bankAccount.accountNumber
      .slice(-4)
      .padStart(specialist.bankAccount.accountNumber.length, '*');

    return res.status(200).json({
      success: true,
      bankAccount: {
        accountHolderName: specialist.bankAccount.accountHolderName,
        accountNumber: maskedAccountNumber,
        ifscCode: specialist.bankAccount.ifscCode,
        accountType: specialist.bankAccount.accountType,
        bankName: specialist.bankAccount.bankName,
        isVerified: specialist.bankAccount.isVerified,
        verificationStatus: specialist.bankAccount.verificationStatus,
        verificationDate: specialist.bankAccount.verificationDate,
        addedAt: specialist.bankAccount.addedAt,
      },
    });
  } catch (error) {
    console.error('[Get Bank Account] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving bank account',
      error: error.message,
    });
  }
};

/**
 * Get payout history for specialist
 * GET /api/specialist/payouts
 * Query params: status, limit, skip
 */
export const getPayoutHistory = async (req, res) => {
  try {
    const specialistId = req.user?.userId;
    const { status: filterStatus, limit = 10, skip = 0 } = req.query;

    let query = { specialistId };
    if (filterStatus) {
      query.status = filterStatus;
    }

    const payouts = await SpecialistPayout.find(query)
      .populate('courseId', 'title')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await SpecialistPayout.countDocuments(query);

    // Calculate summary
    const summary = await SpecialistPayout.aggregate([
      { $match: { specialistId: new mongoose.Types.ObjectId(specialistId) } },
      {
        $group: {
          _id: null,
          totalPending: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, '$amount', 0] },
          },
          totalCompleted: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, '$amount', 0] },
          },
          totalProcessing: {
            $sum: { $cond: [{ $eq: ['$status', 'processing'] }, '$amount', 0] },
          },
          totalFailed: {
            $sum: { $cond: [{ $eq: ['$status', 'failed'] }, '$amount', 0] },
          },
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      payouts: payouts.map((payout) => ({
        id: payout._id,
        courseTitle: payout.courseId?.title || 'Unknown Course',
        amount: payout.amount,
        currency: payout.currency,
        status: payout.status,
        failureReason: payout.failureReason,
        payoutCompletedAt: payout.payoutCompletedAt,
        createdAt: payout.createdAt,
      })),
      summary: summary[0] || {
        totalPending: 0,
        totalCompleted: 0,
        totalProcessing: 0,
        totalFailed: 0,
      },
      pagination: {
        total,
        limit: parseInt(limit),
        skip: parseInt(skip),
      },
    });
  } catch (error) {
    console.error('[Get Payouts] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving payout history',
      error: error.message,
    });
  }
};

/**
 * Get payout statistics for specialist dashboard
 * GET /api/specialist/payout-stats
 */
export const getPayoutStats = async (req, res) => {
  try {
    const specialistId = req.user?.userId;

    const specialist = await CreatorProfile.findById(specialistId);
    if (!specialist) {
      return res.status(404).json({
        success: false,
        message: 'Specialist not found',
      });
    }

    // Calculate this month's earnings
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const statsThisMonth = await SpecialistPayout.aggregate([
      {
        $match: {
          specialistId: new mongoose.Types.ObjectId(specialistId),
          createdAt: { $gte: startOfMonth },
        },
      },
      {
        $group: {
          _id: null,
          countEnrollments: { $sum: 1 },
          totalEarnings: { $sum: '$amount' },
          completedPayouts: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, '$amount', 0] },
          },
          pendingPayouts: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, '$amount', 0] },
          },
        },
      },
    ]);

    const stats = statsThisMonth[0] || {
      countEnrollments: 0,
      totalEarnings: 0,
      completedPayouts: 0,
      pendingPayouts: 0,
    };

    return res.status(200).json({
      success: true,
      stats: {
        thisMonth: {
          enrollments: stats.countEnrollments,
          totalEarnings: stats.totalEarnings / 100, // Convert to rupees
          totalCompleted: stats.completedPayouts / 100,
          totalPending: stats.pendingPayouts / 100,
        },
        allTime: {
          totalEarnings: specialist.totalEarnings / 100,
          totalCommissionPaid: specialist.totalCommissionPaid / 100,
          lastPayoutDate: specialist.lastPayoutDate,
        },
        bankAccountStatus: {
          isSetup: !!specialist.bankAccount?.accountNumber,
          isVerified: specialist.bankAccount?.isVerified || false,
          verificationStatus: specialist.bankAccount?.verificationStatus || 'unverified',
        },
      },
    });
  } catch (error) {
    console.error('[Get Payout Stats] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving payout statistics',
      error: error.message,
    });
  }
};

/**
 * Admin: Process payout for specialist (manual trigger)
 * POST /api/admin/process-payout/:commissionId
 */
export const processPayoutManual = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can process payouts',
      });
    }

    const { commissionId } = req.params;
    const { notes } = req.body;

    // Import the function (we'll create this in razorpayService)
    const { processSpecialistPayout } = await import('../services/razorpayService.js');

    const result = await processSpecialistPayout(commissionId, notes);

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error('[Process Payout Manual] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing payout',
      error: error.message,
    });
  }
};
