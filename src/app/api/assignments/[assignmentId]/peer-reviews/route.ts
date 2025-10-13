import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET endpoint for fetching all peer reviews for an assignment
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

    // Get all peer reviews for this assignment's submissions
    const result = await pool.query(`
      SELECT 
        pr.review_id as id,
        pr.submission_id as "submissionId",
        pr.reviewer_id as "reviewerId",
        pr.status,
        pr.assigned_date as "assignedDate",
        pr.completed_date as "completedDate",
        CASE 
          WHEN $2 = true THEN u.name
          ELSE 'Anonymous Reviewer'
        END as "reviewerName"
      FROM 
        peer_assessment.peer_reviews pr
      JOIN 
        peer_assessment.submissions s ON pr.submission_id = s.submission_id
      JOIN 
        peer_assessment.users u ON pr.reviewer_id = u.user_id
      WHERE 
        s.assignment_id = $1
      ORDER BY 
        pr.assigned_date DESC
    `, [assignmentId, showRealNames]);

    return NextResponse.json({
      peerReviews: result.rows
    });
  } catch (error) {
    console.error('Error fetching peer reviews:', error);
    return NextResponse.json(
      { error: 'Failed to fetch peer reviews. Please try again.' },
      { status: 500 }
    );
  }
}

// POST endpoint for creating a new peer review assignment
export async function POST(request: NextRequest) {
  try {
    const { submissionId, reviewerId } = await request.json();
    
    // Validate required fields
    if (!submissionId || isNaN(Number(submissionId))) {
      return NextResponse.json(
        { error: 'Invalid submission ID' },
        { status: 400 }
      );
    }

    if (!reviewerId || isNaN(Number(reviewerId))) {
      return NextResponse.json(
        { error: 'Invalid reviewer ID' },
        { status: 400 }
      );
    }

    // Check if submission exists
    const submissionCheck = await pool.query(
      `SELECT submission_id, student_id 
       FROM peer_assessment.submissions 
       WHERE submission_id = $1`,
      [submissionId]
    );
    
    if (submissionCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      );
    }

    // Check if reviewer exists and is a student
    const reviewerCheck = await pool.query(
      `SELECT user_id 
       FROM peer_assessment.users 
       WHERE user_id = $1 AND role = 'student'`,
      [reviewerId]
    );
    
    if (reviewerCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Reviewer not found or is not a student' },
        { status: 404 }
      );
    }

    // Check if student is trying to review their own submission
    if (submissionCheck.rows[0].student_id === reviewerId) {
      return NextResponse.json(
        { error: 'Students cannot review their own submissions' },
        { status: 400 }
      );
    }

    // Check if this peer review already exists
    const existingReview = await pool.query(
      `SELECT review_id 
       FROM peer_assessment.peer_reviews 
       WHERE submission_id = $1 AND reviewer_id = $2`,
      [submissionId, reviewerId]
    );
    
    if (existingReview.rows.length > 0) {
      return NextResponse.json(
        { error: 'This peer review assignment already exists' },
        { status: 409 }
      );
    }

    // Create the peer review
    const result = await pool.query(
      `INSERT INTO peer_assessment.peer_reviews (
         submission_id, 
         reviewer_id, 
         status, 
         assigned_date
       ) 
       VALUES ($1, $2, 'assigned', CURRENT_TIMESTAMP)
       RETURNING 
         review_id as id,
         submission_id as "submissionId",
         reviewer_id as "reviewerId",
         status,
         assigned_date as "assignedDate"`,
      [submissionId, reviewerId]
    );

    // Get reviewer name for the response
    const reviewerNameResult = await pool.query(
      `SELECT name 
       FROM peer_assessment.users 
       WHERE user_id = $1`,
      [reviewerId]
    );

    const peerReview = {
      ...result.rows[0],
      reviewerName: reviewerNameResult.rows[0]?.name || 'Unknown'
    };

    return NextResponse.json({ 
      message: 'Peer review assigned successfully',
      peerReview
    });
  } catch (error) {
    console.error('Error assigning peer review:', error);
    return NextResponse.json(
      { error: 'Failed to assign peer review. Please try again.' },
      { status: 500 }
    );
  }
} 