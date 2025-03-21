'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import RubricForm from '../../../components/review/RubricForm';
import AIReviewAnalysis from '../../../components/review/AIReviewAnalysis';
import Link from 'next/link';

export default function PeerReview() {
  const router = useRouter();
  const params = useParams();
  const reviewId = params.id;
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [overallFeedback, setOverallFeedback] = useState('');
  const [scores, setScores] = useState<{[key: number]: number}>({});
  const [feedback, setFeedback] = useState<{[key: number]: string}>({});
  const [activeTab, setActiveTab] = useState('submission');
  const [submitted, setSubmitted] = useState(false);
  
  // Mock data - would be fetched from API in real app
  const assignment = {
    id: reviewId,
    title: "Essay on Climate Change",
    author: "Jane Smith",
    course: "Environmental Science 101",
    submittedDate: "2024-03-10",
    content: `<h2>Climate Change: A Global Challenge</h2>
      <p>Climate change represents one of the most significant challenges facing humanity in the 21st century. This essay explores the causes, effects, and potential solutions to this global crisis.</p>
      
      <h3>Causes of Climate Change</h3>
      <p>Human activities have been the primary driver of climate change, primarily due to burning fossil fuels like coal, oil, and natural gas, which results in the greenhouse effect. Deforestation and industrial processes also contribute significantly.</p>
      
      <h3>Effects of Climate Change</h3>
      <p>The effects of climate change are far-reaching and include rising global temperatures, melting ice caps and glaciers, rising sea levels, more frequent and severe weather events, and disruptions to ecosystems worldwide.</p>
      
      <h3>Potential Solutions</h3>
      <p>Addressing climate change requires a multi-faceted approach, including transitioning to renewable energy sources, improving energy efficiency, implementing carbon pricing, promoting sustainable land use, and fostering international cooperation.</p>
      
      <h3>Conclusion</h3>
      <p>Climate change presents an unprecedented challenge that requires immediate and coordinated action at all levels of society. By implementing comprehensive solutions and fostering global collaboration, we can mitigate its worst effects and build a more sustainable future.</p>`,
  };

  // Mock rubric criteria
  const rubricCriteria = [
    {
      id: 1,
      name: "Content & Understanding",
      description: "Demonstrates comprehensive understanding of the topic with relevant, accurate information.",
      maxPoints: 30
    },
    {
      id: 2,
      name: "Organization & Structure",
      description: "Presents ideas in a logical, coherent manner with clear introduction, body, and conclusion.",
      maxPoints: 25
    },
    {
      id: 3,
      name: "Critical Analysis",
      description: "Analyzes information critically, presents various perspectives, and draws reasoned conclusions.",
      maxPoints: 25
    },
    {
      id: 4,
      name: "Language & Style",
      description: "Uses appropriate academic language, correct grammar, spelling, and citation format.",
      maxPoints: 20
    }
  ];

  const handleScoreChange = (criterionId: number, score: number) => {
    setScores({ ...scores, [criterionId]: score });
  };

  const handleFeedbackChange = (criterionId: number, text: string) => {
    setFeedback({ ...feedback, [criterionId]: text });
  };

  const getTotalScore = () => {
    return Object.values(scores).reduce((total, score) => total + score, 0);
  };

  const getMaxPossibleScore = () => {
    return rubricCriteria.reduce((total, criterion) => total + criterion.maxPoints, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
    }, 1500);
  };

  const allCriteriaScored = rubricCriteria.every(criterion => 
    scores[criterion.id] !== undefined
  );

  const handleAIFeedbackSelect = (feedbackText: string) => {
    // Find the criterion that needs the most improvement
    const criterionWithLowestScore = rubricCriteria.reduce((lowest, current) => {
      const lowestScore = scores[lowest.id] || 0;
      const currentScore = scores[current.id] || 0;
      return currentScore < lowestScore ? current : lowest;
    });
    
    handleFeedbackChange(criterionWithLowestScore.id, feedbackText);
  };

  const handleAIOverallFeedbackSelect = (feedbackText: string) => {
    setOverallFeedback(overallFeedback ? 
      `${overallFeedback}\n\n${feedbackText}` : 
      feedbackText
    );
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <svg 
              className="mx-auto h-16 w-16 text-green-500" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M5 13l4 4L19 7" 
              />
            </svg>
            <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl mt-4">
              Review Submitted!
            </h2>
            <p className="mt-3 text-xl text-gray-500 sm:mt-4">
              Your peer review has been submitted successfully.
            </p>
            <div className="mt-10">
              <Link
                href="/dashboard"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Return to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-b border-gray-200 pb-5 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold leading-7 text-black sm:text-3xl sm:truncate">
                Peer Review: {assignment.title}
              </h1>
              <p className="mt-2 max-w-4xl text-sm text-black">
                By: {assignment.author} | Course: {assignment.course} | Submitted: {assignment.submittedDate}
              </p>
            </div>

            {/* Score Summary */}
            <div className="bg-indigo-50 p-3 rounded-lg text-center">
              <p className="text-sm font-medium text-indigo-800">Current Score</p>
              <p className="text-2xl font-bold text-indigo-900">
                {getTotalScore()}/{getMaxPossibleScore()}
              </p>
            </div>
          </div>

          <div className="mt-4 border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('submission')}
                className={`${
                  activeTab === 'submission'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-black hover:text-black hover:border-gray-300'
                } whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm`}
              >
                Submission
              </button>
              <button
                onClick={() => setActiveTab('review')}
                className={`${
                  activeTab === 'review'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-black hover:text-black hover:border-gray-300'
                } whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm`}
              >
                Review Form
              </button>
            </nav>
          </div>

          <div className="mt-6">
            {activeTab === 'submission' ? (
              <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="px-4 py-5 sm:p-6">
                  <div className="prose max-w-none text-black" dangerouslySetInnerHTML={{ __html: assignment.content }}></div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="space-y-8">
                  <RubricForm 
                    criteria={rubricCriteria}
                    onScoreChange={handleScoreChange}
                    onFeedbackChange={handleFeedbackChange}
                  />
                  
                  <div className="bg-white p-6 shadow rounded-lg">
                    <h3 className="text-lg font-medium text-black">Overall Feedback</h3>
                    <p className="mt-1 text-sm text-black">
                      Provide comprehensive feedback on the entire submission, highlighting strengths and areas for improvement.
                    </p>
                    <div className="mt-4">
                      <textarea
                        rows={6}
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border border-gray-300 rounded-md text-black"
                        placeholder="Enter your overall feedback here..."
                        value={overallFeedback}
                        onChange={(e) => setOverallFeedback(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* AI Review Analysis Component */}
                  <AIReviewAnalysis
                    criteria={rubricCriteria}
                    scores={scores}
                    feedback={feedback}
                    overallFeedback={overallFeedback}
                    assignment={assignment}
                    onAIFeedbackSelect={handleAIFeedbackSelect}
                    onAIOverallFeedbackSelect={handleAIOverallFeedbackSelect}
                  />
                  
                  <div className="flex justify-between items-center">
                    <div>
                      {!allCriteriaScored && (
                        <p className="text-sm text-red-600">Please provide a score for all criteria before submitting.</p>
                      )}
                    </div>
                    <div className="flex justify-end">
                      <Link
                        href="/dashboard"
                        className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        Cancel
                      </Link>
                      <button
                        type="submit"
                        disabled={isSubmitting || !allCriteriaScored || !overallFeedback}
                        className={`ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white
                          ${
                            isSubmitting || !allCriteriaScored || !overallFeedback
                              ? 'bg-indigo-400 cursor-not-allowed'
                              : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                          }`}
                      >
                        {isSubmitting ? (
                          <>
                            <svg
                              className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              ></circle>
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              ></path>
                            </svg>
                            Submitting...
                          </>
                        ) : (
                          'Submit Review'
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 