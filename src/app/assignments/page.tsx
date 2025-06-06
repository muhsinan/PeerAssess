'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '../../components/layout/Layout';
import Link from 'next/link';
import { PlusIcon, PencilIcon, EyeIcon, UsersIcon, ClipboardDocumentListIcon } from '@heroicons/react/24/outline';

interface Assignment {
  id: number;
  title: string;
  description: string;
  dueDate: string;
  courseId: number;
  courseName: string;
  rubrics: any[];
  hasRubric: boolean;
}

export default function AssignmentsPage() {
  const router = useRouter();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);

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

  // Fetch assignments for the instructor
  useEffect(() => {
    const fetchAssignments = async () => {
      if (!userId || userRole !== 'instructor') return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch(`/api/instructors/${userId}/assignments`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch assignments');
        }
        
        const data = await response.json();
        setAssignments(data.assignments || []);
      } catch (error) {
        console.error('Error fetching assignments:', error);
        setError(error instanceof Error ? error.message : 'An unexpected error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    if (userId && userRole === 'instructor') {
      fetchAssignments();
    }
  }, [userId, userRole]);

  // Format date for display
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

  // Get status badge based on due date
  const getStatusBadge = (dueDate: string) => {
    const now = new Date();
    const due = new Date(dueDate);
    const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return (
        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
          Past Due
        </span>
      );
    } else if (diffDays <= 7) {
      return (
        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
          Due Soon
        </span>
      );
    } else {
      return (
        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
          Active
        </span>
      );
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

  if (error) {
    return (
      <Layout>
        <div className="py-10">
          <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
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
        </div>
      </Layout>
    );
  }

  if (userRole !== 'instructor') {
    return (
      <Layout>
        <div className="py-10">
          <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    This page is only available for instructors.
                  </p>
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
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          <div className="md:flex md:items-center md:justify-between">
            <div className="min-w-0 flex-1">
              <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
                My Assignments
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Manage and track all your course assignments
              </p>
            </div>
            <div className="mt-4 flex md:ml-4 md:mt-0">
              <Link
                href="/assignments/create"
                className="inline-flex items-center rounded-md bg-purple-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-purple-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600"
              >
                <PlusIcon className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                New Assignment
              </Link>
            </div>
          </div>

          <div className="mt-8">
            {assignments.length === 0 ? (
              <div className="text-center py-12">
                <ClipboardDocumentListIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-semibold text-gray-900">No assignments</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by creating a new assignment.</p>
                <div className="mt-6">
                  <Link
                    href="/assignments/create"
                    className="inline-flex items-center rounded-md bg-purple-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-purple-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600"
                  >
                    <PlusIcon className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                    New Assignment
                  </Link>
                </div>
              </div>
            ) : (
              <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <ul role="list" className="divide-y divide-gray-200">
                  {assignments.map((assignment) => (
                    <li key={assignment.id}>
                      <div className="px-4 py-4 sm:px-6">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h3 className="text-lg font-medium text-gray-900 truncate">
                                {assignment.title}
                              </h3>
                              {getStatusBadge(assignment.dueDate)}
                            </div>
                            <div className="mt-1 flex flex-col sm:flex-row sm:flex-wrap sm:space-x-6">
                              <div className="mt-2 flex items-center text-sm text-gray-500">
                                <span className="font-medium">{assignment.courseName}</span>
                              </div>
                              <div className="mt-2 flex items-center text-sm text-gray-500">
                                <span>Due: {formatDate(assignment.dueDate)}</span>
                              </div>
                              <div className="mt-2 flex items-center text-sm text-gray-500">
                                <span className={assignment.hasRubric ? 'text-green-600' : 'text-yellow-600'}>
                                  {assignment.hasRubric ? 'Has Rubric' : 'No Rubric'}
                                </span>
                              </div>
                            </div>
                            {assignment.description && (
                              <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                                {assignment.description}
                              </p>
                            )}
                          </div>
                          <div className="ml-4 flex-shrink-0 flex space-x-2">
                            <Link
                              href={`/assignments/${assignment.id}`}
                              className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                              title="View Assignment"
                            >
                              <EyeIcon className="h-4 w-4" />
                            </Link>
                            <Link
                              href={`/assignments/${assignment.id}/edit`}
                              className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                              title="Edit Assignment"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </Link>
                            <Link
                              href={`/assignments/${assignment.id}/submissions`}
                              className="inline-flex items-center px-3 py-1.5 border border-purple-300 shadow-sm text-xs font-medium rounded-md text-purple-700 bg-purple-50 hover:bg-purple-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                              title="View Submissions"
                            >
                              <UsersIcon className="h-4 w-4" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
} 