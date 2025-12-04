'use client';

import { useState, useEffect, useRef } from 'react';

interface RubricSubitem {
  id: number;
  name: string;
  description: string;
  points: number;
  orderPosition: number;
}

interface RubricCriterion {
  id: number;
  name: string;
  description: string;
  maxPoints: number;
  criterionType?: 'levels' | 'subitems';
  levels?: Array<{
    id: number;
    name?: string;
    description: string;
    score: number;
    orderPosition: number;
  }>;
  subitems?: RubricSubitem[];
}

interface RubricFormProps {
  criteria: RubricCriterion[];
  onScoreChange: (criterionId: number, score: number) => void;
  onFeedbackChange: (criterionId: number, feedback: string) => void;
  initialScores?: {[key: number]: number};
  initialFeedback?: {[key: number]: string};
  initialCheckedSubitems?: {[key: number]: number[]};
  onSubitemsChange?: (criterionId: number, checkedSubitemIds: number[]) => void;
  onAIHelpRequest?: (criterionId: number) => void;
}

export default function RubricForm({ 
  criteria, 
  onScoreChange, 
  onFeedbackChange,
  initialScores = {},
  initialFeedback = {},
  initialCheckedSubitems = {},
  onSubitemsChange,
  onAIHelpRequest
}: RubricFormProps) {
  const [scores, setScores] = useState<{[key: number]: number}>(initialScores);
  const [feedback, setFeedback] = useState<{[key: number]: string}>(initialFeedback);
  const [checkedSubitems, setCheckedSubitems] = useState<{[key: number]: number[]}>(initialCheckedSubitems);
  
  // Track previous values to avoid infinite loops
  const prevInitialScoresRef = useRef<string>('');
  const prevInitialFeedbackRef = useRef<string>('');
  const prevInitialCheckedSubitemsRef = useRef<string>('');

  // Update internal state when props change (only if actually different)
  useEffect(() => {
    const scoresStr = JSON.stringify(initialScores);
    if (scoresStr !== prevInitialScoresRef.current) {
      prevInitialScoresRef.current = scoresStr;
      setScores(initialScores);
    }
  }, [initialScores]);

  useEffect(() => {
    const feedbackStr = JSON.stringify(initialFeedback);
    if (feedbackStr !== prevInitialFeedbackRef.current) {
      prevInitialFeedbackRef.current = feedbackStr;
      setFeedback(initialFeedback);
    }
  }, [initialFeedback]);

  useEffect(() => {
    const subitemsStr = JSON.stringify(initialCheckedSubitems);
    if (subitemsStr !== prevInitialCheckedSubitemsRef.current) {
      prevInitialCheckedSubitemsRef.current = subitemsStr;
      setCheckedSubitems(initialCheckedSubitems);
    }
  }, [initialCheckedSubitems]);

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

  const handleSubitemToggle = (criterion: RubricCriterion, subitemId: number, isChecked: boolean) => {
    const currentChecked = checkedSubitems[criterion.id] || [];
    const newChecked = isChecked 
      ? [...currentChecked, subitemId]
      : currentChecked.filter(id => id !== subitemId);
    
    const newCheckedSubitems = { ...checkedSubitems, [criterion.id]: newChecked };
    setCheckedSubitems(newCheckedSubitems);
    
    // Calculate total score from checked subitems
    const totalScore = (criterion.subitems || [])
      .filter(s => newChecked.includes(s.id))
      .reduce((sum, s) => sum + s.points, 0);
    
    handleScoreChange(criterion.id, totalScore);
    
    if (onSubitemsChange) {
      onSubitemsChange(criterion.id, newChecked);
    }
  };

  const getTotalSubitemPoints = (criterion: RubricCriterion) => {
    return (criterion.subitems || []).reduce((sum, s) => sum + s.points, 0);
  };

  return (
    <div className="space-y-8">
      {criteria.map((criterion) => (
        <div key={criterion.id} className="bg-white p-6 shadow rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-black">{criterion.name}</h3>
              <p className="mt-1 text-sm text-black">{criterion.description}</p>
            </div>
            {criterion.criterionType === 'subitems' && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                Checklist
              </span>
            )}
          </div>
          
          <div className="mt-4">
            {criterion.criterionType === 'subitems' && criterion.subitems && criterion.subitems.length > 0 ? (
              // Subitem-based grading (checkboxes)
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Check all items that meet the criteria:
                </label>
                <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
                  {criterion.subitems.map((subitem) => {
                    const isChecked = (checkedSubitems[criterion.id] || []).includes(subitem.id);
                    return (
                      <div key={subitem.id} className="flex items-start">
                        <input
                          id={`subitem-${criterion.id}-${subitem.id}`}
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => handleSubitemToggle(criterion, subitem.id, e.target.checked)}
                          className="focus:ring-indigo-500 h-5 w-5 text-indigo-600 border-gray-300 rounded mt-0.5"
                        />
                        <div className="ml-3 flex-1">
                          <label
                            htmlFor={`subitem-${criterion.id}-${subitem.id}`}
                            className={`block text-sm cursor-pointer ${isChecked ? 'text-gray-900' : 'text-gray-600'}`}
                          >
                            <span className="font-semibold">{subitem.name}</span>
                            <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                              isChecked ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'
                            }`}>
                              {subitem.points} pts
                            </span>
                          </label>
                          {subitem.description && (
                            <p className="text-sm text-gray-500 mt-0.5">{subitem.description}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-3 flex items-center justify-between bg-indigo-50 p-3 rounded-lg">
                  <span className="text-sm font-medium text-indigo-900">Score:</span>
                  <span className="text-lg font-bold text-indigo-700">
                    {scores[criterion.id] || 0} / {getTotalSubitemPoints(criterion)} points
                  </span>
                </div>
              </div>
            ) : criterion.levels && criterion.levels.length > 0 ? (
              // Level-based grading (radio buttons)
              <div>
                <label htmlFor={`score-${criterion.id}`} className="block text-sm font-medium text-black">
                  Performance Level
                </label>
                <div className="mt-2 space-y-2">
                  {criterion.levels.map((level) => (
                    <div key={level.id} className="flex items-start">
                      <input
                        id={`score-${criterion.id}-level-${level.id}`}
                        name={`score-${criterion.id}`}
                        type="radio"
                        value={level.score}
                        checked={scores[criterion.id] === level.score}
                        onChange={() => handleScoreChange(criterion.id, level.score)}
                        className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 mt-1"
                      />
                      <div className="ml-3 flex-1">
                        <label
                          htmlFor={`score-${criterion.id}-level-${level.id}`}
                          className="block text-sm font-medium text-gray-900 cursor-pointer"
                        >
                          <span className="font-semibold">{level.name || `Level ${level.orderPosition}`} ({level.score} pts):</span> {level.description}
                        </label>
                      </div>
                    </div>
                  ))}
                  <div className="mt-2 text-sm text-gray-600">
                    Selected: <span className="font-medium">{scores[criterion.id] || 0}/{criterion.maxPoints} points</span>
                  </div>
                </div>
              </div>
            ) : (
              // Fallback to slider if no levels or subitems are defined
              <div>
                <label htmlFor={`score-${criterion.id}`} className="block text-sm font-medium text-black">
                  Score
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
            )}
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between mb-1">
              <label htmlFor={`feedback-${criterion.id}`} className="block text-sm font-medium text-black">
                Feedback
              </label>
              {onAIHelpRequest && (
                <button
                  type="button"
                  onClick={() => onAIHelpRequest(criterion.id)}
                  className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md text-purple-700 bg-purple-100 hover:bg-purple-200 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                  </svg>
                  Get AI Help
                </button>
              )}
            </div>
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
