import express from 'express';
import {
  getConversations,
  getOrCreateConversation,
  sendMessage,
  getMessages,
  markAsRead,
  getUnreadCount,
  deleteMessage,
  archiveConversation,
} from '../controllers/messageController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Conversations (must come before /:conversationId routes)
router.get('/conversations', getConversations);
router.post('/conversations', getOrCreateConversation);

// Unread count (must come before /:conversationId routes)
router.get('/unread/count', getUnreadCount);

// Messages
router.post('/', sendMessage);
router.get('/:conversationId', getMessages);
router.put('/:conversationId/read', markAsRead);
router.put('/:conversationId/archive', archiveConversation);

// Single message operations
router.delete('/:messageId', deleteMessage);

export default router;
