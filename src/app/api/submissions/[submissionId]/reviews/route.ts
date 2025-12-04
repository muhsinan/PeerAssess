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

    // Get user ID and role from query parameters to determine what data to return
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const userRole = searchParams.get('role');

    // Determine if we should show real names (for instructors) or anonymous (for students)
    let showRealNames = false;
    if (userId && userRole === 'instructor') {
      // Verify the user is actually an instructor
      const userCheck = await pool.query(
        'SELECT role FROM peer_assessment.users WHERE user_id = $1 AND role = $2',
        [userId, 'instructor']
      );
      showRealNames = userCheck.rows.length > 0;
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
    // Hide reviewer identity for AI-generated reviews
    const reviewsResult = await pool.query(
      `SELECT 
         pr.review_id as id,
         pr.submission_id as "submissionId",
         pr.reviewer_id as "reviewerId",
         CASE 
           WHEN $2 = true THEN u.name
           ELSE 'Anonymous Reviewer'
         END as "reviewerName",
         pr.status,
         pr.assigned_date as "assignedDate",
         pr.completed_date as "completedDate",
         pr.overall_feedback as "overallFeedback",
         pr.total_score as "totalScore",
         pr.is_ai_generated as "isAiGenerated",
         pr.is_released as "isReleased",
         pr.ai_feedback_synthesis as "aiSynthesis"
       FROM peer_assessment.peer_reviews pr
       JOIN peer_assessment.users u ON pr.reviewer_id = u.user_id
       WHERE pr.submission_id = $1
       ORDER BY pr.assigned_date ASC`,
      [submissionId, showRealNames]
    );

    // Get detailed scores for each review
    const reviewsWithScores = await Promise.all(
      reviewsResult.rows.map(async (review) => {
        const scoresResult = await pool.query(
          `SELECT 
             rs.criterion_id as "criterionId",
             rs.score,
             rs.feedback
           FROM peer_assessment.peer_review_scores rs
           WHERE rs.review_id = $1
           ORDER BY rs.criterion_id ASC`,
          [review.id]
        );

        // Parse subitem data from feedback if present
        const parsedScores = scoresResult.rows.map(score => {
          let cleanFeedback = score.feedback || '';
          let subitemScores = null;

          // Check if feedback contains embedded subitem data
          const subitemMatch = cleanFeedback.match(/<!--SUBITEM_DATA:(.*?)-->/s);
          if (subitemMatch) {
            try {
              const subitemData = JSON.parse(subitemMatch[1]);
              if (subitemData.type === 'subitems' && Array.isArray(subitemData.evaluations)) {
                subitemScores = subitemData.evaluations;
              }
              // Remove the subitem data marker from the feedback
              cleanFeedback = cleanFeedback.replace(/\n*<!--SUBITEM_DATA:.*?-->/s, '').trim();
            } catch (e) {
              console.error('Error parsing subitem data:', e);
            }
          }

          return {
            ...score,
            feedback: cleanFeedback,
            subitemScores: subitemScores
          };
        });

        return {
          ...review,
          scores: parsedScores
        };
      })
    );

    // Filter unreleased AI reviews for students
    const filteredReviews = reviewsWithScores.filter(review => {
      // Instructors see all reviews
      if (showRealNames) return true;
      
      // Students only see released AI reviews and all non-AI reviews
      if (review.isAiGenerated && !review.isReleased) {
        return false;
      }
      return true;
    });

    // Add "assessing" status reviews for unreleased AI reviews (for students)
    const unreleasedAIReviews = reviewsWithScores.filter(review => 
      review.isAiGenerated && !review.isReleased && !showRealNames
    );

    const assessingReviews = unreleasedAIReviews.map(review => ({
      id: review.id,
      submissionId: review.submissionId,
      reviewerId: review.reviewerId,
      reviewerName: 'AI Reviewer',
      status: 'assessing',
      assignedDate: review.assignedDate,
      completedDate: null,
      overallFeedback: null,
      totalScore: null,
      isAiGenerated: true,
      isReleased: false,
      aiSynthesis: null,
      scores: []
    }));

    return NextResponse.json([...filteredReviews, ...assessingReviews]);
  } catch (error) {
    console.error('Error fetching submission reviews:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reviews. Please try again.' },
      { status: 500 }
    );
  }
} 