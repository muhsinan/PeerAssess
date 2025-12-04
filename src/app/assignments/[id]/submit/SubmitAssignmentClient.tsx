'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/layout/Layout';
import Link from 'next/link';
import dynamic from 'next/dynamic';

// Dynamically import TinyMCE Editor with SSR disabled
const Editor = dynamic(
  () => import('@tinymce/tinymce-react').then((mod) => mod.Editor),
  { 
    ssr: false,
    loading: () => (
      <div className="border border-gray-300 rounded-md p-4 h-[400px] flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Loading editor...</p>
        </div>
      </div>
    )
  }
);

export default function SubmitAssignmentClient({ assignmentId }: { assignmentId: string }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assignment, setAssignment] = useState<any>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [hasExistingSubmission, setHasExistingSubmission] = useState(false);
  const editorRef = useRef<any>(null);
  
  // Form data
  const [content, setContent] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const id = localStorage.getItem('userId');
      setUserId(id);
    }

    const fetchAssignmentAndSubmission = async () => {
      if (!assignmentId) return;
      
      try {
        setIsLoading(true);
        
        // Fetch assignment details
        const response = await fetch(`/api/assignments/${assignmentId}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch assignment details');
        }
        
        const data = await response.json();
        setAssignment(data);
        
        // Check if there's already a submission for this assignment
        if (userId) {
          const submissionResponse = await fetch(`/api/assignments/${assignmentId}/submissions?studentId=${userId}`);
          
          if (submissionResponse.ok) {
            const submissionData = await submissionResponse.json();
            
            if (submissionData.submissions && submissionData.submissions.length > 0) {
              setHasExistingSubmission(true);
              
              // Redirect to the assignment details page since they've already submitted
              router.push(`/assignments/${assignmentId}`);
              return; // Exit the function early
            }
          }
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading assignment details:', error);
        setError(error instanceof Error ? error.message : 'An unexpected error occurred');
        setIsLoading(false);
      }
    };

    if (assignmentId && userId) {
      fetchAssignmentAndSubmission();
    }
  }, [assignmentId, userId, router]);

  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'N/A';
    }
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setFiles(prevFiles => [...prevFiles, ...selectedFiles]);
    }
  };

  // Remove file from the list
  const removeFile = (index: number) => {
    setFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userId) {
      setSubmitError('You must be logged in to submit an assignment');
      return;
    }
    
    // Get content from TinyMCE editor
    const editorContent = editorRef.current ? editorRef.current.getContent() : '';
    
    if (!editorContent.trim()) {
      setSubmitError('Please provide content for your submission');
      return;
    }
    
    try {
      setIsSubmitting(true);
      setSubmitError(null);
      
      // Step 1: Create the submission
      const submissionResponse = await fetch(`/api/assignments/${assignmentId}/submissions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: '',
          content: editorContent.trim(),
          studentId: userId,
          status: 'submitted'
        }),
      });
      
      if (!submissionResponse.ok) {
        const errorData = await submissionResponse.json();
        throw new Error(errorData.error || 'Failed to submit assignment');
      }
      
      const submissionResult = await submissionResponse.json();
      const submissionId = submissionResult.submission.id;
      
      // Step 2: Upload attachments if any
      if (files.length > 0) {
        const uploadPromises = files.map(async (file, index) => {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('submissionId', submissionId);
          formData.append('studentId', userId);
          
          console.log(`[Client] Uploading file: ${file.name} (${file.size} bytes)`);
          
          const uploadResponse = await fetch(`/api/submissions/${submissionId}/attachments`, {
            method: 'POST',
            body: formData,
          });
          
          console.log(`[Client] Upload response status: ${uploadResponse.status}`);
          
          if (!uploadResponse.ok) {
            // Try to parse JSON error, but handle HTML responses
            let errorMessage = `Failed to upload attachment: ${file.name}`;
            
            // Clone the response so we can try reading it in different formats
            const responseClone = uploadResponse.clone();
            
            try {
              const errorData = await uploadResponse.json();
              errorMessage = errorData.error || errorMessage;
              if (errorData.details) {
                console.error('[Client] Upload error details:', errorData.details);
                errorMessage += ` (${errorData.details})`;
              }
            } catch (parseError) {
              // If we can't parse as JSON, try reading as text from the cloned response
              try {
                const errorText = await responseClone.text();
                console.error('[Client] Non-JSON error response:', errorText.substring(0, 200));
                
                // Check for specific nginx errors
                if (uploadResponse.status === 413 || errorText.includes('413') || errorText.includes('too large')) {
                  errorMessage = `File "${file.name}" is too large. The server's upload limit needs to be increased. Please contact your administrator.`;
                } else {
                  errorMessage += ' (Server returned an error - check server logs)';
                }
              } catch (textError) {
                console.error('[Client] Could not read error response:', textError);
                if (uploadResponse.status === 413) {
                  errorMessage = `File "${file.name}" is too large. Maximum upload size exceeded.`;
                }
              }
            }
            throw new Error(errorMessage);
          }
          
          // Update progress
          setUploadProgress(Math.round(((index + 1) / files.length) * 100));
          
          return uploadResponse.json();
        });
        
        await Promise.all(uploadPromises);
      }
      
      setSubmitSuccess(true);
      
      // Redirect to assignment details after successful submission
      router.push(`/assignments/${assignmentId}`);
    } catch (error) {
      console.error('Error submitting assignment:', error);
      setSubmitError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <Layout>
        <div className="py-10 flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      </Layout>
    );
  }

  // Show error state
  if (error || !assignment) {
    return (
      <Layout>
        <div className="py-10">
          <div className="max-w-3xl mx-auto sm:px-6 lg:px-8">
            <div className="bg-red-50 border-l-4 border-red-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error || 'Assignment not found'}</p>
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
          </div>
        </div>
      </Layout>
    );
  }

  // Show already submitted state
  if (hasExistingSubmission) {
    return (
      <Layout>
        <div className="py-10">
          <div className="max-w-3xl mx-auto sm:px-6 lg:px-8">
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    You have already submitted this assignment.
                  </p>
                  <div className="mt-4">
                    <Link
                      href={`/assignments/${assignmentId}`}
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                    >
                      View Assignment
                    </Link>
                  </div>
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
        <div className="max-w-4xl mx-auto sm:px-6 lg:px-8">
          {/* Header */}
          <div className="md:flex md:items-center md:justify-between md:space-x-5 mb-6">
            <div className="flex items-start space-x-5">
              <div className="pt-1.5">
                <h1 className="text-2xl font-bold text-gray-900">Submit Assignment: {assignment.title}</h1>
                <p className="text-sm font-medium text-gray-500">
                  Due: {formatDate(assignment.dueDate)}
                </p>
              </div>
            </div>
            <div className="mt-6 flex flex-col-reverse justify-stretch space-y-4 space-y-reverse sm:flex-row-reverse sm:justify-end sm:space-x-3 sm:space-y-0 sm:space-x-reverse">
              <Link
                href={`/assignments/${assignmentId}`}
                className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                Back to Assignment
              </Link>
            </div>
          </div>

          {/* Assignment details */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
            <div className="px-4 py-5 sm:px-6 bg-purple-50">
              <h3 className="text-lg leading-6 font-medium text-purple-900">
                Assignment Details
              </h3>
            </div>
            <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
              <div className="prose prose-sm text-gray-700 max-w-none" 
                   dangerouslySetInnerHTML={{ __html: assignment.description || 'No description provided for this assignment.' }}>
              </div>
            </div>
          </div>

          {/* Success message */}
          {submitSuccess && (
            <div className="rounded-md bg-green-50 p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-800">
                    Your assignment has been successfully submitted! Redirecting...
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Submit form */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 bg-purple-50">
              <h3 className="text-lg leading-6 font-medium text-purple-900">
                Submit Your Work
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-purple-600">
                Please provide content and any attachments for your submission.
              </p>
            </div>
            
            <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
              {submitError && (
                <div className="rounded-md bg-red-50 p-4 mb-6">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">
                        Error submitting assignment
                      </h3>
                      <div className="mt-2 text-sm text-red-700">
                        <p>{submitError}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <form onSubmit={handleSubmit}>
                <div className="space-y-6">
                  <div>
                    <label htmlFor="content" className="block text-sm font-medium text-gray-700">
                      Submission Content *
                    </label>
                    <div className="mt-1">
                      <Editor
                        apiKey="5vzbklf4x3hbeb8mcumkruowbljz3slj1ynpvt2wcn2l6z2m" // You'll need to get an API key from TinyMCE
                        onInit={(evt, editor) => editorRef.current = editor}
                        initialValue=""
                        init={{
                          height: 400,
                          menubar: true,
                          plugins: [
                            'advlist autolink lists link image charmap print preview anchor',
                            'searchreplace visualblocks code fullscreen',
                            'insertdatetime media table paste code help wordcount'
                          ],
                          toolbar: 'undo redo | formatselect | ' +
                            'bold italic backcolor | alignleft aligncenter ' +
                            'alignright alignjustify | bullist numlist outdent indent | ' +
                            'removeformat | help',
                          content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }'
                        }}
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      Provide a detailed response to the assignment prompt. You can format text, add images, and more.
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Attachments
                    </label>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                      <div className="space-y-1 text-center">
                        <svg
                          className="mx-auto h-12 w-12 text-gray-400"
                          stroke="currentColor"
                          fill="none"
                          viewBox="0 0 48 48"
                          aria-hidden="true"
                        >
                          <path
                            d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                            strokeWidth={2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <div className="flex text-sm text-gray-600">
                          <label
                            htmlFor="file-upload"
                            className="relative cursor-pointer bg-white rounded-md font-medium text-purple-600 hover:text-purple-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-purple-500"
                          >
                            <span>Upload files</span>
                            <input
                              id="file-upload"
                              name="file-upload"
                              type="file"
                              className="sr-only"
                              multiple
                              onChange={handleFileChange}
                            />
                          </label>
                          <p className="pl-1">or drag and drop</p>
                        </div>
                        <p className="text-xs text-gray-500">
                          PDF, Word, Excel, PowerPoint, ZIP up to 10MB each
                        </p>
                      </div>
                    </div>
                    
                    {/* File list */}
                    {files.length > 0 && (
                      <div className="mt-4">
                        <h4 className="text-sm font-medium text-gray-700">Selected Files:</h4>
                        <ul className="mt-2 border border-gray-200 rounded-md divide-y divide-gray-200">
                          {files.map((file, index) => (
                            <li key={index} className="pl-3 pr-4 py-3 flex items-center justify-between text-sm">
                              <div className="w-0 flex-1 flex items-center">
                                <svg className="flex-shrink-0 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                  <path fillRule="evenodd" d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z" clipRule="evenodd" />
                                </svg>
                                <span className="ml-2 flex-1 w-0 truncate">
                                  {file.name}
                                </span>
                              </div>
                              <div className="ml-4 flex-shrink-0">
                                <button
                                  type="button"
                                  onClick={() => removeFile(index)}
                                  className="font-medium text-red-600 hover:text-red-500"
                                >
                                  Remove
                                </button>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {isSubmitting && uploadProgress > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-700">Uploading attachments: {uploadProgress}%</h4>
                      <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                        <div className="bg-purple-600 h-2.5 rounded-full" style={{ width: `${uploadProgress}%` }}></div>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end">
                    <Link
                      href={`/assignments/${assignmentId}`}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 mr-3"
                    >
                      Cancel
                    </Link>
                    <button
                      type="submit"
                      disabled={isSubmitting || submitSuccess}
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
                    >
                      {isSubmitting ? 'Submitting...' : 'Submit Assignment'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
} 