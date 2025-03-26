'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '../../../components/layout/Layout';
import Link from 'next/link';

export default function CreateRubric() {
  const router = useRouter();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    assignmentId: ''
  });
  
  const [criteria, setCriteria] = useState<Array<{
    name: string;
    description: string;
    maxPoints: number;
    weight: number;
  }>>([
    { name: '', description: '', maxPoints: 10, weight: 1.0 }
  ]);
  
  const [availableAssignments, setAvailableAssignments] = useState<Array<{
    id: number;
    title: string;
    courseId: number;
    courseName: string;
  }>>([]);

  // Check if user is authorized (must be an instructor)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const role = localStorage.getItem('userRole');
      const userId = localStorage.getItem('userId');
      
      setUserRole(role);
      
      // If not an instructor, redirect to dashboard
      if (role !== 'instructor') {
        router.push('/dashboard');
      } else if (userId) {
        // Fetch available assignments for this instructor
        fetchInstructorAssignments(userId);
      }
    }
  }, [router]);

  // Fetch assignments that this instructor has created
  const fetchInstructorAssignments = async (instructorId: string) => {
    try {
      const response = await fetch(`/api/instructors/${instructorId}/assignments`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch assignments');
      }
      
      const data = await response.json();
      setAvailableAssignments(data.assignments || []);
    } catch (error) {
      console.error('Error fetching assignments:', error);
      // Non-critical error, so we don't show it to the user
    }
  };

  // Handle input changes for the main form
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Handle changes to criteria
  const handleCriterionChange = (index: number, field: string, value: string | number) => {
    const newCriteria = [...criteria];
    newCriteria[index] = { 
      ...newCriteria[index], 
      [field]: field === 'maxPoints' || field === 'weight' ? Number(value) : value 
    };
    setCriteria(newCriteria);
  };

  // Add a new criterion
  const addCriterion = () => {
    setCriteria([...criteria, { name: '', description: '', maxPoints: 10, weight: 1.0 }]);
  };

  // Remove a criterion
  const removeCriterion = (index: number) => {
    if (criteria.length > 1) {
      const newCriteria = [...criteria];
      newCriteria.splice(index, 1);
      setCriteria(newCriteria);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form inputs
    if (!formData.name.trim()) {
      setError('Rubric name is required');
      return;
    }
    
    // Validate assignment selection
    if (!formData.assignmentId) {
      setError('Please select an assignment for this rubric');
      return;
    }
    
    // Validate criteria
    const invalidCriteriaIndex = criteria.findIndex(c => !c.name.trim());
    if (invalidCriteriaIndex !== -1) {
      setError(`Criterion ${invalidCriteriaIndex + 1} name is required`);
      return;
    }
    
    // All validation passed, submit the form
    try {
      setIsLoading(true);
      setError(null);
      
      // Create the rubric first
      const rubricResponse = await fetch('/api/rubrics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          assignmentId: parseInt(formData.assignmentId)
        })
      });
      
      if (!rubricResponse.ok) {
        const data = await rubricResponse.json();
        throw new Error(data.error || 'Failed to create rubric');
      }
      
      const rubricData = await rubricResponse.json();
      const rubricId = rubricData.rubric.id;
      
      // Then add all criteria
      for (const criterion of criteria) {
        const criterionResponse = await fetch(`/api/rubrics/${rubricId}/criteria`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            title: criterion.name,
            description: criterion.description,
            maxPoints: criterion.maxPoints,
            weight: criterion.weight
          })
        });
        
        if (!criterionResponse.ok) {
          const data = await criterionResponse.json();
          throw new Error(data.error || 'Failed to create criteria');
        }
      }
      
      // Success! Show message briefly then redirect
      setSuccessMessage('Rubric created successfully');
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
      
    } catch (error) {
      console.error('Error creating rubric:', error);
      setError(error instanceof Error ? error.message : 'Failed to create rubric. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // If not authorized, show loading state
  if (userRole !== 'instructor') {
    return (
      <Layout>
        <div className="py-10 flex justify-center items-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="py-10">
        <header>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="md:flex md:items-center md:justify-between">
              <div className="flex-1 min-w-0">
                <h1 className="text-3xl font-bold leading-tight text-black">
                  Create New Rubric
                </h1>
              </div>
              <div className="mt-4 flex md:mt-0 md:ml-4">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                >
                  Cancel
                </Link>
              </div>
            </div>
          </div>
        </header>

        <main>
          <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
            {/* Success Message */}
            {successMessage && (
              <div className="rounded-md bg-green-50 p-4 mb-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-green-800">
                      {successMessage}
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Error Message */}
            {error && (
              <div className="rounded-md bg-red-50 p-4 mb-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-red-800">
                      {error}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <form onSubmit={handleSubmit}>
                <div className="px-4 py-5 sm:p-6">
                  <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                    {/* Rubric Name */}
                    <div className="sm:col-span-4">
                      <label htmlFor="name" className="block text-sm font-medium text-black-700">
                        Rubric Name *
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          name="name"
                          id="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          className="shadow-sm focus:ring-purple-500 focus:border-purple-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          placeholder="e.g., Essay Evaluation Rubric"
                          required
                        />
                      </div>
                    </div>

                    {/* Assignment (Optional) */}
                    <div className="sm:col-span-4">
                      <label htmlFor="assignmentId" className="block text-sm font-medium text-gray-700">
                        Assignment *
                      </label>
                      <div className="mt-1">
                        <select
                          id="assignmentId"
                          name="assignmentId"
                          value={formData.assignmentId}
                          onChange={handleInputChange}
                          className="shadow-sm focus:ring-purple-500 focus:border-purple-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          required
                        >
                          <option value="">Select an assignment</option>
                          {availableAssignments.map(assignment => (
                            <option key={assignment.id} value={assignment.id}>
                              {assignment.title} - {assignment.courseName}
                            </option>
                          ))}
                        </select>
                      </div>
                      <p className="mt-2 text-sm text-gray-500">
                        Please select the assignment this rubric will be used for
                      </p>
                    </div>

                    {/* Description */}
                    <div className="sm:col-span-6">
                      <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                        Description
                      </label>
                      <div className="mt-1">
                        <textarea
                          id="description"
                          name="description"
                          rows={3}
                          value={formData.description}
                          onChange={handleInputChange}
                          className="shadow-sm focus:ring-purple-500 focus:border-purple-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          placeholder="Describe the purpose of this rubric"
                        />
                      </div>
                    </div>

                    {/* Criteria Section */}
                    <div className="sm:col-span-6">
                      <div className="pb-5 border-b border-gray-200">
                        <h3 className="text-lg leading-6 font-medium text-black">Assessment Criteria</h3>
                        <p className="mt-1 text-sm text-gray-500">
                          Define the criteria that will be used to evaluate submissions.
                        </p>
                      </div>
                      
                      {criteria.map((criterion, index) => (
                        <div key={index} className="mt-6 pt-6 border-t border-gray-200">
                          <div className="flex justify-between items-center mb-4">
                            <h4 className="text-md font-medium text-gray-900">Criterion {index + 1}</h4>
                            {criteria.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeCriterion(index)}
                                className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm leading-5 font-medium rounded-md text-red-700 bg-white hover:bg-gray-50"
                              >
                                Remove
                              </button>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                            {/* Criterion Name */}
                            <div className="sm:col-span-6">
                              <label htmlFor={`criterion-${index}-name`} className="block text-sm font-medium text-gray-700">
                                Name *
                              </label>
                              <div className="mt-1">
                                <input
                                  type="text"
                                  id={`criterion-${index}-name`}
                                  value={criterion.name}
                                  onChange={(e) => handleCriterionChange(index, 'name', e.target.value)}
                                  className="shadow-sm focus:ring-purple-500 focus:border-purple-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                  placeholder="e.g., Content Quality"
                                  required
                                />
                              </div>
                            </div>

                            {/* Criterion Description */}
                            <div className="sm:col-span-6">
                              <label htmlFor={`criterion-${index}-description`} className="block text-sm font-medium text-gray-700">
                                Description
                              </label>
                              <div className="mt-1">
                                <textarea
                                  id={`criterion-${index}-description`}
                                  value={criterion.description}
                                  onChange={(e) => handleCriterionChange(index, 'description', e.target.value)}
                                  rows={2}
                                  className="shadow-sm focus:ring-purple-500 focus:border-purple-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                  placeholder="Describe what this criterion evaluates"
                                />
                              </div>
                            </div>

                            {/* Max Points */}
                            <div className="sm:col-span-3">
                              <label htmlFor={`criterion-${index}-points`} className="block text-sm font-medium text-gray-700">
                                Maximum Points
                              </label>
                              <div className="mt-1">
                                <input
                                  type="number"
                                  id={`criterion-${index}-points`}
                                  value={criterion.maxPoints}
                                  onChange={(e) => handleCriterionChange(index, 'maxPoints', e.target.value)}
                                  min="1"
                                  max="100"
                                  className="shadow-sm focus:ring-purple-500 focus:border-purple-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                />
                              </div>
                            </div>

                            {/* Weight */}
                            <div className="sm:col-span-3">
                              <label htmlFor={`criterion-${index}-weight`} className="block text-sm font-medium text-gray-700">
                                Weight
                              </label>
                              <div className="mt-1">
                                <input
                                  type="number"
                                  id={`criterion-${index}-weight`}
                                  value={criterion.weight}
                                  onChange={(e) => handleCriterionChange(index, 'weight', e.target.value)}
                                  min="0.1"
                                  max="10"
                                  step="0.1"
                                  className="shadow-sm focus:ring-purple-500 focus:border-purple-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                />
                              </div>
                              <p className="mt-2 text-xs text-gray-500">
                                Weight determines the relative importance of this criterion (default: 1.0)
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      <div className="mt-6">
                        <button
                          type="button"
                          onClick={addCriterion}
                          className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                        >
                          <svg className="-ml-1 mr-2 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                          </svg>
                          Add Criterion
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 pt-5 border-t border-gray-200 flex justify-end">
                    <Link
                      href="/dashboard"
                      className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                    >
                      Cancel
                    </Link>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
                    >
                      {isLoading ? 'Creating...' : 'Create Rubric'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </main>
      </div>
    </Layout>
  );
}