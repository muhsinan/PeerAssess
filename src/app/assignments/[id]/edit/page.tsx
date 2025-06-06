'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Layout from '../../../../components/layout/Layout';
import Link from 'next/link';

export default function EditAssignment() {
  const router = useRouter();
  const params = useParams();
  const assignmentId = params && Array.isArray(params.id) ? params.id[0] : params?.id;
  
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dueDate: '',
    courseId: '',
    aiPromptsEnabled: true,
    aiOverallPrompt: '',
    aiCriteriaPrompt: ''
  });
  
  // Check if user is authorized and fetch assignment data
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const role = localStorage.getItem('userRole');
      setUserRole(role);
      
      // Only instructors can edit assignments
      if (role !== 'instructor') {
        router.push('/dashboard');
      } else {
        fetchAssignmentDetails();
      }
    }
  }, [assignmentId, router]);
  
  // Fetch assignment details
  const fetchAssignmentDetails = async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch(`/api/assignments/${assignmentId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch assignment details');
      }
      
      const data = await response.json();
      const assignment = data;
      
      if (!assignment || !assignment.dueDate) {
        throw new Error('Invalid assignment data returned from server');
      }
      
      // Format date for the input field (YYYY-MM-DD)
      let formattedDate;
      try {
        const dueDate = new Date(assignment.dueDate);
        formattedDate = dueDate.toISOString().split('T')[0];
      } catch (err) {
        console.error('Error parsing date:', err);
        throw new Error('Invalid date format received from server');
      }
      
      setFormData({
        title: assignment.title || '',
        description: assignment.description || '',
        dueDate: formattedDate,
        courseId: (assignment.courseId || '').toString(),
        aiPromptsEnabled: assignment.aiPromptsEnabled || true,
        aiOverallPrompt: assignment.aiOverallPrompt || '',
        aiCriteriaPrompt: assignment.aiCriteriaPrompt || ''
      });
    } catch (error) {
      console.error('Error fetching assignment details:', error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      // Validate inputs
      if (!formData.title.trim()) {
        throw new Error('Assignment title is required');
      }
      
      if (!formData.dueDate) {
        throw new Error('Due date is required');
      }
      
      // Call API to update assignment
      const response = await fetch(`/api/assignments/${assignmentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          dueDate: formData.dueDate,
          aiPromptsEnabled: formData.aiPromptsEnabled,
          aiOverallPrompt: formData.aiOverallPrompt,
          aiCriteriaPrompt: formData.aiCriteriaPrompt
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update assignment');
      }
      
      const data = await response.json();
      setSuccessMessage('Assignment updated successfully');
      
      // Reset form with updated values
      setFormData(prev => ({
        ...prev,
        title: data.assignment.title,
        description: data.assignment.description || '',
        dueDate: new Date(data.assignment.dueDate).toISOString().split('T')[0],
        aiPromptsEnabled: data.assignment.aiPromptsEnabled || true,
        aiOverallPrompt: data.assignment.aiOverallPrompt || '',
        aiCriteriaPrompt: data.assignment.aiCriteriaPrompt || ''
      }));
      
      // After 2 seconds, redirect back to the submissions page
      setTimeout(() => {
        router.push(`/assignments/${assignmentId}/submissions`);
      }, 2000);
      
    } catch (error) {
      console.error('Error updating assignment:', error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsSaving(false);
    }
  };
  
  // Handle deletion
  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this assignment? This action cannot be undone.')) {
      return;
    }
    
    setIsSaving(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/assignments/${assignmentId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete assignment');
      }
      
      // Redirect to dashboard after successful deletion
      router.push('/dashboard');
      
    } catch (error) {
      console.error('Error deleting assignment:', error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
      setIsSaving(false);
    }
  };
  
  // Loading state
  if (isLoading) {
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
                  Edit Assignment
                </h1>
              </div>
              <div className="mt-4 flex md:mt-0 md:ml-4">
                <Link
                  href={`/assignments/${assignmentId}/submissions`}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                >
                  Cancel
                </Link>
              </div>
            </div>
          </div>
        </header>

        <main>
          <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <div className="px-4 py-6 sm:px-0">
              {error && (
                <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4">
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
              )}
              
              {successMessage && (
                <div className="mb-4 bg-green-50 border-l-4 border-green-400 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-green-700">{successMessage}</p>
                    </div>
                  </div>
                </div>
              )}
              
              <form onSubmit={handleSubmit} className="space-y-8 divide-y divide-gray-200">
                <div className="space-y-8 divide-y divide-gray-200">
                  <div>
                    <div>
                      <h3 className="text-lg leading-6 font-medium text-gray-900">Assignment Information</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Edit the details of your assignment.
                      </p>
                    </div>

                    <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                      <div className="sm:col-span-6">
                        <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                          Title *
                        </label>
                        <div className="mt-1">
                          <input
                            type="text"
                            name="title"
                            id="title"
                            value={formData.title}
                            onChange={handleChange}
                            className="shadow-sm focus:ring-purple-500 focus:border-purple-500 block w-full sm:text-sm border-gray-300 rounded-md"
                            required
                          />
                        </div>
                      </div>

                      <div className="sm:col-span-6">
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                          Description
                        </label>
                        <div className="mt-1">
                          <textarea
                            id="description"
                            name="description"
                            rows={4}
                            value={formData.description}
                            onChange={handleChange}
                            className="shadow-sm focus:ring-purple-500 focus:border-purple-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          />
                        </div>
                        <p className="mt-2 text-sm text-gray-500">Write a few sentences about the assignment.</p>
                      </div>

                      <div className="sm:col-span-3">
                        <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">
                          Due Date *
                        </label>
                        <div className="mt-1">
                          <input
                            type="date"
                            name="dueDate"
                            id="dueDate"
                            value={formData.dueDate}
                            onChange={handleChange}
                            className="shadow-sm focus:ring-purple-500 focus:border-purple-500 block w-full sm:text-sm border-gray-300 rounded-md"
                            min={new Date().toISOString().split('T')[0]}
                            required
                          />
                        </div>
                      </div>

                      {/* AI Configuration Section */}
                      <div className="sm:col-span-6">
                        <div className="border-t border-gray-200 pt-6">
                          <h3 className="text-lg font-medium text-gray-900 flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 mr-2 text-purple-600">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                            </svg>
                            AI Review Analysis Configuration
                          </h3>
                          <p className="mt-1 text-sm text-gray-500">
                            Configure AI prompts for peer review analysis. Students will receive AI-powered suggestions to improve their reviews.
                          </p>
                          
                          {/* Enable AI Prompts Toggle */}
                          <div className="mt-4">
                            <div className="flex items-center">
                              <input
                                id="aiPromptsEnabled"
                                name="aiPromptsEnabled"
                                type="checkbox"
                                checked={formData.aiPromptsEnabled}
                                onChange={handleChange}
                                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                              />
                              <label htmlFor="aiPromptsEnabled" className="ml-2 block text-sm text-gray-900">
                                Enable AI-powered review analysis for this assignment
                              </label>
                            </div>
                          </div>

                          {/* AI Prompt Configuration (only show if enabled) */}
                          {formData.aiPromptsEnabled && (
                            <div className="mt-6 space-y-6">
                              {/* Overall Feedback Prompt */}
                              <div>
                                <label htmlFor="aiOverallPrompt" className="block text-sm font-medium text-gray-700">
                                  Overall Feedback Analysis Prompt
                                </label>
                                <p className="mt-1 text-xs text-gray-500">
                                  Configure the instructions for AI analysis of overall feedback. System context (assignment details, scores) is added automatically.
                                </p>
                                <div className="mt-2">
                                  <textarea
                                    id="aiOverallPrompt"
                                    name="aiOverallPrompt"
                                    rows={8}
                                    value={formData.aiOverallPrompt}
                                    onChange={handleChange}
                                    className="shadow-sm focus:ring-purple-500 focus:border-purple-500 block w-full sm:text-sm border-gray-300 rounded-md font-mono text-xs"
                                  />
                                </div>
                              </div>

                              {/* Criteria Feedback Prompt */}
                              <div>
                                <label htmlFor="aiCriteriaPrompt" className="block text-sm font-medium text-gray-700">
                                  Criteria-Specific Feedback Analysis Prompt
                                </label>
                                <p className="mt-1 text-xs text-gray-500">
                                  Configure the instructions for AI analysis of individual criteria feedback. System context (criterion details, scores) is added automatically.
                                </p>
                                <div className="mt-2">
                                  <textarea
                                    id="aiCriteriaPrompt"
                                    name="aiCriteriaPrompt"
                                    rows={12}
                                    value={formData.aiCriteriaPrompt}
                                    onChange={handleChange}
                                    className="shadow-sm focus:ring-purple-500 focus:border-purple-500 block w-full sm:text-sm border-gray-300 rounded-md font-mono text-xs"
                                  />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-5">
                  <div className="flex justify-between">
                    <button
                      type="button"
                      onClick={handleDelete}
                      className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      disabled={isSaving}
                    >
                      Delete Assignment
                    </button>
                    <div className="flex justify-end">
                      <Link
                        href={`/assignments/${assignmentId}/submissions`}
                        className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                      >
                        Cancel
                      </Link>
                      <button
                        type="submit"
                        className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                        disabled={isSaving}
                      >
                        {isSaving ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Saving...
                          </>
                        ) : (
                          'Save'
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </main>
      </div>
    </Layout>
  );
} 