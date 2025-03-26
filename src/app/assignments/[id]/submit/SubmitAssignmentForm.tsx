import React, { useState } from 'react';
import { useRouter } from 'next/router';

const SubmitAssignmentForm: React.FC = () => {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isDraft, setIsDraft] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    
    if (!content.trim()) {
      setError('Content is required');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      const response = await fetch('/api/submissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assignmentId,
          studentId: userId,
          title,
          content,
          status: isDraft ? 'draft' : 'submitted'
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit assignment');
      }
      
      const data = await response.json();
      
      // Redirect based on submission status
      if (isDraft) {
        router.push(`/submissions/${data.submission.id}/edit`);
      } else {
        // Redirect to assignment page to show submitted status
        router.push(`/assignments/${assignmentId}`);
      }
    } catch (error) {
      console.error('Error submitting assignment:', error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      {/* Render your form here */}
    </div>
  );
};

export default SubmitAssignmentForm; 