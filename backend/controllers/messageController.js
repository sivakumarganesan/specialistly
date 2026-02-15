import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';

// Get all conversations for a user
export const getConversations = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const conversations = await Conversation.find({
      'participants.userId': userId,
      isArchived: false,
    })
      .sort({ lastMessageTime: -1 })
      .lean();

    res.json(conversations);
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get or create a conversation between two users
export const getOrCreateConversation = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { 
      currentUserEmail, 
      currentUserName,
      currentUserType,
      otherUserId, 
      otherUserEmail, 
      otherUserName, 
      otherUserType 
    } = req.body;

    if (!userId || !otherUserId) {
      return res.status(400).json({ error: 'Missing user information' });
    }

    // Find existing conversation
    let conversation = await Conversation.findOne({
      'participants.userId': { $all: [userId, otherUserId] },
    });

    if (conversation) {
      return res.json(conversation);
    }

    // Create new conversation
    const newConversation = new Conversation({
      participants: [
        {
          userId,
          email: currentUserEmail,
          name: currentUserName,
          userType: currentUserType,
        },
        {
          userId: otherUserId,
          email: otherUserEmail,
          name: otherUserName,
          userType: otherUserType,
        },
      ],
      unreadCounts: {
        [userId]: 0,
        [otherUserId]: 0,
      },
    });

    await newConversation.save();
    res.status(201).json(newConversation);
  } catch (error) {
    console.error('Get or create conversation error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Send a message
export const sendMessage = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { conversationId, receiverId, senderName, senderEmail, text } = req.body;

    if (!userId || !conversationId || !receiverId || !senderName || !senderEmail || !text) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Determine sender type from conversation participants
    const conversation = await Conversation.findById(conversationId);
    const currentUserParticipant = conversation?.participants?.find(p => p.userId === userId);
    const senderType = currentUserParticipant?.userType || 'customer';

    // Create message
    const message = new Message({
      conversationId,
      senderId: userId,
      senderName,
      senderEmail,
      senderType,
      receiverId,
      text,
    });

    await message.save();

    // Update conversation
    await Conversation.findByIdAndUpdate(
      conversationId,
      {
        $set: {
          lastMessage: text,
          lastMessageTime: new Date(),
          lastMessageSenderId: userId,
          preview: text.substring(0, 100),
          [`unreadCounts.${receiverId}`]: (await Message.countDocuments({
            conversationId,
            receiverId,
            isRead: false,
          })),
        },
      },
      { new: true }
    );

    res.status(201).json(message);
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get messages for a conversation
export const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { limit = 50, skip = 0 } = req.query;

    if (!conversationId) {
      return res.status(400).json({ error: 'Conversation ID required' });
    }

    const messages = await Message.find({ conversationId })
      .sort({ createdAt: -1 })
      .skip(Number(skip))
      .limit(Number(limit))
      .lean();

    const totalCount = await Message.countDocuments({ conversationId });

    res.json({
      messages: messages.reverse(),
      totalCount,
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Mark messages as read
export const markAsRead = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { conversationId } = req.params;

    if (!userId || !conversationId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Mark all unread messages from others as read
    await Message.updateMany(
      {
        conversationId,
        receiverId: userId,
        isRead: false,
      },
      {
        $set: { isRead: true, readAt: new Date() },
      }
    );

    // Update conversation unread count
    const unreadCount = await Message.countDocuments({
      conversationId,
      receiverId: userId,
      isRead: false,
    });

    await Conversation.findByIdAndUpdate(
      conversationId,
      { $set: { [`unreadCounts.${userId}`]: unreadCount } },
      { new: true }
    );

    res.json({ success: true, unreadCount });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get unread message count
export const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const unreadCount = await Message.countDocuments({
      receiverId: userId,
      isRead: false,
    });

    res.json({ unreadCount });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Delete a message
export const deleteMessage = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { messageId } = req.params;

    if (!userId || !messageId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Only sender can delete
    if (message.senderId !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await Message.findByIdAndDelete(messageId);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Archive a conversation
export const archiveConversation = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { conversationId } = req.params;

    if (!userId || !conversationId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const conversation = await Conversation.findByIdAndUpdate(
      conversationId,
      { isArchived: true },
      { new: true }
    );

    res.json(conversation);
  } catch (error) {
    console.error('Archive conversation error:', error);
    res.status(500).json({ error: error.message });
  }
};
