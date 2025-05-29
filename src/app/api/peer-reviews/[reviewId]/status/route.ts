import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ reviewId: string }> }
) {
  try {
    const { reviewId } = await params;
    
    if (!reviewId || isNaN(Number(reviewId))) {
      return NextResponse.json(
        { error: 'Invalid review ID' },
        { status: 400 }
      );
    }

    // Get request body
    const body = await request.json();
    const { status } = body;
    
    // Validate status
    if (!status || !['assigned', 'in_progress', 'completed'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be "assigned", "in_progress", or "completed"' },
        { status: 400 }
      );
    }

    // Check if review exists
    const reviewCheck = await pool.query(
      `SELECT review_id 
       FROM peer_assessment.peer_reviews 
       WHERE review_id = $1`,
      [reviewId]
    );
    
    if (reviewCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Peer review not found' },
        { status: 404 }
      );
    }

    // Update the review status
    const updateResult = await pool.query(`
      UPDATE peer_assessment.peer_reviews
      SET 
        status = $1,
        completed_date = CASE WHEN $1 = 'completed' THEN CURRENT_TIMESTAMP ELSE NULL END
      WHERE review_id = $2
      RETURNING 
        review_id as id,
        submission_id as "submissionId",
        reviewer_id as "reviewerId",
        status,
        overall_feedback as "overallFeedback",
        total_score as "totalScore",
        assigned_date as "assignedDate",
        completed_date as "completedDate"
    `, [status, reviewId]);

    return NextResponse.json({
      message: 'Peer review status updated successfully',
      review: updateResult.rows[0]
    });
  } catch (error) {
    console.error('Error updating peer review status:', error);
    return NextResponse.json(
      { error: 'Failed to update peer review status. Please try again.' },
      { status: 500 }
    );
  }
} 