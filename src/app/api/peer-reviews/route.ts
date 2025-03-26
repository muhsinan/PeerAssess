import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

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