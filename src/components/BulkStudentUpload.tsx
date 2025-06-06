'use client';

import React, { useState, useRef } from 'react';
import Papa from 'papaparse';

interface BulkUploadResult {
  email: string;
  status: 'success' | 'error' | 'already_enrolled' | 'already_invited';
  message: string;
  name?: string;
}

interface BulkUploadSummary {
  total: number;
  successful: number;
  errors: number;
  alreadyEnrolled: number;
  alreadyInvited: number;
}

interface BulkStudentUploadProps {
  courseId: string;
  onComplete?: () => void;
}

export default function BulkStudentUpload({ courseId, onComplete }: BulkStudentUploadProps) {
  const [emails, setEmails] = useState<string[]>([]);
  const [rawTextInput, setRawTextInput] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState<{
    summary: BulkUploadSummary;
    results: BulkUploadResult[];
  } | null>(null);
  const [showResults, setShowResults] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    
    if (fileExtension === 'csv') {
      // Parse CSV file
      Papa.parse(file, {
        complete: (results) => {
          const extractedEmails = extractEmailsFromData(results.data);
          setEmails(extractedEmails);
          setRawTextInput(extractedEmails.join('\n'));
        },
        header: true,
        skipEmptyLines: true
      });
    } else {
      alert('Please upload a CSV file. For Excel files, please save as CSV first.');
    }
  };

  const extractEmailsFromData = (data: any[]): string[] => {
    const emails: string[] = [];
    
    data.forEach((row) => {
      // Look for email in various possible column names
      const possibleEmailKeys = ['email', 'Email', 'EMAIL', 'e-mail', 'E-mail', 'student_email', 'studentEmail'];
      
      for (const key of possibleEmailKeys) {
        if (row[key] && typeof row[key] === 'string' && row[key].includes('@')) {
          const email = row[key].trim();
          if (email && !emails.includes(email)) {
            emails.push(email);
          }
          break;
        }
      }
      
      // If no email column found, check if any value in the row looks like an email
      if (emails.length === 0) {
        Object.values(row).forEach((value) => {
          if (typeof value === 'string' && value.includes('@') && !emails.includes(value.trim())) {
            emails.push(value.trim());
          }
        });
      }
    });
    
    return emails;
  };

  const parseEmailsFromText = (text: string): string[] => {
    return text
      .split(/[\n,;]/)
      .map(email => email.trim())
      .filter(email => email.length > 0 && email.includes('@'));
  };

  const handleTextareaChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = event.target.value;
    setRawTextInput(text);
    
    const parsedEmails = parseEmailsFromText(text);
    if (JSON.stringify(parsedEmails) !== JSON.stringify(emails)) {
      setEmails(parsedEmails);
    }
  };

  const sendBulkInvitations = async () => {
    const currentEmails = parseEmailsFromText(rawTextInput);
    
    if (currentEmails.length === 0) {
      alert('Please add some email addresses first.');
      return;
    }

    setIsUploading(true);
    setUploadResults(null);

    try {
      const response = await fetch(`/api/courses/${courseId}/bulk-invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ emails: currentEmails }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send invitations');
      }

      const result = await response.json();
      setUploadResults(result);
      setShowResults(true);
      
      if (onComplete) {
        onComplete();
      }
    } catch (error) {
      console.error('Error sending bulk invitations:', error);
      alert(error instanceof Error ? error.message : 'Failed to send invitations');
    } finally {
      setIsUploading(false);
    }
  };

  const clearEmails = () => {
    setEmails([]);
    setRawTextInput('');
    setUploadResults(null);
    setShowResults(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600';
      case 'error': return 'text-red-600';
      case 'already_enrolled': return 'text-blue-600';
      case 'already_invited': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'already_enrolled': return '👤';
      case 'already_invited': return '📧';
      default: return '❓';
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-xl font-semibold mb-4">📊 Bulk Add Students</h3>
      
      {!showResults ? (
        <>
          {/* File Upload Section */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload CSV File
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            <p className="text-xs text-gray-500 mt-1">
              Upload a CSV file with email addresses. The file should have an 'email' column or emails will be auto-detected.
            </p>
          </div>

          {/* Manual Entry Section */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Or Enter Emails Manually
            </label>
            <textarea
              value={rawTextInput}
              onChange={handleTextareaChange}
              placeholder="Enter email addresses (one per line, or separated by commas)&#10;example1@email.com&#10;example2@email.com, example3@email.com"
              rows={8}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {emails.length > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                ✅ {emails.length} valid email{emails.length !== 1 ? 's' : ''} detected
              </p>
            )}
          </div>

          {/* Preview Section */}
          {emails.length > 0 && (
            <div className="mb-6">
              <h4 className="text-lg font-medium mb-2">Preview ({emails.length} emails)</h4>
              <div className="bg-gray-50 p-4 rounded-lg max-h-40 overflow-y-auto">
                {emails.slice(0, 10).map((email, index) => (
                  <div key={index} className="text-sm text-gray-700 py-1">
                    {index + 1}. {email}
                  </div>
                ))}
                {emails.length > 10 && (
                  <div className="text-sm text-gray-500 italic">
                    ... and {emails.length - 10} more
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={sendBulkInvitations}
              disabled={isUploading || emails.length === 0}
              className={`flex-1 py-2 px-4 rounded-lg font-medium ${
                isUploading || emails.length === 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isUploading ? (
                <span className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Sending Invitations...
                </span>
              ) : (
                `Send Invitations (${emails.length})`
              )}
            </button>
            
            <button
              onClick={clearEmails}
              disabled={isUploading}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Clear
            </button>
          </div>
        </>
      ) : (
        /* Results Section */
        uploadResults && (
          <div>
            {/* Summary */}
            <div className="bg-blue-50 p-4 rounded-lg mb-6">
              <h4 className="text-lg font-semibold mb-3">📈 Bulk Invitation Summary</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{uploadResults.summary.total}</div>
                  <div className="text-sm text-gray-600">Total Processed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{uploadResults.summary.successful}</div>
                  <div className="text-sm text-gray-600">Successful</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{uploadResults.summary.alreadyEnrolled}</div>
                  <div className="text-sm text-gray-600">Already Enrolled</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{uploadResults.summary.errors}</div>
                  <div className="text-sm text-gray-600">Errors</div>
                </div>
              </div>
            </div>

            {/* Detailed Results */}
            <div className="mb-6">
              <h4 className="text-lg font-semibold mb-3">📋 Detailed Results</h4>
              <div className="max-h-80 overflow-y-auto border border-gray-200 rounded-lg">
                {uploadResults.results.map((result, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border-b border-gray-100 last:border-b-0">
                    <div className="flex items-center space-x-3">
                      <span className="text-lg">{getStatusIcon(result.status)}</span>
                      <div>
                        <div className="font-medium text-gray-900">
                          {result.email}
                          {result.name && (
                            <span className="text-gray-500 ml-2">({result.name})</span>
                          )}
                        </div>
                        <div className={`text-sm ${getStatusColor(result.status)}`}>
                          {result.message}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowResults(false);
                  clearEmails();
                }}
                className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                ✨ Add More Students
              </button>
              <button
                onClick={() => setShowResults(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Close Results
              </button>
            </div>
          </div>
        )
      )}
    </div>
  );
} 