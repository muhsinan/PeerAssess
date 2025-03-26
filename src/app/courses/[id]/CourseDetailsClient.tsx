'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/layout/Layout';
import Link from 'next/link';

export default function CourseDetailsClient({ courseId }: { courseId: string }) {
  const router = useRouter();
  const [course, setCourse] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    // Get user info from localStorage
    if (typeof window !== 'undefined') {
      const id = localStorage.getItem('userId');
      const role = localStorage.getItem('userRole');
      setUserId(id);
      setUserRole(role);
    }
  }, []);

  // Fetch course data
  useEffect(() => {
    const fetchCourseData = async () => {
      if (!userId || !userRole) return;

      try {
        setIsLoading(true);
        const response = await fetch(`/api/courses/${courseId}?userId=${userId}&role=${userRole}`);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch course details');
        }

        const data = await response.json();
        setCourse(data);
      } catch (error) {
        console.error('Error fetching course details:', error);
        setError(error instanceof Error ? error.message : 'An error occurred while fetching course data');
      } finally {
        setIsLoading(false);
      }
    };

    if (userId && userRole) {
      fetchCourseData();
    }
  }, [courseId, userId, userRole]);

  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      return 'N/A';
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
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
              <div className="mt-4">
                <button
                  onClick={() => router.push('/dashboard')}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Return to Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!course) {
    return (
      <Layout>
        <div className="py-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">Course not found or you don't have access to this course.</p>
                </div>
              </div>
              <div className="mt-4">
                <button
                  onClick={() => router.push('/dashboard')}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                >
                  Return to Dashboard
                </button>
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
                  {course.name}
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  Instructor: {course.instructorName} • {course.enrolledStudentCount} students enrolled
                </p>
              </div>
              <div className="mt-4 flex md:mt-0 md:ml-4">
                <Link 
                  href="/dashboard"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                >
                  Back to Dashboard
                </Link>
              </div>
            </div>
          </div>
        </header>
        
        <main>
          <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
            <div className="mt-8 bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6 bg-purple-50">
                <h3 className="text-lg leading-6 font-medium text-purple-800">Course Information</h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">Course details and description</p>
              </div>
              <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
                <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <dt className="text-sm font-medium text-gray-500">Description</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {course.description || 'No description provided for this course.'}
                    </dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Course ID</dt>
                    <dd className="mt-1 text-sm text-gray-900">C{course.id}</dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Enrolled Since</dt>
                    <dd className="mt-1 text-sm text-gray-900">{formatDate(course.enrollmentDate)}</dd>
                  </div>
                </dl>
              </div>
            </div>
            
            {/* Assignments Section */}
            <div className="mt-8 bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6 bg-purple-50">
                <h3 className="text-lg leading-6 font-medium text-purple-800">Assignments</h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">Course assignments and their due dates</p>
              </div>
              
              <div className="border-t border-gray-200">
                {course.assignments && course.assignments.length > 0 ? (
                  <ul role="list" className="divide-y divide-gray-200">
                    {course.assignments.map((assignment: any) => (
                      <li key={assignment.id} className="px-4 py-4 sm:px-6">
                        <div className="flex items-center justify-between">
                          <div className="flex flex-col">
                            <p className="text-md font-medium text-purple-600 truncate">{assignment.title}</p>
                            <p className="mt-1 text-sm text-gray-500">
                              Due: {formatDate(assignment.dueDate)}
                            </p>
                            {assignment.description && (
                              <p className="mt-1 text-sm text-gray-500 truncate max-w-xl">
                                {assignment.description.substring(0, 100)}
                                {assignment.description.length > 100 ? '...' : ''}
                              </p>
                            )}
                          </div>
                          <div className="ml-2 flex-shrink-0 flex">
                            {userRole === 'student' && (
                              <>
                                <div className="mr-4">
                                  {assignment.hasSubmitted ? (
                                    <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                      Submitted
                                    </span>
                                  ) : (
                                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                                      ${assignment.status === 'past' ? 'bg-red-100 text-red-800' : 
                                       assignment.status === 'soon' ? 'bg-yellow-100 text-yellow-800' : 
                                       'bg-blue-100 text-blue-800'}`}>
                                      {assignment.status === 'past' ? 'Past Due' : 
                                       assignment.status === 'soon' ? 'Due Soon' : 
                                       'Upcoming'}
                                    </span>
                                  )}
                                </div>
                                <Link
                                  href={`/assignments/${assignment.id}`}
                                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                                >
                                  {assignment.hasSubmitted ? 'View Submission' : 'Submit Assignment'}
                                </Link>
                              </>
                            )}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="px-4 py-5 sm:px-6 text-center text-gray-500">
                    No assignments for this course yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </Layout>
  );
} 