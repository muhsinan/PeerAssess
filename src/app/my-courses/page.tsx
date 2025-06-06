'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '../../components/layout/Layout';
import Link from 'next/link';
import { EyeIcon, UsersIcon, AcademicCapIcon, ClipboardDocumentListIcon, CalendarDaysIcon } from '@heroicons/react/24/outline';

interface Course {
  id: number;
  name: string;
  description: string;
  instructorName: string;
  instructorId: number;
  enrollmentDate: string;
  assignmentCount: number;
}

export default function MyCoursesPage() {
  const router = useRouter();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);

  // Check if user is authorized (must be a student)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const role = localStorage.getItem('userRole');
      const id = localStorage.getItem('userId');
      
      setUserRole(role);
      setUserId(id);
      
      // If not a student, redirect to dashboard
      if (role !== 'student') {
        router.push('/dashboard');
        return;
      }
    }
  }, [router]);

  // Fetch courses for the student
  useEffect(() => {
    const fetchCourses = async () => {
      if (!userId || userRole !== 'student') return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch(`/api/dashboard/student?studentId=${userId}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch courses');
        }
        
        const data = await response.json();
        setCourses(data.courses || []);
      } catch (error) {
        console.error('Error fetching courses:', error);
        setError(error instanceof Error ? error.message : 'An unexpected error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    if (userId && userRole === 'student') {
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

  if (userRole !== 'student') {
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
                    This page is only available for students.
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
                My Courses
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                View and access all your enrolled courses
              </p>
            </div>
          </div>

          <div className="mt-8">
            {courses.length === 0 ? (
              <div className="text-center py-12">
                <AcademicCapIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-semibold text-gray-900">No courses enrolled</h3>
                <p className="mt-1 text-sm text-gray-500">
                  You haven't been enrolled in any courses yet. Contact your instructor to get enrolled.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {courses.map((course) => (
                  <div key={course.id} className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow duration-200">
                    <div className="p-6">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <AcademicCapIcon className="h-8 w-8 text-green-600" />
                        </div>
                        <div className="ml-4 w-0 flex-1">
                          <h3 className="text-lg font-medium text-gray-900 truncate">
                            {course.name}
                          </h3>
                          <div className="mt-1 flex items-center text-sm text-gray-500">
                            <UsersIcon className="h-4 w-4 mr-1" />
                            <span>Instructor: {course.instructorName}</span>
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
                      
                      <div className="mt-4 space-y-2">
                        <div className="flex items-center text-sm text-gray-500">
                          <ClipboardDocumentListIcon className="h-4 w-4 mr-2" />
                          <span>{course.assignmentCount || 0} assignments</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                          <CalendarDaysIcon className="h-4 w-4 mr-2" />
                          <span>Enrolled: {formatDate(course.enrollmentDate)}</span>
                        </div>
                      </div>
                      
                      <div className="mt-6">
                        <Link
                          href={`/courses/${course.id}`}
                          className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        >
                          <EyeIcon className="h-4 w-4 mr-2" />
                          View Course
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {courses.length > 0 && (
            <div className="mt-8 bg-green-50 rounded-lg p-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{courses.length}</div>
                  <div className="text-sm text-gray-600">Enrolled Courses</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {courses.reduce((total, course) => total + (course.assignmentCount || 0), 0)}
                  </div>
                  <div className="text-sm text-gray-600">Total Assignments</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {Math.round(courses.reduce((total, course) => total + (course.assignmentCount || 0), 0) / courses.length) || 0}
                  </div>
                  <div className="text-sm text-gray-600">Avg Assignments per Course</div>
                </div>
              </div>
            </div>
          )}
          
          <div className="mt-8 bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Link
                href="/my-assignments"
                className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              >
                <ClipboardDocumentListIcon className="h-8 w-8 text-purple-600 mr-3" />
                <div>
                  <h4 className="text-sm font-medium text-gray-900">My Assignments</h4>
                  <p className="text-sm text-gray-500">View all your assignments</p>
                </div>
              </Link>
              
              <Link
                href="/my-submissions"
                className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              >
                <svg className="h-8 w-8 text-blue-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <div>
                  <h4 className="text-sm font-medium text-gray-900">My Submissions</h4>
                  <p className="text-sm text-gray-500">Track your submissions</p>
                </div>
              </Link>
              
              <Link
                href="/peer-reviews"
                className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              >
                <svg className="h-8 w-8 text-orange-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Peer Reviews</h4>
                  <p className="text-sm text-gray-500">Complete peer reviews</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
} 