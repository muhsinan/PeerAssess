import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

// POST endpoint to release a single AI review
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ reviewId: string }> }
) {
  try {
    const { reviewId } = await params;
    const body = await request.json();
    const { instructorId } = body;
    
    if (!reviewId || isNaN(Number(reviewId))) {
      return NextResponse.json(
        { error: 'Invalid review ID' },
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

    // Get the review and verify it's an AI-generated review
    const reviewCheck = await pool.query(`
      SELECT 
        pr.review_id,
        pr.is_ai_generated,
        pr.is_released,
        s.assignment_id,
        c.instructor_id
      FROM peer_assessment.peer_reviews pr
      JOIN peer_assessment.submissions s ON pr.submission_id = s.submission_id
      JOIN peer_assessment.assignments a ON s.assignment_id = a.assignment_id
      JOIN peer_assessment.courses c ON a.course_id = c.course_id
      WHERE pr.review_id = $1
    `, [reviewId]);

    if (reviewCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      );
    }

    const review = reviewCheck.rows[0];

    // Verify the instructor owns this course
    if (review.instructor_id !== parseInt(instructorId)) {
      return NextResponse.json(
        { error: 'You do not have permission to release this review' },
        { status: 403 }
      );
    }

    // Verify it's an AI-generated review
    if (!review.is_ai_generated) {
      return NextResponse.json(
        { error: 'This review is not AI-generated and does not need to be released' },
        { status: 400 }
      );
    }

    // Check if already released
    if (review.is_released) {
      return NextResponse.json(
        { error: 'This review has already been released' },
        { status: 400 }
      );
    }

    // Release the review
    await pool.query(`
      UPDATE peer_assessment.peer_reviews
      SET is_released = true
      WHERE review_id = $1
    `, [reviewId]);

    return NextResponse.json({
      success: true,
      message: 'Review released successfully'
    });

  } catch (error) {
    console.error('Error releasing AI review:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

