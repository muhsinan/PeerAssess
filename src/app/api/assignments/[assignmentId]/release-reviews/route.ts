import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

// POST endpoint to release all AI auto-reviews for an assignment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ assignmentId: string }> }
) {
  try {
    const { assignmentId } = await params;
    const body = await request.json();
    const { instructorId } = body;
    
    if (!assignmentId || isNaN(Number(assignmentId))) {
      return NextResponse.json(
        { error: 'Invalid assignment ID' },
        { status: 400 }
      );
    }

    if (!instructorId || isNaN(Number(instructorId))) {
      return NextResponse.json(
        { error: 'Invalid instructor ID' },
        { status: 400 }
      );
    }

    // Verify instructor role
    const instructorCheck = await pool.query(
      `SELECT user_id, role FROM peer_assessment.users WHERE user_id = $1 AND role = 'instructor'`,
      [instructorId]
    );
    
    if (instructorCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Only instructors can release AI reviews' },
        { status: 403 }
      );
    }

    // Verify the assignment exists and belongs to instructor's course
    const assignmentCheck = await pool.query(`
      SELECT a.assignment_id, c.instructor_id
      FROM peer_assessment.assignments a
      JOIN peer_assessment.courses c ON a.course_id = c.course_id
      WHERE a.assignment_id = $1
    `, [assignmentId]);

    if (assignmentCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Assignment not found' },
        { status: 404 }
      );
    }

    const assignment = assignmentCheck.rows[0];
    
    // Verify the instructor owns this assignment's course
    if (assignment.instructor_id !== parseInt(instructorId)) {
      return NextResponse.json(
        { error: 'You do not have permission to release reviews for this assignment' },
        { status: 403 }
      );
    }

    // Release all unreleased AI-generated reviews for submissions in this assignment
    const releaseResult = await pool.query(`
      UPDATE peer_assessment.peer_reviews pr
      SET is_released = true
      FROM peer_assessment.submissions s
      WHERE pr.submission_id = s.submission_id
        AND s.assignment_id = $1
        AND pr.is_ai_generated = true
        AND pr.is_released = false
      RETURNING pr.review_id
    `, [assignmentId]);

    const releasedCount = releaseResult.rows.length;

    return NextResponse.json({
      success: true,
      message: `Successfully released ${releasedCount} AI review(s)`,
      releasedCount: releasedCount
    });

  } catch (error) {
    console.error('Error releasing AI reviews:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint to check how many unreleased AI reviews exist for an assignment
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

    // Count unreleased AI reviews for this assignment
    const countResult = await pool.query(`
      SELECT COUNT(*) as unreleased_count
      FROM peer_assessment.peer_reviews pr
      JOIN peer_assessment.submissions s ON pr.submission_id = s.submission_id
      WHERE s.assignment_id = $1
        AND pr.is_ai_generated = true
        AND pr.is_released = false
    `, [assignmentId]);

    const unreleasedCount = parseInt(countResult.rows[0].unreleased_count || '0');

    return NextResponse.json({
      assignmentId: assignmentId,
      unreleasedCount: unreleasedCount
    });

  } catch (error) {
    console.error('Error counting unreleased AI reviews:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}










