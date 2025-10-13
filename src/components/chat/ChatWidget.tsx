'use client';

import { useState, useEffect, useRef } from 'react';
import { formatDistanceToNow } from 'date-fns';

interface Message {
  id: number;
  senderId: number | null;
  messageText: string;
  sentAt: string;
  messageType: 'text' | 'system' | 'ai_response' | 'ai_suggestion';
  senderName?: string;
  isRead: boolean;
}

interface Conversation {
  id: number;
  reviewId: number;
  participant1Id: number;
  participant1Name: string;
  participant2Id: number;
  participant2Name: string;
  submissionTitle: string;
  assignmentTitle: string;
  courseName: string;
  submissionOwnerId: number;
  reviewerId: number;
  reviewStatus: string;
  reviewFeedback?: string;
  isAiConversation?: boolean;
}

interface ChatWidgetProps {
  reviewId: number;
  currentUserId: number;
  isVisible: boolean;
  onClose: () => void;
}

export default function ChatWidget({ reviewId, currentUserId, isVisible, onClose }: ChatWidgetProps) {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuggestionMinimized, setIsSuggestionMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [newMessage]);

  // Initialize or get conversation
  useEffect(() => {
    if (isVisible && reviewId && currentUserId) {
      initializeChat();
    } else if (!isVisible) {
      // Reset state when closing
      setError(null);
      setIsLoading(false);
      setConversation(null);
      setMessages([]);
      setNewMessage('');
    }
  }, [isVisible, reviewId, currentUserId]);

  const initializeChat = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Create or get existing conversation
      const conversationResponse = await fetch('/api/chat/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewId, userId: currentUserId })
      });

      if (!conversationResponse.ok) {
        const errorData = await conversationResponse.json();
        throw new Error(errorData.error || 'Failed to initialize chat');
      }

      const { conversationId } = await conversationResponse.json();

      // Fetch conversation details and messages
      const chatResponse = await fetch(`/api/chat/conversations/${conversationId}?userId=${currentUserId}`);
      
      if (!chatResponse.ok) {
        const errorData = await chatResponse.json();
        throw new Error(errorData.error || 'Failed to load chat');
      }

      const chatData = await chatResponse.json();
      setConversation(chatData.conversation);
      setMessages(chatData.messages);

    } catch (error) {
      console.error('Error initializing chat:', error);
      setError(error instanceof Error ? error.message : 'Failed to load chat');
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !conversation || isSending) return;

    setIsSending(true);
    const messageText = newMessage.trim();
    setNewMessage('');

    try {
      const response = await fetch(`/api/chat/conversations/${conversation.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageText,
          senderId: currentUserId
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send message');
      }

      const { message, messages } = await response.json();
      // If multiple messages returned (e.g., user message + AI response), add all
      if (messages && Array.isArray(messages)) {
        setMessages(prev => [...prev, ...messages.map(msg => ({ ...msg, isRead: true }))]);
      } else {
        setMessages(prev => [...prev, { ...message, isRead: true }]);
      }

    } catch (error) {
      console.error('Error sending message:', error);
      setNewMessage(messageText); // Restore message on error
      setError(error instanceof Error ? error.message : 'Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatMessageTime = (sentAt: string) => {
    try {
      return formatDistanceToNow(new Date(sentAt), { addSuffix: true });
    } catch {
      return 'Unknown time';
    }
  };

  const getOtherParticipant = () => {
    if (!conversation) return null;
    // Always return anonymous reviewer name regardless of AI or peer
    return { id: -1, name: 'Anonymous Reviewer' };
  };

  // Check if current user is the reviewer (should see AI suggestions)
  const isCurrentUserReviewer = () => {
    if (!conversation) return false;
    return currentUserId === conversation.reviewerId;
  };

  if (!isVisible) {
    // Completely reset all state when not visible
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 bg-white border border-gray-300 rounded-lg shadow-lg flex flex-col z-[99999]" style={{ height: '650px', maxHeight: '85vh' }}>
      {/* Header */}
      <div className="bg-indigo-600 text-white p-3 rounded-t-lg flex justify-between items-center flex-shrink-0">
        <div className="flex-1">
          <h3 className="font-medium text-sm">
            {isLoading ? 'Loading...' : 'Anonymous Reviewer'}
          </h3>
          {conversation && (
            <p className="text-xs text-indigo-200 truncate">
              {conversation.assignmentTitle}
            </p>
          )}
        </div>
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onClose();
          }}
          className="text-indigo-200 hover:text-white"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ minHeight: '300px' }}>
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
          </div>
        ) : error ? (
          <div className="text-center text-red-600 text-sm">
            <p>{error}</p>
            <button
              onClick={initializeChat}
              className="mt-2 text-xs bg-red-100 px-2 py-1 rounded hover:bg-red-200"
            >
              Retry
            </button>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-500 text-sm">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.filter(message => message.messageType !== 'ai_suggestion').map((message) => (
            <div key={message.id}>
              {message.messageType === 'system' ? (
                <div className="text-center text-xs text-gray-500 bg-gray-100 py-2 px-3 rounded">
                  {message.messageText}
                </div>
              ) : message.messageType === 'ai_response' ? (
                <div className="flex justify-start">
                  <div className="max-w-xs lg:max-w-md px-3 py-2 rounded-lg text-sm bg-gray-200 text-gray-900">
                    <p className="whitespace-pre-wrap">{message.messageText}</p>
                    <p className="text-xs mt-1 text-gray-500">
                      {formatMessageTime(message.sentAt)}
                    </p>
                  </div>
                </div>
              ) : (
                <div
                  className={`flex ${
                    message.senderId === currentUserId ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg text-sm ${
                      message.senderId === currentUserId
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-200 text-gray-900'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{message.messageText}</p>
                    <p
                      className={`text-xs mt-1 ${
                        message.senderId === currentUserId
                          ? 'text-indigo-200'
                          : 'text-gray-500'
                      }`}
                    >
                      {formatMessageTime(message.sentAt)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* AI Feedback Suggestions - Only show to reviewers */}
      {conversation && !error && isCurrentUserReviewer() && messages.some(msg => msg.messageType === 'ai_suggestion') && (
        <div className="border-t border-gray-200 bg-amber-50 flex-shrink-0" style={{ maxHeight: '120px' }}>
          <div className="flex items-center justify-between px-2 py-1">
            <div className="text-xs font-medium text-amber-800 flex items-center">
              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" clipRule="evenodd" />
              </svg>
              AI Suggestion
            </div>
            <button 
              onClick={() => setIsSuggestionMinimized(!isSuggestionMinimized)}
              className="text-amber-600 hover:text-amber-800 p-1"
            >
              <svg className={`w-3 h-3 transition-transform ${isSuggestionMinimized ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
          {!isSuggestionMinimized && messages.filter(msg => msg.messageType === 'ai_suggestion').slice(-1).map((suggestion) => (
            <div key={suggestion.id} className="px-2 pb-2 overflow-y-auto" style={{ maxHeight: '90px' }}>
              <div className="text-xs text-amber-700 bg-white bg-opacity-50 p-2 rounded border border-amber-200">
                <p className="text-xs leading-relaxed whitespace-pre-wrap">{suggestion.messageText}</p>
                <p className="text-xs mt-1 text-amber-600">
                  {formatMessageTime(suggestion.sentAt)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Input Area */}
      {conversation && !error && (
        <div className="border-t border-gray-200 p-3 flex-shrink-0" style={{ minHeight: '80px' }}>
          <div className="flex space-x-2">
            <textarea
              ref={textareaRef}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="flex-1 resize-none border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              rows={1}
              maxLength={2000}
              disabled={isSending}
            />
            <button
              onClick={sendMessage}
              disabled={!newMessage.trim() || isSending}
              className="bg-indigo-600 text-white px-3 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-700 transition-colors"
            >
              {isSending ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              )}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      )}
    </div>
  );
}
