'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '../../../components/layout/Layout';
import Link from 'next/link';

interface Subitem {
  id: number;
  name: string;
  description: string;
  points: number;
}

interface Level {
  id: number;
  name: string;
  description: string;
  score: number;
}

interface Criterion {
  name: string;
  description: string;
  maxPoints: number;
  weight: number;
  criterionType: 'levels' | 'subitems';
  levels: Level[];
  subitems: Subitem[];
}

export default function CreateRubric() {
  const router = useRouter();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    assignmentIds: [] as number[]
  });
  
  const [criteria, setCriteria] = useState<Criterion[]>([]);
  
  const [availableAssignments, setAvailableAssignments] = useState<Array<{
    id: number;
    title: string;
    courseId: number;
    courseName: string;
    hasRubric: boolean;
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

  // Handle assignment selection changes
  const handleAssignmentChange = (assignmentId: number, isChecked: boolean) => {
    // Check if assignment already has a rubric
    const assignment = availableAssignments.find(a => a.id === assignmentId);
    if (assignment?.hasRubric && isChecked) {
      setError('This assignment already has a rubric assigned. Each assignment can only have one rubric.');
      return;
    }

    setFormData(prev => ({
      ...prev,
      assignmentIds: isChecked 
        ? [...prev.assignmentIds, assignmentId]
        : prev.assignmentIds.filter(id => id !== assignmentId)
    }));
  };

  // Handle changes to criteria
  const handleCriterionChange = (index: number, field: string, value: string | number) => {
    const newCriteria = [...criteria];
    newCriteria[index] = { 
      ...newCriteria[index], 
      [field]: field === 'maxPoints' || field === 'weight' ? Number(value) : value 
    };
    
    // If max points changed and it's a level-based criterion, update the default level scores proportionally
    if (field === 'maxPoints' && typeof value === 'string' && newCriteria[index].criterionType === 'levels') {
      const maxPoints = Number(value);
      if (maxPoints > 0) {
        newCriteria[index].levels = newCriteria[index].levels.map((level, levelIndex) => ({
          ...level,
          score: Math.round(maxPoints * (0.25 * (levelIndex + 1)))
        }));
      }
    }
    
    setCriteria(newCriteria);
  };

  // Update criterion type
  const updateCriterionType = (index: number, type: 'levels' | 'subitems') => {
    const newCriteria = [...criteria];
    const criterion = newCriteria[index];
    criterion.criterionType = type;
    
    // Initialize with defaults if switching types and empty
    if (type === 'levels' && criterion.levels.length === 0) {
      const maxPoints = criterion.maxPoints || 10;
      criterion.levels = [
        { id: 1, name: 'Beginning', description: 'Does not meet expectations', score: Math.round(maxPoints * 0.25) },
        { id: 2, name: 'Developing', description: 'Partially meets expectations', score: Math.round(maxPoints * 0.5) },
        { id: 3, name: 'Proficient', description: 'Meets expectations', score: Math.round(maxPoints * 0.75) },
        { id: 4, name: 'Exemplary', description: 'Exceeds expectations', score: maxPoints },
      ];
    }
    if (type === 'subitems' && criterion.subitems.length === 0) {
      criterion.subitems = [
        { id: 1, name: 'Item 1', description: 'Description of this item', points: 5 },
      ];
    }
    
    setCriteria(newCriteria);
  };

  // Add a new criterion (level-based or subitem-based)
  const addCriterion = (type: 'levels' | 'subitems' = 'levels') => {
    const defaultMaxPoints = type === 'subitems' ? 25 : 10;
    const newCriterion: Criterion = {
      name: '',
      description: '',
      maxPoints: defaultMaxPoints,
      weight: 1.0,
      criterionType: type,
      levels: type === 'levels' ? [
        { id: 1, name: 'Beginning', description: 'Does not meet expectations', score: Math.round(defaultMaxPoints * 0.25) },
        { id: 2, name: 'Developing', description: 'Partially meets expectations', score: Math.round(defaultMaxPoints * 0.5) },
        { id: 3, name: 'Proficient', description: 'Meets expectations', score: Math.round(defaultMaxPoints * 0.75) },
        { id: 4, name: 'Exemplary', description: 'Exceeds expectations', score: defaultMaxPoints },
      ] : [],
      subitems: type === 'subitems' ? [
        { id: 1, name: 'Item 1', description: 'Description of this item', points: 5 },
        { id: 2, name: 'Item 2', description: 'Description of this item', points: 5 },
        { id: 3, name: 'Item 3', description: 'Description of this item', points: 5 },
        { id: 4, name: 'Item 4', description: 'Description of this item', points: 10 },
      ] : []
    };
    setCriteria([...criteria, newCriterion]);
  };

  // Remove a criterion
  const removeCriterion = (index: number) => {
    const newCriteria = [...criteria];
    newCriteria.splice(index, 1);
    setCriteria(newCriteria);
  };

  // Update level name
  const updateLevelName = (criterionIndex: number, levelId: number, name: string) => {
    const newCriteria = [...criteria];
    newCriteria[criterionIndex].levels = newCriteria[criterionIndex].levels.map(level => 
      level.id === levelId ? { ...level, name } : level
    );
    setCriteria(newCriteria);
  };

  // Update level description
  const updateLevelDescription = (criterionIndex: number, levelId: number, description: string) => {
    const newCriteria = [...criteria];
    newCriteria[criterionIndex].levels = newCriteria[criterionIndex].levels.map(level => 
      level.id === levelId ? { ...level, description } : level
    );
    setCriteria(newCriteria);
  };

  // Update level score
  const updateLevelScore = (criterionIndex: number, levelId: number, score: number) => {
    const newCriteria = [...criteria];
    newCriteria[criterionIndex].levels = newCriteria[criterionIndex].levels.map(level => 
      level.id === levelId ? { ...level, score } : level
    );
    setCriteria(newCriteria);
  };

  // Add a new level to a criterion
  const addLevel = (criterionIndex: number) => {
    const newCriteria = [...criteria];
    const criterion = newCriteria[criterionIndex];
    const newLevelId = criterion.levels.length > 0 ? Math.max(...criterion.levels.map(l => l.id)) + 1 : 1;
    const newLevelNumber = criterion.levels.length + 1;
    
    // Calculate a reasonable default score
    const maxExistingScore = criterion.levels.length > 0 ? Math.max(...criterion.levels.map(l => l.score)) : 0;
    const defaultScore = Math.min(maxExistingScore + Math.round(criterion.maxPoints * 0.1), criterion.maxPoints);
    
    criterion.levels.push({
      id: newLevelId,
      name: `Level ${newLevelNumber}`,
      description: 'New level description',
      score: defaultScore
    });
    setCriteria(newCriteria);
  };

  // Remove a level from a criterion
  const removeLevel = (criterionIndex: number, levelId: number) => {
    const newCriteria = [...criteria];
    const criterion = newCriteria[criterionIndex];
    if (criterion.levels.length <= 1) {
      return; // Don't remove the last level
    }
    criterion.levels = criterion.levels.filter(level => level.id !== levelId);
    setCriteria(newCriteria);
  };

  // Add a new subitem to a criterion
  const addSubitem = (criterionIndex: number) => {
    const newCriteria = [...criteria];
    const criterion = newCriteria[criterionIndex];
    const newSubitemId = criterion.subitems.length > 0 ? Math.max(...criterion.subitems.map(s => s.id)) + 1 : 1;
    criterion.subitems.push({
      id: newSubitemId,
      name: `Item ${criterion.subitems.length + 1}`,
      description: 'Description of this item',
      points: 5
    });
    setCriteria(newCriteria);
  };

  // Update subitem name
  const updateSubitemName = (criterionIndex: number, subitemId: number, name: string) => {
    const newCriteria = [...criteria];
    newCriteria[criterionIndex].subitems = newCriteria[criterionIndex].subitems.map(s => 
      s.id === subitemId ? { ...s, name } : s
    );
    setCriteria(newCriteria);
  };

  // Update subitem description
  const updateSubitemDescription = (criterionIndex: number, subitemId: number, description: string) => {
    const newCriteria = [...criteria];
    newCriteria[criterionIndex].subitems = newCriteria[criterionIndex].subitems.map(s => 
      s.id === subitemId ? { ...s, description } : s
    );
    setCriteria(newCriteria);
  };

  // Update subitem points
  const updateSubitemPoints = (criterionIndex: number, subitemId: number, points: number) => {
    const newCriteria = [...criteria];
    newCriteria[criterionIndex].subitems = newCriteria[criterionIndex].subitems.map(s => 
      s.id === subitemId ? { ...s, points } : s
    );
    setCriteria(newCriteria);
  };

  // Remove a subitem from a criterion
  const removeSubitem = (criterionIndex: number, subitemId: number) => {
    const newCriteria = [...criteria];
    const criterion = newCriteria[criterionIndex];
    if (criterion.subitems.length <= 1) {
      return; // Don't remove the last subitem
    }
    criterion.subitems = criterion.subitems.filter(s => s.id !== subitemId);
    setCriteria(newCriteria);
  };

  // Calculate total subitem points for a criterion
  const getTotalSubitemPoints = (criterion: Criterion) => {
    return criterion.subitems.reduce((sum, s) => sum + s.points, 0);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form inputs
    if (!formData.name.trim()) {
      setError('Rubric name is required');
      return;
    }
    
    // Assignment selection is optional - rubrics can be created without being assigned to assignments
    // Multiple assignments can be selected and one rubric can be used by multiple assignments
    
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
          assignmentIds: formData.assignmentIds
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
            maxPoints: criterion.criterionType === 'subitems' ? getTotalSubitemPoints(criterion) : criterion.maxPoints,
            weight: criterion.weight,
            criterionType: criterion.criterionType,
            levels: criterion.levels.map(level => ({
              id: level.id,
              name: level.name,
              description: level.description,
              score: level.score
            })),
            subitems: criterion.subitems.map(subitem => ({
              id: subitem.id,
              name: subitem.name,
              description: subitem.description,
              points: subitem.points
            }))
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

                    {/* Assignments (Optional) */}
                    <div className="sm:col-span-4">
                      <label className="block text-sm font-medium text-gray-700">
                        Assignments (Optional)
                      </label>
                      <div className="mt-1 space-y-2 max-h-40 overflow-y-auto border border-gray-300 rounded-md p-3">
                        {availableAssignments.length === 0 ? (
                          <p className="text-sm text-gray-500">No assignments available</p>
                        ) : (
                          availableAssignments.map(assignment => {
                            const hasRubric = assignment.hasRubric;
                            return (
                              <div key={assignment.id} className={`flex items-center ${hasRubric ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                <input
                                  type="checkbox"
                                  checked={formData.assignmentIds.includes(assignment.id)}
                                  onChange={(e) => hasRubric ? e.preventDefault() : handleAssignmentChange(assignment.id, e.target.checked)}
                                  disabled={hasRubric}
                                  className={`h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded ${hasRubric ? 'cursor-not-allowed opacity-50' : ''}`}
                                />
                                <span className={`ml-2 text-sm ${hasRubric ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                                  {assignment.title} - {assignment.courseName}
                                  {hasRubric && <span className="ml-2 text-red-600 font-semibold">(Already has rubric)</span>}
                                </span>
                              </div>
                            );
                          })
                        )}
                      </div>
                      <div className="mt-2 text-sm text-gray-500">
                        Select the assignments this rubric will be used for. You can select multiple assignments or none.
                      </div>
                      {availableAssignments.some(a => a.hasRubric) && (
                        <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-md">
                          <div className="flex">
                            <div className="flex-shrink-0">
                              <svg className="h-5 w-5 text-amber-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div className="ml-3">
                              <p className="text-sm text-amber-800 font-medium">
                                ⚠️ Assignments that already have a rubric cannot be selected. Each assignment can only have one rubric.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
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
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="text-lg leading-6 font-medium text-black">Assessment Criteria</h3>
                            <p className="mt-1 text-sm text-gray-500">
                              Define the criteria that will be used to evaluate submissions.
                            </p>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              type="button"
                              onClick={() => addCriterion('levels')}
                              className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                            >
                              + Level-based
                            </button>
                            <button
                              type="button"
                              onClick={() => addCriterion('subitems')}
                              className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                              + Subitem-based
                            </button>
                          </div>
                        </div>
                      </div>
                      
                      {criteria.length === 0 ? (
                        <div className="mt-6 text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                          <h3 className="mt-2 text-sm font-medium text-gray-900">No criteria yet</h3>
                          <p className="mt-1 text-sm text-gray-500">Get started by adding a criterion using the buttons above.</p>
                          <p className="mt-2 text-xs text-gray-400">
                            <strong>Level-based:</strong> Reviewer picks ONE level (e.g., Excellent, Good, Fair) | 
                            <strong> Subitem-based:</strong> Reviewer checks off items in a checklist
                          </p>
                        </div>
                      ) : (
                        criteria.map((criterion, index) => (
                          <div key={index} className="mt-6 pt-6 border-t border-gray-200">
                            <div className="flex justify-between items-center mb-4">
                              <div className="flex items-center space-x-3">
                                <h4 className="text-md font-medium text-gray-900">Criterion {index + 1}</h4>
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  criterion.criterionType === 'subitems' 
                                    ? 'bg-indigo-100 text-indigo-800' 
                                    : 'bg-purple-100 text-purple-800'
                                }`}>
                                  {criterion.criterionType === 'subitems' ? 'Subitems' : 'Levels'}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeCriterion(index)}
                                className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm leading-5 font-medium rounded-md text-red-700 bg-white hover:bg-gray-50"
                              >
                                Remove
                              </button>
                            </div>
                            
                            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                              {/* Criterion Name */}
                              <div className="sm:col-span-2">
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

                              {/* Grading Type */}
                              <div className="sm:col-span-2">
                                <label htmlFor={`criterion-${index}-type`} className="block text-sm font-medium text-gray-700">
                                  Grading Type
                                </label>
                                <div className="mt-1">
                                  <select
                                    id={`criterion-${index}-type`}
                                    value={criterion.criterionType}
                                    onChange={(e) => updateCriterionType(index, e.target.value as 'levels' | 'subitems')}
                                    className="shadow-sm focus:ring-purple-500 focus:border-purple-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                  >
                                    <option value="levels">Levels (pick one)</option>
                                    <option value="subitems">Subitems (checklist)</option>
                                  </select>
                                </div>
                              </div>

                              {/* Max Points - only for levels */}
                              {criterion.criterionType === 'levels' ? (
                                <div className="sm:col-span-2">
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
                              ) : (
                                <div className="sm:col-span-2">
                                  <label className="block text-sm font-medium text-gray-700">
                                    Total Points
                                  </label>
                                  <div className="mt-1">
                                    <div className="py-2 px-3 bg-gray-100 rounded-md text-sm font-medium text-gray-700">
                                      {getTotalSubitemPoints(criterion)} pts (sum of subitems)
                                    </div>
                                  </div>
                                </div>
                              )}

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
                            </div>
                            
                            {/* Performance Levels - only for level-based criteria */}
                            {criterion.criterionType === 'levels' && (
                              <div className="mt-6">
                                <div className="flex justify-between items-center mb-4">
                                  <h5 className="text-sm font-medium text-gray-900">Performance Levels</h5>
                                  <button
                                    type="button"
                                    onClick={() => addLevel(index)}
                                    className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                                  >
                                    Add Level
                                  </button>
                                </div>
                                
                                <div className="bg-gray-50 rounded-md overflow-hidden">
                                  <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                      <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40">
                                          Level Name
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                          Description
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                                          Score
                                        </th>
                                        <th scope="col" className="relative px-6 py-3 w-20">
                                          <span className="sr-only">Actions</span>
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                      {criterion.levels.map((level) => (
                                        <tr key={level.id}>
                                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            <input
                                              type="text"
                                              value={level.name}
                                              onChange={(e) => updateLevelName(index, level.id, e.target.value)}
                                              className="shadow-sm focus:ring-purple-500 focus:border-purple-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                              placeholder="Level name"
                                            />
                                          </td>
                                          <td className="px-6 py-4 text-sm text-gray-500">
                                            <textarea
                                              rows={2}
                                              value={level.description}
                                              onChange={(e) => updateLevelDescription(index, level.id, e.target.value)}
                                              className="shadow-sm focus:ring-purple-500 focus:border-purple-500 block w-full sm:text-sm border-gray-300 rounded-md placeholder-gray-700"
                                            />
                                          </td>
                                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <input
                                              type="number"
                                              min="0"
                                              max={criterion.maxPoints}
                                              value={level.score}
                                              onChange={(e) => updateLevelScore(index, level.id, parseInt(e.target.value, 10) || 0)}
                                              className="shadow-sm focus:ring-purple-500 focus:border-purple-500 block w-24 sm:text-sm border-gray-300 rounded-md placeholder-gray-700"
                                            />
                                          </td>
                                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                              type="button"
                                              onClick={() => removeLevel(index, level.id)}
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
                            )}

                            {/* Subitems - only for subitem-based criteria */}
                            {criterion.criterionType === 'subitems' && (
                              <div className="mt-6">
                                <div className="flex justify-between items-center mb-4">
                                  <h5 className="text-sm font-medium text-gray-900">Checklist Items</h5>
                                  <button
                                    type="button"
                                    onClick={() => addSubitem(index)}
                                    className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                  >
                                    Add Item
                                  </button>
                                </div>
                                
                                <div className="bg-gray-50 rounded-md overflow-hidden">
                                  <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                      <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">
                                          Item Name
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                          Description
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                                          Points
                                        </th>
                                        <th scope="col" className="relative px-6 py-3 w-20">
                                          <span className="sr-only">Actions</span>
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                      {criterion.subitems.map((subitem) => (
                                        <tr key={subitem.id}>
                                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            <input
                                              type="text"
                                              value={subitem.name}
                                              onChange={(e) => updateSubitemName(index, subitem.id, e.target.value)}
                                              className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                              placeholder="Item name"
                                            />
                                          </td>
                                          <td className="px-6 py-4 text-sm text-gray-500">
                                            <textarea
                                              rows={2}
                                              value={subitem.description}
                                              onChange={(e) => updateSubitemDescription(index, subitem.id, e.target.value)}
                                              className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                              placeholder="Description of what earns these points"
                                            />
                                          </td>
                                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <input
                                              type="number"
                                              min="0"
                                              max="100"
                                              value={subitem.points}
                                              onChange={(e) => updateSubitemPoints(index, subitem.id, parseInt(e.target.value, 10) || 0)}
                                              className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-24 sm:text-sm border-gray-300 rounded-md"
                                            />
                                          </td>
                                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                              type="button"
                                              onClick={() => removeSubitem(index, subitem.id)}
                                              disabled={criterion.subitems.length <= 1}
                                              className={`text-red-600 hover:text-red-900 ${
                                                criterion.subitems.length <= 1 ? 'opacity-50 cursor-not-allowed' : ''
                                              }`}
                                            >
                                              Remove
                                            </button>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                    <tfoot className="bg-gray-100">
                                      <tr>
                                        <td colSpan={2} className="px-6 py-3 text-right text-sm font-medium text-gray-700">
                                          Total Points:
                                        </td>
                                        <td className="px-6 py-3 text-sm font-bold text-gray-900">
                                          {getTotalSubitemPoints(criterion)}
                                        </td>
                                        <td></td>
                                      </tr>
                                    </tfoot>
                                  </table>
                                </div>
                                <p className="mt-2 text-sm text-gray-500">
                                  Reviewers will check off each item that meets the criteria. Points are summed for all checked items.
                                </p>
                              </div>
                            )}
                          </div>
                        ))
                      )}
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