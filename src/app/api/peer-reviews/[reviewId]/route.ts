import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET endpoint for fetching a specific peer review
export async function GET(
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

    // Get details of the peer review
    const reviewResult = await pool.query(`
      SELECT 
        pr.review_id as id,
        pr.submission_id as "submissionId",
        pr.reviewer_id as "reviewerId",
        pr.status,
        pr.overall_feedback as "overallFeedback",
        pr.total_score as "totalScore",
        pr.assigned_date as "assignedDate",
        pr.completed_date as "completedDate",
        s.title as "submissionTitle",
        a.assignment_id as "assignmentId",
        a.title as "assignmentTitle"
      FROM 
        peer_assessment.peer_reviews pr
      JOIN 
        peer_assessment.submissions s ON pr.submission_id = s.submission_id
      JOIN 
        peer_assessment.assignments a ON s.assignment_id = a.assignment_id
      WHERE 
        pr.review_id = $1
    `, [reviewId]);
    
    if (reviewResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Peer review not found' },
        { status: 404 }
      );
    }

    // Get scores for this review if they exist
    const scoresResult = await pool.query(`
      SELECT 
        prs.criterion_id as "criterionId",
        prs.score,
        prs.feedback
      FROM 
        peer_assessment.peer_review_scores prs
      WHERE 
        prs.review_id = $1
    `, [reviewId]);

    const review = {
      ...reviewResult.rows[0],
      scores: scoresResult.rows
    };

    return NextResponse.json({ review });
  } catch (error) {
    console.error('Error fetching peer review:', error);
    return NextResponse.json(
      { error: 'Failed to fetch peer review. Please try again.' },
      { status: 500 }
    );
  }
}

// DELETE endpoint for removing a peer review assignment
export async function DELETE(
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

    // Check if review exists
    const reviewCheck = await pool.query(
      `SELECT review_id, status 
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

    // Don't allow deletion of completed reviews
    if (reviewCheck.rows[0].status === 'completed') {
      return NextResponse.json(
        { error: 'Cannot delete a completed review' },
        { status: 400 }
      );
    }

    // Delete the peer review
    await pool.query(
      `DELETE FROM peer_assessment.peer_reviews 
       WHERE review_id = $1`,
      [reviewId]
    );

    return NextResponse.json({ 
      message: 'Peer review deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting peer review:', error);
    return NextResponse.json(
      { error: 'Failed to delete peer review. Please try again.' },
      { status: 500 }
    );
  }
} 