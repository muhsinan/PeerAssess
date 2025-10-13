import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Get student ID from query parameters
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');

    if (!studentId || isNaN(parseInt(studentId))) {
      return NextResponse.json({ error: 'Invalid student ID' }, { status: 400 });
    }

    // First check if user exists and is a student
    const userResult = await pool.query(
      `SELECT * FROM peer_assessment.users WHERE user_id = $1 AND role = 'student'`,
      [studentId]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Fetch enrolled courses
    const coursesQuery = `
      SELECT 
        c.course_id as id,
        c.name,
        c.description,
        u.name as instructorName,
        u.user_id as instructorId,
        ce.enrollment_date as enrollmentDate,
        (
          SELECT COUNT(*) 
          FROM peer_assessment.assignments a 
          WHERE a.course_id = c.course_id
        ) as assignmentCount
      FROM 
        peer_assessment.courses c
      JOIN 
        peer_assessment.course_enrollments ce ON c.course_id = ce.course_id
      JOIN 
        peer_assessment.users u ON c.instructor_id = u.user_id
      WHERE 
        ce.student_id = $1
      ORDER BY 
        c.name ASC
    `;
    const coursesResult = await pool.query(coursesQuery, [studentId]);
    const courses = coursesResult.rows;

    // Fetch upcoming assignments with submission status
    const assignmentsQuery = `
      WITH student_submissions AS (
        SELECT 
          assignment_id,
          submission_id,
          CASE WHEN COUNT(*) > 0 THEN true ELSE false END as has_submitted
        FROM 
          peer_assessment.submissions
        WHERE 
          student_id = $1 AND status IN ('submitted', 'reviewed')
        GROUP BY 
          assignment_id, submission_id
      )
      SELECT 
        a.assignment_id as id,
        a.title,
        a.description,
        a.due_date as "dueDate",
        c.name as "courseName",
        c.course_id as "courseId",
        COALESCE(ss.has_submitted, false) as "submitted",
        ss.submission_id as "submissionId",
        CASE 
          WHEN a.due_date < NOW() THEN 'past'
          WHEN a.due_date < NOW() + INTERVAL '3 days' THEN 'soon'
          ELSE 'upcoming'
        END as status
      FROM 
        peer_assessment.assignments a
      JOIN 
        peer_assessment.courses c ON a.course_id = c.course_id
      JOIN 
        peer_assessment.course_enrollments ce ON c.course_id = ce.course_id
      LEFT JOIN 
        student_submissions ss ON a.assignment_id = ss.assignment_id
      WHERE 
        ce.student_id = $1
      ORDER BY 
        a.due_date ASC
      LIMIT 10
    `;
    const assignmentsResult = await pool.query(assignmentsQuery, [studentId]);
    const assignments = assignmentsResult.rows;

    // Fetch recent submissions
    const submissionsQuery = `
      SELECT 
        s.submission_id as id,
        s.title,
        s.content,
        s.status,
        s.submission_date as "submissionDate",
        s.ai_submission_analysis as "aiAnalysis",
        a.title as "assignmentTitle",
        a.assignment_id as "assignmentId",
        a.due_date as "dueDate",
        c.name as "courseName",
        c.course_id as "courseId",
        (
          SELECT COUNT(*) 
          FROM peer_assessment.peer_reviews pr 
          WHERE pr.submission_id = s.submission_id
        ) as "reviewCount",
        (
          SELECT COUNT(*) 
          FROM peer_assessment.peer_reviews pr 
          WHERE pr.submission_id = s.submission_id AND pr.status = 'completed'
        ) as "completedReviewCount",
        (
          SELECT json_agg(json_build_object(
            'id', pr.review_id,
            'reviewerId', pr.reviewer_id,
            'reviewerName', 'Anonymous Reviewer',
            'status', pr.status,
            'assignedDate', pr.assigned_date,
            'completedDate', pr.completed_date,
            'overallFeedback', pr.overall_feedback,
            'totalScore', pr.total_score,
            'aiSynthesis', pr.ai_feedback_synthesis
          ))
          FROM peer_assessment.peer_reviews pr
          JOIN peer_assessment.users u ON pr.reviewer_id = u.user_id
          WHERE pr.submission_id = s.submission_id
        ) as "reviews"
      FROM 
        peer_assessment.submissions s
      JOIN 
        peer_assessment.assignments a ON s.assignment_id = a.assignment_id
      JOIN 
        peer_assessment.courses c ON a.course_id = c.course_id
      WHERE 
        s.student_id = $1
      ORDER BY 
        s.submission_date DESC
      LIMIT 5
    `;
    const submissionsResult = await pool.query(submissionsQuery, [studentId]);
    const submissions = submissionsResult.rows;

    // Fetch assigned peer reviews (reviews student needs to complete)
    // Include check for whether the reviewer has submitted their own assignment
    const assignedReviewsQuery = `
      SELECT 
        pr.review_id as id,
        pr.assigned_date as "assignedDate",
        pr.status,
        s.submission_id as "submissionId",
        s.title as "submissionTitle",
        s.student_id as "studentId",
        u.name as "studentName",
        u.email as "studentEmail",
        a.title as "assignmentTitle",
        a.assignment_id as "assignmentId",
        c.name as "courseName",
        c.course_id as "courseId",
        a.due_date as "dueDate",
        CASE 
          WHEN reviewer_submission.submission_id IS NOT NULL THEN true
          ELSE false
        END as "reviewerHasSubmitted"
      FROM 
        peer_assessment.peer_reviews pr
      JOIN 
        peer_assessment.submissions s ON pr.submission_id = s.submission_id
      JOIN 
        peer_assessment.users u ON s.student_id = u.user_id
      JOIN 
        peer_assessment.assignments a ON s.assignment_id = a.assignment_id
      JOIN 
        peer_assessment.courses c ON a.course_id = c.course_id
      LEFT JOIN 
        peer_assessment.submissions reviewer_submission ON (
          reviewer_submission.assignment_id = a.assignment_id 
          AND reviewer_submission.student_id = pr.reviewer_id 
          AND reviewer_submission.status IN ('submitted', 'reviewed')
        )
      WHERE 
        pr.reviewer_id = $1
      ORDER BY 
        pr.assigned_date ASC
    `;
    const assignedReviewsResult = await pool.query(assignedReviewsQuery, [studentId]);
    const assignedReviews = assignedReviewsResult.rows;

    // Fetch recent feedback (reviews others have completed on student's submissions)
    // Group by submission and include stored aggregated synthesis
    const receivedFeedbackQuery = `
      SELECT 
        s.submission_id as submissionId,
        s.title as submissionTitle,
        s.aggregated_feedback_synthesis as aggregatedSynthesis,
        s.aggregated_synthesis_generated_at as aggregatedSynthesisGeneratedAt,
        a.title as assignmentTitle,
        c.name as courseName,
        c.course_id as courseId,
        array_agg(
          json_build_object(
            'reviewId', pr.review_id,
            'overallFeedback', pr.overall_feedback,
            'aiSynthesis', pr.ai_feedback_synthesis,
            'completedDate', pr.completed_date,
            'totalScore', pr.total_score,
            'isAiGenerated', pr.is_ai_generated
          ) ORDER BY pr.completed_date DESC
        ) as reviews,
        COUNT(pr.review_id) as reviewCount,
        MAX(pr.completed_date) as latestCompletedDate,
        AVG(pr.total_score) as averageScore
      FROM 
        peer_assessment.peer_reviews pr
      JOIN 
        peer_assessment.submissions s ON pr.submission_id = s.submission_id
      JOIN 
        peer_assessment.users u ON pr.reviewer_id = u.user_id
      JOIN 
        peer_assessment.assignments a ON s.assignment_id = a.assignment_id
      JOIN 
        peer_assessment.courses c ON a.course_id = c.course_id
      WHERE 
        s.student_id = $1 AND pr.status = 'completed'
      GROUP BY 
        s.submission_id, s.title, s.aggregated_feedback_synthesis, s.aggregated_synthesis_generated_at, a.title, c.name, c.course_id
      ORDER BY 
        MAX(pr.completed_date) DESC
      LIMIT 5
    `;
    const receivedFeedbackResult = await pool.query(receivedFeedbackQuery, [studentId]);
    const receivedFeedback = receivedFeedbackResult.rows;

    // Use stored aggregated synthesis from database (no need to regenerate)
    const processedFeedback = receivedFeedback.map((feedback) => {
      return {
        ...feedback,
        // Use the aggregated synthesis from the database if it exists
        aggregatedSynthesis: feedback.aggregatedsynthesis || feedback.aggregatedSynthesis,
        reviews: feedback.reviews || []
      };
    });

    // Return all dashboard data
    return NextResponse.json({
      courses: coursesResult.rows.map(course => ({
        id: course.id,
        name: course.name,
        description: course.description,
        instructorName: course.instructorname || course.instructor_name,
        instructorId: course.instructorid || course.instructor_id,
        enrollmentDate: course.enrollmentdate || course.enrollment_date,
        assignmentCount: parseInt(course.assignmentcount || course.assignment_count || '0')
      })),
      assignments: assignmentsResult.rows.map(assignment => ({
        id: assignment.id,
        title: assignment.title,
        description: assignment.description,
        dueDate: assignment.dueDate,
        courseId: assignment.courseId,
        courseName: assignment.courseName,
        submitted: assignment.submitted,
        submissionId: assignment.submissionId,
        status: assignment.status
      })),
      submissions: submissions.map(submission => ({
        id: submission.id,
        title: submission.title,
        content: submission.content,
        status: submission.status,
        submissionDate: submission.submissionDate,
        assignmentId: submission.assignmentId,
        assignmentTitle: submission.assignmentTitle,
        dueDate: submission.dueDate,
        courseId: submission.courseId,
        courseName: submission.courseName,
        reviewCount: parseInt(submission.reviewCount),
        completedReviewCount: parseInt(submission.completedReviewCount),
        reviews: submission.reviews || []
      })),
      assignedReviews: assignedReviews.map(review => ({
        id: review.id,
        submissionId: review.submissionId,
        submissionTitle: review.submissionTitle,
        studentId: review.studentId,
        studentName: review.studentName,
        studentEmail: review.studentEmail,
        assignmentId: review.assignmentId,
        assignmentTitle: review.assignmentTitle,
        courseId: review.courseId,
        courseName: review.courseName,
        status: review.status,
        assignedDate: review.assignedDate,
        dueDate: review.dueDate,
        reviewerHasSubmitted: review.reviewerHasSubmitted
      })),
      receivedFeedback: processedFeedback.map(feedback => ({
        submissionId: feedback.submissionid || feedback.submissionId,
        submissionTitle: feedback.submissiontitle || feedback.submissionTitle,
        assignmentTitle: feedback.assignmenttitle || feedback.assignmentTitle,
        courseName: feedback.coursename || feedback.courseName,
        courseId: feedback.courseid || feedback.courseId,
        reviews: feedback.reviews || [],
        reviewCount: parseInt(feedback.reviewcount || feedback.reviewCount || '0'),
        latestCompletedDate: feedback.latestcompleteddate || feedback.latestCompletedDate,
        averageScore: parseFloat(feedback.averagescore || feedback.averageScore || '0'),
        aggregatedSynthesis: feedback.aggregatedSynthesis
      }))
    });
  } catch (error) {
    console.error('Error fetching student dashboard data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
} 