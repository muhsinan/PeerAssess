'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '../../components/layout/Layout';
import Link from 'next/link';
import { PlusIcon, PencilIcon, EyeIcon, UsersIcon, AcademicCapIcon } from '@heroicons/react/24/outline';

interface Course {
  id: number;
  name: string;
  description: string;
  instructorId: number;
  instructorName: string;
  studentsCount: number;
  createdAt: string;
  updatedAt: string;
}

export default function CoursesPage() {
  const router = useRouter();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [pendingEnrollments, setPendingEnrollments] = useState<any>({});
  const [totalPendingCount, setTotalPendingCount] = useState(0);

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

  // Fetch courses for the instructor
  useEffect(() => {
    const fetchCourses = async () => {
      if (!userId || userRole !== 'instructor') return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch(`/api/courses?instructorId=${userId}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch courses');
        }
        
        const data = await response.json();
        setCourses(data.courses || []);
        
        // Fetch pending enrollments
        const pendingRes = await fetch(`/api/instructors/pending-enrollments?instructorId=${userId}`);
        if (pendingRes.ok) {
          const pendingData = await pendingRes.json();
          
          // Create a map of course ID to pending count for easy lookup
          const pendingMap = {};
          pendingData.coursesPendingCounts.forEach((course: any) => {
            pendingMap[course.courseId] = course.pendingCount;
          });
          
          setPendingEnrollments(pendingMap);
          setTotalPendingCount(pendingData.totalPendingCount || 0);
        }
      } catch (error) {
        console.error('Error fetching courses:', error);
        setError(error instanceof Error ? error.message : 'An unexpected error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    if (userId && userRole === 'instructor') {
      fetchCourses();
    }
  }, [userId, userRole]);

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
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
              <div className="flex items-center space-x-3">
                <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
                  My Courses
                </h2>
                {totalPendingCount > 0 && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                    {totalPendingCount} pending enrollment{totalPendingCount !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Manage and track all your courses
              </p>
            </div>
            <div className="mt-4 flex md:ml-4 md:mt-0">
              <Link
                href="/courses/create"
                className="inline-flex items-center rounded-md bg-purple-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-purple-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600"
              >
                <PlusIcon className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                New Course
              </Link>
            </div>
          </div>

          <div className="mt-8">
            {courses.length === 0 ? (
              <div className="text-center py-12">
                <AcademicCapIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-semibold text-gray-900">No courses</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by creating a new course.</p>
                <div className="mt-6">
                  <Link
                    href="/courses/create"
                    className="inline-flex items-center rounded-md bg-purple-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-purple-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600"
                  >
                    <PlusIcon className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                    New Course
                  </Link>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {courses.map((course) => (
                  <div key={course.id} className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-6">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <AcademicCapIcon className="h-8 w-8 text-purple-600" />
                        </div>
                        <div className="ml-4 w-0 flex-1">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <h3 className="text-lg font-medium text-gray-900 truncate">
                                {course.name}
                              </h3>
                              {pendingEnrollments[course.id] > 0 && (
                                <div className="mt-1">
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                    {pendingEnrollments[course.id]} pending
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="mt-1">
                            <div className="flex items-center text-sm text-gray-500">
                              <UsersIcon className="h-4 w-4 mr-1" />
                              <span>{course.studentsCount} students</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {course.description && (
                        <div className="mt-4">
                          <p className="text-sm text-gray-600 line-clamp-3">
                            {course.description}
                          </p>
                        </div>
                      )}
                      
                      <div className="mt-4 text-xs text-gray-500">
                        Created: {formatDate(course.createdAt)}
                      </div>
                      
                      <div className="mt-6 flex flex-col space-y-2">
                        <div className="flex space-x-3">
                          <Link
                            href={`/courses/${course.id}`}
                            className="flex-1 inline-flex justify-center items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                          >
                            <EyeIcon className="h-4 w-4 mr-1" />
                            Manage
                          </Link>
                          <Link
                            href={`/courses/${course.id}/students`}
                            className="flex-1 inline-flex justify-center items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                          >
                            <UsersIcon className="h-4 w-4 mr-1" />
                            Students
                          </Link>
                        </div>
                        {pendingEnrollments[course.id] > 0 && (
                          <Link
                            href={`/courses/${course.id}/pending-enrollments`}
                            className="w-full inline-flex justify-center items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                          >
                            <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Review Requests ({pendingEnrollments[course.id]})
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {courses.length > 0 && (
            <div className="mt-8 bg-gray-50 rounded-lg p-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{courses.length}</div>
                  <div className="text-sm text-gray-600">Total Courses</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {courses.reduce((total, course) => total + course.studentsCount, 0)}
                  </div>
                  <div className="text-sm text-gray-600">Total Students</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {Math.round(courses.reduce((total, course) => total + course.studentsCount, 0) / courses.length) || 0}
                  </div>
                  <div className="text-sm text-gray-600">Avg Students per Course</div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${totalPendingCount > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                    {totalPendingCount}
                  </div>
                  <div className="text-sm text-gray-600">Pending Enrollments</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
} 