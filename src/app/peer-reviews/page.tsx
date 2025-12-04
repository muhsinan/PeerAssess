'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Component for Student Peer Reviews
function StudentPeerReviews({ userId }: { userId: string }) {
  const [assignedReviews, setAssignedReviews] = useState<any[]>([]);
  const [receivedFeedback, setReceivedFeedback] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStudentReviews = async () => {
      try {
        const response = await fetch(`/api/dashboard/student?studentId=${userId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch review data');
        }
        
        const data = await response.json();
        setAssignedReviews(data.assignedReviews || []);
        setReceivedFeedback(data.receivedFeedback || []);
        setSubmissions(data.submissions || []);
        setLoading(false);
      } catch (err: any) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchStudentReviews();
  }, [userId]);

  if (loading) {
    return (
      <div className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading your peer reviews...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error loading reviews</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Split assigned reviews into to-do and completed (given feedback)
  const toComplete = assignedReviews.filter((r) => r.status !== 'completed');
  const completedGiven = assignedReviews.filter((r) => r.status === 'completed');

  return (
    <div className="py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold leading-tight text-black">My Peer Reviews</h1>
        <p className="mt-2 text-gray-600">View and complete your assigned peer reviews</p>
        
        {/* Reviews to Complete */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Reviews to Complete</h2>
          {toComplete.length > 0 ? (
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {toComplete.map((review) => (
                  <li key={review.id}>
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                          <h3 className="text-lg font-medium text-black">{review.submissionTitle}</h3>
                          <p className="text-sm text-gray-500">Assignment: {review.assignmentTitle}</p>
                          <p className="text-sm text-gray-500">Course: {review.courseName}</p>
                          <p className="text-sm text-gray-500">Student: {review.studentName}</p>
                          <p className="text-sm text-gray-500">
                            Assigned: {new Date(review.assignedDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="ml-2 flex-shrink-0 flex items-center space-x-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            review.status === 'completed' 
                              ? 'bg-green-100 text-green-800' 
                              : review.status === 'in_progress'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {review.status === 'in_progress' ? 'In Progress' : review.status}
                          </span>
                          {review.status !== 'completed' && (
                            <>
                              {review.reviewerHasSubmitted ? (
                                <Link
                                  href={`/reviews/${review.id}`}
                                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                                >
                                  {review.status === 'in_progress' ? 'Continue Review' : 'Start Review'}
                                </Link>
                              ) : (
                                <div className="flex flex-col items-end space-y-2">
                                  <button
                                    disabled
                                    className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md shadow-sm text-gray-500 bg-gray-100 cursor-not-allowed"
                                    title="You must submit your assignment first before reviewing peers"
                                  >
                                    Submit Assignment First
                                  </button>
                                  <Link
                                    href={`/assignments/${review.assignmentId}`}
                                    className="inline-flex items-center px-2 py-1 border border-blue-300 text-xs leading-4 font-medium rounded text-blue-600 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                  >
                                    Go to Assignment
                                  </Link>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="bg-white shadow rounded-lg p-6">
              <p className="text-center text-gray-500">No peer reviews assigned yet</p>
            </div>
          )}
        </div>

        {/* Reviews Completed (Given Feedback) */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Reviews Completed (Given Feedback)</h2>
          {completedGiven.length > 0 ? (
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {completedGiven.map((review) => (
                  <li key={review.id}>
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                          <h3 className="text-lg font-medium text-black">{review.submissionTitle}</h3>
                          <p className="text-sm text-gray-500">Assignment: {review.assignmentTitle}</p>
                          <p className="text-sm text-gray-500">Course: {review.courseName}</p>
                          <p className="text-sm text-gray-500">
                            Completed: {new Date(review.completedDate).toLocaleDateString()}
                          </p>
                          {review.totalScore && (
                            <p className="text-sm text-gray-500">Score: {review.totalScore}</p>
                          )}
                        </div>
                        <div className="ml-2 flex-shrink-0 flex items-center space-x-2">
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                            completed
                          </span>
                          <Link
                            href={`/reviews/${review.id}`}
                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                          >
                            View Given Feedback
                          </Link>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="bg-white shadow rounded-lg p-6">
              <p className="text-center text-gray-500">No completed reviews yet</p>
            </div>
          )}
        </div>

        {/* Feedback Received */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Feedback Received</h2>
          
          {/* Show submissions with unreleased AI reviews */}
          {submissions && submissions.filter((s: any) => s.unreleasedAIReviewCount > 0).length > 0 && (
            <div className="mb-4 space-y-3">
              {submissions.filter((s: any) => s.unreleasedAIReviewCount > 0).map((submission: any) => (
                <div key={`assessing-${submission.id}`} className="bg-indigo-50 border-l-4 border-indigo-400 p-4 rounded-r-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center flex-1">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-indigo-900">{submission.title}</p>
                        <p className="text-xs text-indigo-700 mt-1">
                          Assignment: {submission.assignmentTitle}
                        </p>
                        <p className="text-xs text-indigo-700">
                          Course: {submission.courseName}
                        </p>
                        <p className="text-xs text-indigo-600 mt-1">
                          Feedback pending instructor release
                        </p>
                      </div>
                    </div>
                    <div className="ml-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                        Assessing
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {receivedFeedback.length > 0 ? (
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {receivedFeedback.map((feedback) => (
                  <li key={feedback.submissionId || feedback.id}>
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                          <h3 className="text-lg font-medium text-black">{feedback.submissionTitle}</h3>
                          <p className="text-sm text-gray-500">Assignment: {feedback.assignmentTitle}</p>
                          <p className="text-sm text-gray-500">Course: {feedback.courseName}</p>
                          {feedback.reviewCount ? (
                            <>
                              <p className="text-sm text-gray-500">
                                Latest Review: {new Date(feedback.latestCompletedDate).toLocaleDateString()}
                              </p>
                              <p className="text-sm text-gray-500">
                                Reviews: {feedback.reviewCount} | Average Score: {feedback.averageScore?.toFixed(1) || 'N/A'}
                              </p>
                            </>
                          ) : (
                            <>
                              <p className="text-sm text-gray-500">Reviewer: {feedback.reviewerName}</p>
                              <p className="text-sm text-gray-500">
                                Completed: {new Date(feedback.completedDate).toLocaleDateString()}
                              </p>
                              {feedback.totalScore && (
                                <p className="text-sm text-gray-500">Score: {feedback.totalScore}</p>
                              )}
                            </>
                          )}
                        </div>
                        <div className="ml-2 flex-shrink-0">
                          <Link
                            href={feedback.submissionId ? `/submissions/${feedback.submissionId}/feedback` : `/reviews/${feedback.id}`}
                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                          >
                            {feedback.reviewCount > 1 ? 'View All Feedback' : 'View Feedback'}
                          </Link>
                        </div>
                      </div>
                      
                      {/* Show aggregated synthesis if multiple reviews exist */}
                      {feedback.reviewCount > 1 && feedback.aggregatedSynthesis && (
                        <div className="mt-4">
                          <div className="text-sm text-gray-700 bg-gradient-to-r from-purple-50 to-indigo-50 border-l-4 border-purple-400 p-4 rounded-lg">
                            <p className="font-medium text-purple-800 flex items-center mb-2">
                              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              Combined Feedback Synthesis ({feedback.reviewCount} reviews):
                            </p>
                            <p className="text-gray-800 leading-relaxed">
                              {feedback.aggregatedSynthesis}
                            </p>
                          </div>
                        </div>
                      )}
                      
                      {/* Show individual feedback summary if only one review or old format */}
                      {((feedback.reviewCount === 1 && feedback.reviews && feedback.reviews[0]) || 
                        (!feedback.reviewCount && (feedback.aiSynthesis || feedback.overallFeedback))) && (
                        <div className="mt-2">
                          <div className="text-sm text-gray-700 bg-purple-50 border-l-4 border-purple-400 p-3 rounded">
                            <p className="font-medium text-purple-800 flex items-center mb-1">
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-1l-4 4z" />
                              </svg>
                              Feedback Summary:
                            </p>
                            <p className="text-gray-800">
                              {feedback.reviewCount === 1 && feedback.reviews 
                                ? (feedback.reviews[0].aiSynthesis || feedback.reviews[0].overallFeedback || 'No feedback available')
                                : (feedback.aiSynthesis || feedback.overallFeedback)
                              }
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : !submissions || submissions.filter((s: any) => s.unreleasedAIReviewCount > 0).length === 0 ? (
            <div className="bg-white shadow rounded-lg p-6">
              <p className="text-center text-gray-500">No feedback received yet</p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

// Component for Instructor Peer Reviews
function InstructorPeerReviews({ userId }: { userId: string }) {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        const response = await fetch(`/api/dashboard/instructor/assignments?instructorId=${userId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch assignments');
        }
        
        const data = await response.json();
        setAssignments(data.assignments || []);
        setLoading(false);
      } catch (err: any) {
        setError(err.message);
        setLoading(false);
      }
    };
    
    fetchAssignments();
  }, [userId]);

  if (loading) {
    return (
      <div className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading assignments...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error loading assignments</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold leading-tight text-black">Peer Reviews Management</h1>
        <p className="mt-2 text-gray-600">Manage peer review assignments for your courses</p>
        
        <div className="mt-8">
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {assignments.length > 0 ? (
                assignments.map((assignment) => (
                  <li key={assignment.id}>
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                          <h3 className="text-lg font-medium text-black truncate">{assignment.title}</h3>
                          <p className="text-sm text-gray-500">Course: {assignment.course}</p>
                        </div>
                        <div className="ml-2 flex-shrink-0 flex">
                          <Link
                            href={`/peer-reviews/assignment/${assignment.id}`}
                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                          >
                            Manage Peer Reviews
                          </Link>
                        </div>
                      </div>
                    </div>
                  </li>
                ))
              ) : (
                <li className="px-4 py-4 sm:px-6">
                  <p className="text-center text-gray-500">No assignments found</p>
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PeerReviewsPage() {
  const router = useRouter();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get user role and ID from localStorage
    if (typeof window !== 'undefined') {
      const role = localStorage.getItem('userRole');
      const id = localStorage.getItem('userId');
      
      if (!role || !id) {
        router.push('/login');
        return;
      }
      
      setUserRole(role);
      setUserId(id);
      setLoading(false);
    }
  }, [router]);

  if (loading) {
    return (
      <div className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!userRole || !userId) {
    return null; // Will redirect to login
  }

  // Render appropriate component based on user role
  if (userRole === 'student') {
    return <StudentPeerReviews userId={userId} />;
  } else if (userRole === 'instructor') {
    return <InstructorPeerReviews userId={userId} />;
  } else {
    // Unknown role, redirect to dashboard
    router.push('/dashboard');
    return null;
  }
} 