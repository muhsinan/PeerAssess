import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

interface PeerReview {
  id: number;
  submissionId: number;
  reviewerId: number;
  status: string;
  assignedDate: string;
  reviewerName?: string;
}

export async function POST(
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

    // Get request body
    const body = await request.json();
    const reviewsPerStudent = body.reviewsPerStudent || 2; // Default to 2 reviews per student

    // Start a transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // First, get all submissions for this assignment
      const submissionsResult = await client.query(`
        SELECT 
          s.submission_id as id,
          s.student_id as "studentId"
        FROM 
          peer_assessment.submissions s
        WHERE 
          s.assignment_id = $1
      `, [assignmentId]);

      const submissions = submissionsResult.rows;
      
      if (submissions.length < 1) {
        await client.query('ROLLBACK');
        return NextResponse.json(
          { error: 'No submissions found to generate peer reviews.' },
          { status: 400 }
        );
      }

      // Get existing peer reviews to delete them before reassigning
      const existingReviewsResult = await client.query(`
        SELECT 
          pr.review_id
        FROM 
          peer_assessment.peer_reviews pr
        JOIN 
          peer_assessment.submissions s ON pr.submission_id = s.submission_id
        WHERE 
          s.assignment_id = $1
          AND pr.status = 'assigned'
      `, [assignmentId]);

      // Delete existing peer reviews that are still in 'assigned' status
      // (we don't delete ones that are in_progress or completed)
      if (existingReviewsResult.rows.length > 0) {
        const reviewIds = existingReviewsResult.rows.map(row => row.review_id);
        await client.query(`
          DELETE FROM peer_assessment.peer_reviews
          WHERE review_id = ANY($1::int[])
        `, [reviewIds]);
      }

      // Get all students who have submitted
      const studentIds = [...new Set(submissions.map(sub => sub.studentId))];
      
      // Adjust reviewsPerStudent based on number of submissions
      const adjustedReviewsPerStudent = Math.min(reviewsPerStudent, Math.max(1, submissions.length - 1));
      
      // Make sure we have at least as many students as the adjusted reviewsPerStudent parameter
      if (studentIds.length <= adjustedReviewsPerStudent) {
        await client.query('ROLLBACK');
        return NextResponse.json(
          { error: `Not enough different students for ${adjustedReviewsPerStudent} reviews per student. Need at least ${adjustedReviewsPerStudent + 1}.` },
          { status: 400 }
        );
      }

      // Generate the peer review assignments
      const peerReviews: PeerReview[] = [];
      let reviewsDistribution = new Map<number, number>(); // Track reviews assigned per student
      let reviewsReceived = new Map<number, number>(); // Track reviews received per submission

      // Initialize counters for each student
      studentIds.forEach(studentId => {
        reviewsDistribution.set(studentId, 0);
      });
      
      // Initialize counters for each submission
      submissions.forEach(sub => {
        reviewsReceived.set(sub.id, 0);
      });

      // First, ensure every student gets exactly adjustedReviewsPerStudent assignments
      for (const studentId of studentIds) {
        // Find submissions this student can review (not their own)
        const eligibleSubmissions = submissions.filter(sub => sub.studentId !== studentId);
        
        // Assign adjustedReviewsPerStudent reviews to this student
        let assignedCount = 0;
        
        // Copy eligible submissions for shuffling
        let shuffledSubmissions = [...eligibleSubmissions];
        
        // Simple shuffle algorithm (Fisher-Yates)
        for (let i = shuffledSubmissions.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffledSubmissions[i], shuffledSubmissions[j]] = [shuffledSubmissions[j], shuffledSubmissions[i]];
        }
        
        // Sort by number of reviews already received to prioritize submissions with fewer reviews
        shuffledSubmissions.sort((a, b) => 
          (reviewsReceived.get(a.id) || 0) - (reviewsReceived.get(b.id) || 0)
        );
        
        // Assign reviews until we reach the target per student
        for (const submission of shuffledSubmissions) {
          if (assignedCount >= adjustedReviewsPerStudent) break;
          
          // Create a new peer review
          const peerReviewResult = await client.query(`
            INSERT INTO peer_assessment.peer_reviews (
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
              assigned_date as "assignedDate"
          `, [submission.id, studentId]);
          
          peerReviews.push(peerReviewResult.rows[0] as PeerReview);
          assignedCount++;
          
          // Update tracking counts
          reviewsDistribution.set(studentId, (reviewsDistribution.get(studentId) || 0) + 1);
          reviewsReceived.set(submission.id, (reviewsReceived.get(submission.id) || 0) + 1);
        }
      }

      // Now ensure all submissions have roughly the same number of reviews
      // Calculate target reviews per submission
      const targetReviewsPerSubmission = Math.ceil((studentIds.length * adjustedReviewsPerStudent) / submissions.length);
      
      // Find submissions that need more reviews
      for (const submission of submissions) {
        const currentReviews = reviewsReceived.get(submission.id) || 0;
        if (currentReviews < targetReviewsPerSubmission) {
          // Find eligible reviewers (who haven't already reviewed this submission and aren't the author)
          const eligibleReviewers = studentIds.filter(studentId => 
            studentId !== submission.studentId && 
            !peerReviews.some(pr => pr.submissionId === submission.id && pr.reviewerId === studentId)
          );
          
          // Sort reviewers by number of reviews already assigned to balance workload
          eligibleReviewers.sort((a, b) => 
            (reviewsDistribution.get(a) || 0) - (reviewsDistribution.get(b) || 0)
          );
          
          // Assign additional reviews needed
          for (let i = 0; i < targetReviewsPerSubmission - currentReviews && i < eligibleReviewers.length; i++) {
            const reviewerId = eligibleReviewers[i];
            
            // Create a new peer review
            const peerReviewResult = await client.query(`
              INSERT INTO peer_assessment.peer_reviews (
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
                assigned_date as "assignedDate"
            `, [submission.id, reviewerId]);
            
            peerReviews.push(peerReviewResult.rows[0] as PeerReview);
            
            // Update tracking counts
            reviewsDistribution.set(reviewerId, (reviewsDistribution.get(reviewerId) || 0) + 1);
            reviewsReceived.set(submission.id, (reviewsReceived.get(submission.id) || 0) + 1);
          }
        }
      }

      // Get reviewer names for the response
      const reviewerIds = peerReviews.map(pr => pr.reviewerId);
      const reviewersResult = await client.query(`
        SELECT 
          user_id as id,
          name
        FROM 
          peer_assessment.users
        WHERE 
          user_id = ANY($1::int[])
      `, [reviewerIds]);
      
      const reviewerNames = new Map<number, string>();
      reviewersResult.rows.forEach(reviewer => {
        reviewerNames.set(reviewer.id, reviewer.name);
      });
      
      // Enhance peer reviews with reviewer names
      const enhancedPeerReviews = peerReviews.map(pr => ({
        ...pr,
        reviewerName: reviewerNames.get(pr.reviewerId) || 'Unknown'
      }));

      await client.query('COMMIT');
      
      return NextResponse.json({
        peerReviews: enhancedPeerReviews,
        stats: {
          reviewsPerStudent: Object.fromEntries(reviewsDistribution),
          reviewsPerSubmission: Object.fromEntries(reviewsReceived)
        }
      });
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Error generating peer reviews:', err);
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error in peer review generation:', error);
    return NextResponse.json(
      { error: 'Failed to generate peer reviews. Please try again.' },
      { status: 500 }
    );
  }
} 