import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { NewsletterSubscriber, NewsUpdate } from '../models/Newsletter.js';
import Website from '../models/Website.js';

const router = express.Router();

// ========== PUBLIC ROUTES ==========

// Subscribe to newsletter (public, no auth)
router.post('/:websiteId/subscribe', async (req, res) => {
  try {
    const { websiteId } = req.params;
    const { email } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ success: false, message: 'Invalid email format' });
    }

    // Verify website exists
    const website = await Website.findById(websiteId);
    if (!website) {
      return res.status(404).json({ success: false, message: 'Website not found' });
    }

    // Check if already subscribed
    const existing = await NewsletterSubscriber.findOne({
      websiteId,
      email: email.trim().toLowerCase(),
    });

    if (existing) {
      if (existing.isActive) {
        return res.status(200).json({ success: true, message: 'You are already subscribed!' });
      }
      // Re-activate
      existing.isActive = true;
      existing.subscribedAt = new Date();
      await existing.save();
      return res.status(200).json({ success: true, message: 'Welcome back! You have been re-subscribed.' });
    }

    await NewsletterSubscriber.create({
      websiteId,
      email: email.trim().toLowerCase(),
    });

    res.status(201).json({ success: true, message: 'Successfully subscribed!' });
  } catch (error) {
    console.error('Newsletter subscribe error:', error);
    res.status(500).json({ success: false, message: 'Failed to subscribe' });
  }
});

// Unsubscribe (public)
router.post('/:websiteId/unsubscribe', async (req, res) => {
  try {
    const { websiteId } = req.params;
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const subscriber = await NewsletterSubscriber.findOneAndUpdate(
      { websiteId, email: email.trim().toLowerCase() },
      { isActive: false },
      { new: true }
    );

    if (!subscriber) {
      return res.status(404).json({ success: false, message: 'Subscriber not found' });
    }

    res.status(200).json({ success: true, message: 'Successfully unsubscribed' });
  } catch (error) {
    console.error('Newsletter unsubscribe error:', error);
    res.status(500).json({ success: false, message: 'Failed to unsubscribe' });
  }
});

// Get published news updates (public)
router.get('/:websiteId/updates', async (req, res) => {
  try {
    const { websiteId } = req.params;
    const updates = await NewsUpdate.find({ websiteId, isPublished: true })
      .sort({ createdAt: -1 })
      .limit(20);

    res.status(200).json({ success: true, data: updates });
  } catch (error) {
    console.error('Fetch news updates error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch updates' });
  }
});

// ========== PROTECTED ROUTES (specialist) ==========
router.use(authMiddleware);

// Get subscribers list
router.get('/:websiteId/subscribers', async (req, res) => {
  try {
    const { websiteId } = req.params;

    // Verify ownership
    const website = await Website.findOne({ _id: websiteId, userId: req.user.userId });
    if (!website) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const subscribers = await NewsletterSubscriber.find({ websiteId, isActive: true })
      .sort({ subscribedAt: -1 });

    res.status(200).json({
      success: true,
      data: subscribers,
      total: subscribers.length,
    });
  } catch (error) {
    console.error('Fetch subscribers error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch subscribers' });
  }
});

// Create news update
router.post('/:websiteId/updates', async (req, res) => {
  try {
    const { websiteId } = req.params;
    const { title, content, image } = req.body;

    // Verify ownership
    const website = await Website.findOne({ _id: websiteId, userId: req.user.userId });
    if (!website) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (!title || !content) {
      return res.status(400).json({ success: false, message: 'Title and content are required' });
    }

    const update = await NewsUpdate.create({
      websiteId,
      title: title.trim(),
      content: content.trim(),
      image: image || '',
    });

    res.status(201).json({ success: true, data: update });
  } catch (error) {
    console.error('Create news update error:', error);
    res.status(500).json({ success: false, message: 'Failed to create update' });
  }
});

// Update a news update
router.put('/:websiteId/updates/:updateId', async (req, res) => {
  try {
    const { websiteId, updateId } = req.params;
    const { title, content, image, isPublished } = req.body;

    // Verify ownership
    const website = await Website.findOne({ _id: websiteId, userId: req.user.userId });
    if (!website) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const update = await NewsUpdate.findOneAndUpdate(
      { _id: updateId, websiteId },
      { ...(title && { title }), ...(content && { content }), ...(image !== undefined && { image }), ...(isPublished !== undefined && { isPublished }) },
      { new: true }
    );

    if (!update) {
      return res.status(404).json({ success: false, message: 'Update not found' });
    }

    res.status(200).json({ success: true, data: update });
  } catch (error) {
    console.error('Update news error:', error);
    res.status(500).json({ success: false, message: 'Failed to update' });
  }
});

// Delete a news update
router.delete('/:websiteId/updates/:updateId', async (req, res) => {
  try {
    const { websiteId, updateId } = req.params;

    // Verify ownership
    const website = await Website.findOne({ _id: websiteId, userId: req.user.userId });
    if (!website) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const update = await NewsUpdate.findOneAndDelete({ _id: updateId, websiteId });
    if (!update) {
      return res.status(404).json({ success: false, message: 'Update not found' });
    }

    res.status(200).json({ success: true, message: 'Update deleted' });
  } catch (error) {
    console.error('Delete news update error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete update' });
  }
});

export default router;
