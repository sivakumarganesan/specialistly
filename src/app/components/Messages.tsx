import { useState, useEffect } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { messageAPI } from '@/app/api/apiClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Badge } from '@/app/components/ui/badge';
import { Send, Search, Archive, Trash2 } from 'lucide-react';

interface Participant {
  userId: string;
  email: string;
  name: string;
  userType: 'specialist' | 'customer';
}

interface Conversation {
  _id: string;
  participants: Participant[];
  lastMessage: string;
  lastMessageTime: string;
  lastMessageSenderId: string;
  preview: string;
  unreadCounts: Record<string, number>;
  isArchived: boolean;
}

interface Message {
  _id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderEmail: string;
  senderType: 'specialist' | 'customer';
  receiverId: string;
  text: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

export function Messages() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [pollInterval, setPollInterval] = useState<NodeJS.Timeout | null>(null);

  // Load conversations
  useEffect(() => {
    if (!user?.id) return;

    const loadConversations = async () => {
      try {
        const data = await messageAPI.getConversations();
        setConversations(data);
        
        // Auto-select first conversation if none selected
        if (data.length > 0 && !selectedConversation) {
          setSelectedConversation(data[0]);
        }
      } catch (error) {
        console.error('Failed to load conversations:', error);
      }
    };

    loadConversations();
  }, [user?.id]);

  // Load messages for selected conversation and setup polling
  useEffect(() => {
    if (!selectedConversation?._id || !user?.id) {
      if (pollInterval) clearInterval(pollInterval);
      return;
    }

    const loadMessages = async () => {
      try {
        setIsLoading(true);
        const data = await messageAPI.getMessages(selectedConversation._id);
        setMessages(data.messages);

        // Mark as read
        await messageAPI.markAsRead(selectedConversation._id);
        
        // Update conversation list to remove unread badge
        setConversations(convs =>
          convs.map(conv =>
            conv._id === selectedConversation._id
              ? { ...conv, unreadCounts: { ...conv.unreadCounts, [user.id]: 0 } }
              : conv
          )
        );
      } catch (error) {
        console.error('Failed to load messages:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadMessages();

    // Poll for new messages every 2 seconds
    const interval = setInterval(loadMessages, 2000);
    setPollInterval(interval);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [selectedConversation?._id, user?.id]);

  // Handle send message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedConversation || !user?.id) return;

    try {
      setIsSending(true);
      const otherParticipant = selectedConversation.participants.find(p => p.userId !== user.id);
      
      if (!otherParticipant) return;

      const newMessage = await messageAPI.sendMessage({
        conversationId: selectedConversation._id,
        receiverId: otherParticipant.userId,
        text: messageText.trim(),
      });

      setMessages([...messages, newMessage]);
      setMessageText('');

      // Update conversation list with new message
      setConversations(convs =>
        convs.map(conv =>
          conv._id === selectedConversation._id
            ? {
                ...conv,
                lastMessage: messageText.trim(),
                lastMessageTime: new Date().toISOString(),
                lastMessageSenderId: user.id,
                preview: messageText.trim().substring(0, 100),
              }
            : conv
        )
      );
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  };

  // Get other participant
  const getOtherParticipant = (conversation: Conversation) => {
    return conversation.participants.find(p => p.userId !== user?.id);
  };

  // Filter conversations based on search
  const filteredConversations = conversations.filter(conv => {
    const otherParticipant = getOtherParticipant(conv);
    if (!otherParticipant) return false;
    
    const query = searchQuery.toLowerCase();
    return (
      otherParticipant.name.toLowerCase().includes(query) ||
      otherParticipant.email.toLowerCase().includes(query) ||
      conv.preview.toLowerCase().includes(query)
    );
  });

  // Get unread count for a conversation
  const getUnreadCount = (conversation: Conversation) => {
    return conversation.unreadCounts?.[user?.id || ''] || 0;
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold mb-2">Messages</h1>
        <p className="text-gray-600">Connect directly with specialists and customers</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px] overflow-hidden">
        {/* Conversations List */}
        <div className="lg:col-span-1 flex flex-col bg-white rounded-lg border">
          <div className="p-4 border-b space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="text-sm text-gray-600">
              {filteredConversations.length} conversation{filteredConversations.length !== 1 ? 's' : ''}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filteredConversations.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-sm">
                {searchQuery ? 'No conversations found' : 'No conversations yet'}
              </div>
            ) : (
              filteredConversations.map(conversation => {
                const otherParticipant = getOtherParticipant(conversation);
                const unreadCount = getUnreadCount(conversation);

                return (
                  <button
                    key={conversation._id}
                    onClick={() => setSelectedConversation(conversation)}
                    className={`w-full p-4 border-b text-left transition hover:bg-gray-50 ${
                      selectedConversation?._id === conversation._id ? 'bg-purple-50' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="font-semibold text-sm truncate">
                        {otherParticipant?.name}
                      </div>
                      {unreadCount > 0 && (
                        <Badge className="bg-purple-600 h-5 px-2 flex items-center justify-center text-xs">
                          {unreadCount}
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-gray-600 truncate mb-1">
                      {otherParticipant?.email}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {conversation.preview || 'No messages yet'}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Messages Panel */}
        <div className="lg:col-span-2 flex flex-col bg-white rounded-lg border">
          {selectedConversation ? (
            <>
              {/* Header */}
              <div className="p-4 border-b flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-lg">
                    {getOtherParticipant(selectedConversation)?.name}
                  </h2>
                  <p className="text-xs text-gray-600">
                    {getOtherParticipant(selectedConversation)?.userType === 'specialist'
                      ? 'Specialist'
                      : 'Customer'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {/* Archive logic */}}
                  >
                    <Archive className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                {isLoading ? (
                  <div className="text-center text-gray-500">Loading messages...</div>
                ) : messages.length === 0 ? (
                  <div className="text-center text-gray-500">No messages yet. Start the conversation!</div>
                ) : (
                  messages.map(message => (
                    <div
                      key={message._id}
                      className={`flex ${message.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs px-4 py-2 rounded-lg ${
                          message.senderId === user?.id
                            ? 'bg-purple-600 text-white'
                            : 'bg-white border'
                        }`}
                      >
                        <p className="text-sm break-words">{message.text}</p>
                        <p className={`text-xs mt-1 ${
                          message.senderId === user?.id ? 'text-purple-100' : 'text-gray-500'
                        }`}>
                          {new Date(message.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                          {message.isRead && message.senderId === user?.id && ' ✓'}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Input */}
              <form onSubmit={handleSendMessage} className="p-4 border-t bg-white">
                <div className="flex gap-2">
                  <Input
                    placeholder="Type your message..."
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    disabled={isSending}
                  />
                  <Button
                    type="submit"
                    disabled={isSending || !messageText.trim()}
                    className="bg-purple-600 hover:bg-purple-700 gap-2"
                  >
                    <Send className="h-4 w-4" />
                    Send
                  </Button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              Select a conversation to start messaging
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Messages;
