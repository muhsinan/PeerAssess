'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

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
  
  // Handle the case where params might be null or id might not be available
  if (!params || !params.id) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Invalid Assignment ID</h2>
          <p className="mt-2 text-gray-600">The assignment ID is missing or invalid.</p>
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
  
  const assignmentId = params.id as string;
  
  const [assignment, setAssignment] = useState<any>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [peerReviews, setPeerReviews] = useState<PeerReview[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [pendingAssignments, setPendingAssignments] = useState<{[studentId: number]: number[]}>({});

  // Helper function to save pending assignments to localStorage
  const savePendingAssignments = (assignments: {[studentId: number]: number[]}) => {
    localStorage.setItem(`pendingAssignments-${assignmentId}`, JSON.stringify(assignments));
    setPendingAssignments(assignments);
  };

  // Clean up pending assignments when they become actual assignments
  useEffect(() => {
    const convertPendingToActual = async () => {
      if (Object.keys(pendingAssignments).length > 0 && submissions.length > 0) {
        const updatedPendingAssignments = { ...pendingAssignments };
        let hasChanges = false;

        // Convert pending assignments to actual peer reviews for students who now have submissions
        for (const submission of submissions) {
          if (updatedPendingAssignments[submission.studentId]) {
            const reviewerIds = updatedPendingAssignments[submission.studentId];
            
            // Create actual peer reviews for each pending reviewer
            for (const reviewerId of reviewerIds) {
              try {
                // Check if this peer review already exists to avoid duplicates
                const existingReview = peerReviews.find(pr => 
                  pr.submissionId === submission.id && pr.reviewerId === reviewerId
                );
                
                if (!existingReview) {
                  await assignPeerReview(submission.id, reviewerId);
                }
              } catch (error) {
                console.error('Failed to convert pending assignment to peer review:', error);
              }
            }
            
            // Remove the pending assignments after converting them
            delete updatedPendingAssignments[submission.studentId];
            hasChanges = true;
          }
        }

        if (hasChanges) {
          savePendingAssignments(updatedPendingAssignments);
          setSuccessMessage('Pending assignments have been converted to active peer reviews!');
        }
      }
    };

    convertPendingToActual();
  }, [submissions, pendingAssignments, assignmentId, peerReviews]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Check if user is instructor
        const userRole = localStorage.getItem('userRole');
        if (userRole !== 'instructor') {
          router.push('/dashboard');
          return;
        }

        // Load pending assignments from localStorage
        const savedPendingAssignments = localStorage.getItem(`pendingAssignments-${assignmentId}`);
        if (savedPendingAssignments) {
          setPendingAssignments(JSON.parse(savedPendingAssignments));
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
        
        if (!courseId) {
          throw new Error('Course ID not found in assignment data');
        }
        
        try {
          const studentsRes = await fetch(`/api/courses/${courseId}/students`);
          
          if (!studentsRes.ok) {
            throw new Error(`Failed to fetch students: ${studentsRes.status} ${studentsRes.statusText}`);
          }
          
          const studentsData = await studentsRes.json();
          if (!studentsData.students || !Array.isArray(studentsData.students)) {
            throw new Error('Invalid students data format');
          }
          setStudents(studentsData.students || []);
        } catch (studentsError: any) {
          // Continue with the page even if students fetch fails
          console.error('Error fetching students:', studentsError);
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
          reviewsPerStudent: 1, // Each student gets 1 reviewer assigned
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to generate peer reviews');
      }
      
      const data = await response.json();
      setPeerReviews(data.peerReviews || []);
      
      // Handle pending assignments for students who haven't submitted yet
      if (data.pendingAssignments && data.pendingAssignments.length > 0) {
        const pendingMap: {[studentId: number]: number[]} = {};
        data.pendingAssignments.forEach((assignment: any) => {
          if (!pendingMap[assignment.studentId]) {
            pendingMap[assignment.studentId] = [];
          }
          pendingMap[assignment.studentId].push(assignment.reviewerId);
        });
        savePendingAssignments(pendingMap);
      }
      
      setSuccessMessage(`Successfully assigned 1 reviewer to each student. ${data.stats?.peerReviewsCreated || 0} immediate assignments and ${data.stats?.pendingAssignmentsCreated || 0} pending assignments created.`);
      
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

        {/* Information Section */}
        <div className="mt-6 bg-blue-50 border-l-4 border-blue-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">Peer Review Assignment</h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>
                  You can now assign peer reviews to all enrolled students, even if they haven't submitted their work yet. 
                  This allows for more flexible assignment scheduling and ensures all students can participate in the peer review process.
                </p>
                <p className="mt-2">
                  <strong>How it works:</strong> Use "Auto-Assign" to automatically distribute submissions among all enrolled students, 
                  or manually assign specific students as reviewers using the dropdown in each submission row.
                </p>
              </div>
            </div>
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

        {/* Student Peer Review Assignments - All Enrolled Students */}
        <div className="mt-8 bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 bg-gray-50">
            <h3 className="text-lg leading-6 font-medium text-gray-900">All Students - Peer Review Assignments</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Assign peer reviewers to all enrolled students, including those who haven't submitted yet
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submission Status</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submission Date</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Will Receive Reviews From</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assign Reviewer</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {students.map((student) => {
                  const studentSubmission = submissions.find(sub => sub.studentId === student.id);
                  const reviewsToComplete = getReviewsByStudent(student.id);
                  const reviewsToReceive = peerReviews.filter(review => 
                    submissions.some(sub => sub.studentId === student.id && sub.id === review.submissionId)
                  );
                  
                  return (
                    <tr key={student.id} className={!studentSubmission ? "bg-blue-50" : ""}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div>
                            <div className="text-sm font-medium text-black">{student.name}</div>
                            <div className="text-sm text-gray-500">{student.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {studentSubmission ? (
                          <div>
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              Submitted
                            </span>
                            <div className="text-xs text-gray-500 mt-1">{studentSubmission.title}</div>
                          </div>
                        ) : (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                            Not Submitted
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {studentSubmission ? (
                          <div className="text-sm text-gray-900">
                            {new Date(studentSubmission.submissionDate).toLocaleDateString()}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {reviewsToReceive.length > 0 || (pendingAssignments[student.id] && pendingAssignments[student.id].length > 0) ? (
                          <div className="text-sm text-gray-500">
                            {/* Show actual peer reviews */}
                            {reviewsToReceive.map((review) => (
                              <div key={review.id} className="mb-2 flex items-center justify-between bg-gray-50 p-2 rounded-md">
                                <div>
                                  <span className="font-medium">{review.reviewerName}</span>
                                  <span className={`ml-2 px-2 inline-flex text-xs leading-4 font-semibold rounded-full 
                                    ${review.status === 'completed' ? 'bg-green-100 text-green-800' : 
                                      review.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' : 
                                      'bg-gray-100 text-gray-800'}`}
                                  >
                                    {review.status === 'completed' ? 'Done' : 
                                     review.status === 'in_progress' ? 'In Progress' : 'Assigned'}
                                  </span>
                                </div>
                                <button
                                  onClick={() => deletePeerReview(review.id)}
                                  className="ml-2 inline-flex items-center px-2 py-1 border border-red-300 text-xs font-medium rounded text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                >
                                  Remove
                                </button>
                              </div>
                            ))}
                            {/* Show pending assignments */}
                            {pendingAssignments[student.id] && pendingAssignments[student.id].map((reviewerId) => {
                              const reviewer = students.find(s => s.id === reviewerId);
                              return (
                                <div key={`pending-${reviewerId}`} className="mb-2 flex items-center justify-between bg-blue-50 p-2 rounded-md">
                                  <div>
                                    <span className="font-medium">{reviewer?.name || 'Unknown'}</span>
                                    <span className="ml-2 px-2 inline-flex text-xs leading-4 font-semibold rounded-full bg-blue-100 text-blue-800">
                                      Pending
                                    </span>
                                  </div>
                                  <button
                                    onClick={() => {
                                      const newAssignments = {
                                        ...pendingAssignments,
                                        [student.id]: pendingAssignments[student.id].filter(id => id !== reviewerId)
                                      };
                                      savePendingAssignments(newAssignments);
                                    }}
                                    className="ml-2 inline-flex items-center px-2 py-1 border border-red-300 text-xs font-medium rounded text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                  >
                                    Remove
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">No reviewers assigned</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <select 
                          className="block w-full text-xs pl-2 pr-8 py-1 border-gray-300 focus:outline-none focus:ring-purple-500 focus:border-purple-500 rounded-md"
                          onChange={(e) => {
                            const reviewerId = parseInt(e.target.value);
                            if (reviewerId) {
                              if (studentSubmission) {
                                // Student has submitted - create normal peer review
                                assignPeerReview(studentSubmission.id, reviewerId);
                              } else {
                                // Student hasn't submitted yet - store as pending assignment
                                const reviewerName = students.find(s => s.id === reviewerId)?.name;
                                const newAssignments = {
                                  ...pendingAssignments,
                                  [student.id]: [...(pendingAssignments[student.id] || []), reviewerId]
                                };
                                savePendingAssignments(newAssignments);
                                setSuccessMessage(`Pending assignment: ${reviewerName} will review ${student.name}'s work once they submit.`);
                              }
                              e.target.value = '';
                            }
                          }}
                          defaultValue=""
                        >
                          <option value="">Assign reviewer...</option>
                          {students
                            .filter(s => s.id !== student.id) // Can't review own submission
                            .filter(s => !reviewsToReceive.some(r => r.reviewerId === s.id)) // Not already assigned in actual reviews
                            .filter(s => !(pendingAssignments[student.id] && pendingAssignments[student.id].includes(s.id))) // Not already assigned as pending
                            .map(reviewer => (
                              <option key={reviewer.id} value={reviewer.id}>
                                {reviewer.name}
                              </option>
                            ))
                          }
                        </select>
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