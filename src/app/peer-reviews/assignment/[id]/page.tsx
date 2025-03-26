'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface Student {
  id: number;
  name: string;
  email: string;
}

interface Submission {
  id: number;
  title: string;
  studentId: number;
  studentName: string;
  studentEmail: string;
  submissionDate: string;
  reviewCount: number;
  completedReviewCount: number;
}

interface PeerReview {
  id: number;
  submissionId: number;
  reviewerId: number;
  reviewerName: string;
  status: string;
  assignedDate: string;
  completedDate?: string;
}

export default function AssignmentPeerReviewPage() {
  const params = useParams();
  const router = useRouter();
  const assignmentId = params.id as string;
  
  const [assignment, setAssignment] = useState<any>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [peerReviews, setPeerReviews] = useState<PeerReview[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Check if user is instructor
        const userRole = localStorage.getItem('userRole');
        if (userRole !== 'instructor') {
          router.push('/dashboard');
          return;
        }

        // Fetch assignment details
        const assignmentRes = await fetch(`/api/assignments/${assignmentId}`);
        if (!assignmentRes.ok) {
          throw new Error('Failed to fetch assignment details');
        }
        const assignmentData = await assignmentRes.json();
        setAssignment(assignmentData);

        // Fetch submissions for this assignment
        const submissionsRes = await fetch(`/api/assignments/${assignmentId}/submissions`);
        if (!submissionsRes.ok) {
          throw new Error('Failed to fetch submissions');
        }
        const submissionsData = await submissionsRes.json();
        setSubmissions(submissionsData.submissions || []);

        // Fetch all peer reviews for this assignment
        const peerReviewsRes = await fetch(`/api/assignments/${assignmentId}/peer-reviews`);
        if (!peerReviewsRes.ok) {
          throw new Error('Failed to fetch peer reviews');
        }
        const peerReviewsData = await peerReviewsRes.json();
        setPeerReviews(peerReviewsData.peerReviews || []);

        // Fetch all students enrolled in the course
        const courseId = assignmentData.courseId;
        setDebugInfo(`Fetching students for course ID: ${courseId}`);
        
        if (!courseId) {
          throw new Error('Course ID not found in assignment data');
        }
        
        try {
          const studentsRes = await fetch(`/api/courses/${courseId}/students`);
          const responseText = await studentsRes.text(); // Get raw response for debugging
          
          if (!studentsRes.ok) {
            setDebugInfo(`Failed to fetch students. Status: ${studentsRes.status}. Response: ${responseText}`);
            throw new Error(`Failed to fetch students: ${studentsRes.status} ${studentsRes.statusText}`);
          }
          
          try {
            const studentsData = JSON.parse(responseText);
            if (!studentsData.students || !Array.isArray(studentsData.students)) {
              setDebugInfo(`Invalid students data format. Response: ${responseText}`);
              throw new Error('Invalid students data format');
            }
            setStudents(studentsData.students || []);
          } catch (parseError) {
            setDebugInfo(`Error parsing students JSON: ${parseError}. Raw response: ${responseText}`);
            throw new Error('Error parsing students data');
          }
        } catch (studentsError: any) {
          // Continue with the page even if students fetch fails
          console.error('Error fetching students:', studentsError);
          setDebugInfo(`Students fetch error: ${studentsError.message}`);
          // We'll still set the loading to false and continue with empty students array
        }

        setLoading(false);
      } catch (err: any) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchData();
  }, [assignmentId, router]);

  const assignRandomPeerReviews = async () => {
    setGenerating(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      // Create a new endpoint for this
      const response = await fetch(`/api/assignments/${assignmentId}/peer-reviews/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reviewsPerStudent: 2, // Each student reviews 2 assignments
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to generate peer reviews');
      }
      
      const data = await response.json();
      setPeerReviews(data.peerReviews || []);
      setSuccessMessage('Peer reviews have been randomly assigned successfully');
      
      // Refresh submissions data to update review counts
      const submissionsRes = await fetch(`/api/assignments/${assignmentId}/submissions`);
      if (submissionsRes.ok) {
        const submissionsData = await submissionsRes.json();
        setSubmissions(submissionsData.submissions || []);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const deletePeerReview = async (reviewId: number) => {
    try {
      const response = await fetch(`/api/peer-reviews/${reviewId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete peer review');
      }
      
      // Remove the deleted review from state
      setPeerReviews(peerReviews.filter(review => review.id !== reviewId));
      setSuccessMessage('Peer review has been deleted successfully');
      
      // Refresh submissions data to update review counts
      const submissionsRes = await fetch(`/api/assignments/${assignmentId}/submissions`);
      if (submissionsRes.ok) {
        const submissionsData = await submissionsRes.json();
        setSubmissions(submissionsData.submissions || []);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const assignPeerReview = async (submissionId: number, reviewerId: number) => {
    try {
      const response = await fetch(`/api/peer-reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          submissionId,
          reviewerId,
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to assign peer review');
      }
      
      const data = await response.json();
      setPeerReviews([...peerReviews, data.peerReview]);
      setSuccessMessage('Peer review has been assigned successfully');
      
      // Refresh submissions data to update review counts
      const submissionsRes = await fetch(`/api/assignments/${assignmentId}/submissions`);
      if (submissionsRes.ok) {
        const submissionsData = await submissionsRes.json();
        setSubmissions(submissionsData.submissions || []);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold leading-tight text-black">Loading Assignment...</h1>
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold leading-tight text-black">Error</h1>
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mt-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
                {debugInfo && (
                  <p className="text-xs text-red-500 mt-1">Debug info: {debugInfo}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const getReviewsForSubmission = (submissionId: number) => {
    return peerReviews.filter(review => review.submissionId === submissionId);
  };

  const getReviewsByStudent = (studentId: number) => {
    return peerReviews.filter(review => review.reviewerId === studentId);
  };

  return (
    <div className="py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-bold leading-tight text-black">
              Peer Reviews: {assignment?.title}
            </h1>
            <p className="mt-1 text-gray-500">
              Course: {assignment?.courseName} | Due: {new Date(assignment?.dueDate).toLocaleDateString()}
            </p>
            {debugInfo && (
              <p className="text-xs text-gray-500 mt-1">Debug info: {debugInfo}</p>
            )}
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4">
            <button
              type="button"
              onClick={assignRandomPeerReviews}
              disabled={generating}
              className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
            >
              {generating ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating...
                </>
              ) : 'Auto-Assign Peer Reviews'}
            </button>
          </div>
        </div>
        
        {/* Success Message */}
        {successMessage && (
          <div className="mt-4 bg-green-50 border-l-4 border-green-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-700">{successMessage}</p>
              </div>
              <div className="ml-auto pl-3">
                <div className="-mx-1.5 -my-1.5">
                  <button
                    onClick={() => setSuccessMessage(null)}
                    className="inline-flex bg-green-50 rounded-md p-1.5 text-green-500 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-600"
                  >
                    <span className="sr-only">Dismiss</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Submissions Table */}
        <div className="mt-8 bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 bg-gray-50">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Submissions and Assigned Reviews</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              {submissions.length} submissions received | {peerReviews.length} peer reviews assigned
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submission</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned Reviewers</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {submissions.map((submission) => {
                  const assignedReviews = getReviewsForSubmission(submission.id);
                  return (
                    <tr key={submission.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div>
                            <div className="text-sm font-medium text-black">{submission.studentName}</div>
                            <div className="text-sm text-gray-500">{submission.studentEmail}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-black">{submission.title}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(submission.submissionDate).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        {assignedReviews.length > 0 ? (
                          <ul className="text-sm text-gray-500">
                            {assignedReviews.map((review) => (
                              <li key={review.id} className="flex justify-between items-center mb-2">
                                <span>{review.reviewerName}</span>
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                  ${review.status === 'completed' ? 'bg-green-100 text-green-800' : 
                                    review.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' : 
                                    'bg-gray-100 text-gray-800'}`}
                                >
                                  {review.status === 'completed' ? 'Completed' : 
                                   review.status === 'in_progress' ? 'In Progress' : 'Assigned'}
                                </span>
                                <button
                                  onClick={() => deletePeerReview(review.id)}
                                  className="text-red-600 hover:text-red-900 ml-2"
                                >
                                  Remove
                                </button>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <span className="text-sm text-gray-500">No reviewers assigned</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {students.length > 0 ? (
                          <select 
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm rounded-md"
                            onChange={(e) => {
                              const reviewerId = parseInt(e.target.value);
                              if (reviewerId) {
                                assignPeerReview(submission.id, reviewerId);
                                e.target.value = ''; // Reset select after assigning
                              }
                            }}
                            defaultValue=""
                          >
                            <option value="">Assign Reviewer...</option>
                            {students
                              .filter(student => student.id !== submission.studentId) // Can't review own submission
                              .filter(student => !assignedReviews.some(r => r.reviewerId === student.id)) // Not already assigned
                              .map(student => (
                                <option key={student.id} value={student.id}>{student.name}</option>
                              ))
                            }
                          </select>
                        ) : (
                          <div className="text-sm text-yellow-600">
                            Unable to load students. Please refresh and try again.
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Review Distribution Summary */}
        <div className="mt-8 bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 bg-gray-50">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Review Distribution</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Summary of reviews assigned per student
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reviews to Complete</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reviews to Receive</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {students.length > 0 ? (
                  students.map((student) => {
                    const reviewsToComplete = getReviewsByStudent(student.id);
                    const reviewsToReceive = peerReviews.filter(review => 
                      submissions.some(sub => sub.studentId === student.id && sub.id === review.submissionId)
                    );
                    
                    return (
                      <tr key={student.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div>
                              <div className="text-sm font-medium text-black">{student.name}</div>
                              <div className="text-sm text-gray-500">{student.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                            {reviewsToComplete.length}
                          </span>
                          <span className="ml-2 text-sm text-gray-500">
                            {reviewsToComplete.filter(r => r.status === 'completed').length} completed
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                            {reviewsToReceive.length}
                          </span>
                          <span className="ml-2 text-sm text-gray-500">
                            {reviewsToReceive.filter(r => r.status === 'completed').length} completed
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={3} className="px-6 py-4 text-center text-sm text-gray-500">
                      Unable to load students. Please refresh and try again.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
} 