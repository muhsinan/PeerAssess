'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Layout from '../../../../components/layout/Layout';
import ChatWidget from '../../../../components/chat/ChatWidget';
import CriterionChatWidget from '../../../../components/chat/CriterionChatWidget';
import ChatButton from '../../../../components/chat/ChatButton';

interface SubitemScore {
  subitemId: number;
  subitemName: string;
  checked: boolean;
  points: number;
  feedback?: string;
}

interface Review {
  id: number;
  submissionId: number;
  reviewerId: number;
  reviewerName: string;
  status: string;
  assignedDate: string;
  completedDate?: string;
  overallFeedback?: string;
  totalScore?: number;
  isAiGenerated?: boolean;
  scores?: Array<{
    criterionId: number;
    score: number;
    feedback: string;
    subitemScores?: SubitemScore[];
  }>;
}

interface Submission {
  id: number;
  title: string;
  content: string;
  studentName: string;
  studentId: number;
  assignmentTitle: string;
  courseName: string;
  assignmentId: number;
}

interface RubricSubitem {
  id: number;
  name: string;
  description?: string;
  points: number;
  orderPosition: number;
}

interface RubricCriterion {
  id: number;
  name: string;
  description: string;
  maxPoints: number;
  criterionType?: 'levels' | 'subitems';
  subitems?: RubricSubitem[];
}

interface ActiveChatContext {
  reviewId: number;
  criterionId?: number | null;
  subitemId?: number | null;
  criterionName?: string;
  subitemName?: string;
  feedbackContext?: string;
}

export default function SubmissionFeedback() {
  const router = useRouter();
  const params = useParams();
  const submissionId = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const [submission, setSubmission] = useState<Submission | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [rubricCriteria, setRubricCriteria] = useState<RubricCriterion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isChatVisible, setIsChatVisible] = useState(false);
  const [selectedReviewId, setSelectedReviewId] = useState<number | null>(null);
  const [activeChatContext, setActiveChatContext] = useState<ActiveChatContext | null>(null);
  const [isCriterionChatVisible, setIsCriterionChatVisible] = useState(false);
  const [feedbackChatType, setFeedbackChatType] = useState<string>('ai');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const role = localStorage.getItem('userRole');
      const currentUserId = localStorage.getItem('userId');
      setUserRole(role);
      setUserId(currentUserId);

      if (!role || !currentUserId) {
        router.push('/dashboard');
        return;
      }

      // Only call fetchData if we have a valid userId
      if (currentUserId && submissionId) {
        fetchData(currentUserId);
      }
    }
  }, [submissionId, router]);

  const fetchData = async (userIdParam: string) => {
    try {
      setIsLoading(true);
      
      // Fetch submission details
      const submissionResponse = await fetch(`/api/submissions/${submissionId}?userId=${userIdParam}`);
      if (!submissionResponse.ok) {
        throw new Error('Failed to fetch submission');
      }
      const submissionResponseData = await submissionResponse.json();
      const submissionData = submissionResponseData.submission; // Extract submission from the response
      setSubmission(submissionData);

      // Fetch reviews for this submission
      const currentUserRole = localStorage.getItem('userRole');
      const reviewsResponse = await fetch(`/api/submissions/${submissionId}/reviews?userId=${userIdParam}&role=${currentUserRole}`);
      if (reviewsResponse.ok) {
        const reviewsData = await reviewsResponse.json();
        setReviews(reviewsData);
      }

      // Fetch rubric criteria for the assignment (includes subitems)
      if (submissionData.assignmentId) {
        const rubricResponse = await fetch(`/api/assignments/${submissionData.assignmentId}/rubric`);
        if (rubricResponse.ok) {
          const rubricData = await rubricResponse.json();
          setRubricCriteria(rubricData.criteria || []);
        }
        
        // Fetch assignment details to get feedbackChatType
        const assignmentResponse = await fetch(`/api/assignments/${submissionData.assignmentId}`);
        if (assignmentResponse.ok) {
          const assignmentData = await assignmentResponse.json();
          setFeedbackChatType(assignmentData.feedbackChatType || 'ai');
        }
      }

    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load submission feedback');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateAverageScore = () => {
    const completedReviews = reviews.filter(r => r.status === 'completed' && r.totalScore !== null);
    if (completedReviews.length === 0) return 0;
    const total = completedReviews.reduce((sum, review) => sum + (review.totalScore || 0), 0);
    return Math.round((total / completedReviews.length) * 10) / 10;
  };

  const getMaxPossibleScore = () => {
    if (!Array.isArray(rubricCriteria)) return 0;
    return rubricCriteria.reduce((total, criterion) => total + criterion.maxPoints, 0);
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading feedback...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600">{error}</p>
            <Link 
              href="/dashboard"
              className="mt-4 inline-block text-purple-600 hover:text-purple-900"
            >
              Return to Dashboard
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  if (!submission) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-600">Submission not found</p>
            <Link 
              href="/dashboard"
              className="mt-4 inline-block text-purple-600 hover:text-purple-900"
            >
              Return to Dashboard
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  const completedReviews = reviews.filter(r => r.status === 'completed');
  const assessingReviews = reviews.filter(r => r.status === 'assessing');

  return (
    <Layout>
      <div className="py-10">
        <header>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="md:flex md:items-center md:justify-between">
              <div className="flex-1 min-w-0">
                <h1 className="text-3xl font-bold leading-tight text-black">
                  Feedback: {submission.title}
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  {submission.assignmentTitle} - {submission.courseName}
                </p>
                

                <div className="mt-2 flex items-center space-x-4">
                  <span className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    {completedReviews.length} Review{completedReviews.length !== 1 ? 's' : ''} Completed
                  </span>
                  {assessingReviews.length > 0 && (
                    <span className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
                      <svg className="-ml-0.5 mr-1.5 h-3 w-3 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {assessingReviews.length} Assessing
                    </span>
                  )}
                  {completedReviews.length > 0 && (
                    <div className="bg-purple-50 p-3 rounded-lg">
                      <p className="text-sm font-medium text-purple-800">Average Score</p>
                      <p className="text-2xl font-bold text-purple-900">
                        {calculateAverageScore()}/{getMaxPossibleScore()}
                      </p>
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
                <Link
                  href={`/submissions/${submission.id}`}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  View Submission
                </Link>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700"
                >
                  Return to Dashboard
                </Link>
              </div>
            </div>
          </div>
        </header>

        <main>
          <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
            {/* Show assessing reviews if any */}
            {assessingReviews.length > 0 && (
              <div className="mb-6">
                {assessingReviews.map((review, index) => (
                  <div key={review.id} className="bg-indigo-50 border-l-4 border-indigo-400 p-4 rounded-r-lg">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-indigo-700">
                          <strong>Review #{index + 1} - Assessing</strong>
                        </p>
                        <p className="text-xs text-indigo-600 mt-1">
                          Feedback will be available once your instructor releases it.
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {completedReviews.length === 0 && assessingReviews.length === 0 ? (
              <div className="text-center py-12">
                <svg 
                  className="mx-auto h-12 w-12 text-gray-400" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth="2" 
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No feedback available</h3>
                <p className="mt-1 text-sm text-gray-500">
                  This submission hasn't been reviewed yet.
                </p>
              </div>
            ) : completedReviews.length > 0 ? (
              <div className="space-y-6">
                {completedReviews.map((review, index) => (
                  <div key={review.id} className="bg-white shadow overflow-hidden sm:rounded-lg">
                    <div className="px-4 py-5 sm:px-6 bg-purple-50">
                      <h3 className="text-lg leading-6 font-medium text-purple-800">
                        Review #{index + 1} - Anonymous Reviewer
                      </h3>
                      <div className="mt-1 flex items-center space-x-4">
                        <span className="text-sm text-gray-500">
                          Completed on {formatDate(review.completedDate)}
                        </span>
                        {review.totalScore !== null && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            Score: {review.totalScore}/{getMaxPossibleScore()}
                          </span>
                        )}
                        
                        {/* CHAT BUTTON - Overall feedback discussion */}
                        <div className="ml-4">
                          <button
                            onClick={() => {
                              setSelectedReviewId(review.id);
                              setIsChatVisible(true);
                            }}
                            className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold text-sm flex items-center space-x-2 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            <span>{feedbackChatType === 'ai' ? 'Chat About Overall Feedback' : 'Chat with Reviewer'}</span>
                          </button>
                        </div>
                        {feedbackChatType === 'ai' && (
                          <p className="ml-4 text-xs text-gray-500">
                            💡 Click "Ask" buttons on each criterion for specific questions
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
                      {/* Overall Feedback */}
                      <div className="mb-6">
                        <h4 className="text-md font-medium text-gray-900 mb-2">Overall Feedback</h4>
                        <div className="prose max-w-none text-gray-700">
                          {review.overallFeedback || 'No overall feedback provided.'}
                        </div>
                      </div>

                      {/* Criteria Feedback */}
                      {review.scores && review.scores.length > 0 && (
                        <div>
                          <h4 className="text-md font-medium text-gray-900 mb-4">Detailed Feedback</h4>
                          <div className="space-y-4">
                            {Array.isArray(rubricCriteria) && rubricCriteria.map((criterion) => {
                              const criterionScore = review.scores?.find(s => s.criterionId === criterion.id);
                              if (!criterionScore) return null;
                              
                              const hasSubitems = criterionScore.subitemScores && Array.isArray(criterionScore.subitemScores) && criterionScore.subitemScores.length > 0;
                              
                              return (
                                <div key={criterion.id} className="border-l-4 border-purple-200 pl-4">
                                  <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2">
                                      <h5 className="text-sm font-medium text-gray-900">{criterion.name}</h5>
                                      {hasSubitems && (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-700">
                                          Checklist
                                        </span>
                                      )}
                                      {/* Chat button for criterion (only for AI chat type and non-subitem criteria) */}
                                      {feedbackChatType === 'ai' && !hasSubitems && (
                                        <button
                                          onClick={() => {
                                            setActiveChatContext({
                                              reviewId: review.id,
                                              criterionId: criterion.id,
                                              criterionName: criterion.name,
                                              feedbackContext: criterionScore.feedback
                                            });
                                            setIsCriterionChatVisible(true);
                                          }}
                                          className="inline-flex items-center px-2 py-1 text-xs font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-md transition-colors"
                                          title={`Chat about ${criterion.name}`}
                                        >
                                          <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                          </svg>
                                          Ask
                                        </button>
                                      )}
                                    </div>
                                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                      {criterionScore.score}/{criterion.maxPoints}
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-600 mb-2">{criterion.description}</p>
                                  
                                  {/* Display subitem scores if available */}
                                  {hasSubitems ? (
                                    <div className="mt-3 space-y-2">
                                      {criterionScore.subitemScores!.map((subitem: SubitemScore) => (
                                        <div key={subitem.subitemId} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                                          <div className="flex items-start gap-3">
                                            <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${
                                              subitem.checked 
                                                ? 'bg-green-100 text-green-600' 
                                                : 'bg-gray-200 text-gray-400'
                                            }`}>
                                              {subitem.checked ? (
                                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                              ) : (
                                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                                </svg>
                                              )}
                                            </div>
                                            <div className="flex-1">
                                              <div className="flex items-center justify-between mb-1">
                                                <div className="flex items-center gap-2">
                                                  <span className={`text-sm font-medium ${subitem.checked ? 'text-gray-900' : 'text-gray-500'}`}>
                                                    {subitem.subitemName}
                                                  </span>
                                                  {/* Chat button for each subitem (only for AI chat type) */}
                                                  {feedbackChatType === 'ai' && (
                                                    <button
                                                      onClick={() => {
                                                        setActiveChatContext({
                                                          reviewId: review.id,
                                                          criterionId: criterion.id,
                                                          subitemId: subitem.subitemId,
                                                          criterionName: criterion.name,
                                                          subitemName: subitem.subitemName,
                                                          feedbackContext: subitem.feedback
                                                        });
                                                        setIsCriterionChatVisible(true);
                                                      }}
                                                      className="inline-flex items-center px-1.5 py-0.5 text-xs font-medium text-teal-600 bg-teal-50 hover:bg-teal-100 rounded transition-colors"
                                                      title={`Chat about ${subitem.subitemName}`}
                                                    >
                                                      <svg className="w-3 h-3 mr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                                      </svg>
                                                      Ask
                                                    </button>
                                                  )}
                                                </div>
                                                <span className={`text-xs px-2 py-0.5 rounded ${
                                                  subitem.checked 
                                                    ? 'bg-green-100 text-green-700' 
                                                    : 'bg-gray-100 text-gray-500'
                                                }`}>
                                                  {subitem.checked ? `+${subitem.points}` : '0'} / {subitem.points} pts
                                                </span>
                                              </div>
                                              {subitem.feedback && (
                                                <p className="text-sm text-gray-600">{subitem.feedback}</p>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                      {criterionScore.feedback && (
                                        <div className="mt-2 pt-2 border-t border-gray-200 flex items-start justify-between">
                                          <p className="text-sm text-gray-700 flex-1">
                                            <span className="font-medium">Overall: </span>
                                            {criterionScore.feedback}
                                          </p>
                                          {/* Chat button for overall criterion feedback when it has subitems */}
                                          {feedbackChatType === 'ai' && (
                                            <button
                                              onClick={() => {
                                                setActiveChatContext({
                                                  reviewId: review.id,
                                                  criterionId: criterion.id,
                                                  criterionName: criterion.name,
                                                  feedbackContext: criterionScore.feedback
                                                });
                                                setIsCriterionChatVisible(true);
                                              }}
                                              className="ml-2 inline-flex items-center px-2 py-1 text-xs font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-md transition-colors flex-shrink-0"
                                              title={`Chat about ${criterion.name} overall feedback`}
                                            >
                                              <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                              </svg>
                                              Ask
                                            </button>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <p className="text-sm text-gray-700">
                                      {criterionScore.feedback || 'No specific feedback provided for this criterion.'}
                                    </p>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </main>
      </div>
      
      {/* Overall Chat Widget (for general feedback discussion) */}
      {selectedReviewId && userId && (
        <ChatWidget
          reviewId={selectedReviewId}
          currentUserId={parseInt(userId)}
          isVisible={isChatVisible}
          onClose={() => {
            setIsChatVisible(false);
            setSelectedReviewId(null);
          }}
        />
      )}
      
      {/* Criterion/Subitem-specific Chat Widget */}
      {activeChatContext && userId && (
        <CriterionChatWidget
          reviewId={activeChatContext.reviewId}
          currentUserId={parseInt(userId)}
          isVisible={isCriterionChatVisible}
          onClose={() => {
            setIsCriterionChatVisible(false);
            setActiveChatContext(null);
          }}
          criterionId={activeChatContext.criterionId}
          subitemId={activeChatContext.subitemId}
          criterionName={activeChatContext.criterionName}
          subitemName={activeChatContext.subitemName}
          feedbackContext={activeChatContext.feedbackContext}
        />
      )}

      {/* Floating button for overall feedback chat */}
      {completedReviews.length > 0 && feedbackChatType === 'ai' && (
        <button
          onClick={() => {
            const firstCompleted = completedReviews[0];
            setSelectedReviewId(firstCompleted.id);
            setIsChatVisible(true);
          }}
          className="fixed bottom-6 right-6 bg-indigo-600 text-white px-4 py-3 rounded-full shadow-lg z-[99998] flex items-center space-x-2 hover:bg-indigo-700 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span>Overall Chat</span>
        </button>
      )}
    </Layout>
  );
} 