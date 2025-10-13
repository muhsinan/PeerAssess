'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Layout from '../../../../components/layout/Layout';
import ChatWidget from '../../../../components/chat/ChatWidget';
import ChatButton from '../../../../components/chat/ChatButton';

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

interface RubricCriterion {
  id: number;
  name: string;
  description: string;
  maxPoints: number;
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

  // Auto-open chat for the first available review (prefer completed) when feedback page loads
  useEffect(() => {
    if (!isChatVisible && userId && reviews.length > 0) {
      const firstCompleted = reviews.find(r => r.status === 'completed');
      const target = firstCompleted || reviews[0];
      setSelectedReviewId(target.id);
      setIsChatVisible(true);
    }
  }, [reviews, userId, isChatVisible]);

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

      // Fetch rubric criteria for the assignment
      if (submissionData.assignmentId) {
        const rubricResponse = await fetch(`/api/assignments/${submissionData.assignmentId}/rubric`);
        if (rubricResponse.ok) {
          const rubricData = await rubricResponse.json();
          setRubricCriteria(rubricData.criteria || []);
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
            {completedReviews.length === 0 ? (
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
            ) : (
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
                        
                        {/* CHAT BUTTON - AI chat for AI reviews, anonymous chat for peer reviews */}
                        <div className="ml-4">
                          <button
                            onClick={() => {
                              setSelectedReviewId(review.id);
                              setIsChatVisible(true);
                            }}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold text-sm flex items-center space-x-2"
                          >
                            <span>💬</span>
                            <span>Chat with Reviewer</span>
                          </button>
                        </div>
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
                              
                              return (
                                <div key={criterion.id} className="border-l-4 border-purple-200 pl-4">
                                  <div className="flex justify-between items-start mb-2">
                                    <h5 className="text-sm font-medium text-gray-900">{criterion.name}</h5>
                                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                      {criterionScore.score}/{criterion.maxPoints}
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-600 mb-2">{criterion.description}</p>
                                  <p className="text-sm text-gray-700">
                                    {criterionScore.feedback || 'No specific feedback provided for this criterion.'}
                                  </p>
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
            )}
          </div>
        </main>
      </div>
      
      {/* Chat Widget */}
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

      {/* Fallback floating button to force-open chat */}
      {completedReviews.length > 0 && (
        <button
          onClick={() => {
            const firstCompleted = completedReviews[0];
            setSelectedReviewId(firstCompleted.id);
            setIsChatVisible(true);
          }}
          className="fixed bottom-6 right-6 bg-indigo-600 text-white px-4 py-3 rounded-full shadow-lg z-[99998]"
        >
          💬 Open Chat
        </button>
      )}
    </Layout>
  );
} 