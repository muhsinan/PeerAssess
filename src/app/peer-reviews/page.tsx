'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PeerReviewsPage() {
  const router = useRouter();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Get user role from localStorage
    if (typeof window !== 'undefined') {
      const role = localStorage.getItem('userRole');
      setUserRole(role);
      
      // Redirect students to dashboard
      if (role === 'student') {
        router.push('/dashboard');
        return;
      }
      
      // Fetch assignments for instructors
      if (role === 'instructor') {
        const fetchAssignments = async () => {
          try {
            const userId = localStorage.getItem('userId');
            if (!userId) {
              throw new Error('User ID not found');
            }
            
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
      }
    }
  }, [router]);

  if (userRole === 'student') {
    return null; // Will redirect to dashboard
  }

  if (loading) {
    return (
      <div className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold leading-tight text-black">Peer Reviews Management</h1>
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
          <h1 className="text-3xl font-bold leading-tight text-black">Peer Reviews Management</h1>
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
                          <a
                            href={`/peer-reviews/assignment/${assignment.id}`}
                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                          >
                            Manage Peer Reviews
                          </a>
                        </div>
                      </div>
                      <div className="mt-2 sm:flex sm:justify-between">
                        <div className="sm:flex">
                          <p className="flex items-center text-sm text-gray-500">
                            Submissions: {assignment.submissionsCount || 0}/{assignment.totalStudents || 0}
                          </p>
                        </div>
                        <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                          <p>
                            Due: {new Date(assignment.dueDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </li>
                ))
              ) : (
                <li className="px-4 py-6 sm:px-6">
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