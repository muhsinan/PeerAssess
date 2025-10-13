import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET: Fetch details for a specific submission
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ submissionId: string }> }
) {
  try {
    const { submissionId } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!submissionId || isNaN(Number(submissionId))) {
      return NextResponse.json(
        { error: 'Invalid submission ID' },
        { status: 400 }
      );
    }

    // Query to get submission details with related information
    const submissionResult = await pool.query(`
      SELECT 
        s.submission_id as id,
        s.title,
        s.content,
        s.submission_date,
        s.status,
        s.assignment_id,
        s.ai_submission_analysis,
        a.title as assignment_title,
        a.ai_prompts_enabled,
        a.course_id,
        c.name as course_name,
        s.student_id,
        u.name as student_name,
        u.email as student_email,
        u.role as student_role
      FROM 
        peer_assessment.submissions s
      JOIN 
        peer_assessment.assignments a ON s.assignment_id = a.assignment_id
      JOIN 
        peer_assessment.courses c ON a.course_id = c.course_id
      JOIN 
        peer_assessment.users u ON s.student_id = u.user_id
      WHERE 
        s.submission_id = $1
    `, [submissionId]);

    if (submissionResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      );
    }

    const submission = submissionResult.rows[0];
    
    // If a user ID was provided, check if they're authorized to view this submission
    if (userId) {
      // Get the user's role
      const userResult = await pool.query(
        'SELECT role FROM peer_assessment.users WHERE user_id = $1',
        [userId]
      );
      
      if (userResult.rows.length === 0) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }
      
      const userRole = userResult.rows[0].role;
      
      // Check permissions:
      // 1. Instructors can view all submissions
      // 2. Students can view their own submissions
      // 3. Students can view submissions they are assigned to peer review
      let hasAccess = false;
      
      if (userRole === 'instructor') {
        hasAccess = true;
      } else if (userRole === 'student') {
        // Check if it's their own submission
        if (submission.student_id === parseInt(userId)) {
          hasAccess = true;
        } else {
          // Check if they are assigned as a peer reviewer for this submission
          const peerReviewCheck = await pool.query(`
            SELECT review_id 
            FROM peer_assessment.peer_reviews 
            WHERE submission_id = $1 AND reviewer_id = $2
          `, [submissionId, userId]);
          
          if (peerReviewCheck.rows.length > 0) {
            hasAccess = true;
          }
        }
      }
      
      if (!hasAccess) {
        return NextResponse.json(
          { error: 'You do not have permission to view this submission' },
          { status: 403 }
        );
      }
    }

    // Get user ID and role from query parameters to determine what data to return
    const { searchParams: reviewSearchParams } = new URL(request.url);
    const requestUserId = reviewSearchParams.get('userId');
    const requestUserRole = reviewSearchParams.get('role');

    // Determine if we should show real names (for instructors) or anonymous (for students)
    let showRealNames = false;
    if (requestUserId && requestUserRole === 'instructor') {
      // Verify the user is actually an instructor
      const userCheck = await pool.query(
        'SELECT role FROM peer_assessment.users WHERE user_id = $1 AND role = $2',
        [requestUserId, 'instructor']
      );
      showRealNames = userCheck.rows.length > 0;
    }

    // Get reviews for this submission
    // Hide reviewer identity for AI-generated reviews
    const reviewsResult = await pool.query(`
      SELECT 
        pr.review_id as id,
        pr.reviewer_id,
        CASE 
          WHEN $2 = true THEN u.name
          ELSE 'Anonymous Reviewer'
        END as reviewer_name,
        pr.overall_feedback,
        pr.total_score,
        pr.status,
        pr.assigned_date,
        pr.completed_date,
        pr.is_ai_generated,
        pr.ai_feedback_synthesis
      FROM 
        peer_assessment.peer_reviews pr
      JOIN 
        peer_assessment.users u ON pr.reviewer_id = u.user_id
      WHERE 
        pr.submission_id = $1
      ORDER BY 
        CASE 
          WHEN pr.status = 'completed' THEN 1
          WHEN pr.status = 'in_progress' THEN 2
          ELSE 3
        END,
        pr.assigned_date DESC
    `, [submissionId, showRealNames]);

    const reviews = reviewsResult.rows;

    // Get attachments for this submission
    const attachmentsResult = await pool.query(`
      SELECT 
        attachment_id as id,
        file_name as "fileName",
        file_path as "filePath",
        file_size as "fileSize",
        file_type as "fileType",
        upload_date as "uploadDate"
      FROM 
        peer_assessment.submission_attachments
      WHERE 
        submission_id = $1
      ORDER BY 
        upload_date DESC
    `, [submissionId]);

    const attachments = attachmentsResult.rows;
    
    return NextResponse.json({
      submission: {
        id: submission.id,
        title: submission.title,
        content: submission.content,
        submissionDate: submission.submission_date,
        status: submission.status,
        assignmentId: submission.assignment_id,
        assignmentTitle: submission.assignment_title,
        aiPromptsEnabled: submission.ai_prompts_enabled,
        courseId: submission.course_id,
        courseName: submission.course_name,
        studentId: submission.student_id,
        studentName: submission.student_name,
        studentEmail: submission.student_email,
        attachments: attachments,
        reviews: reviews.map(review => ({
          id: review.id,
          reviewerId: review.reviewer_id,
          reviewerName: review.reviewer_name,
          overallFeedback: review.overall_feedback,
          totalScore: review.total_score,
          status: review.status,
          assignedDate: review.assigned_date,
          completedDate: review.completed_date
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching submission details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch submission details. Please try again.' },
      { status: 500 }
    );
  }
} 