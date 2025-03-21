'use client';

import { useState } from 'react';

interface RubricCriterion {
  id: number;
  name: string;
  description: string;
  maxPoints: number;
}

interface RubricFormProps {
  criteria: RubricCriterion[];
  onScoreChange: (criterionId: number, score: number) => void;
  onFeedbackChange: (criterionId: number, feedback: string) => void;
}

export default function RubricForm({ 
  criteria, 
  onScoreChange, 
  onFeedbackChange 
}: RubricFormProps) {
  const [scores, setScores] = useState<{[key: number]: number}>({});
  const [feedback, setFeedback] = useState<{[key: number]: string}>({});

  const handleScoreChange = (criterionId: number, score: number) => {
    const newScores = { ...scores, [criterionId]: score };
    setScores(newScores);
    onScoreChange(criterionId, score);
  };

  const handleFeedbackChange = (criterionId: number, text: string) => {
    const newFeedback = { ...feedback, [criterionId]: text };
    setFeedback(newFeedback);
    onFeedbackChange(criterionId, text);
  };

  return (
    <div className="space-y-8">
      {criteria.map((criterion) => (
        <div key={criterion.id} className="bg-white p-6 shadow rounded-lg">
          <h3 className="text-lg font-medium text-black">{criterion.name}</h3>
          <p className="mt-1 text-sm text-black">{criterion.description}</p>
          
          <div className="mt-4">
            <label htmlFor={`score-${criterion.id}`} className="block text-sm font-medium text-black">
              Score (0-{criterion.maxPoints})
            </label>
            <div className="mt-2">
              <div className="flex items-center">
                <input
                  type="range"
                  id={`score-${criterion.id}`}
                  name={`score-${criterion.id}`}
                  min="0"
                  max={criterion.maxPoints}
                  value={scores[criterion.id] || 0}
                  onChange={(e) => handleScoreChange(criterion.id, parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <span className="ml-3 text-sm text-black min-w-[2rem] text-center">
                  {scores[criterion.id] || 0}/{criterion.maxPoints}
                </span>
              </div>
              
              {/* Score indicators */}
              <div className="flex justify-between mt-1 px-1">
                <span className="text-xs text-black">Poor</span>
                <span className="text-xs text-black">Excellent</span>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <label htmlFor={`feedback-${criterion.id}`} className="block text-sm font-medium text-black">
              Feedback
            </label>
            <div className="mt-1">
              <textarea
                id={`feedback-${criterion.id}`}
                name={`feedback-${criterion.id}`}
                rows={3}
                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border border-gray-300 rounded-md text-black"
                placeholder="Provide constructive feedback for this criterion..."
                value={feedback[criterion.id] || ''}
                onChange={(e) => handleFeedbackChange(criterion.id, e.target.value)}
              />
            </div>
          </div>

          {/* AI Feedback Suggestions */}
          {scores[criterion.id] !== undefined && (
            <div className="mt-4 p-3 bg-indigo-50 rounded-md">
              <h4 className="text-sm font-medium text-indigo-800 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-1">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                </svg>
                AI Feedback Suggestions
              </h4>
              <div className="mt-2 text-sm text-black">
                {scores[criterion.id] < criterion.maxPoints * 0.3 && (
                  <p>Consider providing specific examples of how the work could be improved to meet the basic requirements.</p>
                )}
                {scores[criterion.id] >= criterion.maxPoints * 0.3 && scores[criterion.id] < criterion.maxPoints * 0.7 && (
                  <p>Consider pointing out both strengths and specific areas where improvements could be made.</p>
                )}
                {scores[criterion.id] >= criterion.maxPoints * 0.7 && (
                  <p>Consider highlighting the exceptional aspects of the work and possibly suggest how it could be developed further.</p>
                )}
              </div>
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  onClick={() => handleFeedbackChange(criterion.id, feedback[criterion.id] ? 
                    `${feedback[criterion.id]} I appreciated your approach to this topic, but consider adding more supporting evidence for your key arguments.` : 
                    "I appreciated your approach to this topic, but consider adding more supporting evidence for your key arguments."
                  )}
                >
                  Add Suggestion
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
} 