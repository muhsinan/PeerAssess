import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import OpenAI from 'openai';

// Function to generate AI synthesis of multiple feedbacks
async function generateMultiFeedbackSynthesis(reviews: any[]) {
  try {
    // Don't synthesize if there's only one review or no reviews
    if (!reviews || reviews.length <= 1) {
      return null;
    }

    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
    });

    // Prepare combined feedback from all reviews
    const combinedFeedback = reviews.map((review, index) => {
      return `Review ${index + 1} (Score: ${review.total_score || 'N/A'}):
${review.overall_feedback || 'No feedback provided'}

${review.ai_feedback_synthesis ? `Previous synthesis: ${review.ai_feedback_synthesis}` : ''}`;
    }).join('\n\n---\n\n');

    const prompt = `You have received multiple peer reviews for the same submission. Please create a comprehensive synthesis that combines insights from all reviews:

${combinedFeedback}

Please provide a comprehensive synthesis that:
1. Identifies consistent strengths mentioned across multiple reviews
2. Highlights areas for improvement that multiple reviewers identified
3. Notes any conflicting feedback and provides balanced perspective
4. Summarizes the overall assessment in a clear, organized way
5. Keep it focused and actionable (around 150-200 words)

Format your response as a clear, well-structured summary that helps the student understand the collective feedback from their peers.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are an AI assistant that synthesizes multiple peer feedback into clear, actionable summaries. Focus on extracting common themes, strengths, and areas for improvement from multiple reviews to help students understand their overall performance."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 400
    });

    const synthesis = completion.choices[0]?.message?.content;
    return synthesis?.trim() || null;
  } catch (error) {
    console.error('Error generating multi-feedback synthesis:', error);
    return null;
  }
}

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

      // If the review is completed, generate aggregated synthesis if multiple reviews exist
      if (status === 'completed') {
        // Get all completed reviews for this submission to check if we need to generate synthesis
        const allReviewsResult = await client.query(`
          SELECT 
            pr.review_id,
            pr.overall_feedback,
            pr.total_score,
            pr.ai_feedback_synthesis,
            pr.completed_date
          FROM peer_assessment.peer_reviews pr
          WHERE pr.submission_id = $1 AND pr.status = 'completed'
          ORDER BY pr.completed_date ASC
        `, [submissionId]);

        const completedReviews = allReviewsResult.rows;
        
        // Generate aggregated synthesis if there are multiple reviews
        if (completedReviews.length > 1) {
          try {
            const aggregatedSynthesis = await generateMultiFeedbackSynthesis(completedReviews);
            
            if (aggregatedSynthesis) {
              // Save the aggregated synthesis to the submissions table
              await client.query(`
                UPDATE peer_assessment.submissions
                SET 
                  aggregated_feedback_synthesis = $1,
                  aggregated_synthesis_generated_at = CURRENT_TIMESTAMP
                WHERE submission_id = $2
              `, [aggregatedSynthesis, submissionId]);
            }
          } catch (error) {
            console.error('Failed to generate aggregated feedback synthesis:', error);
            // Continue without synthesis - this is not critical for the review submission
          }
        }

        // Check if all reviews for this submission are completed and update submission status
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

      const review = {
        ...updateResult.rows[0],
        scores: scoresResult.rows
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