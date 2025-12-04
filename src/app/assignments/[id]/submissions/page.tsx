'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Layout from '../../../../components/layout/Layout';
import Link from 'next/link';

// Subitem score interface
interface SubitemScore {
  subitemId: number;
  subitemName: string;
  checked: boolean;
  points: number;
  feedback: string;
}

// Criterion score interface
interface CriterionScore {
  criterionId: number;
  criterionType?: 'levels' | 'subitems';
  score: number;
  feedback: string;
  subitemScores?: SubitemScore[];
}

// Subitem interface
interface Subitem {
  subitem_id: number;
  name: string;
  description: string;
  points: number;
  order_position: number;
}

// AI Review Preview Modal Component
interface AIReviewPreview {
  submissionId: number;
  studentName: string;
  assignmentTitle: string;
  submissionTitle: string;
  overallFeedback: string;
  criteriaScores: CriterionScore[];
  totalScore: number;
  suggestionsForImprovement: string[];
  criteria: Array<{
    criterion_id: number;
    name: string;
    description: string;
    max_points: number;
    criterion_type?: 'levels' | 'subitems';
    subitems?: Subitem[];
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
  // State for editable fields
  const [editedOverallFeedback, setEditedOverallFeedback] = useState('');
  const [editedCriteriaScores, setEditedCriteriaScores] = useState<CriterionScore[]>([]);
  const [editedSuggestions, setEditedSuggestions] = useState<string[]>([]);

  // Initialize editable state when preview changes
  useEffect(() => {
    if (preview) {
      setEditedOverallFeedback(preview.overallFeedback);
      setEditedCriteriaScores(preview.criteriaScores);
      setEditedSuggestions(preview.suggestionsForImprovement || []);
    }
  }, [preview]);

  if (!isOpen || !preview) return null;

  const totalMaxPoints = preview.criteria.reduce((sum, criterion) => sum + criterion.max_points, 0);
  
  // Calculate total score from edited criteria scores
  const calculatedTotalScore = editedCriteriaScores.reduce((sum, cs) => sum + cs.score, 0);
  const percentage = totalMaxPoints > 0 ? Math.round((calculatedTotalScore / totalMaxPoints) * 100) : 0;

  // Handle score change for a level-based criterion
  const handleScoreChange = (criterionId: number, newScore: string) => {
    const criterion = preview.criteria.find(c => c.criterion_id === criterionId);
    if (!criterion) return;
    
    const scoreValue = Math.max(0, Math.min(criterion.max_points, parseFloat(newScore) || 0));
    setEditedCriteriaScores(prev => 
      prev.map(cs => cs.criterionId === criterionId ? { ...cs, score: scoreValue } : cs)
    );
  };

  // Handle feedback change for a criterion
  const handleCriterionFeedbackChange = (criterionId: number, newFeedback: string) => {
    setEditedCriteriaScores(prev => 
      prev.map(cs => cs.criterionId === criterionId ? { ...cs, feedback: newFeedback } : cs)
    );
  };

  // Handle subitem checked state change
  const handleSubitemCheckedChange = (criterionId: number, subitemId: number, checked: boolean) => {
    setEditedCriteriaScores(prev => 
      prev.map(cs => {
        if (cs.criterionId === criterionId && cs.subitemScores) {
          const updatedSubitems = cs.subitemScores.map(ss => 
            ss.subitemId === subitemId ? { ...ss, checked } : ss
          );
          // Recalculate score based on checked subitems
          const newScore = updatedSubitems.filter(ss => ss.checked).reduce((sum, ss) => sum + ss.points, 0);
          return { ...cs, subitemScores: updatedSubitems, score: newScore };
        }
        return cs;
      })
    );
  };

  // Handle subitem feedback change
  const handleSubitemFeedbackChange = (criterionId: number, subitemId: number, feedback: string) => {
    setEditedCriteriaScores(prev => 
      prev.map(cs => {
        if (cs.criterionId === criterionId && cs.subitemScores) {
          return {
            ...cs,
            subitemScores: cs.subitemScores.map(ss => 
              ss.subitemId === subitemId ? { ...ss, feedback } : ss
            )
          };
        }
        return cs;
      })
    );
  };

  // Handle suggestion change
  const handleSuggestionChange = (index: number, newValue: string) => {
    setEditedSuggestions(prev => prev.map((s, i) => i === index ? newValue : s));
  };

  // Handle confirm with edited data
  const handleConfirmEdited = () => {
    const editedPreview = {
      ...preview,
      overallFeedback: editedOverallFeedback,
      criteriaScores: editedCriteriaScores,
      totalScore: calculatedTotalScore,
      suggestionsForImprovement: editedSuggestions
    };
    onConfirm(editedPreview);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b">
            <div>
              <h3 className="text-lg font-medium text-gray-900">AI Peer Review - Edit & Confirm</h3>
              <p className="text-sm text-gray-500">
                Generated feedback for {preview.studentName}'s submission - Edit before sending
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
                <span className="text-3xl font-bold text-blue-700">{calculatedTotalScore}</span>
                <span className="text-lg text-blue-600 ml-1">/{totalMaxPoints}</span>
                <span className="ml-3 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  {percentage}%
                </span>
              </div>
              <p className="text-xs text-gray-600 mt-2">Score automatically calculated from criteria below</p>
            </div>

            {/* Overall Feedback - EDITABLE */}
            <div className="mb-6">
              <h4 className="text-lg font-medium text-gray-900 mb-2">Overall Feedback</h4>
              <textarea
                value={editedOverallFeedback}
                onChange={(e) => setEditedOverallFeedback(e.target.value)}
                className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={6}
                placeholder="Enter overall feedback..."
              />
            </div>

            {/* Criteria Scores - EDITABLE */}
            <div className="mb-6">
              <h4 className="text-lg font-medium text-gray-900 mb-3">Detailed Scores</h4>
              <div className="space-y-4">
                {editedCriteriaScores.map((criterionScore) => {
                  const criterion = preview.criteria.find(c => c.criterion_id === criterionScore.criterionId);
                  if (!criterion) return null;
                  
                  const isSubitemBased = criterion.criterion_type === 'subitems' && criterionScore.subitemScores;
                  const scorePercentage = Math.round((criterionScore.score / criterion.max_points) * 100);
                  
                  return (
                    <div key={criterionScore.criterionId} className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <h5 className="font-medium text-gray-900">{criterion.name}</h5>
                          {isSubitemBased && (
                            <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs rounded-full">
                              Checklist
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          {!isSubitemBased ? (
                            <input
                              type="number"
                              min="0"
                              max={criterion.max_points}
                              step="0.5"
                              value={criterionScore.score}
                              onChange={(e) => handleScoreChange(criterionScore.criterionId, e.target.value)}
                              className="w-16 px-2 py-1 border border-gray-300 rounded text-center focus:ring-2 focus:ring-blue-500"
                            />
                          ) : (
                            <span className="font-medium text-indigo-700">{criterionScore.score}</span>
                          )}
                          <span className="text-gray-600">/ {criterion.max_points}</span>
                          <span className="ml-2 px-2 py-1 bg-gray-200 text-gray-700 rounded text-sm">
                            {scorePercentage}%
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{criterion.description}</p>
                      
                      {/* Subitems UI - shown when criterion uses subitems */}
                      {isSubitemBased && criterionScore.subitemScores ? (
                        <div className="space-y-3 mb-3">
                          {criterionScore.subitemScores.map((subitemScore) => (
                            <div key={subitemScore.subitemId} className="bg-white border rounded-lg p-3">
                              <div className="flex items-start space-x-3">
                                <input
                                  type="checkbox"
                                  checked={subitemScore.checked}
                                  onChange={(e) => handleSubitemCheckedChange(
                                    criterionScore.criterionId, 
                                    subitemScore.subitemId, 
                                    e.target.checked
                                  )}
                                  className="mt-1 h-5 w-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                />
                                <div className="flex-1">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className={`font-medium ${subitemScore.checked ? 'text-gray-900' : 'text-gray-500'}`}>
                                      {subitemScore.subitemName}
                                    </span>
                                    <span className={`text-sm px-2 py-0.5 rounded ${
                                      subitemScore.checked 
                                        ? 'bg-green-100 text-green-700' 
                                        : 'bg-gray-100 text-gray-500'
                                    }`}>
                                      {subitemScore.checked ? `+${subitemScore.points}` : '0'} / {subitemScore.points} pts
                                    </span>
                                  </div>
                                  <textarea
                                    value={subitemScore.feedback}
                                    onChange={(e) => handleSubitemFeedbackChange(
                                      criterionScore.criterionId,
                                      subitemScore.subitemId,
                                      e.target.value
                                    )}
                                    className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    rows={2}
                                    placeholder={`Feedback for ${subitemScore.subitemName}...`}
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : null}
                      
                      {/* Overall criterion feedback */}
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">
                          {isSubitemBased ? 'Overall Category Feedback' : 'Feedback'}
                        </label>
                        <textarea
                          value={criterionScore.feedback}
                          onChange={(e) => handleCriterionFeedbackChange(criterionScore.criterionId, e.target.value)}
                          className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          rows={isSubitemBased ? 2 : 3}
                          placeholder={isSubitemBased ? "Overall feedback for this category..." : "Enter feedback for this criterion..."}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Suggestions for Improvement - EDITABLE */}
            <div className="mb-6">
              <h4 className="text-lg font-medium text-gray-900 mb-2">Suggestions for Improvement</h4>
              <div className="space-y-2">
                {editedSuggestions.map((suggestion, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <span className="text-gray-600 mt-2">•</span>
                    <input
                      type="text"
                      value={suggestion}
                      onChange={(e) => handleSuggestionChange(index, e.target.value)}
                      className="flex-1 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder={`Suggestion ${index + 1}`}
                    />
                  </div>
                ))}
              </div>
            </div>
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
                onClick={handleConfirmEdited}
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

// View/Edit AI Review Modal Component
interface ViewAIReviewCriterionScore {
  criterionId: number;
  criterionName: string;
  criterionDescription?: string;
  criterionType: 'levels' | 'subitems';
  score: number;
  maxPoints: number;
  feedback: string;
  subitemScores?: Array<{
    subitemId: number;
    subitemName: string;
    checked: boolean;
    points: number;
    feedback: string;
  }>;
  subitems?: Array<{
    subitemId: number;
    name: string;
    description?: string;
    points: number;
  }>;
}

interface ViewAIReviewModalProps {
  review: {
    submissionId: number;
    reviewId: number;
    studentName: string;
    submissionTitle: string;
    overallFeedback: string;
    totalScore: number;
    isReleased: boolean;
    criteriaScores: ViewAIReviewCriterionScore[];
  } | null;
  onClose: () => void;
  onRelease: (reviewId: number) => void;
  onSave: (reviewId: number, data: { overallFeedback: string; totalScore: number; criteriaScores: ViewAIReviewCriterionScore[] }) => void;
  isReleasing: boolean;
  isSaving: boolean;
}

function ViewAIReviewModal({ review, onClose, onRelease, onSave, isReleasing, isSaving }: ViewAIReviewModalProps) {
  const [editedOverallFeedback, setEditedOverallFeedback] = useState('');
  const [editedCriteriaScores, setEditedCriteriaScores] = useState<ViewAIReviewCriterionScore[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize state when review changes
  useEffect(() => {
    if (review) {
      setEditedOverallFeedback(review.overallFeedback || '');
      setEditedCriteriaScores(review.criteriaScores.map(cs => ({
        ...cs,
        subitemScores: cs.subitemScores || (cs.subitems?.map(si => ({
          subitemId: si.subitemId,
          subitemName: si.name,
          checked: false,
          points: si.points,
          feedback: ''
        })))
      })));
      setHasChanges(false);
    }
  }, [review]);

  if (!review) return null;

  const totalMaxPoints = editedCriteriaScores.reduce((sum, cs) => sum + cs.maxPoints, 0);
  const calculatedTotalScore = editedCriteriaScores.reduce((sum, cs) => sum + cs.score, 0);
  const percentage = totalMaxPoints > 0 ? Math.round((calculatedTotalScore / totalMaxPoints) * 100) : 0;

  // Handle score change for level-based criterion
  const handleScoreChange = (criterionId: number, newScore: string) => {
    const criterion = editedCriteriaScores.find(c => c.criterionId === criterionId);
    if (!criterion) return;
    
    const scoreValue = Math.max(0, Math.min(criterion.maxPoints, parseFloat(newScore) || 0));
    setEditedCriteriaScores(prev => 
      prev.map(cs => cs.criterionId === criterionId ? { ...cs, score: scoreValue } : cs)
    );
    setHasChanges(true);
  };

  // Handle feedback change for a criterion
  const handleCriterionFeedbackChange = (criterionId: number, newFeedback: string) => {
    setEditedCriteriaScores(prev => 
      prev.map(cs => cs.criterionId === criterionId ? { ...cs, feedback: newFeedback } : cs)
    );
    setHasChanges(true);
  };

  // Handle subitem checked state change
  const handleSubitemCheckedChange = (criterionId: number, subitemId: number, checked: boolean) => {
    setEditedCriteriaScores(prev => 
      prev.map(cs => {
        if (cs.criterionId === criterionId && cs.subitemScores) {
          const updatedSubitems = cs.subitemScores.map(ss => 
            ss.subitemId === subitemId ? { ...ss, checked } : ss
          );
          const newScore = updatedSubitems.filter(ss => ss.checked).reduce((sum, ss) => sum + ss.points, 0);
          return { ...cs, subitemScores: updatedSubitems, score: newScore };
        }
        return cs;
      })
    );
    setHasChanges(true);
  };

  // Handle subitem feedback change
  const handleSubitemFeedbackChange = (criterionId: number, subitemId: number, feedback: string) => {
    setEditedCriteriaScores(prev => 
      prev.map(cs => {
        if (cs.criterionId === criterionId && cs.subitemScores) {
          return {
            ...cs,
            subitemScores: cs.subitemScores.map(ss => 
              ss.subitemId === subitemId ? { ...ss, feedback } : ss
            )
          };
        }
        return cs;
      })
    );
    setHasChanges(true);
  };

  // Handle overall feedback change
  const handleOverallFeedbackChange = (feedback: string) => {
    setEditedOverallFeedback(feedback);
    setHasChanges(true);
  };

  // Handle save
  const handleSave = () => {
    onSave(review.reviewId, {
      overallFeedback: editedOverallFeedback,
      totalScore: calculatedTotalScore,
      criteriaScores: editedCriteriaScores
    });
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-0 border w-11/12 max-w-4xl shadow-lg rounded-lg bg-white mb-10">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b bg-indigo-600 rounded-t-lg">
          <div>
            <h3 className="text-xl font-semibold text-white flex items-center">
              <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit AI Review
            </h3>
            <p className="text-indigo-200 text-sm mt-1">
              {review.studentName} - {review.submissionTitle}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            {review.isReleased ? (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Released
              </span>
            ) : (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-amber-100 text-amber-800">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                Pending
              </span>
            )}
            <button
              onClick={onClose}
              className="text-white hover:text-indigo-200 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {/* Overall Score */}
          <div className="mb-6 p-4 bg-indigo-50 rounded-lg">
            <h4 className="text-lg font-medium text-indigo-900 mb-2">Overall Score</h4>
            <div className="flex items-center">
              <span className="text-3xl font-bold text-indigo-700">{calculatedTotalScore}</span>
              <span className="text-lg text-indigo-600 ml-1">/{totalMaxPoints}</span>
              <span className="ml-3 px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm font-medium">
                {percentage}%
              </span>
            </div>
            <p className="text-xs text-indigo-600 mt-2">Score automatically calculated from criteria below</p>
          </div>

          {/* Overall Feedback - EDITABLE */}
          <div className="mb-6">
            <h4 className="text-lg font-medium text-gray-900 mb-2">Overall Feedback</h4>
            <textarea
              value={editedOverallFeedback}
              onChange={(e) => handleOverallFeedbackChange(e.target.value)}
              className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              rows={5}
              placeholder="Enter overall feedback..."
            />
          </div>

          {/* Criteria Scores - EDITABLE */}
          <div className="mb-6">
            <h4 className="text-lg font-medium text-gray-900 mb-4">Criteria Breakdown</h4>
            <div className="space-y-4">
              {editedCriteriaScores.map((criterion) => {
                const isSubitemBased = criterion.criterionType === 'subitems' && criterion.subitemScores;
                const criterionPercentage = criterion.maxPoints > 0 
                  ? Math.round((criterion.score / criterion.maxPoints) * 100) 
                  : 0;
                
                return (
                  <div key={criterion.criterionId} className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <h5 className="font-medium text-gray-900">{criterion.criterionName}</h5>
                        {isSubitemBased && (
                          <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs rounded-full">
                            Checklist
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        {!isSubitemBased ? (
                          <input
                            type="number"
                            min="0"
                            max={criterion.maxPoints}
                            step="0.5"
                            value={criterion.score}
                            onChange={(e) => handleScoreChange(criterion.criterionId, e.target.value)}
                            className="w-16 px-2 py-1 border border-gray-300 rounded text-center focus:ring-2 focus:ring-indigo-500"
                          />
                        ) : (
                          <span className="font-medium text-indigo-700">{criterion.score}</span>
                        )}
                        <span className="text-gray-600">/ {criterion.maxPoints}</span>
                        <span className={`ml-2 px-2 py-1 rounded text-sm font-medium ${
                          criterionPercentage >= 80 ? 'bg-green-100 text-green-800' :
                          criterionPercentage >= 60 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {criterionPercentage}%
                        </span>
                      </div>
                    </div>
                    
                    {criterion.criterionDescription && (
                      <p className="text-sm text-gray-600 mb-3">{criterion.criterionDescription}</p>
                    )}
                    
                    {/* Subitems UI */}
                    {isSubitemBased && criterion.subitemScores ? (
                      <div className="space-y-3 mb-3">
                        {criterion.subitemScores.map((subitemScore) => (
                          <div key={subitemScore.subitemId} className="bg-white border rounded-lg p-3">
                            <div className="flex items-start space-x-3">
                              <input
                                type="checkbox"
                                checked={subitemScore.checked}
                                onChange={(e) => handleSubitemCheckedChange(
                                  criterion.criterionId, 
                                  subitemScore.subitemId, 
                                  e.target.checked
                                )}
                                className="mt-1 h-5 w-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                              />
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                  <span className={`font-medium ${subitemScore.checked ? 'text-gray-900' : 'text-gray-500'}`}>
                                    {subitemScore.subitemName}
                                  </span>
                                  <span className={`text-sm px-2 py-0.5 rounded ${
                                    subitemScore.checked 
                                      ? 'bg-green-100 text-green-700' 
                                      : 'bg-gray-100 text-gray-500'
                                  }`}>
                                    {subitemScore.checked ? `+${subitemScore.points}` : '0'} / {subitemScore.points} pts
                                  </span>
                                </div>
                                <textarea
                                  value={subitemScore.feedback}
                                  onChange={(e) => handleSubitemFeedbackChange(
                                    criterion.criterionId,
                                    subitemScore.subitemId,
                                    e.target.value
                                  )}
                                  className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                  rows={2}
                                  placeholder={`Feedback for ${subitemScore.subitemName}...`}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : null}
                    
                    {/* Overall criterion feedback */}
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">
                        {isSubitemBased ? 'Overall Category Feedback' : 'Feedback'}
                      </label>
                      <textarea
                        value={criterion.feedback}
                        onChange={(e) => handleCriterionFeedbackChange(criterion.criterionId, e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                        rows={isSubitemBased ? 2 : 3}
                        placeholder={isSubitemBased ? "Overall feedback for this category..." : "Enter feedback for this criterion..."}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-4 border-t bg-gray-50 rounded-b-lg">
          <div className="text-sm text-gray-500">
            {hasChanges && <span className="text-amber-600 font-medium">You have unsaved changes. </span>}
            {review.isReleased 
              ? 'This review has been released to the student.'
              : 'This review is pending release.'}
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || !hasChanges}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center"
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
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Save Changes
                </>
              )}
            </button>
            {!review.isReleased && (
              <button
                onClick={() => onRelease(review.reviewId)}
                disabled={isReleasing || hasChanges}
                title={hasChanges ? "Save changes before releasing" : "Release review to student"}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center"
              >
                {isReleasing ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Releasing...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Release
                  </>
                )}
              </button>
            )}
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
    isHidden?: boolean;
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
    aiReviewId?: number;
    aiReviewReleased?: boolean;
    aiReviewScore?: number;
    aiReviewStatus?: string;
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
  
  // AI Auto-review release state
  const [unreleasedReviewCount, setUnreleasedReviewCount] = useState(0);
  const [isReleasingReviews, setIsReleasingReviews] = useState(false);
  
  // View AI Review modal state
  const [viewingAIReview, setViewingAIReview] = useState<{
    submissionId: number;
    reviewId: number;
    studentName: string;
    submissionTitle: string;
    overallFeedback: string;
    totalScore: number;
    isReleased: boolean;
    criteriaScores: ViewAIReviewCriterionScore[];
  } | null>(null);
  const [isLoadingAIReview, setIsLoadingAIReview] = useState(false);
  const [isReleasingSingleReview, setIsReleasingSingleReview] = useState(false);
  const [isSavingAIReview, setIsSavingAIReview] = useState(false);
  
  // Remove submission state
  const [isRemovingSubmission, setIsRemovingSubmission] = useState<number | null>(null);

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
        fetchUnreleasedReviewCount();
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

  // Fetch unreleased AI review count
  const fetchUnreleasedReviewCount = async () => {
    try {
      const response = await fetch(`/api/assignments/${assignmentId}/release-reviews`);
      
      if (response.ok) {
        const data = await response.json();
        setUnreleasedReviewCount(data.unreleasedCount || 0);
      }
    } catch (error) {
      console.error('Error fetching unreleased review count:', error);
    }
  };

  // Release all AI auto-reviews
  const handleReleaseReviews = async () => {
    const instructorId = localStorage.getItem('userId');
    
    if (!instructorId) {
      alert('You must be logged in to release reviews');
      return;
    }

    if (!confirm(`Are you sure you want to release ${unreleasedReviewCount} AI-generated review(s)? Students will be able to see their feedback immediately.`)) {
      return;
    }

    try {
      setIsReleasingReviews(true);
      
      const response = await fetch(`/api/assignments/${assignmentId}/release-reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          instructorId: instructorId
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to release reviews');
      }
      
      const data = await response.json();
      alert(data.message);
      
      // Refresh the unreleased count
      await fetchUnreleasedReviewCount();
      await fetchSubmissions();
      
    } catch (error) {
      console.error('Error releasing reviews:', error);
      alert(error instanceof Error ? error.message : 'Failed to release reviews');
    } finally {
      setIsReleasingReviews(false);
    }
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

  // View AI Review for a specific submission
  const handleViewAIReview = async (submissionId: number, reviewId: number) => {
    try {
      setIsLoadingAIReview(true);
      
      const userId = localStorage.getItem('userId');
      const userRole = localStorage.getItem('userRole');
      
      // Fetch the review details
      const response = await fetch(`/api/peer-reviews/${reviewId}?userId=${userId}&role=${userRole}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch AI review');
      }
      
      const reviewData = await response.json();
      
      // Find the submission info
      const submission = submissions.find(s => s.id === submissionId);
      
      setViewingAIReview({
        submissionId,
        reviewId,
        studentName: submission?.studentName || reviewData.studentName || 'Unknown',
        submissionTitle: submission?.title || reviewData.submissionTitle || 'Unknown',
        overallFeedback: reviewData.overallFeedback || '',
        totalScore: reviewData.totalScore || 0,
        isReleased: reviewData.isReleased || false,
        criteriaScores: reviewData.scores?.map((score: { 
          criterionId: number; 
          criterionName?: string; 
          criterionDescription?: string;
          criterionType?: string;
          score: number; 
          maxPoints?: number; 
          feedback: string;
          subitemScores?: Array<{
            subitemId: number;
            subitemName: string;
            checked: boolean;
            points: number;
            feedback: string;
          }>;
          subitems?: Array<{
            subitemId: number;
            name: string;
            description?: string;
            points: number;
          }>;
        }) => ({
          criterionId: score.criterionId,
          criterionName: score.criterionName || `Criterion ${score.criterionId}`,
          criterionDescription: score.criterionDescription || '',
          criterionType: (score.criterionType || 'levels') as 'levels' | 'subitems',
          score: score.score,
          maxPoints: score.maxPoints || 0,
          feedback: score.feedback || '',
          subitemScores: score.subitemScores || null,
          subitems: score.subitems || null
        })) || []
      });
      
    } catch (error) {
      console.error('Error fetching AI review:', error);
      alert(error instanceof Error ? error.message : 'Failed to fetch AI review');
    } finally {
      setIsLoadingAIReview(false);
    }
  };

  // Save AI Review changes
  const handleSaveAIReview = async (reviewId: number, data: { 
    overallFeedback: string; 
    totalScore: number; 
    criteriaScores: ViewAIReviewCriterionScore[] 
  }) => {
    const instructorId = localStorage.getItem('userId');
    
    if (!instructorId) {
      alert('You must be logged in to save reviews');
      return;
    }

    try {
      setIsSavingAIReview(true);
      
      const response = await fetch(`/api/peer-reviews/${reviewId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          instructorId: instructorId,
          overallFeedback: data.overallFeedback,
          totalScore: data.totalScore,
          criteriaScores: data.criteriaScores.map(cs => ({
            criterionId: cs.criterionId,
            score: cs.score,
            feedback: cs.feedback,
            subitemScores: cs.subitemScores
          }))
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save review');
      }
      
      alert('Review saved successfully!');
      
      // Update the local state to reflect saved changes
      if (viewingAIReview) {
        setViewingAIReview({
          ...viewingAIReview,
          overallFeedback: data.overallFeedback,
          totalScore: data.totalScore,
          criteriaScores: data.criteriaScores
        });
      }
      
      // Refresh submissions to show updated scores
      await fetchSubmissions();
      
    } catch (error) {
      console.error('Error saving review:', error);
      alert(error instanceof Error ? error.message : 'Failed to save review');
    } finally {
      setIsSavingAIReview(false);
    }
  };

  // Release a single AI review
  const handleReleaseSingleReview = async (reviewId: number) => {
    const instructorId = localStorage.getItem('userId');
    
    if (!instructorId) {
      alert('You must be logged in to release reviews');
      return;
    }

    if (!confirm('Are you sure you want to release this AI review? The student will be able to see their feedback immediately.')) {
      return;
    }

    try {
      setIsReleasingSingleReview(true);
      
      const response = await fetch(`/api/peer-reviews/${reviewId}/release`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          instructorId: instructorId
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to release review');
      }
      
      alert('Review released successfully!');
      
      // Update the viewing state
      if (viewingAIReview) {
        setViewingAIReview({ ...viewingAIReview, isReleased: true });
      }
      
      // Refresh data
      await fetchUnreleasedReviewCount();
      await fetchSubmissions();
      
    } catch (error) {
      console.error('Error releasing review:', error);
      alert(error instanceof Error ? error.message : 'Failed to release review');
    } finally {
      setIsReleasingSingleReview(false);
    }
  };

  // Remove a submission
  const handleRemoveSubmission = async (submissionId: number, studentName: string, submissionTitle: string) => {
    const instructorId = localStorage.getItem('userId');
    
    if (!instructorId) {
      alert('You must be logged in to remove submissions');
      return;
    }

    if (!confirm(`Are you sure you want to remove "${submissionTitle}" by ${studentName}?\n\nThis will permanently delete:\n• The submission content\n• All peer reviews for this submission\n• All attached files\n\nThis action cannot be undone.`)) {
      return;
    }

    try {
      setIsRemovingSubmission(submissionId);
      
      const response = await fetch(`/api/submissions/${submissionId}?instructorId=${instructorId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to remove submission');
      }
      
      const data = await response.json();
      alert(data.message);
      
      // Refresh submissions list
      await fetchSubmissions();
      await fetchUnreleasedReviewCount();
      
    } catch (error) {
      console.error('Error removing submission:', error);
      alert(error instanceof Error ? error.message : 'Failed to remove submission');
    } finally {
      setIsRemovingSubmission(null);
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
                <div className="flex items-center space-x-3">
                  <h1 className="text-3xl font-bold leading-tight text-black">
                    {assignment?.title} Submissions
                  </h1>
                  {assignment?.isHidden && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-orange-100 text-orange-800">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                      Hidden from Students
                    </span>
                  )}
                </div>
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
            {/* AI Auto-Review Release Banner */}
            {unreleasedReviewCount > 0 && (
              <div className="bg-indigo-50 border-l-4 border-indigo-400 p-4 mb-6 rounded-r-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-indigo-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-indigo-700">
                        <strong>{unreleasedReviewCount}</strong> AI-generated review(s) are ready to be released to students.
                        Students currently see &quot;Assessing...&quot; status.
                      </p>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <button
                      onClick={handleReleaseReviews}
                      disabled={isReleasingReviews}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                    >
                      {isReleasingReviews ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Releasing...
                        </>
                      ) : (
                        <>
                          <svg className="-ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Release All Reviews
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

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
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                AI Review
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
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                  {submission.aiReviewId ? (
                                    <div className="flex flex-col space-y-1">
                                      <div className="flex items-center">
                                        {submission.aiReviewReleased ? (
                                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                            </svg>
                                            Released
                                          </span>
                                        ) : (
                                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                            </svg>
                                            Pending
                                          </span>
                                        )}
                                      </div>
                                      {submission.aiReviewScore !== null && submission.aiReviewScore !== undefined && (
                                        <span className="text-xs text-gray-500">
                                          Score: {submission.aiReviewScore}
                                        </span>
                                      )}
                                      <button
                                        onClick={() => handleViewAIReview(submission.id, submission.aiReviewId!)}
                                        className="inline-flex items-center text-xs text-indigo-600 hover:text-indigo-900"
                                      >
                                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                        View Review
                                      </button>
                                    </div>
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
                                    <button
                                      onClick={() => handleRemoveSubmission(submission.id, submission.studentName, submission.title)}
                                      disabled={isRemovingSubmission === submission.id}
                                      className="inline-flex items-center px-2 py-1 text-xs font-medium text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap border border-red-200 rounded hover:bg-red-50"
                                      title="Remove this submission"
                                    >
                                      {isRemovingSubmission === submission.id ? (
                                        <>
                                          <svg className="animate-spin -ml-1 mr-1 h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                          </svg>
                                          Removing...
                                        </>
                                      ) : (
                                        <>
                                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                          </svg>
                                          Remove
                                        </>
                                      )}
                                    </button>
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

      {/* View AI Review Modal */}
      {viewingAIReview && (
        <ViewAIReviewModal
          review={viewingAIReview}
          onClose={() => setViewingAIReview(null)}
          onRelease={handleReleaseSingleReview}
          onSave={handleSaveAIReview}
          isReleasing={isReleasingSingleReview}
          isSaving={isSavingAIReview}
        />
      )}

      {/* Loading overlay for viewing AI review */}
      {isLoadingAIReview && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg flex items-center">
            <svg className="animate-spin h-6 w-6 text-indigo-600 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-gray-700">Loading AI review...</span>
          </div>
        </div>
      )}
    </Layout>
  );
} 