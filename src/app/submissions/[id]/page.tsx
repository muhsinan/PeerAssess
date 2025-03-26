'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Layout from '../../../components/layout/Layout';
import Link from 'next/link';

export default function ViewSubmission() {
  const router = useRouter();
  const params = useParams();
  const submissionId = Array.isArray(params.id) ? params.id[0] : params.id;
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [submission, setSubmission] = useState<{
    id: number;
    title: string;
    content: string;
    status: string;
    submissionDate: string;
    assignmentId: number;
    assignmentTitle: string;
    courseId: number;
    courseName: string;
    studentId: number;
    studentName: string;
    studentEmail: string;
    reviews: Array<{
      id: number;
      reviewerId: number;
      reviewerName: string;
      status: string;
      overallFeedback: string;
      totalScore: number;
      completedDate: string;
    }>;
  } | null>(null);

  // Check if user is authorized
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const role = localStorage.getItem('userRole');
      const userId = localStorage.getItem('userId');
      
      setUserRole(role);
      
      // Allow both instructors and students to view submissions
      // Students will only see their own submissions
      if (!role || (!userId && role !== 'instructor')) {
        router.push('/dashboard');
      } else {
        // Fetch submission details
        fetchSubmissionDetails(userId);
      }
    }
  }, [submissionId, router]);

  // Fetch submission details
  const fetchSubmissionDetails = async (userId?: string | null) => {
    try {
      setIsLoading(true);
      
      const response = await fetch(`/api/submissions/${submissionId}${userId ? `?userId=${userId}` : ''}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch submission details');
      }
      
      const data = await response.json();
      setSubmission(data.submission);
    } catch (error) {
      console.error('Error fetching submission details:', error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
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

  // Status badge component
  const StatusBadge = ({ status }: { status: string }) => {
    let bgColor = '';
    let textColor = '';
    
    switch (status) {
      case 'submitted':
        bgColor = 'bg-blue-100';
        textColor = 'text-blue-800';
        break;
      case 'reviewed':
        bgColor = 'bg-green-100';
        textColor = 'text-green-800';
        break;
      case 'draft':
        bgColor = 'bg-gray-100';
        textColor = 'text-gray-800';
        break;
      case 'assigned':
        bgColor = 'bg-yellow-100';
        textColor = 'text-yellow-800';
        break;
      case 'in_progress':
        bgColor = 'bg-purple-100';
        textColor = 'text-purple-800';
        break;
      case 'completed':
        bgColor = 'bg-green-100';
        textColor = 'text-green-800';
        break;
      default:
        bgColor = 'bg-gray-100';
        textColor = 'text-gray-800';
    }
    
    return (
      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${bgColor} ${textColor}`}>
        {status.replace('_', ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
      </span>
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <Layout>
        <div className="py-10 flex justify-center items-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      </Layout>
    );
  }

  // Error state
  if (error) {
    return (
      <Layout>
        <div className="py-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-red-50 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{error}</p>
                  </div>
                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={() => router.push('/dashboard')}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      Return to Dashboard
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // No submission found
  if (!submission) {
    return (
      <Layout>
        <div className="py-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-yellow-50 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.485 3.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 3.495zM10 6a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">Submission Not Found</h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>The submission you're looking for does not exist or you don't have permission to view it.</p>
                  </div>
                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={() => router.push('/dashboard')}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-yellow-700 bg-yellow-100 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                    >
                      Return to Dashboard
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="py-10">
        <header>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="md:flex md:items-center md:justify-between">
              <div className="flex-1 min-w-0">
                <h1 className="text-3xl font-bold leading-tight text-black">
                  {submission.title}
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  {submission.assignmentTitle} - {submission.courseName}
                </p>
                <div className="mt-2 flex items-center">
                  <StatusBadge status={submission.status} />
                  <span className="ml-2 text-sm text-gray-500">
                    Submitted on {formatDate(submission.submissionDate)}
                  </span>
                </div>
              </div>
              <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
                <Link
                  href="/my-submissions"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                >
                  Back to Submissions
                </Link>

                {userRole === 'instructor' && submission.status === 'submitted' && (
                  <Link
                    href={`/peer-reviews/assignment/${submission.assignmentId}?submissionId=${submission.id}`}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    Review Submission
                  </Link>
                )}
              </div>
            </div>
          </div>
        </header>

        <main>
          <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
            <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Reviews */}
              <div className="lg:col-span-1">
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:px-6 bg-purple-50">
                    <h3 className="text-lg font-medium leading-6 text-purple-800">Reviews</h3>
                  </div>
                  <div className="px-4 py-5 sm:p-6">
                    {submission.reviews && submission.reviews.length > 0 ? (
                      <ul className="divide-y divide-gray-200">
                        {submission.reviews.map((review) => (
                          <li key={review.id} className="py-4">
                            <div className="flex flex-col space-y-2">
                              <div className="flex justify-between">
                                <h4 className="text-sm font-medium text-gray-900">
                                  {review.reviewerName}
                                </h4>
                                <StatusBadge status={review.status} />
                              </div>
                              
                              {review.status === 'completed' && (
                                <>
                                  <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Score:</span>
                                    <span className="font-medium">{review.totalScore}</span>
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    <p>Completed: {formatDate(review.completedDate)}</p>
                                  </div>
                                  <div className="mt-1 text-sm text-gray-900">
                                    {review.overallFeedback}
                                  </div>
                                  <div className="mt-2">
                                    <Link href={`/reviews/${review.id}`} className="text-sm text-purple-600 hover:text-purple-900">
                                      View detailed feedback
                                    </Link>
                                  </div>
                                </>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-500">No reviews yet.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Submission Content */}
              <div className="lg:col-span-2">
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:px-6 bg-purple-50">
                    <h3 className="text-lg font-medium leading-6 text-purple-800">Submission Content</h3>
                  </div>
                  <div className="px-4 py-5 sm:p-6">
                    <div 
                      className="prose max-w-none"
                      dangerouslySetInnerHTML={{ __html: submission.content }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </Layout>
  );
} 