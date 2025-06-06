import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ submissionId: string }> }
) {
  try {
    const { submissionId: submissionIdParam } = await params;
    const submissionId = parseInt(submissionIdParam);

    if (isNaN(submissionId)) {
      return NextResponse.json(
        { error: 'Invalid submission ID' },
        { status: 400 }
      );
    }

    // Verify submission exists
    const submissionCheck = await pool.query(
      `SELECT submission_id FROM peer_assessment.submissions WHERE submission_id = $1`,
      [submissionId]
    );

    if (submissionCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      );
    }

    // Get all reviews for this submission with reviewer details
    const reviewsResult = await pool.query(
      `SELECT 
         pr.review_id as id,
         pr.submission_id as "submissionId",
         pr.reviewer_id as "reviewerId",
         u.name as "reviewerName",
         pr.status,
         pr.assigned_date as "assignedDate",
         pr.completed_date as "completedDate",
         pr.overall_feedback as "overallFeedback",
         pr.total_score as "totalScore"
       FROM peer_assessment.peer_reviews pr
       JOIN peer_assessment.users u ON pr.reviewer_id = u.user_id
       WHERE pr.submission_id = $1
       ORDER BY pr.assigned_date ASC`,
      [submissionId]
    );

    // Get detailed scores for each review
    const reviewsWithScores = await Promise.all(
      reviewsResult.rows.map(async (review) => {
        const scoresResult = await pool.query(
          `SELECT 
             rs.criterion_id as "criterionId",
             rs.score,
             rs.feedback
           FROM peer_assessment.review_scores rs
           WHERE rs.review_id = $1
           ORDER BY rs.criterion_id ASC`,
          [review.id]
        );

        return {
          ...review,
          scores: scoresResult.rows
        };
      })
    );

    return NextResponse.json(reviewsWithScores);
  } catch (error) {
    console.error('Error fetching submission reviews:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reviews. Please try again.' },
      { status: 500 }
    );
  }
} 