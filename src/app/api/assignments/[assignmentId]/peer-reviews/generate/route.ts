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

      // First, get the course ID for this assignment
      const assignmentResult = await client.query(`
        SELECT course_id 
        FROM peer_assessment.assignments 
        WHERE assignment_id = $1
      `, [assignmentId]);

      if (assignmentResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return NextResponse.json(
          { error: 'Assignment not found' },
          { status: 404 }
        );
      }

      const courseId = assignmentResult.rows[0].course_id;

      // Get all enrolled students for this course (not just those who submitted)
      const enrolledStudentsResult = await client.query(`
        SELECT 
          ce.student_id as "studentId"
        FROM 
          peer_assessment.course_enrollments ce
        WHERE 
          ce.course_id = $1
      `, [courseId]);

      const allStudentIds = enrolledStudentsResult.rows.map(row => row.studentId);
      
      if (allStudentIds.length < 2) {
        await client.query('ROLLBACK');
        return NextResponse.json(
          { error: 'Need at least 2 students to assign peer reviews.' },
          { status: 400 }
        );
      }

      // Get all submissions for this assignment
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
      
      // We can assign reviewers even if no submissions exist yet
      // Assignments will be pending for students who haven't submitted

      // Get existing peer reviews to delete them before reassigning
      const existingReviewsResult = await client.query(`
        SELECT 
          pr.review_id,
          pr.status
        FROM 
          peer_assessment.peer_reviews pr
        JOIN 
          peer_assessment.submissions s ON pr.submission_id = s.submission_id
        WHERE 
          s.assignment_id = $1
      `, [assignmentId]);

      // Delete existing peer reviews that are still in 'assigned' status
      // (we don't delete ones that are in_progress or completed)
      if (existingReviewsResult.rows.length > 0) {
        const assignedReviewIds = existingReviewsResult.rows
          .filter(row => row.status === 'assigned')
          .map(row => row.review_id);
        
        if (assignedReviewIds.length > 0) {
          await client.query(`
            DELETE FROM peer_assessment.peer_reviews
            WHERE review_id = ANY($1::int[])
          `, [assignedReviewIds]);
        }
      }

      // Get remaining peer reviews to avoid duplicates
      const remainingReviewsResult = await client.query(`
        SELECT 
          pr.submission_id,
          pr.reviewer_id
        FROM 
          peer_assessment.peer_reviews pr
        JOIN 
          peer_assessment.submissions s ON pr.submission_id = s.submission_id
        WHERE 
          s.assignment_id = $1
      `, [assignmentId]);

      const existingPairs = new Set(
        remainingReviewsResult.rows.map(row => `${row.submission_id}-${row.reviewer_id}`)
      );

      // Use all enrolled students as potential reviewers (not just those who submitted)
      const studentIds = allStudentIds;
      
      // Make sure we have enough students for the assignment logic to work
      if (studentIds.length < 2) {
        await client.query('ROLLBACK');
        return NextResponse.json(
          { error: 'Need at least 2 students to assign peer reviews.' },
          { status: 400 }
        );
      }

      // Generate the peer review assignments
      const peerReviews: PeerReview[] = [];
      const pendingAssignments: {studentId: number, reviewerId: number, studentName?: string, reviewerName?: string}[] = [];

      // Create a map of student submissions for quick lookup
      const submissionMap = new Map(submissions.map(sub => [sub.studentId, sub]));

      // Shuffle all students to randomize assignments
      const shuffledStudents = [...studentIds];
      for (let i = shuffledStudents.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledStudents[i], shuffledStudents[j]] = [shuffledStudents[j], shuffledStudents[i]];
      }

      // Assign 1 reviewer to each student
      for (let i = 0; i < shuffledStudents.length; i++) {
        const studentId = shuffledStudents[i];
        const reviewerId = shuffledStudents[(i + 1) % shuffledStudents.length]; // Next student in circular fashion
        
        // Skip if trying to assign student to review themselves (shouldn't happen with our logic)
        if (studentId === reviewerId) continue;
        
        const studentSubmission = submissionMap.get(studentId);
        
        // Check if this pair already exists
        const pairKey = `${studentSubmission?.id}-${reviewerId}`;
        if (studentSubmission && existingPairs.has(pairKey)) {
          continue; // Skip this pair as it already exists
        }
        
        if (studentSubmission) {
          // Student has submitted - create actual peer review
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
          `, [studentSubmission.id, reviewerId]);
          
          peerReviews.push(peerReviewResult.rows[0] as PeerReview);
          
          // Add this pair to our tracking set
          if (studentSubmission) {
            existingPairs.add(pairKey);
          }
        } else {
          // Student hasn't submitted yet - store as pending assignment
          pendingAssignments.push({
            studentId: studentId,
            reviewerId: reviewerId
          });
        }
      }

      // Get all student names for the response (for both reviewers and students)
      const allUserIds = [...new Set([
        ...peerReviews.map(pr => pr.reviewerId),
        ...pendingAssignments.map(pa => pa.reviewerId),
        ...pendingAssignments.map(pa => pa.studentId)
      ])];
      
      const usersResult = await client.query(`
        SELECT 
          user_id as id,
          name
        FROM 
          peer_assessment.users
        WHERE 
          user_id = ANY($1::int[])
      `, [allUserIds]);
      
      const userNames = new Map<number, string>();
      usersResult.rows.forEach(user => {
        userNames.set(user.id, user.name);
      });
      
      // Enhance peer reviews with reviewer names
      const enhancedPeerReviews = peerReviews.map(pr => ({
        ...pr,
        reviewerName: userNames.get(pr.reviewerId) || 'Unknown'
      }));

      // Enhance pending assignments with names
      const enhancedPendingAssignments = pendingAssignments.map(pa => ({
        ...pa,
        studentName: userNames.get(pa.studentId) || 'Unknown',
        reviewerName: userNames.get(pa.reviewerId) || 'Unknown'
      }));

      await client.query('COMMIT');
      
      return NextResponse.json({
        peerReviews: enhancedPeerReviews,
        pendingAssignments: enhancedPendingAssignments,
        stats: {
          totalEnrolledStudents: allStudentIds.length,
          submissionsCount: submissions.length,
          peerReviewsCreated: peerReviews.length,
          pendingAssignmentsCreated: pendingAssignments.length
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