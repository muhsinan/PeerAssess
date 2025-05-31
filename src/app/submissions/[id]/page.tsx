'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Layout from '../../../components/layout/Layout';
import Link from 'next/link';

export default function ViewSubmission() {
  const router = useRouter();
  const params = useParams();
  
  // Handle the case where params might be null or id might not be available
  if (!params || !params.id) {
    return (
      <Layout>
        <div className="py-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900">Invalid Submission ID</h2>
              <p className="mt-2 text-gray-600">The submission ID is missing or invalid.</p>
              <Link
                href="/dashboard"
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Return to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </Layout>
    );
  }
  
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
    attachments: Array<{
      id: number;
      fileName: string;
      filePath: string;
      fileSize: number;
      fileType: string;
      uploadDate: string;
    }>;
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

                {/* Attachments */}
                <div className="mt-6 bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:px-6 bg-purple-50">
                    <h3 className="text-lg font-medium leading-6 text-purple-800">Attachments</h3>
                  </div>
                  <div className="px-4 py-5 sm:p-6">
                    {submission.attachments && submission.attachments.length > 0 ? (
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
                    ) : (
                      <p className="text-sm text-gray-500">No attachments.</p>
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
                      className="prose max-w-none text-gray-900 prose-headings:text-gray-900 prose-p:text-gray-900 prose-li:text-gray-900 prose-strong:text-gray-900"
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