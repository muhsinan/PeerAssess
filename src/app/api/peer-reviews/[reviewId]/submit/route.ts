import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(
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
    const { criteriaScores, overallFeedback, totalScore, status } = body;
    
    // Validate inputs
    if (!status || !['in_progress', 'completed'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be "in_progress" or "completed"' },
        { status: 400 }
      );
    }

    if (status === 'completed') {
      if (!criteriaScores || !Array.isArray(criteriaScores) || criteriaScores.length === 0) {
        return NextResponse.json(
          { error: 'Criteria scores are required for completed reviews' },
          { status: 400 }
        );
      }

      if (!overallFeedback) {
        return NextResponse.json(
          { error: 'Overall feedback is required for completed reviews' },
          { status: 400 }
        );
      }
    }

    // Start a transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Check if review exists
      const reviewResult = await client.query(
        `SELECT review_id, submission_id 
         FROM peer_assessment.peer_reviews 
         WHERE review_id = $1`,
        [reviewId]
      );
      
      if (reviewResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return NextResponse.json(
          { error: 'Peer review not found' },
          { status: 404 }
        );
      }

      // Update the review with overall feedback, total score, and status
      const updateResult = await client.query(`
        UPDATE peer_assessment.peer_reviews
        SET 
          overall_feedback = $1,
          total_score = $2,
          status = $3::VARCHAR,
          completed_date = CASE WHEN $4::VARCHAR = 'completed' THEN CURRENT_TIMESTAMP ELSE NULL END
        WHERE review_id = $5
        RETURNING 
          review_id as id,
          submission_id as "submissionId",
          reviewer_id as "reviewerId",
          status,
          overall_feedback as "overallFeedback",
          total_score as "totalScore",
          assigned_date as "assignedDate",
          completed_date as "completedDate"
      `, [overallFeedback || null, totalScore || null, status, status, reviewId]);

      // Handle criteria scores
      if (criteriaScores && criteriaScores.length > 0) {
        // Delete any existing scores for this review
        await client.query(`
          DELETE FROM peer_assessment.peer_review_scores
          WHERE review_id = $1
        `, [reviewId]);

        // Validate that all criterion IDs exist in the database
        const criterionIds = criteriaScores.map((cs: { criterionId: number }) => cs.criterionId);
        const validationResult = await client.query(`
          SELECT criterion_id 
          FROM peer_assessment.rubric_criteria 
          WHERE criterion_id = ANY($1)
        `, [criterionIds]);
        
        // Check if all criterionIds are valid
        if (validationResult.rows.length !== criterionIds.length) {
          throw new Error('One or more invalid criterion IDs');
        }

        // Insert new scores with proper data type handling
        for (const criterionScore of criteriaScores) {
          await client.query(`
            INSERT INTO peer_assessment.peer_review_scores(
              review_id, 
              criterion_id, 
              score, 
              feedback
            )
            VALUES ($1, $2, $3, $4)
          `, [
            parseInt(reviewId),
            parseInt(criterionScore.criterionId),
            parseInt(criterionScore.score) || 0,
            criterionScore.feedback || null
          ]);
        }
      }

      // Get the submission ID for this review
      const submissionId = reviewResult.rows[0].submission_id;

      // If the review is completed, check if all reviews for this submission are completed
      // If yes, update the submission status to 'reviewed'
      if (status === 'completed') {
        const pendingReviewsResult = await client.query(`
          SELECT COUNT(*) as pending_count
          FROM peer_assessment.peer_reviews
          WHERE submission_id = $1 AND status != 'completed'
        `, [submissionId]);

        const pendingCount = parseInt(pendingReviewsResult.rows[0].pending_count);
        
        if (pendingCount === 0) {
          await client.query(`
            UPDATE peer_assessment.submissions
            SET status = 'reviewed'
            WHERE submission_id = $1
          `, [submissionId]);
        }
      }

      // Get scores for this review
      const scoresResult = await client.query(`
        SELECT 
          criterion_id as "criterionId",
          score,
          feedback
        FROM peer_assessment.peer_review_scores
        WHERE review_id = $1
      `, [reviewId]);

      // Commit the transaction
      await client.query('COMMIT');

      // AI feedback generation would go here in a real implementation
      let aiGeneratedFeedback = null;
      if (status === 'completed') {
        // Mock AI feedback for demonstration purposes
        aiGeneratedFeedback = {
          summary: "The AI has analyzed this peer review and it appears to be thorough and constructive.",
          strengths: "The reviewer has provided specific feedback and examples.",
          suggestions: "Consider providing more actionable improvement suggestions in future reviews."
        };
      }

      const review = {
        ...updateResult.rows[0],
        scores: scoresResult.rows,
        aiAnalysis: aiGeneratedFeedback
      };

      return NextResponse.json({
        message: status === 'completed' 
          ? 'Peer review submitted successfully' 
          : 'Peer review saved as draft successfully',
        review
      });
    } catch (error) {
      // Rollback in case of error
      await client.query('ROLLBACK');
      throw error;
    } finally {
      // Release the client
      client.release();
    }
  } catch (error) {
    console.error('Error submitting peer review:', error);
    // Add detailed error logging
    if (error instanceof Error) {
      console.error('Error details:', error.message, error.stack);
    }
    return NextResponse.json(
      { error: 'Failed to submit peer review. Please try again.' },
      { status: 500 }
    );
  }
} 