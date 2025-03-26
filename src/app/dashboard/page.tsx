'use client';

import { useState, useEffect } from "react";
import Layout from "../../components/layout/Layout";
import Link from "next/link";

export default function Dashboard() {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('');
  const [userId, setUserId] = useState<string>('');

  useEffect(() => {
    // Get user role from localStorage
    if (typeof window !== 'undefined') {
      const role = localStorage.getItem('userRole');
      const name = localStorage.getItem('userName') || 'User';
      const id = localStorage.getItem('userId') || '';
      
      setUserRole(role);
      setUserName(name);
      setUserId(id);
    }
  }, []);

  // Render appropriate dashboard based on user role
  return (
    <Layout>
      <div className="py-10">
        <header>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold leading-tight text-black">Dashboard</h1>
          </div>
        </header>
        <main>
          <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
            {userRole === 'instructor' ? (
              <InstructorDashboard userName={userName} />
            ) : userRole === 'student' ? (
              <StudentDashboard userId={userId} userName={userName} />
            ) : (
              <div className="py-4">Loading...</div>
            )}
          </div>
        </main>
      </div>
    </Layout>
  );
}

// Student Dashboard Component
function StudentDashboard({ userId, userName }: { userId: string, userName: string }) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [assignedReviews, setAssignedReviews] = useState<any[]>([]);
  const [receivedFeedback, setReceivedFeedback] = useState<any[]>([]);
  
  // Fetch dashboard data for student
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        
        const response = await fetch(`/api/dashboard/student?studentId=${userId}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch dashboard data');
        }
        
        const data = await response.json();
        console.log('Student dashboard data:', data); // Debug the full data
        console.log('Courses data sample:', data.courses?.[0]); // Debug the first course
        
        setCourses(data.courses || []);
        setAssignments(data.assignments || []);
        setSubmissions(data.submissions || []);
        setAssignedReviews(data.assignedReviews || []);
        setReceivedFeedback(data.receivedFeedback || []);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError(error instanceof Error ? error.message : 'An unexpected error occurred');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (userId) {
      fetchDashboardData();
    }
  }, [userId]);
  
  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    
    // Handle PostgreSQL timestamp format
    try {
      const date = new Date(dateString);
      // Check if date is valid
      if (isNaN(date.getTime())) return 'N/A';
      
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      console.error('Error formatting date:', dateString, e);
      return 'N/A';
    }
  };
  
  // Debug data when loading completes
  useEffect(() => {
    if (!isLoading && assignments.length > 0) {
      console.log('Sample assignment data:', assignments[0]);
    }
  }, [isLoading, assignments]);
  
  // Status badge component
  const StatusBadge = ({ status, type }: { status: string, type: 'assignment' | 'submission' | 'review' }) => {
    let bgColor = '';
    let textColor = '';
    let statusText = status;
    
    if (type === 'assignment') {
      switch (status) {
        case 'past':
          bgColor = 'bg-red-100';
          textColor = 'text-red-800';
          statusText = 'Past Due';
          break;
        case 'soon':
          bgColor = 'bg-yellow-100';
          textColor = 'text-yellow-800';
          statusText = 'Due Soon';
          break;
        case 'upcoming':
          bgColor = 'bg-blue-100';
          textColor = 'text-blue-800';
          statusText = 'Upcoming';
          break;
        default:
          bgColor = 'bg-gray-100';
          textColor = 'text-gray-800';
      }
    } else if (type === 'submission') {
      switch (status) {
        case 'submitted':
          bgColor = 'bg-green-100';
          textColor = 'text-green-800';
          break;
        case 'draft':
          bgColor = 'bg-gray-100';
          textColor = 'text-gray-800';
          break;
        case 'reviewed':
          bgColor = 'bg-purple-100';
          textColor = 'text-purple-800';
          break;
        default:
          bgColor = 'bg-gray-100';
          textColor = 'text-gray-800';
      }
    } else if (type === 'review') {
      switch (status) {
        case 'assigned':
          bgColor = 'bg-blue-100';
          textColor = 'text-blue-800';
          break;
        case 'in_progress':
          bgColor = 'bg-yellow-100';
          textColor = 'text-yellow-800';
          statusText = 'In Progress';
          break;
        case 'completed':
          bgColor = 'bg-green-100';
          textColor = 'text-green-800';
          break;
        default:
          bgColor = 'bg-gray-100';
          textColor = 'text-gray-800';
      }
    }
    
    return (
      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${bgColor} ${textColor}`}>
        {statusText.replace('_', ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
      </span>
    );
  };
  
  if (isLoading) {
    return (
      <div className="py-10 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="py-10">
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="py-6">
      <div className="flex flex-col space-y-8">
        {/* Welcome Section */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h2 className="text-lg font-medium text-gray-900">Welcome, {userName}!</h2>
            <p className="mt-1 text-sm text-gray-500">
              Here's an overview of your courses, assignments, and peer reviews.
            </p>
          </div>
        </div>
        
        {/* Enrolled Courses - Moved to top */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:px-6 bg-green-50">
            <h3 className="text-lg font-medium leading-6 text-green-800">My Courses</h3>
            <p className="mt-1 text-sm text-gray-500">Courses you're enrolled in</p>
          </div>
          <div className="px-4 py-5 sm:p-6">
            {courses.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {courses.map((course) => (
                  <div key={course.id} className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex flex-col space-y-3 hover:border-gray-400">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900">{course.name}</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        <span className="font-medium">Instructor:</span> {course.instructorName || course.instructor_name || 'Not assigned'}
                      </p>
                      <p className="text-sm text-gray-500">
                        <span className="font-medium">Assignments:</span> {
                          typeof course.assignmentCount === 'number' ? course.assignmentCount :
                          typeof course.assignment_count === 'number' ? course.assignment_count : 
                          '0'
                        }
                      </p>
                      {course.description && (
                        <p className="text-sm text-gray-500 mt-2 line-clamp-2">{course.description}</p>
                      )}
                    </div>
                    <div>
                      <Link
                        href={`/courses/${course.id}`}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                      >
                        View Course
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-4">No courses found</p>
            )}
          </div>
        </div>
        
        {/* Upcoming Assignments */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:px-6 bg-purple-50">
            <h3 className="text-lg font-medium leading-6 text-purple-800">Assignments</h3>
            <p className="mt-1 text-sm text-gray-500">Your upcoming and recent assignments</p>
          </div>
          <div className="px-4 py-5 sm:p-6">
            {assignments.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Title
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Course
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Due Date
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {assignments.map((assignment) => (
                      <tr key={assignment.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {assignment.title || 'Untitled Assignment'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {assignment.coursename || assignment.courseName || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(assignment.duedate || assignment.dueDate)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <StatusBadge status={assignment.status} type="assignment" />
                            {assignment.submitted && (
                              <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                Submitted
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <Link 
                            href={`/assignments/${assignment.id}`}
                            className="text-indigo-600 hover:text-indigo-900 mr-4"
                          >
                            Details
                          </Link>
                          {!assignment.submitted && (
                            <Link 
                              href={`/assignments/${assignment.id}/submit`}
                              className="text-green-600 hover:text-green-900"
                            >
                              Submit
                            </Link>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-center text-gray-500 py-4">No assignments found</p>
            )}
          </div>
        </div>
        
        {/* Assigned Reviews */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:px-6 bg-yellow-50">
            <h3 className="text-lg font-medium leading-6 text-yellow-800">Peer Reviews To Complete</h3>
            <p className="mt-1 text-sm text-gray-500">Reviews assigned to you</p>
          </div>
          <div className="px-4 py-5 sm:p-6">
            {assignedReviews.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Submission
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Course
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Assigned Date
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {assignedReviews.map((review) => (
                      <tr key={review.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {review.submissionTitle}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {review.studentName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {review.courseName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(review.assignedDate)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <StatusBadge status={review.status} type="review" />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <Link 
                            href={`/reviews/${review.id}`}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            {review.status === 'in_progress' ? 'Continue Review' : 'Start Review'}
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-center text-gray-500 py-4">No reviews assigned</p>
            )}
          </div>
        </div>
        
        {/* Recent Submissions */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:px-6 bg-blue-50">
            <h3 className="text-lg font-medium leading-6 text-blue-800">My Submissions</h3>
            <p className="mt-1 text-sm text-gray-500">Your recent assignment submissions</p>
          </div>
          <div className="px-4 py-5 sm:p-6">
            {submissions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Title
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Assignment
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Course
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Submitted
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Reviews
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {submissions.map((submission) => (
                      <tr key={submission.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {submission.title}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {submission.assignmentTitle}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {submission.courseName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(submission.submissionDate)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <StatusBadge status={submission.status} type="submission" />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {submission.reviewCount} reviews
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <Link 
                            href={`/submissions/${submission.id}`}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-center text-gray-500 py-4">No submissions found</p>
            )}
          </div>
        </div>
        
        {/* Recent Feedback */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:px-6 bg-indigo-50">
            <h3 className="text-lg font-medium leading-6 text-indigo-800">Recent Feedback</h3>
            <p className="mt-1 text-sm text-gray-500">Feedback received on your submissions</p>
          </div>
          <div className="px-4 py-5 sm:p-6">
            {receivedFeedback && receivedFeedback.length > 0 ? (
              <div className="space-y-6">
                {receivedFeedback.map((feedback) => (
                  <div key={feedback.id} className="bg-white shadow overflow-hidden sm:rounded-lg">
                    <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                      <div>
                        <h3 className="text-lg leading-6 font-medium text-gray-900">
                          {feedback.submissionTitle}
                        </h3>
                        <p className="mt-1 max-w-2xl text-sm text-gray-500">
                          {feedback.courseName} · {feedback.assignmentTitle}
                        </p>
                      </div>
                      <div>
                        <span className="font-bold text-lg text-indigo-600">{feedback.totalScore || 0}</span>
                        <span className="text-gray-500 text-sm ml-1">points</span>
                      </div>
                    </div>
                    <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                      <div className="text-sm text-gray-900 space-y-3">
                        <div>
                          <p className="font-medium text-gray-500">Feedback from {feedback.reviewerName}:</p>
                          <p className="mt-1">{feedback.overallFeedback || 'No feedback provided.'}</p>
                        </div>
                        <div className="flex justify-between items-center pt-3">
                          <span className="text-xs text-gray-500">Received on {formatDate(feedback.completedDate)}</span>
                          <Link 
                            href={`/reviews/${feedback.id}`}
                            className="text-sm text-indigo-600 hover:text-indigo-900"
                          >
                            View Full Feedback
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-4">
                <p className="mb-2">No feedback received yet</p>
                <p className="text-sm">You'll see peer reviews here after others review your submissions.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Instructor Dashboard Component
function InstructorDashboard({ userName }: { userName: string }) {
  const [courses, setCourses] = useState<any[]>([]);
  const [recentAssignments, setRecentAssignments] = useState<any[]>([]);
  const [rubrics, setRubrics] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    
    console.log('User ID from localStorage:', userId);
    
    if (!userId) {
      setError('User ID not found. Please log in again.');
      setIsLoading(false);
      return;
    }

    // Fetch all instructor dashboard data
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch courses
        console.log('Fetching courses for user ID:', userId);
        const coursesRes = await fetch(`/api/dashboard/instructor/courses?instructorId=${userId}`);
        
        if (!coursesRes.ok) {
          const errorData = await coursesRes.json().catch(() => ({}));
          console.error('Courses fetch error:', errorData);
          throw new Error(`Failed to fetch courses: ${errorData.details || coursesRes.statusText}`);
        }
        
        const coursesData = await coursesRes.json();
        console.log('Courses data received:', coursesData);
        
        // Check if courses array exists
        if (!coursesData.courses) {
          throw new Error('Invalid courses data format');
        }
        
        // Fetch assignments with the same instructor ID
        const assignmentsRes = await fetch(`/api/dashboard/instructor/assignments?instructorId=${userId}`);
        if (!assignmentsRes.ok) {
          const errorData = await assignmentsRes.json().catch(() => ({}));
          throw new Error(`Failed to fetch assignments: ${errorData.details || assignmentsRes.statusText}`);
        }
        const assignmentsData = await assignmentsRes.json();
        console.log('Assignments data received:', assignmentsData);
        
        // Fetch rubrics with the same instructor ID
        const rubricsRes = await fetch(`/api/dashboard/instructor/rubrics?instructorId=${userId}`);
        if (!rubricsRes.ok) {
          const errorData = await rubricsRes.json().catch(() => ({}));
          throw new Error(`Failed to fetch rubrics: ${errorData.details || rubricsRes.statusText}`);
        }
        const rubricsData = await rubricsRes.json();
        console.log('Rubrics data received:', rubricsData);
        
        // Update state with fetched data
        setCourses(coursesData.courses);
        setRecentAssignments(assignmentsData.assignments || []);
        setRubrics(rubricsData.rubrics || []);
        setError(null);
        setErrorDetails(null);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        if (err instanceof Error) {
          setError('Failed to load dashboard data.');
          setErrorDetails(err.message);
        } else {
          setError('Failed to load dashboard data. Please try again.');
          setErrorDetails(String(err));
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div className="py-10 flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-10 flex justify-center items-center flex-col h-96">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative max-w-2xl" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
          {errorDetails && (
            <div className="mt-2 text-sm border-t border-red-200 pt-2">
              <p>Details: {errorDetails}</p>
            </div>
          )}
          <div className="mt-4">
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-10">
      <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
        {/* Welcome Card */}
        <div className="px-4 py-6 sm:px-0 mb-8">
          <div className="bg-gradient-to-r from-purple-700 to-purple-900 rounded-lg shadow-md p-6 text-white">
            <h2 className="text-xl font-semibold mb-2">Welcome back, {userName}</h2>
            <p className="text-purple-100">You manage {courses.length} courses with {courses.reduce((total, course) => total + course.studentsCount, 0)} students in total.</p>
          </div>
        </div>

        {/* Quick Actions Section */}
        <div className="px-4 sm:px-0 mb-8">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <Link 
              href="/courses/create"
              className="bg-white overflow-hidden shadow rounded-lg p-4 hover:bg-purple-50 transition duration-150 ease-in-out"
            >
              <div className="flex flex-col items-center">
                <div className="rounded-md bg-purple-50 p-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <div className="mt-2 text-center">
                  <h4 className="text-sm font-medium text-gray-900">New Course</h4>
                </div>
              </div>
            </Link>
            
            <Link 
              href="/assignments/create"
              className="bg-white overflow-hidden shadow rounded-lg p-4 hover:bg-purple-50 transition duration-150 ease-in-out"
            >
              <div className="flex flex-col items-center">
                <div className="rounded-md bg-purple-50 p-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div className="mt-2 text-center">
                  <h4 className="text-sm font-medium text-gray-900">New Assignment</h4>
                </div>
              </div>
            </Link>
            
            <Link 
              href="/peer-reviews"
              className="bg-white overflow-hidden shadow rounded-lg p-4 hover:bg-purple-50 transition duration-150 ease-in-out"
            >
              <div className="flex flex-col items-center">
                <div className="rounded-md bg-purple-50 p-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
                <div className="mt-2 text-center">
                  <h4 className="text-sm font-medium text-gray-900">Manage Peer Reviews</h4>
                </div>
              </div>
            </Link>
            
            <Link 
              href="/rubrics/create"
              className="bg-white overflow-hidden shadow rounded-lg p-4 hover:bg-purple-50 transition duration-150 ease-in-out"
            >
              <div className="flex flex-col items-center">
                <div className="rounded-md bg-purple-50 p-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div className="mt-2 text-center">
                  <h4 className="text-sm font-medium text-gray-900">Create Rubric</h4>
                </div>
              </div>
            </Link>
          </div>
        </div>

        <div className="px-4 sm:px-0">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            {/* My Courses */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:px-6 bg-purple-50">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium leading-6 text-purple-800">My Courses</h3>
                    <p className="mt-1 text-sm text-gray-500">Courses you're currently teaching</p>
                  </div>
                  <Link 
                    href="/courses/create"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                  >
                    New Course
                  </Link>
                </div>
              </div>
              <div className="px-4 py-5 sm:p-6">
                {courses.length > 0 ? (
                  <ul className="divide-y divide-gray-200">
                    {courses.map((course) => (
                      <li key={course.id} className="py-4">
                        <div className="flex flex-col space-y-2">
                          <div className="flex items-center justify-between">
                            <h4 className="text-md font-medium text-black">{course.title}</h4>
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                              {course.code}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm text-gray-500">
                            <span>{course.studentsCount} students</span>
                            <span>{course.assignmentsCount} assignments</span>
                          </div>
                          <div className="mt-2 flex space-x-2">
                            <Link 
                              href={`/courses/${course.id}`}
                              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                            >
                              Manage Course
                            </Link>
                            <Link 
                              href={`/courses/${course.id}/students`}
                              className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                            >
                              Add Students
                            </Link>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-center text-gray-500 py-4">No courses yet</p>
                )}
              </div>
            </div>
            
            {/* Rubrics */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:px-6 bg-purple-50">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium leading-6 text-purple-800">Assessment Rubrics</h3>
                    <p className="mt-1 text-sm text-gray-500">Grading criteria for assignments</p>
                  </div>
                  <Link 
                    href="/rubrics/create"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                  >
                    New Rubric
                  </Link>
                </div>
              </div>
              <div className="px-4 py-5 sm:p-6">
                {rubrics.length > 0 ? (
                  <ul className="divide-y divide-gray-200">
                    {rubrics.map((rubric) => (
                      <li key={rubric.id} className="py-4">
                        <div className="flex flex-col space-y-2">
                          <div className="flex items-center justify-between">
                            <h4 className="text-md font-medium text-black">{rubric.title}</h4>
                            <span className="text-sm text-gray-500">
                              Last updated: {rubric.lastUpdated}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500">{rubric.criteria} criteria</p>
                          <div className="mt-2">
                            <Link 
                              href={`/rubrics/${rubric.id}/edit`}
                              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                            >
                              Edit Rubric
                            </Link>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-center text-gray-500 py-4">No rubrics created yet</p>
                )}
              </div>
            </div>
          </div>
          
          {/* Recent Assignments */}
          <div className="mt-8 bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:px-6 bg-purple-50">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium leading-6 text-purple-800">Recent Assignments</h3>
                  <p className="mt-1 text-sm text-gray-500">Assignments you've created recently</p>
                </div>
                <Link 
                  href="/assignments/create"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                >
                  Create Assignment
                </Link>
              </div>
            </div>
            <div className="px-4 py-5 sm:p-6">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Title
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Course
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Due Date
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Submissions
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {recentAssignments.length > 0 ? (
                      recentAssignments.map((assignment) => (
                        <tr key={assignment.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-black">
                            {assignment.title}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                            {assignment.course}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                            {assignment.dueDate}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                            <div className="flex items-center">
                              <span className="mr-2">
                                {assignment.submissionsCount}/{assignment.totalStudents}
                              </span>
                              <div className="w-16 bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-purple-600 h-2 rounded-full" 
                                  style={{ width: `${(assignment.submissionsCount / assignment.totalStudents) * 100}%` }}
                                ></div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <Link 
                                href={`/assignments/${assignment.id}/submissions`}
                                className="text-purple-600 hover:text-purple-900"
                              >
                                View Submissions
                              </Link>
                              <span className="text-gray-300">|</span>
                              <Link 
                                href={`/assignments/${assignment.id}/edit`}
                                className="text-purple-600 hover:text-purple-900"
                              >
                                Edit
                              </Link>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                          No assignments created yet
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 