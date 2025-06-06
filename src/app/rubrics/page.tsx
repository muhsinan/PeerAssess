'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '../../components/layout/Layout';
import Link from 'next/link';

export default function RubricsPage() {
  const router = useRouter();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [rubrics, setRubrics] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Check if user is authorized (must be an instructor)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const role = localStorage.getItem('userRole');
      const userId = localStorage.getItem('userId');
      
      setUserRole(role);
      
      // If not an instructor, redirect to dashboard
      if (role !== 'instructor') {
        router.push('/dashboard');
        return;
      }
      
      // Load rubrics data
      fetchRubrics(userId);
    }
  }, [router]);

  // Fetch rubrics from API
  const fetchRubrics = async (userId: string | null) => {
    if (!userId) return;
    
    try {
      setIsLoading(true);
      
      const response = await fetch(`/api/rubrics?instructorId=${userId}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Failed to fetch rubrics: ${errorData.details || response.statusText}`);
      }
      
      const data = await response.json();
      setRubrics(data.rubrics || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching rubrics:', err);
      setError('Failed to load rubrics data. Please try again.');
    } finally {
      setIsLoading(false);
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

  if (userRole !== 'instructor') {
    return (
      <Layout>
        <div className="py-10 flex justify-center items-center h-96">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative max-w-2xl" role="alert">
            <strong className="font-bold">Access Denied: </strong>
            <span className="block sm:inline">This page is only accessible to instructors.</span>
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
                  Assessment Rubrics
                </h1>
              </div>
              <div className="mt-4 flex md:mt-0 md:ml-4">
                <Link
                  href="/rubrics/create"
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                >
                  Create New Rubric
                </Link>
              </div>
            </div>
          </div>
        </header>
        <main>
          <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
            <div className="px-4 py-8 sm:px-0">
              {error && (
                <div className="rounded-md bg-red-50 p-4 mb-6">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-4.707-10.293a1 1 0 00-1.414 1.414l4 4a1 1 0 001.414 0l4-4a1 1 0 00-1.414-1.414L10 9.586 6.707 6.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-red-800">
                        {error}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {rubrics.length > 0 ? (
                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                  <ul className="divide-y divide-gray-200">
                    {rubrics.map((rubric) => (
                      <li key={rubric.id}>
                        <div className="px-4 py-5 sm:px-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="text-lg leading-6 font-medium text-gray-900">
                                {rubric.name}
                              </h3>
                              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                                {rubric.criteria_count} criteria
                              </p>
                              {rubric.assignments && rubric.assignments.length > 0 ? (
                                <div className="mt-1">
                                  <p className="text-sm text-gray-500">
                                    Assignments: {' '}
                                    <span className="font-medium">
                                      {rubric.assignments.map((assignment: any) => assignment.title).join(', ')}
                                    </span>
                                  </p>
                                  <p className="text-sm text-gray-500">
                                    Courses: {' '}
                                    <span className="font-medium">
                                      {[...new Set(rubric.assignments.map((assignment: any) => assignment.courseName))].join(', ')}
                                    </span>
                                  </p>
                                </div>
                              ) : (
                                <p className="mt-1 text-sm text-gray-500">
                                  <span className="text-gray-400 italic">Not assigned to any assignments</span>
                                </p>
                              )}
                              <p className="mt-1 text-sm text-gray-500">
                                Last updated: {rubric.updated_at ? new Date(rubric.updated_at).toLocaleDateString() : 'Unknown'}
                              </p>
                            </div>
                            <div className="flex space-x-3">
                              <Link
                                href={`/rubrics/${rubric.id}/edit`}
                                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                              >
                                Edit Rubric
                              </Link>
                              {rubric.assignments && rubric.assignments.length > 0 && (
                                <Link
                                  href={`/assignments/${rubric.assignments[0].id}/submissions`}
                                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                                >
                                  View Assignment
                                </Link>
                              )}
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="text-center py-12 bg-white shadow overflow-hidden sm:rounded-md">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No rubrics found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Start by creating a new assessment rubric.
                  </p>
                  <div className="mt-6">
                    <Link
                      href="/rubrics/create"
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                    >
                      Create New Rubric
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </Layout>
  );
} 