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

// Conversations
router.get('/conversations', getConversations);
router.post('/conversations', getOrCreateConversation);

// Messages
router.post('/', sendMessage);
router.get('/:conversationId', getMessages);
router.put('/:conversationId/read', markAsRead);
router.get('/unread', getUnreadCount);
router.delete('/:messageId', deleteMessage);
router.put('/:conversationId/archive', archiveConversation);

export default router;
