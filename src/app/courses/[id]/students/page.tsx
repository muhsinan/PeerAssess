'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '../../../../components/layout/Layout';
import Link from 'next/link';
import BulkStudentUpload from '@/components/BulkStudentUpload';
import { useEmailJS } from '@/hooks/useEmailJS';

export default function AddStudentsToCourse({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const courseId = React.use(params).id;
  const { sendInvitationEmail } = useEmailJS();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [courseName, setCourseName] = useState('Loading...');
  const [courseCode, setCourseCode] = useState('');
  const [students, setStudents] = useState<Array<{ id: number; name: string; email: string; isEnrolled: boolean }>>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [newStudentEmail, setNewStudentEmail] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if user is authorized (must be an instructor)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const role = localStorage.getItem('userRole');
      setUserRole(role);
      
      // If not an instructor, redirect to dashboard
      if (role !== 'instructor') {
        router.push('/dashboard');
      } else {
        // Load course data and enrolled students
        fetchCourseData();
        fetchEnrolledStudents();
      }
    }
  }, [router, courseId]);

  // Fetch the course details
  const fetchCourseData = async () => {
    try {
      const response = await fetch(`/api/courses/${courseId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch course data');
      }
      
      const data = await response.json();
      setCourseName(data.name);
      setCourseCode(`C${data.id}`);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching course:', error);
      setErrorMessage('Failed to load course data. Please try again.');
      setIsLoading(false);
    }
  };

  // Fetch enrolled students
  const fetchEnrolledStudents = async () => {
    try {
      // Only fetch students who are already enrolled in this course
      const response = await fetch(`/api/courses/${courseId}/enrollments`);
      if (!response.ok) {
        throw new Error('Failed to fetch enrolled students');
      }
      
      const data = await response.json();
      setStudents(data.enrollments || []);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching enrolled students:', error);
      setErrorMessage('Failed to load enrolled students data. Please try again.');
      setIsLoading(false);
    }
  };

  // Search for students by email or name
  const searchStudents = async () => {
    if (!searchQuery.trim()) return;
    
    try {
      setIsLoading(true);
      const response = await fetch(`/api/students?search=${encodeURIComponent(searchQuery)}&courseId=${courseId}`);
      
      if (!response.ok) {
        throw new Error('Failed to search for students');
      }
      
      const data = await response.json();
      
      // Merge the search results with already displayed students
      // Get list of IDs of students we're already showing
      const existingIds = new Set(students.map(s => s.id));
      
      // Add any students from search that aren't already displayed
      const newStudents = data.students.filter((s: { id: number; name: string; email: string; isEnrolled: boolean }) => !existingIds.has(s.id));
      
      setStudents([...students, ...newStudents]);
    } catch (error) {
      console.error('Error searching for students:', error);
      setErrorMessage('Failed to search for students. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Handle search form submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    searchStudents();
  };

  // Filter students based on search query for local filtering
  const filteredStudents = students.filter(student => 
    student.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    student.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Toggle student enrollment
  const toggleEnrollment = async (studentId: number) => {
    try {
      const student = students.find(s => s.id === studentId);
      if (!student) return;
      
      if (student.isEnrolled) {
        // Remove student from course
        const response = await fetch(`/api/courses/${courseId}/enrollments?studentId=${studentId}`, {
          method: 'DELETE'
        });
        
        if (!response.ok) {
          throw new Error('Failed to remove student from course');
        }
        
        // Update local state
        setStudents(students.map(s => 
          s.id === studentId ? { ...s, isEnrolled: false } : s
        ));
        
        setSuccessMessage(`${student.name} was removed from the course.`);
      } else {
        // Add student to course
        const response = await fetch(`/api/courses/${courseId}/enrollments`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email: student.email })
        });
        
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to add student to course');
        }
        
        // Update local state
        setStudents(students.map(s => 
          s.id === studentId ? { ...s, isEnrolled: true } : s
        ));
        
        setSuccessMessage(`${student.name} was added to the course.`);
      }
      
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error toggling enrollment:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to update enrollment. Please try again.');
      setTimeout(() => setErrorMessage(''), 3000);
    }
  };

  // Add new student by email
  const addStudentByEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');
    
    try {
      // Check if student is already in our local list first
      const existingStudent = students.find(
        s => s.email.toLowerCase() === newStudentEmail.toLowerCase()
      );
      
      if (existingStudent) {
        if (existingStudent.isEnrolled) {
          setErrorMessage('This student is already enrolled in this course.');
        } else {
          // Toggle enrollment for the existing student
          await toggleEnrollment(existingStudent.id);
        }
        setNewStudentEmail('');
        setIsSubmitting(false);
        return;
      }
      
      // Call API to add student by email
      const response = await fetch(`/api/courses/${courseId}/enrollments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: newStudentEmail })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to add student to course');
      } else {
        if (data.userExists && data.newEnrollment) {
          // Student exists and was added successfully
          const newStudent = data.student;
          
          // Check if this student is already in our local list
          const existingIndex = students.findIndex(s => s.id === newStudent.id);
          
          if (existingIndex >= 0) {
            // Update the existing student
            setStudents(students.map(s => 
              s.id === newStudent.id ? { ...s, isEnrolled: true } : s
            ));
          } else {
            // Add the new student to our list
            setStudents([...students, newStudent]);
          }
          
          setSuccessMessage(`${newStudent.name} has been added to the course.`);
        } else if (!data.userExists && data.invitationSent) {
          // Student doesn't exist - invitation was sent
          // Send the actual email via EmailJS
          if (data.emailData) {
            try {
              const emailSent = await sendInvitationEmail(data.emailData);
              if (emailSent) {
                setSuccessMessage(
                  `Invitation sent to ${data.email}! They will be automatically enrolled when they register using the invitation link.`
                );
              } else {
                setSuccessMessage(
                  `Invitation created for ${data.email}, but email delivery failed. They can still register using the invitation link.`
                );
              }
            } catch (emailError) {
              console.error('EmailJS sending failed:', emailError);
              setSuccessMessage(
                `Invitation created for ${data.email}, but email delivery failed. They can still register using the invitation link.`
              );
            }
          } else {
            setSuccessMessage(
              `Invitation sent to ${data.email}! They will be automatically enrolled when they register using the invitation link.`
            );
          }
        } else {
          setSuccessMessage(data.message || 'Student processed successfully');
        }
        
        setNewStudentEmail('');
      }
    } catch (error) {
      console.error('Error adding student:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to add student. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add a new function to refresh data after bulk upload
  const handleBulkUploadComplete = () => {
    // Refresh the enrolled students list after bulk upload
    fetchEnrolledStudents();
    
    // Clear any existing messages
    setErrorMessage('');
    setSuccessMessage('');
  };

  // If not authorized or still loading, show loading state
  if (userRole !== 'instructor' || isLoading) {
    return (
      <Layout>
        <div className="py-10 flex justify-center items-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
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
                  Manage Students
                </h1>
                <div className="mt-1 flex flex-col sm:flex-row sm:flex-wrap sm:mt-0 sm:space-x-6">
                  <div className="mt-2 flex items-center text-sm text-gray-500">
                    Course: {courseName} ({courseCode})
                  </div>
                </div>
              </div>
              <div className="mt-4 flex md:mt-0 md:ml-4">
                <Link 
                  href={`/courses/${courseId}`}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                >
                  Back to Course
                </Link>
              </div>
            </div>
          </div>
        </header>
        <main>
          <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
            {/* Success Message */}
            {successMessage && (
              <div className="rounded-md bg-green-50 p-4 mb-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-green-800">
                      {successMessage}
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Error Message */}
            {errorMessage && (
              <div className="rounded-md bg-red-50 p-4 mb-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-red-800">
                      {errorMessage}
                    </p>
                  </div>
                  <div className="ml-auto pl-3">
                    <div className="-mx-1.5 -my-1.5">
                      <button
                        type="button"
                        onClick={() => setErrorMessage('')}
                        className="inline-flex bg-red-50 rounded-md p-1.5 text-red-500 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        <span className="sr-only">Dismiss</span>
                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Add New Student Form */}
            <div className="bg-white shadow sm:rounded-lg mb-6">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  📝 Add Single Student
                </h3>
                <div className="mt-2 max-w-xl text-sm text-gray-500">
                  <p>
                    Add a student by email to join this course. If the student is already registered, they will be added immediately. If not, an invitation email will be sent for them to register and join automatically.
                  </p>
                </div>
                <form onSubmit={addStudentByEmail} className="mt-5 sm:flex sm:items-center">
                  <div className="w-full sm:max-w-xs">
                    <label htmlFor="email" className="sr-only">
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      id="email"
                      className="shadow-sm focus:ring-purple-500 focus:border-purple-500 block w-full sm:text-sm border-gray-300 rounded-md placeholder-gray-400 text-black"
                      placeholder="student@example.com"
                      value={newStudentEmail}
                      onChange={(e) => {
                        setNewStudentEmail(e.target.value);
                        setErrorMessage('');
                      }}
                      disabled={isSubmitting}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="mt-3 w-full inline-flex items-center justify-center px-4 py-2 border border-transparent shadow-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Processing...' : 'Add Student'}
                  </button>
                </form>
              </div>
            </div>

            {/* Bulk Student Upload Component */}
            <div className="mb-6">
              <BulkStudentUpload 
                courseId={courseId} 
                onComplete={handleBulkUploadComplete}
              />
            </div>
            
            {/* Student List */}
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
                <div className="-ml-4 -mt-4 flex justify-between items-center flex-wrap sm:flex-nowrap">
                  <div className="ml-4 mt-4">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Students
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Manage students in this course
                    </p>
                  </div>
                  <div className="ml-4 mt-4 flex-shrink-0 w-full sm:w-1/2 md:w-2/5 lg:w-1/3">
                    <form onSubmit={handleSearchSubmit} className="relative flex">
                      <input
                        type="text"
                        name="search"
                        id="search"
                        placeholder="Search students by name or email..."
                        className="shadow-sm focus:ring-purple-500 focus:border-purple-500 block w-full pr-10 sm:text-sm border-gray-300 rounded-md placeholder-gray-700"
                        value={searchQuery}
                        onChange={handleSearchChange}
                      />
                      <button
                        type="submit"
                        className="absolute inset-y-0 right-0 flex items-center px-3 py-1.5 bg-purple-600 text-white rounded-r-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                      >
                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </form>
                  </div>
                </div>
              </div>
              <ul className="divide-y divide-gray-200">
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((student) => (
                    <li key={student.id}>
                      <div className="px-4 py-4 flex items-center sm:px-6">
                        <div className="min-w-0 flex-1 sm:flex sm:items-center sm:justify-between">
                          <div>
                            <div className="flex text-sm">
                              <p className="font-medium text-purple-600 truncate">{student.name}</p>
                            </div>
                            <div className="mt-2 flex">
                              <div className="flex items-center text-sm text-gray-500">
                                <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                                </svg>
                                <span>{student.email}</span>
                              </div>
                            </div>
                          </div>
                          <div className="mt-4 flex-shrink-0 sm:mt-0">
                            <button
                              type="button"
                              onClick={() => toggleEnrollment(student.id)}
                              className={`inline-flex items-center px-3 py-1.5 border text-sm leading-5 font-medium rounded-md shadow-sm ${
                                student.isEnrolled
                                  ? 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                                  : 'border-transparent text-white bg-purple-600 hover:bg-purple-700'
                              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500`}
                            >
                              {student.isEnrolled ? 'Remove from Course' : 'Add to Course'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))
                ) : (
                  <li className="px-4 py-5 text-center text-sm text-gray-500">
                    No students match your search criteria.
                  </li>
                )}
              </ul>
            </div>
          </div>
        </main>
      </div>
    </Layout>
  );
} 