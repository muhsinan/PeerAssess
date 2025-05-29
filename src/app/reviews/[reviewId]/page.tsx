'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import RubricForm from '../../../components/review/RubricForm';
import AIReviewAnalysis from '../../../components/review/AIReviewAnalysis';
import Layout from '../../../components/layout/Layout';

interface RubricCriterion {
  id: number;
  name: string;
  description: string;
  maxPoints: number;
}

interface Review {
  id: number;
  submissionId: number;
  reviewerId: number;
  studentId?: number;
  status: string;
  assignedDate: string;
  completedDate?: string;
  overallFeedback?: string;
  totalScore?: number;
  scores?: any[];
}

interface Submission {
  id: number;
  title: string;
  content: string;
  studentName: string;
  studentId?: number;
  assignmentTitle: string;
  courseName: string;
}

interface CriterionScore {
  criterionId: number;
  score: number;
  feedback: string;
}

// Component for viewing a completed review as feedback
function ViewReviewFeedback({ review, submission, rubricCriteria }: { 
  review: Review; 
  submission: Submission; 
  rubricCriteria: RubricCriterion[];
}) {
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

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header */}
          <div className="border-b border-gray-200 pb-5">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center">
              <div>
                <h1 className="text-2xl font-bold leading-7 text-black sm:text-3xl sm:truncate">
                  Feedback on: {submission?.title}
                </h1>
                <p className="mt-2 max-w-4xl text-sm text-black">
                  Assignment: {submission?.assignmentTitle} | Course: {submission?.courseName}
                </p>
              </div>
              <div className="mt-4 md:mt-0 bg-indigo-50 p-3 rounded-lg text-center">
                <p className="text-sm font-medium text-indigo-800">Total Score</p>
                <p className="text-2xl font-bold text-indigo-900">
                  {review.totalScore || 0}
                  {rubricCriteria.length > 0 && 
                    <span>/{rubricCriteria.reduce((total, criterion) => total + criterion.maxPoints, 0)}</span>
                  }
                </p>
              </div>
            </div>
            <div className="mt-3">
              <span className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-green-100 text-green-800 mr-2">
                Review completed on {formatDate(review.completedDate)}
              </span>
            </div>
          </div>

          {/* Review Content */}
          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Overall Feedback */}
            <div className="lg:col-span-3">
              <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6 bg-indigo-50">
                  <h3 className="text-lg leading-6 font-medium text-indigo-800">
                    Overall Feedback
                  </h3>
                </div>
                <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
                  <div className="prose max-w-none text-black">
                    {review.overallFeedback || 'No overall feedback provided.'}
                  </div>
                </div>
              </div>
            </div>

            {/* Criteria Feedback */}
            {rubricCriteria.length > 0 && (
              <div className="lg:col-span-3">
                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                  <div className="px-4 py-5 sm:px-6 bg-indigo-50">
                    <h3 className="text-lg leading-6 font-medium text-indigo-800">
                      Detailed Feedback
                    </h3>
                  </div>
                  <div className="border-t border-gray-200">
                    <dl className="divide-y divide-gray-200">
                      {rubricCriteria.map((criterion) => {
                        const criterionScore = review.scores?.find((s: any) => s.criterionId === criterion.id);
                        return (
                          <div key={criterion.id} className="px-4 py-5 sm:grid sm:grid-cols-4 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-black">
                              <div>{criterion.name}</div>
                              <div className="mt-1 text-xs text-gray-500">{criterion.description}</div>
                              <div className="mt-2">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                  Score: {criterionScore?.score || 0}/{criterion.maxPoints}
                                </span>
                              </div>
                            </dt>
                            <dd className="mt-1 text-sm text-black sm:mt-0 sm:col-span-3">
                              {criterionScore?.feedback || 'No specific feedback provided for this criterion.'}
                            </dd>
                          </div>
                        );
                      })}
                    </dl>
                  </div>
                </div>
              </div>
            )}

            {/* Back button */}
            <div className="lg:col-span-3 flex justify-center mt-6">
              <Link
                href="/dashboard"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Return to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ReviewPage() {
  const router = useRouter();
  const params = useParams();
  const reviewId = params.reviewId as string;
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [review, setReview] = useState<Review | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [rubricCriteria, setRubricCriteria] = useState<RubricCriterion[]>([]);
  const [criteriaScores, setCriteriaScores] = useState<CriterionScore[]>([]);
  const [overallFeedback, setOverallFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('submission');
  const [submitted, setSubmitted] = useState(false);
  const [viewMode, setViewMode] = useState(false);
  
  // Fetch review data
  useEffect(() => {
    const fetchReviewData = async () => {
      try {
        const userIdFromStorage = localStorage.getItem('userId');
        const role = localStorage.getItem('userRole');
        setUserId(userIdFromStorage);
        setUserRole(role);
        
        // Check if user is logged in
        if (!userIdFromStorage) {
          router.push('/login');
          return;
        }
        
        // Fetch review details
        const reviewResponse = await fetch(`/api/peer-reviews/${reviewId}`);
        if (!reviewResponse.ok) {
          throw new Error('Failed to fetch review details');
        }
        
        const reviewData = await reviewResponse.json();
        setReview(reviewData.review);
        
        // Fetch submission details
        const submissionResponse = await fetch(`/api/submissions/${reviewData.review.submissionId}`);
        if (!submissionResponse.ok) {
          throw new Error('Failed to fetch submission details');
        }
        
        const submissionData = await submissionResponse.json();
        setSubmission(submissionData.submission);
        
        // Determine view mode based on role and review properties
        // Case 1: Student is viewing feedback they received (they are the submission owner)
        // Case 2: Student is doing a review (they are the reviewer)
        if (
          // Student viewing feedback on their own submission
          (role === 'student' && 
           submissionData.submission.studentId?.toString() === userIdFromStorage) ||
          // Instructor viewing any review
          (role === 'instructor') ||
          // Student viewing a completed review
          (role === 'student' && reviewData.review.status === 'completed' && 
           reviewData.review.reviewerId.toString() !== userIdFromStorage)
        ) {
          setViewMode(true);
        } else if (role === 'student' && reviewData.review.reviewerId.toString() !== userIdFromStorage) {
          // If a student is trying to view a review they're not authorized to see
          router.push('/dashboard');
          return;
        }
        
        // Update review status to in_progress if it's currently 'assigned' and user is the reviewer
        if (!viewMode && reviewData.review.status === 'assigned' && 
            reviewData.review.reviewerId.toString() === userIdFromStorage) {
          const updateResponse = await fetch(`/api/peer-reviews/${reviewId}/status`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status: 'in_progress' }),
          });
          
          if (updateResponse.ok) {
            const updatedReview = await updateResponse.json();
            setReview(updatedReview.review);
          }
        }
        
        // Fetch rubric criteria for this assignment
        try {
          const rubricResponse = await fetch(`/api/assignments/${submissionData.submission.assignmentId}/rubric`);
          if (rubricResponse.ok) {
            const rubricData = await rubricResponse.json();
            setRubricCriteria(rubricData.criteria || []);
            
            // Initialize scores for each criterion if we have criteria
            if (rubricData.criteria && rubricData.criteria.length > 0) {
              const initialScores = rubricData.criteria.map((criterion: RubricCriterion) => ({
                criterionId: criterion.id,
                score: 0,
                feedback: ''
              }));
              
              setCriteriaScores(initialScores);
              
              // Check if review already has scores
              if (reviewData.review.scores && reviewData.review.scores.length > 0) {
                setCriteriaScores(reviewData.review.scores);
              }
            }
          } else {
            console.warn(`No rubric found for assignment ${submissionData.submission.assignmentId}`);
            // Set an empty array for criteria - the review will proceed without a formal rubric
            setRubricCriteria([]);
            setCriteriaScores([]);
          }
        } catch (rubricError) {
          console.error('Error fetching rubric:', rubricError);
          // Continue without a rubric
          setRubricCriteria([]);
          setCriteriaScores([]);
        }
        
        if (reviewData.review.overallFeedback) {
          setOverallFeedback(reviewData.review.overallFeedback);
        }
        
        setIsLoading(false);
      } catch (error: any) {
        console.error('Error fetching review data:', error);
        setError(error.message);
        setIsLoading(false);
      }
    };

    fetchReviewData();
  }, [reviewId, router]);

  const handleScoreChange = (criterionId: number, score: number) => {
    setCriteriaScores(
      criteriaScores.map(cs => 
        cs.criterionId === criterionId ? { ...cs, score } : cs
      )
    );
  };

  const handleFeedbackChange = (criterionId: number, feedback: string) => {
    setCriteriaScores(
      criteriaScores.map(cs => 
        cs.criterionId === criterionId ? { ...cs, feedback } : cs
      )
    );
  };

  const calculateTotalScore = () => {
    return criteriaScores.reduce((total, cs) => total + cs.score, 0);
  };

  const getTotalScore = () => {
    return calculateTotalScore();
  };

  const getMaxPossibleScore = () => {
    return rubricCriteria.reduce((total, criterion) => total + criterion.maxPoints, 0);
  };

  const handleSubmit = async (e: React.FormEvent, isDraft: boolean = false) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    
    try {
      // Validate inputs if not a draft
      if (!isDraft) {
        // Only check for unscored criteria if we have a rubric
        if (rubricCriteria.length > 0) {
          // Check if all criteria have been scored
          const unscored = criteriaScores.some(cs => cs.score === 0);
          if (unscored) {
            setError('Please provide a score for all criteria');
            setSubmitting(false);
            return;
          }
        }
        
        // Check if overall feedback is provided
        if (!overallFeedback.trim()) {
          setError('Please provide overall feedback');
          setSubmitting(false);
          return;
        }
      }
      
      // Prepare data for submission
      const reviewData = {
        criteriaScores,
        overallFeedback,
        status: isDraft ? 'in_progress' : 'completed',
        totalScore: rubricCriteria.length > 0 ? calculateTotalScore() : null
      };
      
      // Submit the review
      const response = await fetch(`/api/peer-reviews/${reviewId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reviewData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit review. Please try again.');
      }
      
      const data = await response.json();
      setReview(data.review);
      
      // Show success message
      setSuccessMessage(isDraft 
        ? 'Review saved as draft successfully' 
        : 'Review submitted successfully');
      
      // Set submitted state if not a draft
      if (!isDraft) {
        setSubmitted(true);
      } else {
        // For draft, just show message briefly
        setTimeout(() => {
          setSuccessMessage(null);
        }, 3000);
      }
      
      setSubmitting(false);
    } catch (error: any) {
      console.error('Error submitting review:', error);
      setError(error.message);
      setSubmitting(false);
    }
  };

  const handleAIFeedbackSelect = (criterionId: number, feedbackText: string) => {
    // Update the feedback for the specific criterion
    const existingFeedback = criteriaScores.find(cs => cs.criterionId === criterionId)?.feedback || '';
    
    handleFeedbackChange(criterionId, 
      existingFeedback ? 
      `${existingFeedback}\n\n${feedbackText}` : 
      feedbackText
    );
  };

  const handleAIOverallFeedbackSelect = (feedbackText: string) => {
    setOverallFeedback(overallFeedback ? 
      `${overallFeedback}\n\n${feedbackText}` : 
      feedbackText
    );
  };

  const allCriteriaScored = rubricCriteria.every(criterion => {
    const criterionScore = criteriaScores.find(cs => cs.criterionId === criterion.id);
    return criterionScore && criterionScore.score > 0;
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 flex justify-center items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      </Layout>
    );
  }

  if (error && !successMessage) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-lg font-medium text-red-600">Error</h2>
            <p className="mt-1">{error}</p>
            <div className="mt-4">
              <Link
                href="/dashboard"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Return to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // If in view mode (student viewing feedback or instructor), use the ViewReviewFeedback component
  if (viewMode && review && submission) {
    return (
      <Layout>
        <ViewReviewFeedback 
          review={review} 
          submission={submission}
          rubricCriteria={rubricCriteria}
        />
      </Layout>
    );
  }

  if (submitted) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <svg 
                className="mx-auto h-16 w-16 text-green-500" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M5 13l4 4L19 7" 
                />
              </svg>
              <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl mt-4">
                Review Submitted!
              </h2>
              <p className="mt-3 text-xl text-gray-500 sm:mt-4">
                Your peer review has been submitted successfully.
              </p>
              <div className="mt-10">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Return to Dashboard
                </Link>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="border-b border-gray-200 pb-5 flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold leading-7 text-black sm:text-3xl sm:truncate">
                  Peer Review: {submission?.assignmentTitle}
                </h1>
                <p className="mt-2 max-w-4xl text-sm text-black">
                  By: {submission?.studentName} | Course: {submission?.courseName} | Submitted: {new Date(review?.assignedDate || '').toLocaleDateString()}
                </p>
              </div>

              {/* Score Summary */}
              <div className="bg-indigo-50 p-3 rounded-lg text-center">
                <p className="text-sm font-medium text-indigo-800">Current Score</p>
                <p className="text-2xl font-bold text-indigo-900">
                  {getTotalScore()}/{getMaxPossibleScore()}
                </p>
              </div>
            </div>

            {successMessage && (
              <div className="mt-4 rounded-md bg-green-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-green-800">
                      {successMessage}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-4 border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('submission')}
                  className={`${
                    activeTab === 'submission'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-black hover:text-black hover:border-gray-300'
                  } whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm`}
                >
                  Submission
                </button>
                <button
                  onClick={() => setActiveTab('review')}
                  className={`${
                    activeTab === 'review'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-black hover:text-black hover:border-gray-300'
                  } whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm`}
                >
                  Review Form
                </button>
              </nav>
            </div>

            <div className="mt-6">
              {activeTab === 'submission' ? (
                <div className="bg-white shadow rounded-lg overflow-hidden">
                  <div className="px-4 py-5 sm:p-6">
                    <div className="prose max-w-none text-black" dangerouslySetInnerHTML={{ __html: submission?.content || '' }}></div>
                  </div>
                </div>
              ) : (
                <form onSubmit={(e) => handleSubmit(e, false)}>
                  <div className="space-y-8">
                    <RubricForm 
                      criteria={rubricCriteria}
                      onScoreChange={handleScoreChange}
                      onFeedbackChange={handleFeedbackChange}
                      initialScores={criteriaScores.reduce((acc, cs) => ({ ...acc, [cs.criterionId]: cs.score }), {})}
                      initialFeedback={criteriaScores.reduce((acc, cs) => ({ ...acc, [cs.criterionId]: cs.feedback }), {})}
                    />
                    
                    <div className="bg-white p-6 shadow rounded-lg">
                      <h3 className="text-lg font-medium text-black">Overall Feedback</h3>
                      <p className="mt-1 text-sm text-black">
                        Provide comprehensive feedback on the entire submission, highlighting strengths and areas for improvement.
                      </p>
                      <div className="mt-4">
                        <textarea
                          rows={6}
                          className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border border-gray-300 rounded-md text-black"
                          placeholder="Enter your overall feedback here..."
                          value={overallFeedback}
                          onChange={(e) => setOverallFeedback(e.target.value)}
                        />
                      </div>
                    </div>

                    {/* AI Review Analysis Component */}
                    <AIReviewAnalysis
                      criteria={rubricCriteria}
                      scores={criteriaScores.reduce((acc, cs) => ({ ...acc, [cs.criterionId]: cs.score }), {})}
                      feedback={criteriaScores.reduce((acc, cs) => ({ ...acc, [cs.criterionId]: cs.feedback }), {})}
                      overallFeedback={overallFeedback}
                      assignment={{ title: submission?.assignmentTitle || '', content: submission?.content || '' }}
                      onAIFeedbackSelect={handleAIFeedbackSelect}
                      onAIOverallFeedbackSelect={handleAIOverallFeedbackSelect}
                    />
                    
                    <div className="flex justify-between items-center">
                      <div>
                        {error && (
                          <p className="text-sm text-red-600">{error}</p>
                        )}
                        {!allCriteriaScored && (
                          <p className="text-sm text-red-600">Please provide a score for all criteria before submitting.</p>
                        )}
                      </div>
                      <div className="flex justify-end space-x-3">
                        <button
                          type="button"
                          onClick={(e) => handleSubmit(e, true)}
                          className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          Save Draft
                        </button>
                        <Link
                          href="/dashboard"
                          className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          Cancel
                        </Link>
                        <button
                          type="submit"
                          disabled={submitting || !allCriteriaScored || !overallFeedback}
                          className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white
                            ${
                              submitting || !allCriteriaScored || !overallFeedback
                                ? 'bg-indigo-400 cursor-not-allowed'
                                : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                            }`}
                        >
                          {submitting ? (
                            <>
                              <svg
                                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                              >
                                <circle
                                  className="opacity-25"
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  stroke="currentColor"
                                  strokeWidth="4"
                                ></circle>
                                <path
                                  className="opacity-75"
                                  fill="currentColor"
                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                ></path>
                              </svg>
                              Submitting...
                            </>
                          ) : (
                            'Submit Review'
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
} 