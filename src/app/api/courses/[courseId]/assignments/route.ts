import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    const courseId = params.courseId;
    
    if (!courseId || isNaN(parseInt(courseId))) {
      return NextResponse.json(
        { error: 'Valid course ID is required' },
        { status: 400 }
      );
    }

    // Check if course exists
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

    // Get assignments for the course with submission counts
    const result = await pool.query(`
      SELECT 
        a.assignment_id as id,
        a.title,
        a.description,
        a.due_date,
        a.created_at,
        a.updated_at,
        (SELECT COUNT(*) FROM peer_assessment.submissions s WHERE s.assignment_id = a.assignment_id) as submissions_count,
        (SELECT COUNT(*) FROM peer_assessment.course_enrollments ce WHERE ce.course_id = a.course_id) as total_students
      FROM 
        peer_assessment.assignments a
      WHERE 
        a.course_id = $1
      ORDER BY 
        a.due_date ASC
    `, [courseId]);

    return NextResponse.json({
      assignments: result.rows.map(assignment => ({
        id: assignment.id,
        title: assignment.title,
        description: assignment.description,
        dueDate: assignment.due_date,
        createdAt: assignment.created_at,
        updatedAt: assignment.updated_at,
        submissionsCount: parseInt(assignment.submissions_count || '0'),
        totalStudents: parseInt(assignment.total_students || '0')
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

export async function POST(
  request: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    const courseId = params.courseId;
    
    if (!courseId || isNaN(parseInt(courseId))) {
      return NextResponse.json(
        { error: 'Valid course ID is required' },
        { status: 400 }
      );
    }

    // Parse request body
    const { title, description, dueDate } = await request.json();

    // Validate input
    if (!title || !title.trim()) {
      return NextResponse.json(
        { error: 'Assignment title is required' },
        { status: 400 }
      );
    }

    // Check if course exists
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
        (title, description, course_id, due_date) 
       VALUES 
        ($1, $2, $3, $4) 
       RETURNING assignment_id, title, description, course_id, due_date, created_at, updated_at`,
      [title.trim(), description?.trim() || null, courseId, dueDate ? new Date(dueDate) : null]
    );

    const newAssignment = result.rows[0];

    // Return newly created assignment
    return NextResponse.json({
      message: 'Assignment created successfully',
      assignment: {
        id: newAssignment.assignment_id,
        title: newAssignment.title,
        description: newAssignment.description,
        courseId: newAssignment.course_id,
        dueDate: newAssignment.due_date,
        createdAt: newAssignment.created_at,
        updatedAt: newAssignment.updated_at,
        submissionsCount: 0,
        totalStudents: 0
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