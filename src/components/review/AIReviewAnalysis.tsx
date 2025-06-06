'use client';

import { useState } from 'react';
import OpenAI from 'openai';

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
  onAIFeedbackSelect: (criterionId: number, feedbackText: string) => void;
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

  // Function to extract text between quotes from AI suggestions
  const extractQuotedText = (suggestion: string): string => {
    console.log('Extracting from suggestion:', suggestion);
    
    // First, try to find text after "Revised Feedback Example:" pattern (case insensitive)
    const exampleMatch = suggestion.match(/Revised\s+Feedback\s+Example:\s*[""]([^"""]*?)[""]/) || 
                        suggestion.match(/Revised\s+Feedback\s+Example:\s*"([^"]*?)"/i);
    if (exampleMatch && exampleMatch[1] && exampleMatch[1].trim()) {
      console.log('Found example match:', exampleMatch[1].trim());
      return exampleMatch[1].trim();
    }
    
    // Fall back to looking for any text between quotes (more greedy)
    const quoteMatch = suggestion.match(/[""]([^"""]+?)[""]/) || 
                      suggestion.match(/"([^"]+?)"/) ||
                      suggestion.match(/['']([^''']+?)['']/);
    if (quoteMatch && quoteMatch[1] && quoteMatch[1].trim()) {
      console.log('Found quote match:', quoteMatch[1].trim());
      return quoteMatch[1].trim();
    }
    
    console.log('No quotes found, returning original');
    // If no quotes found, return the original suggestion
    return suggestion.trim();
  };

  // Generate AI analysis and suggestions
  const generateAnalysis = async () => {
    setIsAnalyzing(true);
    
    try {
      // Initialize OpenAI client
      const openai = new OpenAI({
        apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY || '',
        dangerouslyAllowBrowser: true
      });
      
      // Prepare data for OpenAI API
      const criteriaData = criteria.map(criterion => {
        const criterionScore = scores[criterion.id] || 0;
        const scorePercentage = (criterionScore / criterion.maxPoints) * 100;
        const criterionFeedback = feedback[criterion.id] || '';
        
        return {
          name: criterion.name,
          description: criterion.description,
          maxPoints: criterion.maxPoints,
          score: criterionScore,
          feedback: criterionFeedback
        };
      });
      
      // Generate prompt for overall feedback
      const overallPrompt = `
        You are an AI assistant helping a student improve their peer review feedback.
        
        Assignment: ${assignment.title}
        Assignment Description: ${assignment.content}
        
        Overall feedback provided: "${overallFeedback}"
        
        Total score: ${totalScore}/${maxPossibleScore} (${scorePercentage.toFixed(2)}%)
        
        Please provide constructive suggestions to improve the overall feedback. Focus on making the feedback more helpful, specific, and balanced. Keep your response concise and actionable.
      `;
      
      // Call OpenAI API for overall feedback
      const overallResponse = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant that provides constructive feedback suggestions for peer reviews. Be specific, actionable, and encouraging."
          },
          {
            role: "user",
            content: overallPrompt
          }
        ],
        max_tokens: 500,
        temperature: 0.85
      });
      
      const overallSuggestion = overallResponse.choices[0]?.message?.content || "No suggestion available";
      
      // Generate criteria-specific suggestions
      const suggestions: {[key: number]: string[]} = {};
      
      // Process each criterion sequentially
      for (const criterion of criteria) {
        const criterionScore = scores[criterion.id] || 0;
        const scorePercentage = (criterionScore / criterion.maxPoints) * 100;
        const criterionFeedback = feedback[criterion.id] || '';
        
        const criterionPrompt = `
          You are an AI assistant helping a student improve their peer review feedback.
          Assignment: ${assignment.title}
          Assignment Description: ${assignment.content}
          Criterion: ${criterion.name}
          Description: ${criterion.description}
          Max Points: ${criterion.maxPoints}
          Score Given: ${criterionScore} (${scorePercentage.toFixed(2)}%)
          Feedback Provided: "${criterionFeedback}"
          
          Your tasks:

          1. Suggest 1 specific improvement to the feedback for this criterion to the reviewer. The suggestion should be concise and actionable.
          2. After the suggestion, provide a single revised version of the feedback as if written by the reviewer, incorporating the improvement. Write it in the reviewer's voice.

          Format your response as:
          1. [suggestion]. Revised Feedback Example: "[your rewritten reviewer feedback here]"
          
        `;
        
        const criterionResponse = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: "You are a helpful assistant that provides constructive feedback suggestions for peer reviews. Provide exactly 1 numbered suggestion."
            },
            {
              role: "user",
              content: criterionPrompt
            }
          ],
          max_tokens: 300,
          temperature: 0.6
        });
        
        const criterionSuggestions = criterionResponse.choices[0]?.message?.content || "No suggestions available";
        
        // Parse the response more carefully to preserve the full suggestions
        // Split by lines starting with numbers (1., 2., 3., etc.)
        const suggestionList = criterionSuggestions
          .split(/(?=\d+\.\s)/)
          .filter(Boolean)
          .map((suggestion: string) => suggestion.trim())
          .filter((suggestion: string) => suggestion.length > 10) // Filter out very short fragments
          .slice(0, 1); // Take only first 1 suggestion
        
        console.log('Raw AI response:', criterionSuggestions);
        console.log('Parsed suggestions:', suggestionList);
        
        suggestions[criterion.id] = suggestionList.length > 0 ? suggestionList : [criterionSuggestions];
      }
      
      setAiSuggestions(suggestions);
      setAiOverallSuggestion(overallSuggestion);
    } catch (error) {
      console.error('Error generating AI feedback:', error);
      // Fallback to mock data if API call fails
      const suggestions: {[key: number]: string[]} = {};
      
      criteria.forEach(criterion => {
        suggestions[criterion.id] = [
          `Unable to connect to OpenAI API. Please check your API key and network connection.`,
          `You can try again later or provide feedback manually.`,
          `Consider checking specific aspects of ${criterion.name.toLowerCase()} when writing feedback.`
        ];
      });
      
      setAiSuggestions(suggestions);
      setAiOverallSuggestion('Unable to connect to OpenAI API. Please check your API key and network connection and try again.');
    } finally {
      setIsAnalyzing(false);
      setAnalysisGenerated(true);
    }
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
                  type="button"
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
                  type="button"
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
                    onClick={() => onAIOverallFeedbackSelect(extractQuotedText(aiOverallSuggestion))}
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
                              onClick={() => {
                                const extractedText = extractQuotedText(suggestion);
                                console.log('Button clicked - extracted text:', extractedText);
                                onAIFeedbackSelect(criterion.id, extractedText);
                              }}
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