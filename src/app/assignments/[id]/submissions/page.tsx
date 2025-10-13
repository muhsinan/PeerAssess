'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Layout from '../../../../components/layout/Layout';
import Link from 'next/link';

// AI Review Preview Modal Component
interface AIReviewPreview {
  submissionId: number;
  studentName: string;
  assignmentTitle: string;
  submissionTitle: string;
  overallFeedback: string;
  criteriaScores: Array<{
    criterionId: number;
    score: number;
    feedback: string;
  }>;
  totalScore: number;
  suggestionsForImprovement: string[];
  criteria: Array<{
    criterion_id: number;
    name: string;
    description: string;
    max_points: number;
  }>;
  generatedBy: number;
  aiModel: string;
}

interface AIReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  preview: AIReviewPreview | null;
  onConfirm: (preview: AIReviewPreview) => void;
  isLoading: boolean;
}

function AIReviewModal({ isOpen, onClose, preview, onConfirm, isLoading }: AIReviewModalProps) {
  if (!isOpen || !preview) return null;

  const totalMaxPoints = preview.criteria.reduce((sum, criterion) => sum + criterion.max_points, 0);
  const percentage = totalMaxPoints > 0 ? Math.round((preview.totalScore / totalMaxPoints) * 100) : 0;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b">
            <div>
              <h3 className="text-lg font-medium text-gray-900">AI Peer Review Preview</h3>
              <p className="text-sm text-gray-500">
                Generated peer-style feedback for {preview.studentName}'s submission
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="mt-4 max-h-96 overflow-y-auto">
            {/* Overall Score */}
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="text-lg font-medium text-blue-900 mb-2">Overall Score</h4>
              <div className="flex items-center">
                <span className="text-3xl font-bold text-blue-700">{preview.totalScore}</span>
                <span className="text-lg text-blue-600 ml-1">/{totalMaxPoints}</span>
                <span className="ml-3 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  {percentage}%
                </span>
              </div>
            </div>

            {/* Overall Feedback */}
            <div className="mb-6">
              <h4 className="text-lg font-medium text-gray-900 mb-2">Overall Feedback</h4>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-700 whitespace-pre-wrap">{preview.overallFeedback}</p>
              </div>
            </div>

            {/* Criteria Scores */}
            <div className="mb-6">
              <h4 className="text-lg font-medium text-gray-900 mb-3">Detailed Scores</h4>
              <div className="space-y-4">
                {preview.criteriaScores.map((criterionScore) => {
                  const criterion = preview.criteria.find(c => c.criterion_id === criterionScore.criterionId);
                  if (!criterion) return null;
                  
                  const scorePercentage = Math.round((criterionScore.score / criterion.max_points) * 100);
                  
                  return (
                    <div key={criterionScore.criterionId} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium text-gray-900">{criterion.name}</h5>
                        <div className="flex items-center">
                          <span className="text-lg font-semibold">{criterionScore.score}/{criterion.max_points}</span>
                          <span className="ml-2 px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm">
                            {scorePercentage}%
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{criterion.description}</p>
                      <div className="bg-yellow-50 p-3 rounded">
                        <p className="text-sm text-gray-700">{criterionScore.feedback}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Suggestions for Improvement */}
            {preview.suggestionsForImprovement && preview.suggestionsForImprovement.length > 0 && (
              <div className="mb-6">
                <h4 className="text-lg font-medium text-gray-900 mb-2">Suggestions for Improvement</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 bg-green-50 p-4 rounded-lg">
                  {preview.suggestionsForImprovement.map((suggestion, index) => (
                    <li key={index}>{suggestion}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-xs text-gray-500">
              AI-generated peer-style review using {preview.aiModel} • Will appear as anonymous peer feedback to the student
            </div>
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                onClick={() => onConfirm(preview)}
                disabled={isLoading}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Saving...' : 'Confirm & Send Review'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AssignmentSubmissions() {
  const router = useRouter();
  const params = useParams();
  const assignmentId = params && Array.isArray(params.id) ? params.id[0] : params?.id;
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [assignment, setAssignment] = useState<{
    id: number;
    title: string;
    description: string;
    dueDate: string;
    courseId: number;
    courseName: string;
    totalStudents: number;
    submissionsCount: number;
  } | null>(null);
  
  const [submissions, setSubmissions] = useState<Array<{
    id: number;
    studentId: number;
    studentName: string;
    studentEmail: string;
    title: string;
    submissionDate: string;
    status: string;
    score?: number;
    reviewsCount: number;
    attachments?: Array<{
      id: number;
      fileName: string;
      filePath: string;
      fileSize: number;
      fileType: string;
      uploadDate: string;
    }>;
  }>>([]);

  // AI Review state
  const [isGeneratingAI, setIsGeneratingAI] = useState<number | null>(null);
  const [aiReviewPreview, setAiReviewPreview] = useState<AIReviewPreview | null>(null);
  const [showAIModal, setShowAIModal] = useState(false);
  const [isSavingAI, setIsSavingAI] = useState(false);

  // Check if user is authorized (must be an instructor)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const role = localStorage.getItem('userRole');
      const userId = localStorage.getItem('userId');
      
      setUserRole(role);
      
      // If not an instructor, redirect to dashboard
      if (role !== 'instructor') {
        router.push('/dashboard');
      } else {
        // Fetch assignment details and submissions
        fetchAssignmentDetails();
        fetchSubmissions();
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
      setAssignment(data);
    } catch (error) {
      console.error('Error fetching assignment details:', error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch submissions for this assignment
  const fetchSubmissions = async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch(`/api/assignments/${assignmentId}/submissions`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch submissions');
      }
      
      const data = await response.json();
      setSubmissions(data.submissions);
    } catch (error) {
      console.error('Error fetching submissions:', error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle attachment download
  const handleDownloadAttachment = async (attachmentId: number, fileName: string) => {
    try {
      const userId = localStorage.getItem('userId');
      const response = await fetch(`/api/attachments/${attachmentId}/download?userId=${userId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to download attachment');
      }
      
      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading attachment:', error);
      alert(error instanceof Error ? error.message : 'Failed to download attachment');
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      
      // Check if date is valid
      if (isNaN(date.getTime())) return 'N/A';
      
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'N/A';
    }
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Generate AI Review
  const handleGenerateAIReview = async (submissionId: number) => {
    try {
      setIsGeneratingAI(submissionId);
      const userId = localStorage.getItem('userId');
      
      if (!userId) {
        alert('User not authenticated');
        return;
      }

      const response = await fetch(`/api/submissions/${submissionId}/ai-review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          instructorId: parseInt(userId)
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate AI review');
      }

      const data = await response.json();
      setAiReviewPreview(data.preview);
      setShowAIModal(true);
      
    } catch (error) {
      console.error('Error generating AI review:', error);
      alert(error instanceof Error ? error.message : 'Failed to generate AI review');
    } finally {
      setIsGeneratingAI(null);
    }
  };

  // Confirm and save AI Review
  const handleConfirmAIReview = async (preview: AIReviewPreview) => {
    try {
      setIsSavingAI(true);
      const userId = localStorage.getItem('userId');
      
      if (!userId) {
        alert('User not authenticated');
        return;
      }

      const response = await fetch(`/api/submissions/${preview.submissionId}/ai-review`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          instructorId: parseInt(userId),
          overallFeedback: preview.overallFeedback,
          criteriaScores: preview.criteriaScores,
          totalScore: preview.totalScore,
          aiModel: preview.aiModel
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save AI review');
      }

      // Refresh submissions to show updated status
      await fetchSubmissions();
      
      setShowAIModal(false);
      setAiReviewPreview(null);
      alert('AI review saved successfully!');
      
    } catch (error) {
      console.error('Error saving AI review:', error);
      alert(error instanceof Error ? error.message : 'Failed to save AI review');
    } finally {
      setIsSavingAI(false);
    }
  };

  // Status badge component
  const StatusBadge = ({ status }: { status: string }) => {
    let bgColor = '';
    let textColor = '';
    
    switch (status) {
      case 'submitted':
        bgColor = 'bg-blue-100';
        textColor = 'text-blue-800';
        break;
      case 'reviewed':
        bgColor = 'bg-green-100';
        textColor = 'text-green-800';
        break;
      case 'draft':
        bgColor = 'bg-gray-100';
        textColor = 'text-gray-800';
        break;
      default:
        bgColor = 'bg-gray-100';
        textColor = 'text-gray-800';
    }
    
    return (
      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${bgColor} ${textColor}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  // Loading state
  if (isLoading && !assignment) {
    return (
      <Layout>
        <div className="py-10 flex justify-center items-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      </Layout>
    );
  }

  // Error state
  if (error) {
    return (
      <Layout>
        <div className="py-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-red-50 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{error}</p>
                  </div>
                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={() => router.push('/dashboard')}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
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

  return (
    <Layout>
      <div className="py-10">
        <header>
          <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
            <div className="md:flex md:items-center md:justify-between">
              <div className="flex-1 min-w-0">
                <h1 className="text-3xl font-bold leading-tight text-black">
                  {assignment?.title} Submissions
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  {assignment?.courseName} &middot; Due: {assignment?.dueDate ? formatDate(assignment.dueDate) : 'N/A'}
                </p>
              </div>
              <div className="mt-4 flex md:mt-0 md:ml-4">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                >
                  Back to Dashboard
                </Link>
                <Link
                  href={`/assignments/${assignmentId}/edit`}
                  className="ml-3 inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <svg className="-ml-1 mr-2 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                  Edit Assignment
                </Link>
                <Link
                  href={`/courses/${assignment?.courseId}`}
                  className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                >
                  Go to Course
                </Link>
              </div>
            </div>
          </div>
        </header>

        <main>
          <div className="max-w-full mx-auto sm:px-6 lg:px-8">
            {/* Submission Stats */}
            <div className="bg-white shadow rounded-lg p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="border-r border-gray-200 pr-6">
                  <h3 className="text-lg font-medium text-gray-900">Submission Status</h3>
                  <div className="mt-2 flex items-baseline">
                    <div className="text-3xl font-semibold text-purple-700">
                      {submissions.length}
                    </div>
                    <div className="ml-2 text-sm text-gray-500">
                      of {assignment?.totalStudents} students
                    </div>
                  </div>
                </div>
                <div className="border-r border-gray-200 px-6">
                  <h3 className="text-lg font-medium text-gray-900">Reviewed</h3>
                  <div className="mt-2 flex items-baseline">
                    <div className="text-3xl font-semibold text-green-700">
                      {submissions.filter(s => s.status === 'reviewed').length}
                    </div>
                    <div className="ml-2 text-sm text-gray-500">
                      submissions
                    </div>
                  </div>
                </div>
                <div className="pl-6">
                  <h3 className="text-lg font-medium text-gray-900">Pending Review</h3>
                  <div className="mt-2 flex items-baseline">
                    <div className="text-3xl font-semibold text-yellow-600">
                      {submissions.filter(s => s.status === 'submitted').length}
                    </div>
                    <div className="ml-2 text-sm text-gray-500">
                      submissions
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Submissions List */}
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6 bg-purple-50">
                <h3 className="text-lg leading-6 font-medium text-purple-800">
                  Student Submissions
                </h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                  {submissions.length > 0 
                    ? 'All submissions for this assignment' 
                    : 'No submissions yet for this assignment'}
                </p>
              </div>
              
              {submissions.length > 0 ? (
                <div className="flex flex-col">
                  <div className="overflow-x-auto">
                    <div className="py-2 align-middle inline-block min-w-full">
                      <div className="overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Student
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Submission
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Date
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Score
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Attachments
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Reviews
                              </th>
                              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[280px]">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {submissions.map((submission) => (
                              <tr key={submission.id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <div>
                                      <div className="text-sm font-medium text-gray-900">
                                        {submission.studentName}
                                      </div>
                                      <div className="text-sm text-gray-500">
                                        {submission.studentEmail}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-900">{submission.title}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-900">
                                    {formatDate(submission.submissionDate)}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <StatusBadge status={submission.status} />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {submission.score ? (
                                    <span className="text-gray-900 font-medium">{submission.score}</span>
                                  ) : (
                                    <span className="text-gray-400">-</span>
                                  )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  {submission.attachments && submission.attachments.length > 0 ? (
                                    <div className="space-y-1">
                                      {submission.attachments.map((attachment) => (
                                        <div key={attachment.id} className="flex items-center">
                                          <button
                                            onClick={() => handleDownloadAttachment(attachment.id, attachment.fileName)}
                                            className="flex items-center text-xs text-purple-600 hover:text-purple-900"
                                          >
                                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                            <span className="truncate max-w-24">{attachment.fileName}</span>
                                          </button>
                                          <span className="text-xs text-gray-400 ml-1">
                                            ({formatFileSize(attachment.fileSize)})
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <span className="text-gray-400 text-sm">No files</span>
                                  )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {submission.reviewsCount > 0 ? (
                                    <span className="text-gray-900 font-medium">{submission.reviewsCount}</span>
                                  ) : (
                                    <span className="text-gray-400">-</span>
                                  )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium min-w-[280px]">
                                  <div className="flex justify-end space-x-3 items-center">
                                    <Link
                                      href={`/submissions/${submission.id}`}
                                      className="inline-flex items-center px-2 py-1 text-xs font-medium text-purple-600 hover:text-purple-900 whitespace-nowrap border border-purple-200 rounded hover:bg-purple-50"
                                    >
                                      View
                                    </Link>
                                    {submission.status === 'submitted' && (
                                      <>
                                        <Link
                                          href={`/submissions/${submission.id}/review`}
                                          className="inline-flex items-center px-2 py-1 text-xs font-medium text-green-600 hover:text-green-900 whitespace-nowrap border border-green-200 rounded hover:bg-green-50"
                                        >
                                          Review
                                        </Link>
                                        <button
                                          onClick={() => handleGenerateAIReview(submission.id)}
                                          disabled={isGeneratingAI === submission.id}
                                          className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-600 hover:text-blue-900 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap border border-blue-200 rounded hover:bg-blue-50"
                                          title="Generate AI Peer Review (sounds like student feedback)"
                                        >
                                          {isGeneratingAI === submission.id ? (
                                            <>
                                              <svg className="animate-spin -ml-1 mr-1 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                              </svg>
                                              Generating...
                                            </>
                                          ) : (
                                            <>
                                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                              </svg>
                                              AI Review
                                            </>
                                          )}
                                        </button>
                                      </>
                                    )}
                                    {submission.status === 'reviewed' && (
                                      <Link
                                        href={`/submissions/${submission.id}/feedback`}
                                        className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-600 hover:text-blue-900 whitespace-nowrap border border-blue-200 rounded hover:bg-blue-50"
                                      >
                                        Feedback
                                      </Link>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="px-6 py-12 text-center">
                  <svg 
                    className="mx-auto h-12 w-12 text-gray-400" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor" 
                    aria-hidden="true"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth="2" 
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
                    />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No submissions</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    No students have submitted their work for this assignment yet.
                  </p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* AI Review Modal */}
      <AIReviewModal
        isOpen={showAIModal}
        onClose={() => {
          setShowAIModal(false);
          setAiReviewPreview(null);
        }}
        preview={aiReviewPreview}
        onConfirm={handleConfirmAIReview}
        isLoading={isSavingAI}
      />
    </Layout>
  );
} 