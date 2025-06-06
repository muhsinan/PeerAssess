import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET: List all assignments (with optional filters)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const courseId = searchParams.get('courseId');
    const instructorId = searchParams.get('instructorId');
    
    let query = `
      SELECT 
        a.assignment_id as id,
        a.title,
        a.description,
        a.due_date,
        a.created_at,
        a.updated_at,
        c.course_id,
        c.name as course_name,
        c.instructor_id,
        u.name as instructor_name,
        (SELECT COUNT(*) FROM peer_assessment.submissions s WHERE s.assignment_id = a.assignment_id) as submissions_count,
        (SELECT COUNT(*) FROM peer_assessment.course_enrollments ce WHERE ce.course_id = c.course_id) as enrolled_students
      FROM 
        peer_assessment.assignments a
      JOIN 
        peer_assessment.courses c ON a.course_id = c.course_id
      JOIN 
        peer_assessment.users u ON c.instructor_id = u.user_id
      WHERE 1=1
    `;
    
    const params: any[] = [];
    let paramIndex = 1;
    
    if (courseId) {
      query += ` AND c.course_id = $${paramIndex}`;
      params.push(courseId);
      paramIndex++;
    }
    
    if (instructorId) {
      query += ` AND c.instructor_id = $${paramIndex}`;
      params.push(instructorId);
      paramIndex++;
    }
    
    query += ` ORDER BY a.due_date ASC`;
    
    const result = await pool.query(query, params);
    
    return NextResponse.json({
      assignments: result.rows.map(assignment => ({
        id: assignment.id,
        title: assignment.title,
        description: assignment.description,
        dueDate: assignment.due_date,
        courseId: assignment.course_id,
        courseName: assignment.course_name,
        instructorId: assignment.instructor_id,
        instructorName: assignment.instructor_name,
        submissionsCount: parseInt(assignment.submissions_count || '0'),
        totalStudents: parseInt(assignment.enrolled_students || '0'),
        createdAt: assignment.created_at,
        updatedAt: assignment.updated_at
      }))
    });
  } catch (error) {
    console.error('Error fetching assignments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assignments. Please try again.' },
      { status: 500 }
    );
  }
}

// POST: Create a new assignment
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const { title, description, courseId, dueDate, aiPromptsEnabled, aiOverallPrompt, aiCriteriaPrompt } = await request.json();
    
    // Validate input
    if (!title || !title.trim()) {
      return NextResponse.json(
        { error: 'Assignment title is required' },
        { status: 400 }
      );
    }
    
    if (!courseId || isNaN(parseInt(String(courseId)))) {
      return NextResponse.json(
        { error: 'Valid course ID is required' },
        { status: 400 }
      );
    }
    
    if (!dueDate) {
      return NextResponse.json(
        { error: 'Due date is required' },
        { status: 400 }
      );
    }
    
    // Validate that the course exists
    const courseCheck = await pool.query(
      'SELECT course_id FROM peer_assessment.courses WHERE course_id = $1',
      [courseId]
    );
    
    if (courseCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }
    
    // Insert assignment into database
    const result = await pool.query(
      `INSERT INTO peer_assessment.assignments
        (title, description, course_id, due_date, ai_prompts_enabled, ai_overall_prompt, ai_criteria_prompt) 
       VALUES 
        ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING assignment_id, title, description, course_id, due_date, ai_prompts_enabled, ai_overall_prompt, ai_criteria_prompt, created_at, updated_at`,
      [
        title.trim(), 
        description?.trim() || null, 
        courseId,
        new Date(dueDate + 'T23:59:59'),
        aiPromptsEnabled ?? true,
        aiOverallPrompt?.trim() || null,
        aiCriteriaPrompt?.trim() || null
      ]
    );
    
    const newAssignment = result.rows[0];
    
    // Get course details
    const courseDetails = await pool.query(
      `SELECT 
        c.name as course_name, 
        c.instructor_id, 
        u.name as instructor_name
       FROM 
        peer_assessment.courses c
       JOIN 
        peer_assessment.users u ON c.instructor_id = u.user_id
       WHERE 
        c.course_id = $1`,
      [courseId]
    );
    
    const course = courseDetails.rows[0];
    
    // Return newly created assignment with course details
    return NextResponse.json({
      message: 'Assignment created successfully',
      assignment: {
        id: newAssignment.assignment_id,
        title: newAssignment.title,
        description: newAssignment.description,
        dueDate: newAssignment.due_date,
        courseId: newAssignment.course_id,
        courseName: course.course_name,
        instructorId: course.instructor_id,
        instructorName: course.instructor_name,
        aiPromptsEnabled: newAssignment.ai_prompts_enabled,
        aiOverallPrompt: newAssignment.ai_overall_prompt,
        aiCriteriaPrompt: newAssignment.ai_criteria_prompt,
        submissionsCount: 0,
        totalStudents: 0,
        createdAt: newAssignment.created_at,
        updatedAt: newAssignment.updated_at
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Assignment creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create assignment. Please try again.' },
      { status: 500 }
    );
  }
} 