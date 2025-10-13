'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '../../../../components/layout/Layout';
import Link from 'next/link';

interface RubricCriterion {
  id: number;
  title: string;
  description: string;
  points: number;
  levels: {
    id: number;
    description: string;
    score: number;
  }[];
}

export default function EditRubric({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const rubricId = React.use(params).id;
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [rubricName, setRubricName] = useState('');
  const [rubricDescription, setRubricDescription] = useState('');
  const [assignmentIds, setAssignmentIds] = useState<number[]>([]);
  const [criteria, setCriteria] = useState<RubricCriterion[]>([]);
  const [availableAssignments, setAvailableAssignments] = useState<Array<{
    id: number;
    title: string;
    courseId: number;
    courseName: string;
    hasRubric: boolean;
  }>>([]);
  const [isDirty, setIsDirty] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

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
        // Load rubric data and available assignments
        fetchRubricData();
        fetchInstructorAssignments(userId);
      }
    }
  }, [router, rubricId]);

  // Fetch rubric data from API
  const fetchRubricData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch rubric details
      const response = await fetch(`/api/rubrics/${rubricId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch rubric');
      }
      
      const data = await response.json();
      
      setRubricName(data.name);
      setRubricDescription(data.description || '');
      setAssignmentIds(data.assignments ? data.assignments.map((a: any) => a.id) : []);
      setCriteria(data.criteria ? data.criteria.map((criterion: any) => ({
        id: criterion.id,
        title: criterion.name,
        description: criterion.description || '',
        points: criterion.max_points,
        levels: criterion.levels ? criterion.levels.map((level: any) => ({
          id: level.id,
          description: level.description,
          score: level.score
        })) : []
      })) : []);
      
      setIsLoading(false);
      setIsDirty(false);
    } catch (error) {
      console.error('Error fetching rubric data:', error);
      router.push('/dashboard');
    }
  };

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
    }
  };

  // Handle assignment selection changes
  const handleAssignmentChange = (assignmentId: number, isChecked: boolean) => {
    // Check if assignment already has a different rubric
    const assignment = availableAssignments.find(a => a.id === assignmentId);
    const isCurrentlyAssigned = assignmentIds.includes(assignmentId);
    
    if (assignment?.hasRubric && isChecked && !isCurrentlyAssigned) {
      // Assignment already has a rubric and we're trying to add it to this rubric
      // This should be prevented
      return;
    }

    setAssignmentIds(prev => {
      const newIds = isChecked 
        ? [...prev, assignmentId]
        : prev.filter(id => id !== assignmentId);
      setIsDirty(true);
      return newIds;
    });
  };

  // Add a new criterion
  const addCriterion = () => {
    const newId = criteria.length > 0 ? Math.max(...criteria.map(c => c.id)) + 1 : 1;
    const newCriterion: RubricCriterion = {
      id: newId,
      title: 'New Criterion',
      description: 'Description of this criterion',
      points: 10,
      levels: [
        { id: 1, description: 'Does not meet expectations', score: 2 },
        { id: 2, description: 'Partially meets expectations', score: 5 },
        { id: 3, description: 'Meets expectations', score: 8 },
        { id: 4, description: 'Exceeds expectations', score: 10 },
      ]
    };
    
    setCriteria([...criteria, newCriterion]);
    setIsDirty(true);
  };

  // Remove a criterion
  const removeCriterion = (id: number) => {
    setCriteria(criteria.filter(c => c.id !== id));
    setIsDirty(true);
  };

  // Update criterion title
  const updateCriterionTitle = (id: number, title: string) => {
    setCriteria(criteria.map(c => 
      c.id === id ? { ...c, title } : c
    ));
    setIsDirty(true);
  };

  // Update criterion description
  const updateCriterionDescription = (id: number, description: string) => {
    setCriteria(criteria.map(c => 
      c.id === id ? { ...c, description } : c
    ));
    setIsDirty(true);
  };

  // Update criterion points
  const updateCriterionPoints = (id: number, points: number) => {
    setCriteria(criteria.map(c => 
      c.id === id ? { ...c, points } : c
    ));
    setIsDirty(true);
  };

  // Update level description
  const updateLevelDescription = (criterionId: number, levelId: number, description: string) => {
    setCriteria(criteria.map(c => 
      c.id === criterionId 
        ? { 
            ...c, 
            levels: c.levels.map(l => 
              l.id === levelId ? { ...l, description } : l
            ) 
          } 
        : c
    ));
    setIsDirty(true);
  };

  // Update level score
  const updateLevelScore = (criterionId: number, levelId: number, score: number) => {
    setCriteria(criteria.map(c => 
      c.id === criterionId 
        ? { 
            ...c, 
            levels: c.levels.map(l => 
              l.id === levelId ? { ...l, score } : l
            ) 
          } 
        : c
    ));
    setIsDirty(true);
  };

  // Add a new level to a criterion
  const addLevel = (criterionId: number) => {
    setCriteria(criteria.map(c => {
      if (c.id === criterionId) {
        const newLevelId = c.levels.length > 0 ? Math.max(...c.levels.map(l => l.id)) + 1 : 1;
        return {
          ...c,
          levels: [
            ...c.levels,
            { 
              id: newLevelId, 
              description: 'New level description', 
              score: Math.round(c.points / 4) // Default to 1/4 of points
            }
          ]
        };
      }
      return c;
    }));
    setIsDirty(true);
  };

  // Remove a level from a criterion
  const removeLevel = (criterionId: number, levelId: number) => {
    setCriteria(criteria.map(c => {
      if (c.id === criterionId) {
        if (c.levels.length <= 1) {
          return c; // Don't remove the last level
        }
        return {
          ...c,
          levels: c.levels.filter(l => l.id !== levelId)
        };
      }
      return c;
    }));
    setIsDirty(true);
  };

  // Save changes
  const saveRubric = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Update rubric details
      const rubricResponse = await fetch(`/api/rubrics/${rubricId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: rubricName,
          description: rubricDescription,
          assignmentIds: assignmentIds
        }),
      });
      
      if (!rubricResponse.ok) {
        const errorData = await rubricResponse.json();
        throw new Error(errorData.error || 'Failed to update rubric');
      }
      
      // Update criteria - in a real implementation, we'd need to handle
      // creating, updating, and deleting criteria as needed
      const criteriaPromises = criteria.map(async (criterion) => {
        // This is simplified - in a real app, we'd need to check if this is a new or existing criterion
        const criterionResponse = await fetch(`/api/rubrics/${rubricId}/criteria/${criterion.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: criterion.title,
            description: criterion.description,
            maxPoints: criterion.points,
            levels: criterion.levels.map(level => ({
              id: level.id,
              description: level.description,
              score: level.score
            }))
          }),
        });
        
        if (!criterionResponse.ok) {
          const errorData = await criterionResponse.json();
          throw new Error(errorData.error || 'Failed to update criterion');
        }
      });
      
      await Promise.all(criteriaPromises);
      
      setIsLoading(false);
      setIsDirty(false);
      setSuccessMessage('Rubric saved successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error saving rubric:', error);
      setIsLoading(false);
      setError(error instanceof Error ? error.message : 'Failed to save rubric. Please try again.');
      setTimeout(() => setError(null), 5000);
    }
  };

  // Delete the rubric
  const deleteRubric = async () => {
    try {
      setIsLoading(true);
      
      // Call the API to delete the rubric
      const response = await fetch(`/api/rubrics/${rubricId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete rubric');
      }
      
      // Redirect to the dashboard after successful deletion
      router.push('/dashboard');
      
    } catch (error) {
      console.error('Error deleting rubric:', error);
      setIsLoading(false);
      // Here we could show an error message to the user
    }
  };

  // If not authorized or still loading, show loading state
  if (userRole !== 'instructor' || isLoading) {
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
                  Edit Rubric
                </h1>
              </div>
              <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
                <button
                  onClick={() => setShowDeleteConfirmation(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Delete Rubric
                </button>
                <Link 
                  href="/rubrics"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                >
                  Cancel
                </Link>
                <button
                  onClick={saveRubric}
                  disabled={!isDirty}
                  className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                    isDirty 
                      ? 'bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500' 
                      : 'bg-purple-300 cursor-not-allowed'
                  }`}
                >
                  Save Rubric
                </button>
              </div>
            </div>
          </div>
        </header>
        <main>
          <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
            {/* Delete Confirmation Dialog */}
            {showDeleteConfirmation && (
              <div className="fixed z-10 inset-0 overflow-y-auto">
                <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                  <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                    <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                  </div>
                  <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                  <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
                    <div>
                      <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                        <svg className="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      </div>
                      <div className="mt-3 text-center sm:mt-5">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">
                          Delete Rubric
                        </h3>
                        <div className="mt-2">
                          <p className="text-sm text-gray-500">
                            Are you sure you want to delete this rubric? This action cannot be undone.
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                      <button
                        type="button"
                        onClick={deleteRubric}
                        className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:col-start-2 sm:text-sm"
                      >
                        Delete
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowDeleteConfirmation(false)}
                        className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

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
            
            {/* Rubric Details */}
            <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
              <div className="px-4 py-5 sm:p-6">
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <label htmlFor="rubric-name" className="block text-sm font-medium text-gray-700">
                      Rubric Name
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        name="rubric-name"
                        id="rubric-name"
                        value={rubricName}
                        onChange={(e) => {
                          setRubricName(e.target.value);
                          setIsDirty(true);
                        }}
                        className="shadow-sm focus:ring-purple-500 focus:border-purple-500 block w-full sm:text-sm border-gray-300 rounded-md placeholder-gray-700"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Assignments
                    </label>
                    <div className="mt-1 space-y-2 max-h-40 overflow-y-auto border border-gray-300 rounded-md p-3">
                      {availableAssignments.length === 0 ? (
                        <p className="text-sm text-gray-500">No assignments available</p>
                      ) : (
                        availableAssignments.map(assignment => {
                          const isCurrentlyAssigned = assignmentIds.includes(assignment.id);
                          const hasOtherRubric = assignment.hasRubric && !isCurrentlyAssigned;
                          return (
                            <div key={assignment.id} className={`flex items-center ${hasOtherRubric ? 'opacity-50 cursor-not-allowed' : ''}`}>
                              <input
                                type="checkbox"
                                checked={assignmentIds.includes(assignment.id)}
                                onChange={(e) => hasOtherRubric ? e.preventDefault() : handleAssignmentChange(assignment.id, e.target.checked)}
                                disabled={hasOtherRubric}
                                className={`h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded ${hasOtherRubric ? 'cursor-not-allowed opacity-50' : ''}`}
                              />
                              <span className={`ml-2 text-sm ${hasOtherRubric ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                                {assignment.title} - {assignment.courseName}
                                {hasOtherRubric && <span className="ml-2 text-red-600 font-semibold">(Already has rubric)</span>}
                              </span>
                            </div>
                          );
                        })
                      )}
                    </div>
                    <div className="mt-2 text-sm text-gray-500">
                      Select the assignments this rubric will be used for. You can select multiple assignments.
                    </div>
                    {availableAssignments.some(a => a.hasRubric && !assignmentIds.includes(a.id)) && (
                      <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-md">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-amber-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm text-amber-800 font-medium">
                              ⚠️ Assignments that already have a different rubric cannot be selected. Each assignment can only have one rubric.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label htmlFor="rubric-description" className="block text-sm font-medium text-gray-700">
                      Description
                    </label>
                    <div className="mt-1">
                      <textarea
                        id="rubric-description"
                        name="rubric-description"
                        rows={3}
                        value={rubricDescription}
                        onChange={(e) => {
                          setRubricDescription(e.target.value);
                          setIsDirty(true);
                        }}
                        className="shadow-sm focus:ring-purple-500 focus:border-purple-500 block w-full sm:text-sm border-gray-300 rounded-md placeholder-gray-700"
                      />
                    </div>
                    <p className="mt-2 text-sm text-gray-500">
                      Brief description of this rubric's purpose and how it should be used.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Criteria */}
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-medium text-gray-900">Assessment Criteria</h2>
                <button
                  type="button"
                  onClick={addCriterion}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                >
                  Add Criterion
                </button>
              </div>
              
              {criteria.length === 0 ? (
                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                  <div className="px-4 py-5 sm:p-6 text-center text-gray-500">
                    No criteria defined yet. Click "Add Criterion" to create your first criterion.
                  </div>
                </div>
              ) : (
                criteria.map((criterion) => (
                  <div key={criterion.id} className="bg-white shadow overflow-hidden sm:rounded-lg">
                    <div className="px-4 py-5 sm:px-6 bg-gray-50 flex justify-between items-center">
                      <div>
                        <h3 className="text-lg leading-6 font-medium text-gray-900">
                          {criterion.title}
                        </h3>
                        <p className="mt-1 max-w-2xl text-sm text-gray-500">
                          {criterion.points} points
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeCriterion(criterion.id)}
                        className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 text-xs font-medium rounded text-red-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        Remove
                      </button>
                    </div>
                    <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
                      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <div>
                          <label htmlFor={`criterion-title-${criterion.id}`} className="block text-sm font-medium text-gray-700">
                            Title
                          </label>
                          <div className="mt-1">
                            <input
                              type="text"
                              name={`criterion-title-${criterion.id}`}
                              id={`criterion-title-${criterion.id}`}
                              value={criterion.title}
                              onChange={(e) => updateCriterionTitle(criterion.id, e.target.value)}
                              className="shadow-sm focus:ring-purple-500 focus:border-purple-500 block w-full sm:text-sm border-gray-300 rounded-md placeholder-gray-700"
                            />
                          </div>
                        </div>
                        <div>
                          <label htmlFor={`criterion-points-${criterion.id}`} className="block text-sm font-medium text-gray-700">
                            Points
                          </label>
                          <div className="mt-1">
                            <input
                              type="number"
                              name={`criterion-points-${criterion.id}`}
                              id={`criterion-points-${criterion.id}`}
                              min="1"
                              max="100"
                              value={criterion.points}
                              onChange={(e) => updateCriterionPoints(criterion.id, parseInt(e.target.value, 10) || 0)}
                              className="shadow-sm focus:ring-purple-500 focus:border-purple-500 block w-full sm:text-sm border-gray-300 rounded-md placeholder-gray-700"
                            />
                          </div>
                        </div>
                        <div className="sm:col-span-2">
                          <label htmlFor={`criterion-description-${criterion.id}`} className="block text-sm font-medium text-gray-700">
                            Description
                          </label>
                          <div className="mt-1">
                            <textarea
                              id={`criterion-description-${criterion.id}`}
                              name={`criterion-description-${criterion.id}`}
                              rows={2}
                              value={criterion.description}
                              onChange={(e) => updateCriterionDescription(criterion.id, e.target.value)}
                              className="shadow-sm focus:ring-purple-500 focus:border-purple-500 block w-full sm:text-sm border-gray-300 rounded-md placeholder-gray-700"
                            />
                          </div>
                        </div>
                      </div>
                      
                      {/* Performance Levels */}
                      <div className="mt-6">
                        <div className="flex justify-between items-center mb-4">
                          <h4 className="text-sm font-medium text-gray-900">Performance Levels</h4>
                          <button
                            type="button"
                            onClick={() => addLevel(criterion.id)}
                            className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                          >
                            Add Level
                          </button>
                        </div>
                        
                        <div className="bg-gray-50 rounded-md overflow-hidden">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Level
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Description
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Score
                                </th>
                                <th scope="col" className="relative px-6 py-3">
                                  <span className="sr-only">Actions</span>
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {criterion.levels.map((level, index) => (
                                <tr key={level.id}>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    Level {index + 1}
                                  </td>
                                  <td className="px-6 py-4 text-sm text-gray-500">
                                    <textarea
                                      rows={2}
                                      value={level.description}
                                      onChange={(e) => updateLevelDescription(criterion.id, level.id, e.target.value)}
                                      className="shadow-sm focus:ring-purple-500 focus:border-purple-500 block w-full sm:text-sm border-gray-300 rounded-md placeholder-gray-700"
                                    />
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <input
                                      type="number"
                                      min="0"
                                      max={criterion.points}
                                      value={level.score}
                                      onChange={(e) => updateLevelScore(criterion.id, level.id, parseInt(e.target.value, 10) || 0)}
                                      className="shadow-sm focus:ring-purple-500 focus:border-purple-500 block w-24 sm:text-sm border-gray-300 rounded-md placeholder-gray-700"
                                    />
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button
                                      type="button"
                                      onClick={() => removeLevel(criterion.id, level.id)}
                                      disabled={criterion.levels.length <= 1}
                                      className={`text-red-600 hover:text-red-900 ${
                                        criterion.levels.length <= 1 ? 'opacity-50 cursor-not-allowed' : ''
                                      }`}
                                    >
                                      Remove
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </main>
      </div>
    </Layout>
  );
} 