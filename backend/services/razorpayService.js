import Razorpay from 'razorpay';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

// Lazy initialization of Razorpay - only create when credentials are available
let razorpay = null;

const initializeRazorpay = () => {
  if (razorpay) return razorpay;

  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error('Razorpay credentials not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET environment variables.');
  }

  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });

  return razorpay;
};

export const razorpayService = {
  /**
   * Create a Razorpay Order for payment processing
   * @param {Object} options - Configuration options
   * @param {number} options.amount - Amount in smallest unit (paise for INR)
   * @param {string} options.currency - Currency code (INR, USD, etc.)
   * @param {string} options.customerId - Customer ID
   * @param {string} options.customerEmail - Customer email
   * @param {string} options.description - Payment description
   * @param {Object} options.metadata - Additional metadata
   * @returns {Promise<Object>} Razorpay Order object
   */
  createOrder: async ({
    amount,
    currency = 'INR',
    customerId,
    customerEmail,
    description,
    metadata = {},
  }) => {
    try {
      const rp = initializeRazorpay();
      
      if (amount < 100) {
        throw new Error('Amount must be at least 100 paise (₹1 for INR)');
      }

      const orderData = {
        amount, // Amount in paise for INR
        currency,
        description,
        customer_notify: 1,
        notes: {
          customerId,
          customerEmail,
          ...metadata,
        },
      };

      const order = await rp.orders.create(orderData);

      return {
        success: true,
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        status: order.status,
      };
    } catch (error) {
      console.error('[RazorpayService] Error creating order:', error);
      return {
        success: false,
        error: error.message,
        code: error.code,
      };
    }
  },

  /**
   * Verify Razorpay payment signature
   * @param {string} orderId - Razorpay Order ID
   * @param {string} paymentId - Razorpay Payment ID
   * @param {string} signature - Razorpay Signature from webhook
   * @returns {Promise<Object>} Verification result
   */
  verifyPaymentSignature: async (orderId, paymentId, signature) => {
    try {
      const body = orderId + '|' + paymentId;
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(body)
        .digest('hex');

      const isSignatureValid = expectedSignature === signature;

      if (!isSignatureValid) {
        console.warn('[RazorpayService] Signature verification failed');
        return {
          success: false,
          error: 'Invalid signature',
          isValid: false,
        };
      }

      console.log('[RazorpayService] Signature verified successfully');
      return {
        success: true,
        isValid: true,
        orderId,
        paymentId,
      };
    } catch (error) {
      console.error('[RazorpayService] Error verifying signature:', error);
      return {
        success: false,
        error: error.message,
        isValid: false,
      };
    }
  },

  /**
   * Retrieve Razorpay Payment details
   * @param {string} paymentId - Razorpay Payment ID
   * @returns {Promise<Object>} Payment details
   */
  retrievePayment: async (paymentId) => {
    try {
      const rp = initializeRazorpay();
      const payment = await rp.payments.fetch(paymentId);

      console.log('[RazorpayService] Retrieved payment:', {
        id: payment.id,
        status: payment.status,
        amount: payment.amount,
      });

      return {
        success: true,
        status: payment.status,
        amount: payment.amount,
        currency: payment.currency,
        paymentMethod: payment.method,
        orderId: payment.order_id,
        customerId: payment.notes?.customerId,
      };
    } catch (error) {
      console.error('[RazorpayService] Error retrieving payment:', error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  /**
   * Retrieve Razorpay Order details
   * @param {string} orderId - Razorpay Order ID
   * @returns {Promise<Object>} Order details
   */
  retrieveOrder: async (orderId) => {
    try {
      const rp = initializeRazorpay();
      const order = await rp.orders.fetch(orderId);

      console.log('[RazorpayService] Retrieved order:', {
        id: order.id,
        status: order.status,
        amount: order.amount,
      });

      return {
        success: true,
        orderId: order.id,
        status: order.status,
        amount: order.amount,
        currency: order.currency,
        paymentIds: order.payments?.items || [],
      };
    } catch (error) {
      console.error('[RazorpayService] Error retrieving order:', error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  /**
   * Process refund for a payment
   * @param {string} paymentId - Razorpay Payment ID
   * @param {number} amount - Refund amount in paise (optional, full refund if not provided)
   * @param {string} notes - Refund notes
   * @returns {Promise<Object>} Refund result
   */
  processRefund: async (paymentId, amount = null, notes = '') => {
    try {
      const rp = initializeRazorpay();
      
      const refundData = {
        notes: notes ? { reason: notes } : undefined,
      };

      if (amount) {
        refundData.amount = amount;
      }

      const refund = await rp.payments.refund(paymentId, refundData);

      console.log('[RazorpayService] Refund processed:', {
        id: refund.id,
        status: refund.status,
        amount: refund.amount,
      });

      return {
        success: true,
        refundId: refund.id,
        status: refund.status,
        amount: refund.amount,
      };
    } catch (error) {
      console.error('[RazorpayService] Error processing refund:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  },
};

/**
 * Process specialist payout to bank account
 * Creates a transfer from platform to specialist bank
 * @param {string} commissionId - Commission record ID
 * @param {string} notes - Optional payout notes
 * @returns {Promise<Object>} Payout result
 */
export async function processSpecialistPayout(commissionId, notes = '') {
  try {
    const rp = initializeRazorpay();
    
    // Import models
    const { default: MarketplaceCommission } = await import('../models/MarketplaceCommission.js');
    const { default: CreatorProfile } = await import('../models/CreatorProfile.js');
    const { default: SpecialistPayout } = await import('../models/SpecialistPayout.js');

    // Get commission record
    const commission = await MarketplaceCommission.findById(commissionId);
    if (!commission) {
      return {
        success: false,
        error: 'Commission record not found',
      };
    }

    // Get specialist with bank account
    const specialist = await CreatorProfile.findOne({
      email: commission.specialistEmail,
    });
    
    if (!specialist) {
      return {
        success: false,
        error: 'Specialist not found',
      };
    }

    if (!specialist.bankAccount?.accountNumber) {
      return {
        success: false,
        error: 'Specialist has not set up bank account',
      };
    }

    // Prepare transfer data
    const accountNumber = specialist.bankAccount.accountNumber;
    const ifscCode = specialist.bankAccount.ifscCode;
    const accountHolderName = specialist.bankAccount.accountHolderName;

    console.log('[RazorpayService] Initiating payout:', {
      specialistEmail: specialist.email,
      amount: commission.specialistPayout,
      accountNumber: accountNumber.slice(-4),
    });

    // Create transfer (fund account + transfer)
    try {
      // Step 1: Create or get contact for specialist
      let contactId = specialist.bankAccount?.razorpayContactId;
      
      if (!contactId) {
        const contactResponse = await rp.contacts.create({
          type: 'vendor',
          name: accountHolderName,
          email: specialist.email,
          gstin: null, // Optional: GST number
          notes: {
            specialistId: specialist._id.toString(),
          },
        });
        contactId = contactResponse.id;
        
        // Update specialist with contact ID
        specialist.bankAccount.razorpayContactId = contactId;
        await specialist.save();
        
        console.log('[RazorpayService] Created Razorpay contact:', contactId);
      }

      // Step 2: Create fund account (bank account link)
      const fundAccountResponse = await rp.fundAccounts.create({
        contact_id: contactId,
        account_type: 'bank_account',
        bank_account: {
          name: accountHolderName,
          notes: {
            notes_key: accountHolderName,
          },
          ifsc: ifscCode,
          account_number: accountNumber,
        },
      });
      const fundAccountId = fundAccountResponse.id;

      console.log('[RazorpayService] Created fund account:', fundAccountId);

      // Step 3: Create payout
      const payoutResponse = await rp.payouts.create({
        account_number: process.env.RAZORPAY_ACCOUNT_NUMBER || 'default', // Razorpay business account
        fund_account_id: fundAccountId,
        amount: commission.specialistPayout, // in paise
        currency: 'INR',
        mode: 'NEFT', // NEFT, RTGS, IMPS, IFT (Instant Fund Transfer)
        purpose: 'payout',
        description: `Payout for course sale - ${commission.serviceName}`,
        notes: {
          commissionId: commission._id.toString(),
          courseTitle: commission.serviceName,
          specialistEmail: specialist.email,
          adminNotes: notes,
        },
      });

      console.log('[RazorpayService] Payout initiated:', {
        payoutId: payoutResponse.id,
        status: payoutResponse.status,
        amount: payoutResponse.amount,
      });

      // Step 4: Create payout record in database
      const payoutRecord = await SpecialistPayout.create({
        specialistId: specialist._id,
        specialistEmail: specialist.email,
        specialistName: specialist.creatorName,
        commissionId: commission._id,
        courseId: commission.serviceId,
        amount: commission.specialistPayout,
        currency: 'INR',
        originalPaymentAmount: commission.grossAmount,
        commissionDeducted: commission.commissionAmount,
        razorpayPayoutId: payoutResponse.id,
        razorpayPaymentId: commission.razorpayPaymentId || commission.paymentIntentId,
        status: payoutResponse.status === 'pending' ? 'processing' : payoutResponse.status,
        payoutInitiatedAt: new Date(),
        bankDetailsSnapshot: {
          accountHolderName: specialist.bankAccount.accountHolderName,
          accountNumber: accountNumber.slice(-4),
          accountType: specialist.bankAccount.accountType,
          bankName: specialist.bankAccount.bankName,
        },
        notes: notes || null,
      });

      // Update commission status
      commission.payoutStatus = 'initiated';
      commission.razorpayPayoutId = payoutResponse.id;
      await commission.save();

      return {
        success: true,
        message: 'Payout initiated successfully',
        payout: {
          id: payoutRecord._id,
          razorpayPayoutId: payoutResponse.id,
          status: payoutResponse.status,
          amount: commission.specialistPayout / 100, // Convert to rupees
          specialistEmail: specialist.email,
          estimatedArrivalTime: '2-4 hours for NEFT',
        },
      };
    } catch (razorpayError) {
      console.error('[RazorpayService] Razorpay payout error:', razorpayError);
      
      // Create failed payout record
      await SpecialistPayout.create({
        specialistId: specialist._id,
        specialistEmail: specialist.email,
        specialistName: specialist.creatorName,
        commissionId: commission._id,
        courseId: commission.serviceId,
        amount: commission.specialistPayout,
        currency: 'INR',
        originalPaymentAmount: commission.grossAmount,
        commissionDeducted: commission.commissionAmount,
        status: 'failed',
        failureReason: razorpayError.message,
        bankDetailsSnapshot: {
          accountHolderName: specialist.bankAccount.accountHolderName,
          accountNumber: accountNumber.slice(-4),
          accountType: specialist.bankAccount.accountType,
          bankName: specialist.bankAccount.bankName,
        },
        notes: notes || null,
      });

      return {
        success: false,
        error: 'Failed to initiate payout',
        details: razorpayError.message,
      };
    }
  } catch (error) {
    console.error('[RazorpayService] Error processing specialist payout:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

