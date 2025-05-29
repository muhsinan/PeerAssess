import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET: Fetch details for a specific assignment
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ assignmentId: string }> }
) {
  try {
    const { assignmentId } = await params;
    
    if (!assignmentId || isNaN(Number(assignmentId))) {
      return NextResponse.json(
        { error: 'Invalid assignment ID' },
        { status: 400 }
      );
    }

    // Query to get assignment details with course information
    const assignmentQuery = `
      SELECT 
        a.assignment_id as id,
        a.title,
        a.description,
        a.due_date as "dueDate",
        a.created_at as "createdAt",
        a.updated_at as "updatedAt",
        c.course_id as "courseId",
        c.name as "courseName",
        json_build_object(
          'id', c.course_id,
          'name', c.name,
          'instructor_id', c.instructor_id,
          'description', c.description
        ) as course,
        (
          SELECT COUNT(*)
          FROM peer_assessment.submissions s
          WHERE s.assignment_id = a.assignment_id
        ) as "submissionCount",
        (
          SELECT COUNT(*)
          FROM peer_assessment.course_enrollments ce
          WHERE ce.course_id = c.course_id
        ) as "enrolledStudents"
      FROM 
        peer_assessment.assignments a
      JOIN 
        peer_assessment.courses c ON a.course_id = c.course_id
      LEFT JOIN 
        peer_assessment.users u ON c.instructor_id = u.user_id
      WHERE 
        a.assignment_id = $1
    `;

    const result = await pool.query(assignmentQuery, [assignmentId]);
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Assignment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching assignment details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assignment details', details: String(error) },
      { status: 500 }
    );
  }
}

// PUT: Update an assignment
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ assignmentId: string }> }
) {
  try {
    const { assignmentId } = await params;
    
    if (!assignmentId || isNaN(Number(assignmentId))) {
      return NextResponse.json(
        { error: 'Invalid assignment ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    
    // Validate required fields
    if (!body.title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    if (!body.dueDate) {
      return NextResponse.json(
        { error: 'Due date is required' },
        { status: 400 }
      );
    }

    // Check if assignment exists and get current course ID if not provided
    const checkQuery = `
      SELECT assignment_id, course_id 
      FROM peer_assessment.assignments 
      WHERE assignment_id = $1
    `;
    
    const checkResult = await pool.query(checkQuery, [assignmentId]);
    
    if (checkResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Assignment not found' },
        { status: 404 }
      );
    }

    // Use existing course ID if not provided in request
    const courseId = body.courseId || checkResult.rows[0].course_id;

    // Update assignment
    const updateQuery = `
      UPDATE peer_assessment.assignments
      SET 
        title = $1,
        description = $2,
        due_date = $3,
        course_id = $4,
        updated_at = NOW()
      WHERE assignment_id = $5
      RETURNING assignment_id as id
    `;
    
    const updateValues = [
      body.title,
      body.description || null,
      body.dueDate,
      courseId,
      assignmentId
    ];
    
    const updateResult = await pool.query(updateQuery, updateValues);

    // Fetch the updated assignment
    const getUpdatedAssignment = `
      SELECT 
        a.assignment_id as id,
        a.title,
        a.description,
        a.due_date as "dueDate",
        a.created_at as "createdAt",
        a.updated_at as "updatedAt",
        c.course_id as "courseId",
        c.name as "courseName"
      FROM 
        peer_assessment.assignments a
      JOIN 
        peer_assessment.courses c ON a.course_id = c.course_id
      WHERE 
        a.assignment_id = $1
    `;
    
    const getResult = await pool.query(getUpdatedAssignment, [assignmentId]);
    
    return NextResponse.json({
      message: 'Assignment updated successfully',
      assignment: getResult.rows[0]
    });
  } catch (error) {
    console.error('Error updating assignment:', error);
    return NextResponse.json(
      { error: 'Failed to update assignment', details: String(error) },
      { status: 500 }
    );
  }
}

// DELETE: Delete an assignment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ assignmentId: string }> }
) {
  try {
    const { assignmentId } = await params;
    
    if (!assignmentId || isNaN(Number(assignmentId))) {
      return NextResponse.json(
        { error: 'Invalid assignment ID' },
        { status: 400 }
      );
    }

    // Check if assignment exists
    const checkQuery = `
      SELECT assignment_id 
      FROM peer_assessment.assignments 
      WHERE assignment_id = $1
    `;
    
    const checkResult = await pool.query(checkQuery, [assignmentId]);
    
    if (checkResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Assignment not found' },
        { status: 404 }
      );
    }

    // Check if there are submissions for this assignment
    const submissionsQuery = `
      SELECT COUNT(*) as count
      FROM peer_assessment.submissions
      WHERE assignment_id = $1
    `;
    
    const submissionsResult = await pool.query(submissionsQuery, [assignmentId]);
    const submissionsCount = parseInt(submissionsResult.rows[0].count);
    
    if (submissionsCount > 0) {
      return NextResponse.json(
        { 
          error: 'Cannot delete assignment with submissions',
          details: `This assignment has ${submissionsCount} submissions. Delete all submissions first.` 
        },
        { status: 400 }
      );
    }

    // Delete the assignment
    const deleteQuery = `
      DELETE FROM peer_assessment.assignments
      WHERE assignment_id = $1
      RETURNING assignment_id as id
    `;
    
    const deleteResult = await pool.query(deleteQuery, [assignmentId]);
    
    return NextResponse.json({
      message: 'Assignment deleted successfully',
      id: deleteResult.rows[0].id
    });
  } catch (error) {
    console.error('Error deleting assignment:', error);
    return NextResponse.json(
      { error: 'Failed to delete assignment', details: String(error) },
      { status: 500 }
    );
  }
} 