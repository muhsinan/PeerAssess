import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { assignmentId: string } }
) {
  try {
    const { assignmentId } = await params;
    
    if (!assignmentId || isNaN(Number(assignmentId))) {
      return NextResponse.json(
        { error: 'Invalid assignment ID' },
        { status: 400 }
      );
    }

    // Get optional studentId from query parameters
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    
    // Check if assignment exists
    const assignmentCheck = await pool.query(
      `SELECT assignment_id FROM peer_assessment.assignments WHERE assignment_id = $1`,
      [assignmentId]
    );
    
    if (assignmentCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Assignment not found' },
        { status: 404 }
      );
    }

    // Base query for submissions
    let query = `
      SELECT 
        s.submission_id as id,
        s.title,
        s.content,
        s.status,
        s.submission_date as "submissionDate",
        s.student_id as "studentId",
        u.name as "studentName",
        u.email as "studentEmail",
        (
          SELECT COUNT(*)
          FROM peer_assessment.peer_reviews pr
          WHERE pr.submission_id = s.submission_id
        ) as "reviewCount",
        (
          SELECT COUNT(*)
          FROM peer_assessment.peer_reviews pr
          WHERE pr.submission_id = s.submission_id AND pr.status = 'completed'
        ) as "completedReviewCount"
      FROM 
        peer_assessment.submissions s
      JOIN 
        peer_assessment.users u ON s.student_id = u.user_id
      WHERE 
        s.assignment_id = $1
    `;
    
    let queryParams = [assignmentId];
    
    // Add student filter if provided
    if (studentId) {
      query += ` AND s.student_id = $2`;
      queryParams.push(studentId);
    }
    
    // Add order by clause
    query += ` ORDER BY s.submission_date DESC`;
    
    const result = await pool.query(query, queryParams);
    
    return NextResponse.json({
      assignmentId: assignmentId,
      submissions: result.rows
    });
  } catch (error) {
    console.error('Error fetching submissions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch submissions', details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { assignmentId: string } }
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
        { error: 'Submission title is required' },
        { status: 400 }
      );
    }
    
    if (!body.studentId) {
      return NextResponse.json(
        { error: 'Student ID is required' },
        { status: 400 }
      );
    }
    
    if (!body.content) {
      return NextResponse.json(
        { error: 'Submission content is required' },
        { status: 400 }
      );
    }
    
    // Check if assignment exists
    const assignmentCheck = await pool.query(
      `SELECT assignment_id FROM peer_assessment.assignments WHERE assignment_id = $1`,
      [assignmentId]
    );
    
    if (assignmentCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Assignment not found' },
        { status: 404 }
      );
    }
    
    // Check if student is enrolled in the course
    const enrollmentCheck = await pool.query(`
      SELECT ce.enrollment_id
      FROM peer_assessment.course_enrollments ce
      JOIN peer_assessment.assignments a ON ce.course_id = a.course_id
      WHERE a.assignment_id = $1 AND ce.student_id = $2
    `, [assignmentId, body.studentId]);
    
    if (enrollmentCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Student is not enrolled in the course for this assignment' },
        { status: 403 }
      );
    }
    
    // Check if the student already has a submission for this assignment
    const existingSubmission = await pool.query(`
      SELECT submission_id
      FROM peer_assessment.submissions
      WHERE assignment_id = $1 AND student_id = $2
    `, [assignmentId, body.studentId]);
    
    if (existingSubmission.rows.length > 0) {
      // If draft submission exists, update it
      if (body.status === 'draft') {
        const updateResult = await pool.query(`
          UPDATE peer_assessment.submissions
          SET 
            title = $1,
            content = $2,
            updated_at = NOW()
          WHERE 
            assignment_id = $3 AND student_id = $4
          RETURNING submission_id as id
        `, [body.title, body.content, assignmentId, body.studentId]);
        
        return NextResponse.json({
          message: 'Draft submission updated successfully',
          submissionId: updateResult.rows[0].id
        });
      } else {
        return NextResponse.json(
          { error: 'A submission already exists for this assignment' },
          { status: 400 }
        );
      }
    }
    
    // Insert new submission
    const status = body.status || 'submitted'; // Default to 'submitted' if not specified
    
    const insertResult = await pool.query(`
      INSERT INTO peer_assessment.submissions(
        assignment_id, student_id, title, content, status, submission_date
      )
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING 
        submission_id as id,
        title,
        status,
        submission_date as "submissionDate"
    `, [assignmentId, body.studentId, body.title, body.content, status]);
    
    return NextResponse.json({
      message: 'Submission created successfully',
      submission: insertResult.rows[0]
    });
  } catch (error) {
    console.error('Error creating submission:', error);
    return NextResponse.json(
      { error: 'Failed to create submission', details: String(error) },
      { status: 500 }
    );
  }
} 