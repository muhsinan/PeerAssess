'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Component for Student Peer Reviews
function StudentPeerReviews({ userId }: { userId: string }) {
  const [assignedReviews, setAssignedReviews] = useState<any[]>([]);
  const [receivedFeedback, setReceivedFeedback] = useState<any[]>([]);
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

  return (
    <div className="py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold leading-tight text-black">My Peer Reviews</h1>
        <p className="mt-2 text-gray-600">View and complete your assigned peer reviews</p>
        
        {/* Reviews to Complete */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Reviews to Complete</h2>
          {assignedReviews.length > 0 ? (
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {assignedReviews.map((review) => (
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
                            <Link
                              href={`/reviews/${review.id}`}
                              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                            >
                              {review.status === 'in_progress' ? 'Continue Review' : 'Start Review'}
                            </Link>
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

        {/* Feedback Received */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Feedback Received</h2>
          {receivedFeedback.length > 0 ? (
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {receivedFeedback.map((feedback) => (
                  <li key={feedback.id}>
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                          <h3 className="text-lg font-medium text-black">{feedback.submissionTitle}</h3>
                          <p className="text-sm text-gray-500">Assignment: {feedback.assignmentTitle}</p>
                          <p className="text-sm text-gray-500">Course: {feedback.courseName}</p>
                          <p className="text-sm text-gray-500">Reviewer: {feedback.reviewerName}</p>
                          <p className="text-sm text-gray-500">
                            Completed: {new Date(feedback.completedDate).toLocaleDateString()}
                          </p>
                          {feedback.totalScore && (
                            <p className="text-sm text-gray-500">Score: {feedback.totalScore}</p>
                          )}
                        </div>
                        <div className="ml-2 flex-shrink-0">
                          <Link
                            href={`/reviews/${feedback.id}`}
                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                          >
                            View Feedback
                          </Link>
                        </div>
                      </div>
                      {feedback.overallFeedback && (
                        <div className="mt-2">
                          <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">
                            {feedback.overallFeedback}
                          </p>
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="bg-white shadow rounded-lg p-6">
              <p className="text-center text-gray-500">No feedback received yet</p>
            </div>
          )}
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