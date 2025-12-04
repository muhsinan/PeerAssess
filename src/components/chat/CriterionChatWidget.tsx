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
  criterionId?: number | null;
  subitemId?: number | null;
  criterionName?: string | null;
  subitemName?: string | null;
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

interface CriterionChatWidgetProps {
  reviewId: number;
  currentUserId: number;
  isVisible: boolean;
  onClose: () => void;
  criterionId?: number | null;
  subitemId?: number | null;
  criterionName?: string;
  subitemName?: string;
  feedbackContext?: string;
}

export default function CriterionChatWidget({ 
  reviewId, 
  currentUserId, 
  isVisible, 
  onClose,
  criterionId,
  subitemId,
  criterionName,
  subitemName,
  feedbackContext
}: CriterionChatWidgetProps) {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
  }, [isVisible, reviewId, currentUserId, criterionId, subitemId]);

  const initializeChat = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Create or get existing conversation with criterion/subitem context
      const conversationResponse = await fetch('/api/chat/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          reviewId, 
          userId: currentUserId,
          criterionId: criterionId || null,
          subitemId: subitemId || null
        })
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

  const getChatTitle = () => {
    if (subitemName) {
      return subitemName;
    }
    if (criterionName) {
      return criterionName;
    }
    return 'Overall Feedback';
  };

  const getChatSubtitle = () => {
    if (subitemName && criterionName) {
      return `${criterionName} › Checklist Item`;
    }
    if (criterionName) {
      return 'Criterion Feedback';
    }
    return 'General Discussion';
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 bg-white border border-gray-300 rounded-lg shadow-2xl flex flex-col z-[99999]" style={{ height: '550px', maxHeight: '80vh' }}>
      {/* Header */}
      <div className={`text-white p-3 rounded-t-lg flex justify-between items-center flex-shrink-0 ${
        subitemId ? 'bg-gradient-to-r from-teal-500 to-cyan-600' : 
        criterionId ? 'bg-gradient-to-r from-purple-600 to-indigo-600' : 
        'bg-gradient-to-r from-indigo-600 to-blue-600'
      }`}>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm truncate flex items-center">
            {subitemId && (
              <svg className="w-4 h-4 mr-1.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
            {criterionId && !subitemId && (
              <svg className="w-4 h-4 mr-1.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            {isLoading ? 'Loading...' : getChatTitle()}
          </h3>
          <p className="text-xs opacity-80 truncate mt-0.5">
            {getChatSubtitle()}
          </p>
        </div>
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onClose();
          }}
          className="text-white/80 hover:text-white ml-2 flex-shrink-0"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Context Banner */}
      {feedbackContext && (
        <div className="bg-gray-50 border-b border-gray-200 px-3 py-2 flex-shrink-0">
          <p className="text-xs text-gray-600 line-clamp-2">
            <span className="font-medium">Feedback: </span>
            {feedbackContext}
          </p>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50" style={{ minHeight: '200px' }}>
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-500">Loading chat...</p>
            </div>
          </div>
        ) : error ? (
          <div className="text-center text-red-600 text-sm bg-red-50 p-4 rounded-lg">
            <p>{error}</p>
            <button
              onClick={initializeChat}
              className="mt-2 text-xs bg-red-100 px-3 py-1.5 rounded hover:bg-red-200"
            >
              Retry
            </button>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-500 text-sm bg-white p-4 rounded-lg border border-gray-200">
            <svg className="w-10 h-10 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="font-medium">Ask about this feedback</p>
            <p className="text-xs mt-1">Start a conversation to understand this feedback better</p>
          </div>
        ) : (
          messages.map((message) => (
            <div key={message.id}>
              {message.messageType === 'system' ? (
                <div className="text-center text-xs text-gray-500 bg-white py-2 px-3 rounded-full border border-gray-200 mx-4">
                  {message.messageText}
                </div>
              ) : message.messageType === 'ai_response' ? (
                <div className="flex justify-start">
                  <div className="max-w-[85%] px-3 py-2 rounded-lg text-sm bg-white border border-gray-200 shadow-sm">
                    <p className="whitespace-pre-wrap text-gray-800">{message.messageText}</p>
                    <p className="text-xs mt-1 text-gray-400">
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
                    className={`max-w-[85%] px-3 py-2 rounded-lg text-sm shadow-sm ${
                      message.senderId === currentUserId
                        ? 'bg-purple-600 text-white'
                        : 'bg-white border border-gray-200 text-gray-800'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{message.messageText}</p>
                    <p
                      className={`text-xs mt-1 ${
                        message.senderId === currentUserId
                          ? 'text-purple-200'
                          : 'text-gray-400'
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

      {/* Input Area */}
      {conversation && !error && (
        <div className="border-t border-gray-200 p-3 bg-white flex-shrink-0 rounded-b-lg" style={{ minHeight: '70px' }}>
          <div className="flex space-x-2">
            <textarea
              ref={textareaRef}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={`Ask about ${subitemName || criterionName || 'this feedback'}...`}
              className="flex-1 resize-none border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              rows={1}
              maxLength={2000}
              disabled={isSending}
            />
            <button
              onClick={sendMessage}
              disabled={!newMessage.trim() || isSending}
              className="bg-purple-600 text-white px-3 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-purple-700 transition-colors self-end"
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
          <p className="text-xs text-gray-400 mt-1">
            Press Enter to send
          </p>
        </div>
      )}
    </div>
  );
}

