'use client';

import { useState, useEffect } from 'react';

interface ChatButtonProps {
  reviewId: number;
  currentUserId: number;
  onChatOpen: () => void;
  className?: string;
}

export default function ChatButton({ reviewId, currentUserId, onChatOpen, className = '' }: ChatButtonProps) {
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkChatAvailability();
  }, [reviewId, currentUserId]);

  const checkChatAvailability = async () => {
    try {
      setIsLoading(true);
      
      // Try to create/get conversation to check if chat is available
      const response = await fetch('/api/chat/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewId, userId: currentUserId })
      });
      
      if (response.ok) {
        setIsAvailable(true);
        
        // Check for unread messages
        const conversationsResponse = await fetch(`/api/chat/conversations?userId=${currentUserId}`);
        if (conversationsResponse.ok) {
          const { conversations } = await conversationsResponse.json();
          const currentConversation = conversations.find((c: any) => c.reviewId === reviewId);
          if (currentConversation && currentConversation.unreadCount > 0) {
            setHasUnreadMessages(true);
          }
        }
      } else {
        setIsAvailable(false);
      }
    } catch (error) {
      console.error('Error checking chat availability:', error);
      setIsAvailable(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClick = () => {
    setHasUnreadMessages(false); // Assume messages will be read when chat opens
    onChatOpen();
  };

  if (isLoading) {
    return (
      <button 
        disabled 
        className={`inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-400 bg-gray-100 cursor-not-allowed ${className}`}
      >
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400 mr-2"></div>
        Loading...
      </button>
    );
  }

  if (!isAvailable) {
    // Show a placeholder for debugging
    return (
      <div className={`text-xs text-gray-500 ${className}`}>
        Chat not available
      </div>
    );
  }

  return (
    <button
      onClick={handleClick}
      className={`relative inline-flex items-center px-4 py-3 border-2 border-indigo-500 shadow-lg text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${className}`}
      style={{ minWidth: '100px' }}
    >
      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
      Chat
      
      {/* Unread messages indicator */}
      {hasUnreadMessages && (
        <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full"></span>
      )}
    </button>
  );
}
