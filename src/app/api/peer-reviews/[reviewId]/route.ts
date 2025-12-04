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
        pr.is_ai_generated as "isAiGenerated",
        pr.is_released as "isReleased",
        pr.ai_feedback_synthesis as "aiSynthesis",
        s.title as "submissionTitle",
        u.name as "studentName",
        a.assignment_id as "assignmentId",
        a.title as "assignmentTitle"
      FROM 
        peer_assessment.peer_reviews pr
      JOIN 
        peer_assessment.submissions s ON pr.submission_id = s.submission_id
      JOIN 
        peer_assessment.users u ON s.student_id = u.user_id
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

    // Get scores for this review with criterion details including type
    const scoresResult = await pool.query(`
      SELECT 
        prs.criterion_id as "criterionId",
        rc.name as "criterionName",
        rc.description as "criterionDescription",
        rc.max_points as "maxPoints",
        COALESCE(rc.criterion_type, 'levels') as "criterionType",
        prs.score,
        prs.feedback
      FROM 
        peer_assessment.peer_review_scores prs
      JOIN 
        peer_assessment.rubric_criteria rc ON prs.criterion_id = rc.criterion_id
      WHERE 
        prs.review_id = $1
      ORDER BY 
        rc.criterion_id
    `, [reviewId]);

    // Fetch subitems for criteria that have them
    const criteriaWithSubitems = await Promise.all(
      scoresResult.rows.map(async (score: { criterionId: number; criterionName: string; criterionDescription: string; maxPoints: number; criterionType: string; score: number; feedback: string }) => {
        let subitemsData = null;
        let cleanFeedback = score.feedback || '';
        
        // Parse subitem data from feedback if present
        const subitemMatch = cleanFeedback.match(/<!--SUBITEM_DATA:(.*?)-->/s);
        if (subitemMatch) {
          try {
            const parsedData = JSON.parse(subitemMatch[1]);
            if (parsedData.type === 'subitems' && Array.isArray(parsedData.evaluations)) {
              subitemsData = parsedData.evaluations;
            }
            // Remove the subitem data marker from the feedback
            cleanFeedback = cleanFeedback.replace(/\n*<!--SUBITEM_DATA:.*?-->/s, '').trim();
          } catch (e) {
            console.error('Error parsing subitem data:', e);
          }
        }
        
        // If criterion type is subitems, fetch the subitems from DB for reference
        let subitems = null;
        if (score.criterionType === 'subitems') {
          const subitemsResult = await pool.query(`
            SELECT 
              subitem_id as "subitemId",
              name,
              description,
              points,
              order_position as "orderPosition"
            FROM peer_assessment.rubric_subitems
            WHERE criterion_id = $1
            ORDER BY order_position
          `, [score.criterionId]);
          subitems = subitemsResult.rows;
        }
        
        return {
          ...score,
          feedback: cleanFeedback,
          subitemScores: subitemsData,
          subitems: subitems
        };
      })
    );

    const review = {
      ...reviewResult.rows[0],
      scores: criteriaWithSubitems
    };

    return NextResponse.json(review);
  } catch (error) {
    console.error('Error fetching peer review:', error);
    return NextResponse.json(
      { error: 'Failed to fetch peer review. Please try again.' },
      { status: 500 }
    );
  }
}

// PUT endpoint for updating a peer review (instructor only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ reviewId: string }> }
) {
  try {
    const { reviewId } = await params;
    const body = await request.json();
    const { instructorId, overallFeedback, totalScore, criteriaScores } = body;
    
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
        { error: 'Only instructors can edit reviews' },
        { status: 403 }
      );
    }

    // Verify the review exists and instructor has access
    const reviewCheck = await pool.query(`
      SELECT 
        pr.review_id,
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
        { error: 'You do not have permission to edit this review' },
        { status: 403 }
      );
    }

    // Start transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Update the main review
      await client.query(`
        UPDATE peer_assessment.peer_reviews
        SET overall_feedback = $1,
            total_score = $2
        WHERE review_id = $3
      `, [overallFeedback, totalScore, reviewId]);

      // Update criteria scores
      if (criteriaScores && Array.isArray(criteriaScores)) {
        for (const cs of criteriaScores) {
          // Build feedback with subitem data embedded if present
          let feedbackToStore = cs.feedback || '';
          
          if (cs.subitemScores && Array.isArray(cs.subitemScores) && cs.subitemScores.length > 0) {
            const subitemData = {
              type: 'subitems',
              evaluations: cs.subitemScores.map((ss: { subitemId: number; subitemName: string; checked: boolean; points: number; feedback: string }) => ({
                subitemId: ss.subitemId,
                subitemName: ss.subitemName,
                checked: ss.checked,
                points: ss.points,
                feedback: ss.feedback
              }))
            };
            feedbackToStore = feedbackToStore + '\n<!--SUBITEM_DATA:' + JSON.stringify(subitemData) + '-->';
          }

          await client.query(`
            UPDATE peer_assessment.peer_review_scores
            SET score = $1,
                feedback = $2
            WHERE review_id = $3 AND criterion_id = $4
          `, [cs.score, feedbackToStore, reviewId, cs.criterionId]);
        }
      }

      await client.query('COMMIT');

      return NextResponse.json({
        success: true,
        message: 'Review updated successfully'
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error updating peer review:', error);
    return NextResponse.json(
      { error: 'Failed to update peer review. Please try again.' },
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