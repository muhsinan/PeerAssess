'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import RubricForm from '../../../components/review/RubricForm';
import AIReviewAnalysis from '../../../components/review/AIReviewAnalysis';
import Link from 'next/link';

interface Submission {
  id: number;
  title: string;
  content: string;
  submissionDate: string;
  studentName: string;
  studentEmail: string;
  assignmentTitle: string;
  courseName: string;
  attachments: Array<{
    id: number;
    fileName: string;
    filePath: string;
    fileSize: number;
    fileType: string;
    uploadDate: string;
  }>;
}

export default function PeerReview() {
  const router = useRouter();
  const params = useParams();
  
  // Handle the case where params might be null or id might not be available
  if (!params || !params.id) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Invalid Review ID</h2>
          <p className="mt-2 text-gray-600">The review ID is missing or invalid.</p>
          <Link
            href="/dashboard"
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }
  
  const reviewId = params.id;
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [overallFeedback, setOverallFeedback] = useState('');
  const [scores, setScores] = useState<{[key: number]: number}>({});
  const [feedback, setFeedback] = useState<{[key: number]: string}>({});
  const [activeTab, setActiveTab] = useState('submission');
  const [submitted, setSubmitted] = useState(false);
  const [submission, setSubmission] = useState<Submission | null>(null);
  
  // Mock rubric criteria - in real app, this would be fetched from API
  const rubricCriteria = [
    {
      id: 1,
      name: "Content & Understanding",
      description: "Demonstrates comprehensive understanding of the topic with relevant, accurate information.",
      maxPoints: 30
    },
    {
      id: 2,
      name: "Organization & Structure",
      description: "Presents ideas in a logical, coherent manner with clear introduction, body, and conclusion.",
      maxPoints: 25
    },
    {
      id: 3,
      name: "Critical Analysis",
      description: "Analyzes information critically, presents various perspectives, and draws reasoned conclusions.",
      maxPoints: 25
    },
    {
      id: 4,
      name: "Language & Style",
      description: "Uses appropriate academic language, correct grammar, spelling, and citation format.",
      maxPoints: 20
    }
  ];

  // Fetch review and submission data
  useEffect(() => {
    const fetchReviewData = async () => {
      try {
        setIsLoading(true);
        const userId = localStorage.getItem('userId');
        
        // First, get the review details to find the submission ID
        const reviewResponse = await fetch(`/api/peer-reviews/${reviewId}`);
        if (!reviewResponse.ok) {
          throw new Error('Review not found or access denied');
        }
        
        const reviewData = await reviewResponse.json();
        const submissionId = reviewData.submissionId;
        
        // Then fetch the submission details with attachments
        const submissionResponse = await fetch(`/api/submissions/${submissionId}?userId=${userId}`);
        if (!submissionResponse.ok) {
          throw new Error('Failed to fetch submission details');
        }
        
        const submissionData = await submissionResponse.json();
        setSubmission(submissionData.submission);
      } catch (error) {
        console.error('Error fetching review data:', error);
        setError(error instanceof Error ? error.message : 'Failed to load review data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchReviewData();
  }, [reviewId]);

  // Handle attachment download
  const handleDownloadAttachment = async (attachmentId: number, fileName: string) => {
    try {
      const userId = localStorage.getItem('userId');
      const response = await fetch(`/api/attachments/${attachmentId}/download?userId=${userId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to download attachment');
      }
      
      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading attachment:', error);
      alert(error instanceof Error ? error.message : 'Failed to download attachment');
    }
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleScoreChange = (criterionId: number, score: number) => {
    setScores({ ...scores, [criterionId]: score });
  };

  const handleFeedbackChange = (criterionId: number, text: string) => {
    setFeedback({ ...feedback, [criterionId]: text });
  };

  const getTotalScore = () => {
    return Object.values(scores).reduce((total, score) => total + score, 0);
  };

  const getMaxPossibleScore = () => {
    return rubricCriteria.reduce((total, criterion) => total + criterion.maxPoints, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
    }, 1500);
  };

  const allCriteriaScored = rubricCriteria.every(criterion => 
    scores[criterion.id] !== undefined
  );

  const handleAIFeedbackSelect = (criterionId: number, feedbackText: string) => {
    // Update the feedback for the specific criterion
    const existingFeedback = feedback[criterionId] || '';
    
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

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading review data...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Error</h2>
          <p className="mt-2 text-gray-600">{error}</p>
          <Link
            href="/dashboard"
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // No submission data
  if (!submission) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Submission Not Found</h2>
          <p className="mt-2 text-gray-600">The submission for this review could not be found.</p>
          <Link
            href="/dashboard"
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
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
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-b border-gray-200 pb-5 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold leading-7 text-black sm:text-3xl sm:truncate">
                Peer Review: {submission.title}
              </h1>
              <p className="mt-2 max-w-4xl text-sm text-black">
                By: {submission.studentName} | Course: {submission.courseName} | Submitted: {formatDate(submission.submissionDate)}
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
              <div className="space-y-6">
                {/* Submission Content */}
                <div className="bg-white shadow rounded-lg overflow-hidden">
                  <div className="px-4 py-5 sm:px-6 bg-purple-50">
                    <h3 className="text-lg font-medium leading-6 text-purple-800">Submission Content</h3>
                  </div>
                  <div className="px-4 py-5 sm:p-6">
                    <div className="prose max-w-none text-black" dangerouslySetInnerHTML={{ __html: submission.content }}></div>
                  </div>
                </div>

                {/* Attachments */}
                {submission.attachments && submission.attachments.length > 0 && (
                  <div className="bg-white shadow rounded-lg overflow-hidden">
                    <div className="px-4 py-5 sm:px-6 bg-purple-50">
                      <h3 className="text-lg font-medium leading-6 text-purple-800">Attachments</h3>
                    </div>
                    <div className="px-4 py-5 sm:p-6">
                      <ul className="divide-y divide-gray-200">
                        {submission.attachments.map((attachment) => (
                          <li key={attachment.id} className="py-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <svg className="flex-shrink-0 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z" clipRule="evenodd" />
                                </svg>
                                <div className="ml-3 flex-1">
                                  <p className="text-sm font-medium text-gray-900 truncate">
                                    {attachment.fileName}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {formatFileSize(attachment.fileSize)} • Uploaded {formatDate(attachment.uploadDate)}
                                  </p>
                                </div>
                              </div>
                              <div className="ml-4 flex-shrink-0">
                                <button
                                  onClick={() => handleDownloadAttachment(attachment.id, attachment.fileName)}
                                  className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                                >
                                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                  Download
                                </button>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="space-y-8">
                  <RubricForm 
                    criteria={rubricCriteria}
                    onScoreChange={handleScoreChange}
                    onFeedbackChange={handleFeedbackChange}
                    initialScores={scores}
                    initialFeedback={feedback}
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
                    scores={scores}
                    feedback={feedback}
                    overallFeedback={overallFeedback}
                    assignment={submission}
                    onAIFeedbackSelect={handleAIFeedbackSelect}
                    onAIOverallFeedbackSelect={handleAIOverallFeedbackSelect}
                  />
                  
                  <div className="flex justify-between items-center">
                    <div>
                      {!allCriteriaScored && (
                        <p className="text-sm text-red-600">Please provide a score for all criteria before submitting.</p>
                      )}
                    </div>
                    <div className="flex justify-end">
                      <Link
                        href="/dashboard"
                        className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        Cancel
                      </Link>
                      <button
                        type="submit"
                        disabled={isSubmitting || !allCriteriaScored || !overallFeedback}
                        className={`ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white
                          ${
                            isSubmitting || !allCriteriaScored || !overallFeedback
                              ? 'bg-indigo-400 cursor-not-allowed'
                              : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                          }`}
                      >
                        {isSubmitting ? (
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
  );
} 