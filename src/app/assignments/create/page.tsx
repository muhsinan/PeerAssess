'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '../../../components/layout/Layout';
import Link from 'next/link';

export default function CreateAssignment() {
  const router = useRouter();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    courseId: '',
    dueDate: '',
    rubricId: '',
    aiPromptsEnabled: true,
    aiOverallPrompt: `Please provide constructive suggestions to improve the overall feedback. Focus on making the feedback more helpful, specific, and balanced. Keep your response concise and actionable.`,
    aiCriteriaPrompt: `Your tasks:

1. Suggest 1 specific improvement to the feedback for this criterion to the reviewer. The suggestion should be concise and actionable.
2. After the suggestion, provide a single revised version of the feedback as if written by the reviewer, incorporating the improvement. Write it in the reviewer's voice.

Format your response as:
1. [suggestion]. Revised Feedback Example: "[your rewritten reviewer feedback here]"`,
    aiInstructorEnabled: true,
    aiInstructorPrompt: '',
    feedbackChatType: 'ai'
  });
  
  const [availableCourses, setAvailableCourses] = useState<Array<{
    id: number;
    name: string;
  }>>([]);
  const [isLoadingCourses, setIsLoadingCourses] = useState(false);
  
  const [availableRubrics, setAvailableRubrics] = useState<Array<{
    id: number;
    name: string;
    description: string;
    criteria_count: number;
  }>>([]);
  const [isLoadingRubrics, setIsLoadingRubrics] = useState(false);

  // Check if user is authorized (must be an instructor)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const role = localStorage.getItem('userRole');
      const userId = localStorage.getItem('userId');
      
      setUserRole(role);
      
      // If not an instructor, redirect to dashboard
      if (role !== 'instructor') {
        router.push('/dashboard');
      } else if (userId) {
        // Fetch available courses for this instructor
        fetchInstructorCourses(userId);
        // Fetch available rubrics
        fetchAvailableRubrics();
      }
    }
  }, [router]);

  // Fetch courses that this instructor teaches
  const fetchInstructorCourses = async (instructorId: string) => {
    try {
      setIsLoadingCourses(true);
      console.log('Fetching courses for instructor:', instructorId);
      const response = await fetch(`/api/dashboard/instructor/courses?instructorId=${instructorId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch courses');
      }
      
      const data = await response.json();
      console.log('Courses data received:', data);
      console.log('Available courses:', data.courses);
      setAvailableCourses(data.courses || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
      setError('Failed to load courses. Please refresh the page.');
    } finally {
      setIsLoadingCourses(false);
    }
  };

  // Fetch all available rubrics
  const fetchAvailableRubrics = async () => {
    try {
      setIsLoadingRubrics(true);
      const response = await fetch('/api/rubrics');
      
      if (!response.ok) {
        throw new Error('Failed to fetch rubrics');
      }
      
      const data = await response.json();
      console.log('Rubrics data received:', data);
      setAvailableRubrics(data.rubrics || []);
    } catch (error) {
      console.error('Error fetching rubrics:', error);
      // Don't show error for rubrics as it's optional
    } finally {
      setIsLoadingRubrics(false);
    }
  };

  // Handle input changes for the form
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form inputs
    if (!formData.title.trim()) {
      setError('Assignment title is required');
      return;
    }
    
    if (!formData.courseId) {
      setError('Please select a course for this assignment');
      return;
    }
    
    if (!formData.dueDate) {
      setError('Due date is required');
      return;
    }
    
    // All validation passed, submit the form
    try {
      setIsLoading(true);
      setError(null);
      
      // Create the assignment
      const response = await fetch('/api/assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          courseId: parseInt(formData.courseId),
          dueDate: formData.dueDate,
          aiPromptsEnabled: formData.aiPromptsEnabled,
          aiOverallPrompt: formData.aiOverallPrompt,
          aiCriteriaPrompt: formData.aiCriteriaPrompt,
          aiInstructorEnabled: formData.aiInstructorEnabled,
          aiInstructorPrompt: formData.aiInstructorPrompt,
          feedbackChatType: formData.feedbackChatType,
          rubricId: formData.rubricId ? parseInt(formData.rubricId) : null
        })
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create assignment');
      }
      
      // Success! Show message briefly then redirect
      setSuccessMessage('Assignment created successfully');
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
      
    } catch (error) {
      console.error('Error creating assignment:', error);
      setError(error instanceof Error ? error.message : 'Failed to create assignment. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // If not authorized, show loading state
  if (userRole !== 'instructor') {
    return (
      <Layout>
        <div className="py-10 flex justify-center items-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      </Layout>
    );
  }

  // Calculate min date for due date (today)
  const today = new Date();
  const minDate = today.toISOString().split('T')[0];

  return (
    <Layout>
      <div className="py-10">
        <header>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="md:flex md:items-center md:justify-between">
              <div className="flex-1 min-w-0">
                <h1 className="text-3xl font-bold leading-tight text-black">
                  Create New Assignment
                </h1>
              </div>
              <div className="mt-4 flex md:mt-0 md:ml-4">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                >
                  Cancel
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
            {error && (
              <div className="rounded-md bg-red-50 p-4 mb-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
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

            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <form onSubmit={handleSubmit}>
                <div className="px-4 py-5 sm:p-6">
                  <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                    {/* Assignment Title */}
                    <div className="sm:col-span-4">
                      <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                        Assignment Title *
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          name="title"
                          id="title"
                          value={formData.title}
                          onChange={handleInputChange}
                          className="shadow-sm focus:ring-purple-500 focus:border-purple-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          placeholder="e.g., Research Paper on Climate Change"
                          required
                        />
                      </div>
                    </div>

                    {/* Course Selection */}
                    <div className="sm:col-span-4">
                      <label htmlFor="courseId" className="block text-sm font-medium text-gray-700">
                        Course * {isLoadingCourses && <span className="text-sm text-gray-500">(Loading...)</span>}
                      </label>
                      <div className="mt-1">
                        <select
                          id="courseId"
                          name="courseId"
                          value={formData.courseId}
                          onChange={handleInputChange}
                          className="shadow-sm focus:ring-purple-500 focus:border-purple-500 block w-full sm:text-sm border-gray-300 rounded-md bg-white text-gray-900"
                          style={{
                            backgroundColor: 'white',
                            color: '#111827'
                          }}
                          disabled={isLoadingCourses}
                          required
                        >
                          <option value="" style={{ backgroundColor: 'white', color: '#111827' }}>
                            {isLoadingCourses ? 'Loading courses...' : 'Select a course'}
                          </option>
                          {availableCourses.map(course => (
                            <option 
                              key={course.id} 
                              value={course.id}
                              style={{ backgroundColor: 'white', color: '#111827' }}
                            >
                              {course.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      {!isLoadingCourses && availableCourses.length === 0 && (
                        <p className="mt-2 text-sm text-red-500">
                          You don't have any courses yet. Please create a course first.
                        </p>
                      )}
                      {!isLoadingCourses && availableCourses.length > 0 && (
                        <p className="mt-2 text-sm text-green-600">
                          Found {availableCourses.length} course(s) available.
                        </p>
                      )}
                    </div>

                    {/* Due Date */}
                    <div className="sm:col-span-4">
                      <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">
                        Due Date *
                      </label>
                      <div className="mt-1">
                        <input
                          type="date"
                          name="dueDate"
                          id="dueDate"
                          value={formData.dueDate}
                          min={minDate}
                          onChange={handleInputChange}
                          className="shadow-sm focus:ring-purple-500 focus:border-purple-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          required
                        />
                      </div>
                    </div>

                    {/* Rubric Selection */}
                    <div className="sm:col-span-4">
                      <label htmlFor="rubricId" className="block text-sm font-medium text-gray-700">
                        Assessment Rubric (Optional) {isLoadingRubrics && <span className="text-sm text-gray-500">(Loading...)</span>}
                      </label>
                      <div className="mt-1">
                        <select
                          id="rubricId"
                          name="rubricId"
                          value={formData.rubricId}
                          onChange={handleInputChange}
                          className="shadow-sm focus:ring-purple-500 focus:border-purple-500 block w-full sm:text-sm border-gray-300 rounded-md bg-white text-gray-900"
                          style={{
                            backgroundColor: 'white',
                            color: '#111827'
                          }}
                          disabled={isLoadingRubrics}
                        >
                          <option value="" style={{ backgroundColor: 'white', color: '#111827' }}>
                            {isLoadingRubrics ? 'Loading rubrics...' : 'Select a rubric (optional)'}
                          </option>
                          {availableRubrics.map(rubric => (
                            <option 
                              key={rubric.id} 
                              value={rubric.id}
                              style={{ backgroundColor: 'white', color: '#111827' }}
                            >
                              {rubric.name} ({rubric.criteria_count} criteria)
                            </option>
                          ))}
                        </select>
                      </div>
                      {!isLoadingRubrics && availableRubrics.length === 0 && (
                        <p className="mt-2 text-sm text-yellow-600">
                          No rubrics available. You can create one later or <Link href="/rubrics/create" className="text-purple-600 hover:text-purple-500 underline">create a rubric now</Link>.
                        </p>
                      )}
                      {!isLoadingRubrics && availableRubrics.length > 0 && (
                        <p className="mt-2 text-sm text-gray-500">
                          Choose a rubric to define assessment criteria for this assignment. You can also create or assign a rubric later.
                        </p>
                      )}
                    </div>

                    {/* Description */}
                    <div className="sm:col-span-6">
                      <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                        Description
                      </label>
                      <div className="mt-1">
                        <textarea
                          id="description"
                          name="description"
                          rows={5}
                          value={formData.description}
                          onChange={handleInputChange}
                          className="shadow-sm focus:ring-purple-500 focus:border-purple-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          placeholder="Describe the assignment requirements, objectives, and any special instructions..."
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
                              onChange={handleInputChange}
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
                                  onChange={handleInputChange}
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
                                  onChange={handleInputChange}
                                  className="shadow-sm focus:ring-purple-500 focus:border-purple-500 block w-full sm:text-sm border-gray-300 rounded-md font-mono text-xs"
                                />
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {/* Instructor AI Generation Configuration */}
                        <div className="mt-8 border-t border-gray-200 pt-6">
                          <h4 className="text-md font-medium text-gray-900 flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2 text-blue-600">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                            </svg>
                            Instructor AI Review Generation
                          </h4>
                          <p className="mt-1 text-sm text-gray-500">
                            Allow instructors to generate AI peer reviews for submissions. Reviews will appear anonymous to students.
                          </p>
                          
                          {/* Enable Instructor AI Toggle */}
                          <div className="mt-4">
                            <div className="flex items-center">
                              <input
                                id="aiInstructorEnabled"
                                name="aiInstructorEnabled"
                                type="checkbox"
                                checked={formData.aiInstructorEnabled}
                                onChange={handleInputChange}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                              <label htmlFor="aiInstructorEnabled" className="ml-2 block text-sm text-gray-900">
                                Enable AI peer review generation for instructors
                              </label>
                            </div>
                          </div>

                          {/* Instructor AI Prompt Configuration */}
                          {formData.aiInstructorEnabled && (
                            <div className="mt-6">
                              <label htmlFor="aiInstructorPrompt" className="block text-sm font-medium text-gray-700">
                                Custom AI Peer Review Prompt (Optional)
                              </label>
                              <p className="mt-1 text-xs text-gray-500">
                                Customize how the AI generates peer reviews. Leave empty to use the default peer-style prompt. Assignment details, submission content, and rubric criteria are added automatically.
                              </p>
                              <div className="mt-2">
                                <textarea
                                  id="aiInstructorPrompt"
                                  name="aiInstructorPrompt"
                                  rows={8}
                                  value={formData.aiInstructorPrompt}
                                  onChange={handleInputChange}
                                  placeholder="Leave empty for default peer-style reviews, or enter custom instructions..."
                                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md font-mono text-xs"
                                />
                              </div>
                              <div className="mt-2">
                                <p className="text-xs text-gray-400">
                                  Example: "Focus on encouraging creative aspects and provide specific suggestions for improvement using casual, supportive language."
                                </p>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Feedback Chat Configuration */}
                        <div className="mt-8 border-t border-gray-200 pt-6">
                          <h4 className="text-md font-medium text-gray-900 flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2 text-green-600">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                            </svg>
                            Feedback Chat Settings
                          </h4>
                          <p className="mt-1 text-sm text-gray-500">
                            Configure how students can discuss peer review feedback. AI chat is recommended for consistent, helpful responses.
                          </p>
                          
                          {/* Chat Type Selection */}
                          <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700">
                              Feedback Chat Type
                            </label>
                            <div className="mt-2 space-y-3">
                              <div className="flex items-center">
                                <input
                                  id="chatTypeAI"
                                  name="feedbackChatType"
                                  type="radio"
                                  value="ai"
                                  checked={formData.feedbackChatType === 'ai'}
                                  onChange={handleInputChange}
                                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                                />
                                <label htmlFor="chatTypeAI" className="ml-2 block text-sm text-gray-900">
                                  <span className="font-medium text-green-700">AI Chat (Recommended)</span>
                                  <p className="text-xs text-gray-500 mt-1">
                                    Students chat with AI for consistent, always-available feedback discussions. AI responds as a helpful peer reviewer.
                                  </p>
                                </label>
                              </div>
                              <div className="flex items-center">
                                <input
                                  id="chatTypePeer"
                                  name="feedbackChatType"
                                  type="radio"
                                  value="peer"
                                  checked={formData.feedbackChatType === 'peer'}
                                  onChange={handleInputChange}
                                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300"
                                />
                                <label htmlFor="chatTypePeer" className="ml-2 block text-sm text-gray-900">
                                  <span className="font-medium text-purple-700">Peer-to-Peer Chat</span>
                                  <p className="text-xs text-gray-500 mt-1">
                                    Students chat directly with their anonymous peer reviewers. Requires both parties to be online.
                                  </p>
                                </label>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 pt-5 border-t border-gray-200 flex justify-end">
                    <Link
                      href="/dashboard"
                      className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                    >
                      Cancel
                    </Link>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
                    >
                      {isLoading ? 'Creating...' : 'Create Assignment'}
                    </button>
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