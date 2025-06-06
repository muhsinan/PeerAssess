'use client';

import { useState, useEffect } from 'react';

interface RubricCriterion {
  id: number;
  name: string;
  description: string;
  maxPoints: number;
  levels?: Array<{
    id: number;
    description: string;
    points: number;
    orderPosition: number;
  }>;
}

interface RubricFormProps {
  criteria: RubricCriterion[];
  onScoreChange: (criterionId: number, score: number) => void;
  onFeedbackChange: (criterionId: number, feedback: string) => void;
  initialScores?: {[key: number]: number};
  initialFeedback?: {[key: number]: string};
}

export default function RubricForm({ 
  criteria, 
  onScoreChange, 
  onFeedbackChange,
  initialScores = {},
  initialFeedback = {}
}: RubricFormProps) {
  const [scores, setScores] = useState<{[key: number]: number}>(initialScores);
  const [feedback, setFeedback] = useState<{[key: number]: string}>(initialFeedback);

  // Update internal state when props change
  useEffect(() => {
    setScores(initialScores);
  }, [initialScores]);

  useEffect(() => {
    setFeedback(initialFeedback);
  }, [initialFeedback]);

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
              Performance Level
            </label>
            
            {criterion.levels && criterion.levels.length > 0 ? (
              <div className="mt-2 space-y-2">
                {criterion.levels.map((level) => (
                  <div key={level.id} className="flex items-start">
                    <input
                      id={`score-${criterion.id}-level-${level.id}`}
                      name={`score-${criterion.id}`}
                      type="radio"
                      value={level.points}
                      checked={scores[criterion.id] === level.points}
                      onChange={() => handleScoreChange(criterion.id, level.points)}
                      className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 mt-1"
                    />
                    <div className="ml-3 flex-1">
                      <label
                        htmlFor={`score-${criterion.id}-level-${level.id}`}
                        className="block text-sm font-medium text-gray-900 cursor-pointer"
                      >
                        <span className="font-semibold">{level.points} points:</span> {level.description}
                      </label>
                    </div>
                  </div>
                ))}
                <div className="mt-2 text-sm text-gray-600">
                  Selected: <span className="font-medium">{scores[criterion.id] || 0}/{criterion.maxPoints} points</span>
                </div>
              </div>
            ) : (
              // Fallback to slider if no levels are defined
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
            )}
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
        </div>
      ))}
    </div>
  );
} 