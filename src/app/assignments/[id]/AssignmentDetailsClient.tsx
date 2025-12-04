'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/layout/Layout';
import Link from 'next/link';

export default function AssignmentDetailsClient({ assignmentId }: { assignmentId: string }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assignment, setAssignment] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [submission, setSubmission] = useState<any>(null);

  useEffect(() => {
    // Get user info from localStorage
    if (typeof window !== 'undefined') {
      const role = localStorage.getItem('userRole');
      const id = localStorage.getItem('userId');
      setUserRole(role);
      setUserId(id);
    }

    const fetchAssignmentDetails = async () => {
      try {
        setIsLoading(true);
        
        // Fetch assignment details using the passed assignmentId prop
        const response = await fetch(`/api/assignments/${assignmentId}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch assignment details');
        }
        
        const data = await response.json();
        
        // If user is a student and assignment is hidden, show error
        if (userRole === 'student' && data.isHidden) {
          throw new Error('This assignment is not available');
        }
        
        setAssignment(data);
        
        // If user is a student, check if they have already submitted
        if (userRole === 'student' && userId) {
          const submissionResponse = await fetch(`/api/assignments/${assignmentId}/submissions?studentId=${userId}`);
          
          if (submissionResponse.ok) {
            const submissionData = await submissionResponse.json();
            if (submissionData.submissions && submissionData.submissions.length > 0) {
              setHasSubmitted(true);
              setSubmission(submissionData.submissions[0]);
            } else {
              setHasSubmitted(false);
              setSubmission(null);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching assignment details:', error);
        setError(error instanceof Error ? error.message : 'An unexpected error occurred');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (assignmentId) {
      fetchAssignmentDetails();
    }
  }, [assignmentId, userRole, userId]);

  // Additional effect to check submission status on component focus
  useEffect(() => {
    const checkSubmissionStatus = async () => {
      if (userRole !== 'student' || !userId || !assignmentId) return;
      
      try {
        const submissionResponse = await fetch(`/api/assignments/${assignmentId}/submissions?studentId=${userId}`);
        
        if (submissionResponse.ok) {
          const submissionData = await submissionResponse.json();
          if (submissionData.submissions && submissionData.submissions.length > 0) {
            setHasSubmitted(true);
            setSubmission(submissionData.submissions[0]);
          }
        }
      } catch (error) {
        console.error('Error checking submission status:', error);
      }
    };

    // Check on mount and when window gets focus
    checkSubmissionStatus();
    
    const handleFocus = () => checkSubmissionStatus();
    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [assignmentId, userId, userRole]);

  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'N/A';
    }
  };

  // Calculate days remaining
  const getDaysRemaining = (dueDate?: string) => {
    if (!dueDate) return { text: 'No due date', color: 'text-gray-500' };
    
    try {
      const due = new Date(dueDate);
      if (isNaN(due.getTime())) return { text: 'Invalid date', color: 'text-gray-500' };
      
      const now = new Date();
      const diffTime = due.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays < 0) {
        return { text: 'Past due', color: 'text-red-600' };
      } else if (diffDays === 0) {
        return { text: 'Due today', color: 'text-yellow-600' };
      } else if (diffDays === 1) {
        return { text: '1 day remaining', color: 'text-yellow-600' };
      } else if (diffDays <= 3) {
        return { text: `${diffDays} days remaining`, color: 'text-yellow-600' };
      } else {
        return { text: `${diffDays} days remaining`, color: 'text-green-600' };
      }
    } catch {
      return { text: 'Error calculating time', color: 'text-gray-500' };
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="py-10 flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      </Layout>
    );
  }

  if (error || !assignment) {
    return (
      <Layout>
        <div className="py-10">
          <div className="max-w-3xl mx-auto sm:px-6 lg:px-8">
            <div className="bg-red-50 border-l-4 border-red-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error || 'Assignment not found'}</p>
                  <div className="mt-4">
                    <button
                      onClick={() => router.push('/dashboard')}
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Back to Dashboard
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

  const daysRemaining = getDaysRemaining(assignment.dueDate);

  return (
    <Layout>
      <div className="py-10">
        <div className="max-w-4xl mx-auto sm:px-6 lg:px-8">
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            {/* Assignment Header */}
            <div className="px-4 py-5 sm:px-6 bg-purple-50">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-lg leading-6 font-medium text-purple-900">
                      {assignment.title}
                    </h3>
                    {assignment.isHidden && userRole === 'instructor' && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                        Hidden from Students
                      </span>
                    )}
                  </div>
                  <p className="mt-1 max-w-2xl text-sm text-gray-500">
                    {assignment.course?.name}
                  </p>
                </div>
                <div className="mt-3 md:mt-0 flex flex-col md:items-end">
                  <span className={`text-sm font-medium ${daysRemaining.color}`}>
                    {daysRemaining.text}
                  </span>
                  <span className="text-xs text-gray-500">
                    Due: {formatDate(assignment.dueDate)}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Assignment Details */}
            <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
              <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Description</dt>
                  <dd className="mt-1 text-sm text-gray-900 prose max-w-full">
                    {assignment.description || 'No description provided.'}
                  </dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-gray-500">Course</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {assignment.course?.name || 'N/A'}
                  </dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-gray-500">Created</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {formatDate(assignment.createdAt)}
                  </dd>
                </div>
                
                {userRole === 'student' && (
                  <div className="sm:col-span-2 mt-4">
                    <dt className="text-sm font-medium text-gray-500">Submission Status</dt>
                    <dd className="mt-2">
                      {hasSubmitted ? (
                        <div className="bg-green-50 border-l-4 border-green-400 p-4">
                          <div className="flex">
                            <div className="flex-shrink-0">
                              <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div className="ml-3">
                              <p className="text-sm text-green-700">
                                You have submitted this assignment on {formatDate(submission?.submissionDate)}
                              </p>
                              <div className="mt-2">
                                <Link
                                  href={`/submissions/${submission?.id}`}
                                  className="text-sm font-medium text-green-700 hover:text-green-600"
                                >
                                  View your submission
                                </Link>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                          <div className="flex">
                            <div className="flex-shrink-0">
                              <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div className="ml-3">
                              <p className="text-sm text-yellow-700">
                                You haven't submitted this assignment yet
                              </p>
                              <div className="mt-2">
                                <Link
                                  href={`/assignments/${assignmentId}/submit`}
                                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                                >
                                  Submit Assignment
                                </Link>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </dd>
                  </div>
                )}
                
                {userRole === 'instructor' && (
                  <div className="sm:col-span-2 mt-4">
                    <dt className="text-sm font-medium text-gray-500">Instructor Actions</dt>
                    <dd className="mt-2 flex space-x-4">
                      <Link
                        href={`/assignments/${assignmentId}/edit`}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        Edit Assignment
                      </Link>
                      <Link
                        href={`/assignments/${assignmentId}/submissions`}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                      >
                        View Submissions
                      </Link>
                    </dd>
                  </div>
                )}
              </dl>
            </div>
            
            {/* Footer */}
            <div className="bg-gray-50 px-4 py-4 sm:px-6 flex justify-between">
              <button
                onClick={() => router.push('/dashboard')}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Back to Dashboard
              </button>
              
              {userRole === 'student' && !hasSubmitted && (
                <Link
                  href={`/assignments/${assignmentId}/submit`}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                >
                  Submit Assignment
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
} 