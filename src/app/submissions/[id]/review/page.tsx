'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function SubmissionReview() {
  const router = useRouter();
  const params = useParams();
  const submissionId = Array.isArray(params?.id) ? params.id[0] : params?.id;

  useEffect(() => {
    const fetchSubmissionAndRedirect = async () => {
      try {
        // Get the submission details to find the assignment ID
        const response = await fetch(`/api/submissions/${submissionId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch submission');
        }
        
        const data = await response.json();
        const submission = data.submission; // Extract submission from the response
        
        // Redirect to the peer-reviews assignment page with the submission ID
        router.push(`/peer-reviews/assignment/${submission.assignmentId}?submissionId=${submissionId}`);
      } catch (error) {
        console.error('Error fetching submission:', error);
        // Fallback - redirect to dashboard
        router.push('/dashboard');
      }
    };

    if (submissionId) {
      fetchSubmissionAndRedirect();
    }
  }, [submissionId, router]);

  // Show loading while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Redirecting to review...</p>
      </div>
    </div>
  );
} 