'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/layout/Layout';

interface PendingRequest {
  id: number;
  studentId: number;
  studentName: string;
  studentEmail: string;
  status: string;
  requestedAt: string;
  reviewedAt?: string;
  rejectionReason?: string;
  courseName: string;
  reviewerName?: string;
}

export default function PendingEnrollmentsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [courseId, setCourseId] = useState<string>('');
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [processingRequest, setProcessingRequest] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [showRejectionModal, setShowRejectionModal] = useState<number | null>(null);

  // Resolve params
  useEffect(() => {
    const resolveParams = async () => {
      const resolvedParams = await params;
      setCourseId(resolvedParams.id);
    };
    resolveParams();
  }, [params]);

  // Check if user is authorized (must be an instructor)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const role = localStorage.getItem('userRole');
      const id = localStorage.getItem('userId');
      
      setUserRole(role);
      setUserId(id);
      
      // If not an instructor, redirect to dashboard
      if (role !== 'instructor') {
        router.push('/dashboard');
        return;
      }
    }
  }, [router]);

  // Fetch pending enrollment requests
  useEffect(() => {
    const fetchPendingRequests = async () => {
      if (!courseId || !userId || userRole !== 'instructor') return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch(`/api/courses/${courseId}/pending-enrollments`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch pending requests');
        }
        
        const data = await response.json();
        setPendingRequests(data.pendingRequests || []);
      } catch (error) {
        console.error('Error fetching pending requests:', error);
        setError(error instanceof Error ? error.message : 'An unexpected error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    if (courseId && userId && userRole === 'instructor') {
      fetchPendingRequests();
    }
  }, [courseId, userId, userRole]);

  const handleApprove = async (requestId: number) => {
    try {
      setProcessingRequest(requestId);
      
      const response = await fetch(`/api/courses/${courseId}/pending-enrollments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requestId,
          action: 'approve',
          instructorId: userId
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to approve request');
      }
      
      const data = await response.json();
      
      // Update the request in the list
      setPendingRequests(prev => 
        prev.map(req => 
          req.id === requestId 
            ? { ...req, status: 'approved', reviewedAt: new Date().toISOString() }
            : req
        )
      );
      
      // Show success message (you could add a toast here)
      alert(`Successfully approved enrollment for ${data.studentName}`);
      
    } catch (error) {
      console.error('Error approving request:', error);
      alert(error instanceof Error ? error.message : 'Failed to approve request');
    } finally {
      setProcessingRequest(null);
    }
  };

  const handleReject = async (requestId: number) => {
    if (!rejectionReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }
    
    try {
      setProcessingRequest(requestId);
      
      const response = await fetch(`/api/courses/${courseId}/pending-enrollments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requestId,
          action: 'reject',
          rejectionReason: rejectionReason.trim(),
          instructorId: userId
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to reject request');
      }
      
      const data = await response.json();
      
      // Update the request in the list
      setPendingRequests(prev => 
        prev.map(req => 
          req.id === requestId 
            ? { 
                ...req, 
                status: 'rejected', 
                reviewedAt: new Date().toISOString(),
                rejectionReason: rejectionReason.trim()
              }
            : req
        )
      );
      
      // Close modal and reset reason
      setShowRejectionModal(null);
      setRejectionReason('');
      
      // Show success message
      alert(`Rejected enrollment request for ${data.studentName}`);
      
    } catch (error) {
      console.error('Error rejecting request:', error);
      alert(error instanceof Error ? error.message : 'Failed to reject request');
    } finally {
      setProcessingRequest(null);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'N/A';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="py-10 flex justify-center items-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="py-10 flex justify-center items-center flex-col h-96">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative max-w-2xl" role="alert">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        </div>
      </Layout>
    );
  }

  const pendingCount = pendingRequests.filter(req => req.status === 'pending').length;
  const courseName = pendingRequests.length > 0 ? pendingRequests[0].courseName : 'Course';

  return (
    <Layout>
      <div className="py-10">
        <header>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold leading-tight text-gray-900">
                  Pending Enrollments
                </h1>
                <p className="mt-2 text-sm text-gray-600">
                  Manage enrollment requests for {courseName}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                  {pendingCount} pending
                </span>
                <button
                  onClick={() => router.back()}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                >
                  Back to Course
                </button>
              </div>
            </div>
          </div>
        </header>

        <main>
          <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
            <div className="px-4 py-8 sm:px-0">
              {pendingRequests.length > 0 ? (
                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                  <ul className="divide-y divide-gray-200">
                    {pendingRequests.map((request) => (
                      <li key={request.id} className="px-6 py-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <div>
                                <h3 className="text-lg font-medium text-gray-900">
                                  {request.studentName}
                                </h3>
                                <p className="text-sm text-gray-500">{request.studentEmail}</p>
                              </div>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(request.status)}`}>
                                {request.status}
                              </span>
                            </div>
                            <div className="mt-2 text-sm text-gray-500">
                              <p>Requested: {formatDate(request.requestedAt)}</p>
                              {request.reviewedAt && (
                                <p>Reviewed: {formatDate(request.reviewedAt)}</p>
                              )}
                              {request.rejectionReason && (
                                <p className="text-red-600 mt-1">
                                  <strong>Rejection reason:</strong> {request.rejectionReason}
                                </p>
                              )}
                            </div>
                          </div>
                          
                          {request.status === 'pending' && (
                            <div className="flex space-x-2 ml-4">
                              <button
                                onClick={() => handleApprove(request.id)}
                                disabled={processingRequest === request.id}
                                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                              >
                                {processingRequest === request.id ? 'Approving...' : 'Approve'}
                              </button>
                              <button
                                onClick={() => setShowRejectionModal(request.id)}
                                disabled={processingRequest === request.id}
                                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                              >
                                Reject
                              </button>
                            </div>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="mx-auto h-12 w-12 text-gray-400">
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                  </div>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No enrollment requests</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    There are no pending enrollment requests for this course.
                  </p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Rejection Modal */}
      {showRejectionModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Reject Enrollment Request
              </h3>
              <div className="mb-4">
                <label htmlFor="rejectionReason" className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for rejection:
                </label>
                <textarea
                  id="rejectionReason"
                  rows={3}
                  className="shadow-sm focus:ring-purple-500 focus:border-purple-500 mt-1 block w-full sm:text-sm border border-gray-300 rounded-md"
                  placeholder="Please provide a reason for rejecting this enrollment request..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowRejectionModal(null);
                    setRejectionReason('');
                  }}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleReject(showRejectionModal)}
                  disabled={!rejectionReason.trim() || processingRequest === showRejectionModal}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                >
                  {processingRequest === showRejectionModal ? 'Rejecting...' : 'Reject Request'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
