'use client';

import { useState } from 'react';

interface RubricCriterion {
  id: number;
  name: string;
  description: string;
  maxPoints: number;
}

interface AIReviewAnalysisProps {
  criteria: RubricCriterion[];
  scores: {[key: number]: number};
  feedback: {[key: number]: string};
  overallFeedback: string;
  assignment: {
    title: string;
    content: string;
  };
  onAIFeedbackSelect: (feedbackText: string) => void;
  onAIOverallFeedbackSelect: (feedbackText: string) => void;
}

export default function AIReviewAnalysis({
  criteria,
  scores,
  feedback,
  overallFeedback,
  assignment,
  onAIFeedbackSelect,
  onAIOverallFeedbackSelect
}: AIReviewAnalysisProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisGenerated, setAnalysisGenerated] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<{[key: number]: string[]}>({});
  const [aiOverallSuggestion, setAiOverallSuggestion] = useState('');
  const [activeTab, setActiveTab] = useState<'overall' | 'criteria'>('overall');

  // Calculate total score and percentage
  const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0);
  const maxPossibleScore = criteria.reduce((sum, criterion) => sum + criterion.maxPoints, 0);
  const scorePercentage = maxPossibleScore > 0 ? (totalScore / maxPossibleScore) * 100 : 0;

  // Generate AI analysis and suggestions
  const generateAnalysis = () => {
    setIsAnalyzing(true);
    
    // Mock AI analysis generation - in a real app, this would call an AI API
    setTimeout(() => {
      // Generate suggestions for each criterion
      const suggestions: {[key: number]: string[]} = {};
      
      criteria.forEach(criterion => {
        const criterionScore = scores[criterion.id] || 0;
        const scorePercentage = (criterionScore / criterion.maxPoints) * 100;
        const criterionFeedback = feedback[criterion.id] || '';
        
        // Generate different suggestions based on score and existing feedback
        if (scorePercentage < 50) {
          suggestions[criterion.id] = [
            `Your feedback could be more constructive by suggesting specific ways to improve in ${criterion.name.toLowerCase()}.`,
            `Consider providing examples of resources that could help the student improve in this area.`,
            `Be more specific about what elements were missing in the ${criterion.name.toLowerCase()} that led to this score.`
          ];
        } else if (scorePercentage < 80) {
          suggestions[criterion.id] = [
            `Balance your critique with acknowledgment of what the student did well in ${criterion.name.toLowerCase()}.`,
            `Your feedback could be more detailed about which specific aspects need improvement.`,
            `Consider suggesting how the student could take their work to the next level in this area.`
          ];
        } else {
          suggestions[criterion.id] = [
            `For high-scoring work, it's helpful to explain why their approach to ${criterion.name.toLowerCase()} was particularly effective.`,
            `Consider suggesting how the student could apply their strengths in this area to other assignments.`,
            `Even for excellent work, consider one area where they could further excel or challenge themselves.`
          ];
        }
      });
      
      // Generate overall analysis
      let overallSuggestion = '';
      if (scorePercentage < 50) {
        overallSuggestion = `Your overall feedback is quite brief and primarily focuses on weaknesses. Consider balancing this with recognition of any strengths in the work, and providing more specific actionable advice for improvement. Remember that effective feedback should guide the student toward better performance in future assignments.`;
      } else if (scorePercentage < 80) {
        overallSuggestion = `Your feedback is thorough but could benefit from more specific examples or resources to help the student improve. Consider structuring your feedback to clearly separate strengths from areas needing improvement, and provide concrete next steps for the student to focus on.`;
      } else {
        overallSuggestion = `Your feedback for this high-scoring submission appropriately recognizes the strengths of the work. Consider adding suggestions for how the student might challenge themselves further or apply these skills in different contexts. This helps even strong students continue to develop.`;
      }
      
      setAiSuggestions(suggestions);
      setAiOverallSuggestion(overallSuggestion);
      setIsAnalyzing(false);
      setAnalysisGenerated(true);
    }, 1500);
  };

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 mr-2 text-indigo-600">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
          </svg>
          AI Review Analysis
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Get AI-powered suggestions to improve the quality and consistency of your peer review.
        </p>
        
        {!analysisGenerated ? (
          <div className="mt-4">
            <button
              type="button"
              className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                isAnalyzing 
                  ? 'bg-indigo-400 cursor-not-allowed' 
                  : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
              }`}
              onClick={generateAnalysis}
              disabled={isAnalyzing}
            >
              {isAnalyzing ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Analyzing Review...
                </>
              ) : (
                'Analyze My Review'
              )}
            </button>
          </div>
        ) : (
          <div className="mt-4">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('overall')}
                  className={`${
                    activeTab === 'overall'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm`}
                >
                  Overall Analysis
                </button>
                <button
                  onClick={() => setActiveTab('criteria')}
                  className={`${
                    activeTab === 'criteria'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm`}
                >
                  Criteria Suggestions
                </button>
              </nav>
            </div>
            
            {activeTab === 'overall' ? (
              <div className="mt-4">
                <div className="flex items-center mb-4">
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-indigo-600">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h4 className="text-sm font-medium text-gray-900">Review Quality Assessment</h4>
                    <div className="mt-1 flex items-center">
                      <div className="flex items-center">
                        {[0, 1, 2, 3, 4].map((rating) => (
                          <svg
                            key={rating}
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            className={`h-5 w-5 ${
                              scorePercentage >= 20 * (rating + 1)
                                ? 'text-yellow-400'
                                : 'text-gray-200'
                            }`}
                          >
                            <path
                              fillRule="evenodd"
                              d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z"
                              clipRule="evenodd"
                            />
                          </svg>
                        ))}
                      </div>
                      <span className="ml-2 text-sm text-gray-500">
                        {scorePercentage < 40 ? 'Needs improvement' : 
                         scorePercentage < 70 ? 'Good' : 
                         scorePercentage < 90 ? 'Very good' : 'Excellent'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-indigo-50 p-4 rounded-md">
                  <p className="text-sm text-gray-700">{aiOverallSuggestion}</p>
                  
                  <button
                    type="button"
                    className="mt-3 inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    onClick={() => onAIOverallFeedbackSelect(aiOverallSuggestion)}
                  >
                    Apply This Suggestion
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-4 space-y-4">
                {criteria.map((criterion) => (
                  <div key={criterion.id} className="border rounded-md p-4">
                    <h4 className="text-sm font-medium text-gray-900">{criterion.name}</h4>
                    <p className="mt-1 text-xs text-gray-500">Your score: {scores[criterion.id] || 0}/{criterion.maxPoints}</p>
                    
                    {aiSuggestions[criterion.id] && (
                      <div className="mt-2 space-y-2">
                        {aiSuggestions[criterion.id].map((suggestion, idx) => (
                          <div key={idx} className="bg-indigo-50 p-3 rounded-md">
                            <p className="text-sm text-gray-700">{suggestion}</p>
                            <button
                              type="button"
                              className="mt-2 inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                              onClick={() => onAIFeedbackSelect(suggestion)}
                            >
                              Apply This Suggestion
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 