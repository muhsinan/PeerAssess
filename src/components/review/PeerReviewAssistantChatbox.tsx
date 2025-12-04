'use client';

import { useState, useEffect, useRef } from 'react';
import { formatDistanceToNow } from 'date-fns';

interface Message {
  id: number;
  senderType: 'reviewer' | 'ai' | 'system';
  messageText: string;
  criterionId: number | null;
  messageType: 'text' | 'system' | 'ai_response';
  sentAt: string;
}

interface Conversation {
  id: number;
  reviewerId: number;
  submissionId: number;
  submissionTitle: string;
  submissionContent: string;
  submissionAnalysis: string | null;
  assignmentTitle: string;
  assignmentDescription: string;
  aiCriteriaPrompt: string | null;
  courseName: string;
  createdAt: string;
}

interface RubricCriterion {
  id: number;
  name: string;
  description: string;
  maxPoints: number;
}

interface PeerReviewAssistantChatboxProps {
  reviewerId: number;
  submissionId: number;
  criteria: RubricCriterion[];
  scores: {[key: number]: number};
  feedback: {[key: number]: string};
  isVisible: boolean;
  onClose: () => void;
  selectedCriterionId?: number | null;
  autoSendRequest?: boolean;
}

export default function PeerReviewAssistantChatbox({
  reviewerId,
  submissionId,
  criteria,
  scores,
  feedback,
  isVisible,
  onClose,
  selectedCriterionId = null,
  autoSendRequest = false
}: PeerReviewAssistantChatboxProps) {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeCriterionId, setActiveCriterionId] = useState<number | null>(selectedCriterionId);
  const [hasAutoSent, setHasAutoSent] = useState(false);
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

  // Initialize conversation when visible
  useEffect(() => {
    if (isVisible && reviewerId && submissionId) {
      initializeChat();
    } else if (!isVisible) {
      // Reset auto-send flag when closing
      setHasAutoSent(false);
    }
  }, [isVisible, reviewerId, submissionId]);

  // Update active criterion when selected
  useEffect(() => {
    if (selectedCriterionId !== null && selectedCriterionId !== undefined) {
      setActiveCriterionId(selectedCriterionId);
    }
  }, [selectedCriterionId]);

  // Auto-send help request when opened with a criterion and autoSendRequest is true
  useEffect(() => {
    if (
      autoSendRequest && 
      !hasAutoSent && 
      conversation && 
      activeCriterionId !== null && 
      !isSending &&
      !isLoading
    ) {
      const criterion = criteria.find(c => c.id === activeCriterionId);
      if (criterion) {
        // Auto-send the help request
        const currentFeedback = feedback[activeCriterionId];
        const currentScore = scores[activeCriterionId];
        
        let autoMessage = `I need help writing feedback for the "${criterion.name}" criterion. `;
        if (currentScore !== null && currentScore !== undefined) {
          autoMessage += `I gave a score of ${currentScore}/${criterion.maxPoints}. `;
        }
        if (currentFeedback && currentFeedback.trim()) {
          autoMessage += `My current feedback is: "${currentFeedback}". `;
        }
        autoMessage += `Can you help me improve this feedback?`;
        
        setNewMessage(autoMessage);
        setHasAutoSent(true);
        
        // Send the message after a brief delay to ensure UI is ready
        setTimeout(() => {
          sendMessageWithText(autoMessage);
        }, 100);
      }
    }
  }, [autoSendRequest, hasAutoSent, conversation, activeCriterionId, isSending, isLoading]);

  const initializeChat = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Create or get existing conversation
      const conversationResponse = await fetch('/api/peer-review-assistant/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewerId, submissionId })
      });

      if (!conversationResponse.ok) {
        const errorData = await conversationResponse.json();
        throw new Error(errorData.error || 'Failed to initialize assistant');
      }

      const { conversationId } = await conversationResponse.json();

      // Fetch conversation details and messages
      const chatResponse = await fetch(`/api/peer-review-assistant/conversations/${conversationId}?reviewerId=${reviewerId}`);
      
      if (!chatResponse.ok) {
        const errorData = await chatResponse.json();
        throw new Error(errorData.error || 'Failed to load assistant');
      }

      const chatData = await chatResponse.json();
      setConversation(chatData.conversation);
      setMessages(chatData.messages);

    } catch (error) {
      console.error('Error initializing assistant:', error);
      setError(error instanceof Error ? error.message : 'Failed to load assistant');
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessageWithText = async (messageText: string) => {
    if (!messageText.trim() || !conversation || isSending) return;

    setIsSending(true);

    try {
      // Get criterion details if one is selected
      const criterion = activeCriterionId ? criteria.find(c => c.id === activeCriterionId) : null;

      const response = await fetch(`/api/peer-review-assistant/conversations/${conversation.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageText: messageText.trim(),
          reviewerId,
          criterionId: activeCriterionId,
          criterionName: criterion?.name,
          criterionDescription: criterion?.description,
          maxPoints: criterion?.maxPoints,
          currentScore: activeCriterionId ? scores[activeCriterionId] : null,
          currentFeedback: activeCriterionId ? feedback[activeCriterionId] : null
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send message');
      }

      const { messages: newMessages } = await response.json();
      setMessages(prev => [...prev, ...newMessages]);
      setNewMessage(''); // Clear the input after successful send

    } catch (error) {
      console.error('Error sending message:', error);
      setError(error instanceof Error ? error.message : 'Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const sendMessage = async () => {
    const messageText = newMessage.trim();
    if (!messageText) return;
    await sendMessageWithText(messageText);
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

  const handleCriterionClick = (criterionId: number) => {
    setActiveCriterionId(criterionId);
    // Set a helpful starting message
    const criterion = criteria.find(c => c.id === criterionId);
    if (criterion && !newMessage) {
      setNewMessage(`I need help with feedback for "${criterion.name}". `);
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 w-[500px] bg-white border border-gray-300 rounded-lg shadow-2xl flex flex-col z-[99999]" style={{ height: '700px', maxHeight: '90vh' }}>
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4 rounded-t-lg flex justify-between items-center flex-shrink-0">
        <div className="flex-1">
          <h3 className="font-semibold text-base flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
            </svg>
            AI Feedback Assistant
          </h3>
          {conversation && (
            <p className="text-xs text-purple-100 truncate mt-0.5">
              {conversation.assignmentTitle}
            </p>
          )}
        </div>
        <button
          onClick={onClose}
          className="text-purple-200 hover:text-white transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Criterion Selector */}
      <div className="bg-gray-50 border-b border-gray-200 p-3 flex-shrink-0">
        <label className="block text-xs font-medium text-gray-700 mb-2">Ask about a specific criterion:</label>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveCriterionId(null)}
            className={`px-3 py-1 text-xs rounded-full transition-colors ${
              activeCriterionId === null
                ? 'bg-purple-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
            }`}
          >
            General
          </button>
          {criteria.map((criterion) => (
            <button
              key={criterion.id}
              onClick={() => handleCriterionClick(criterion.id)}
              className={`px-3 py-1 text-xs rounded-full transition-colors ${
                activeCriterionId === criterion.id
                  ? 'bg-purple-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
              }`}
            >
              {criterion.name}
            </button>
          ))}
        </div>
        {activeCriterionId && (
          <div className="mt-2 text-xs text-gray-600 bg-white p-2 rounded border border-gray-200">
            <span className="font-medium">Current Score:</span> {scores[activeCriterionId] || 0}/{criteria.find(c => c.id === activeCriterionId)?.maxPoints}
          </div>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50" style={{ minHeight: '300px' }}>
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-600">Loading assistant...</p>
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
          <div className="text-center text-gray-500 text-sm bg-white p-6 rounded-lg border border-gray-200">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 mx-auto text-purple-400 mb-3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
            </svg>
            <p className="font-medium mb-1">Welcome to your AI Feedback Assistant!</p>
            <p className="text-xs">Select a criterion above and ask me for help writing better peer review feedback.</p>
          </div>
        ) : (
          messages.map((message) => (
            <div key={message.id}>
              {message.messageType === 'system' ? (
                <div className="text-center text-xs text-gray-500 bg-white py-2 px-3 rounded-full border border-gray-200 mx-8">
                  {message.messageText}
                </div>
              ) : message.senderType === 'ai' ? (
                <div className="flex justify-start">
                  <div className="max-w-[85%] px-4 py-3 rounded-lg text-sm bg-white border border-purple-200 shadow-sm">
                    <div className="flex items-start">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 mr-2 text-purple-600 flex-shrink-0 mt-0.5">
                        <path d="M16.5 7.5h-9v9h9v-9z" />
                        <path fillRule="evenodd" d="M8.25 2.25A.75.75 0 019 3v.75h2.25V3a.75.75 0 011.5 0v.75H15V3a.75.75 0 011.5 0v.75h.75a3 3 0 013 3v.75H21A.75.75 0 0121 9h-.75v2.25H21a.75.75 0 010 1.5h-.75V15H21a.75.75 0 010 1.5h-.75v.75a3 3 0 01-3 3h-.75V21a.75.75 0 01-1.5 0v-.75h-2.25V21a.75.75 0 01-1.5 0v-.75H9V21a.75.75 0 01-1.5 0v-.75h-.75a3 3 0 01-3-3v-.75H3A.75.75 0 013 15h.75v-2.25H3a.75.75 0 010-1.5h.75V9H3a.75.75 0 010-1.5h.75v-.75a3 3 0 013-3h.75V3a.75.75 0 01.75-.75z" clipRule="evenodd" />
                      </svg>
                      <div className="flex-1">
                        <p className="text-gray-800 whitespace-pre-wrap">{message.messageText}</p>
                        <p className="text-xs mt-1.5 text-gray-400">
                          {formatMessageTime(message.sentAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex justify-end">
                  <div className="max-w-[85%] px-4 py-3 rounded-lg text-sm bg-purple-600 text-white shadow-sm">
                    <p className="whitespace-pre-wrap">{message.messageText}</p>
                    <p className="text-xs mt-1.5 text-purple-200">
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
        <div className="border-t border-gray-200 p-3 bg-white flex-shrink-0 rounded-b-lg" style={{ minHeight: '90px' }}>
          <div className="flex space-x-2">
            <textarea
              ref={textareaRef}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={activeCriterionId ? "Ask for help with this criterion..." : "Ask a general question about your review..."}
              className="flex-1 resize-none border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              rows={2}
              maxLength={2000}
              disabled={isSending}
            />
            <button
              onClick={sendMessage}
              disabled={!newMessage.trim() || isSending}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-purple-700 transition-colors self-end"
            >
              {isSending ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              )}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1.5">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      )}
    </div>
  );
}



