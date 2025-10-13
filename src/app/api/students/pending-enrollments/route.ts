import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET pending enrollment requests for a student
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const studentId = url.searchParams.get('studentId');
    
    if (!studentId) {
      return NextResponse.json(
        { error: 'Student ID is required' },
        { status: 400 }
      );
    }

    // Get all pending enrollment requests for the student
    const result = await pool.query(`
      SELECT 
        per.request_id,
        per.course_id,
        per.student_id,
        per.student_name,
        per.student_email,
        per.status,
        per.requested_at,
        per.reviewed_at,
        per.rejection_reason,
        c.name as course_name,
        c.description as course_description,
        u.name as instructor_name,
        reviewer.name as reviewer_name
      FROM 
        peer_assessment.pending_enrollment_requests per
      JOIN 
        peer_assessment.courses c ON per.course_id = c.course_id
      JOIN 
        peer_assessment.users u ON c.instructor_id = u.user_id
      LEFT JOIN 
        peer_assessment.users reviewer ON per.reviewed_by = reviewer.user_id
      WHERE 
        per.student_id = $1
      ORDER BY 
        per.requested_at DESC
    `, [studentId]);

    return NextResponse.json({
      pendingRequests: result.rows.map(request => ({
        id: request.request_id,
        courseId: request.course_id,
        courseName: request.course_name,
        courseDescription: request.course_description,
        instructorName: request.instructor_name,
        status: request.status,
        requestedAt: request.requested_at,
        reviewedAt: request.reviewed_at,
        rejectionReason: request.rejection_reason,
        reviewerName: request.reviewer_name
      }))
    });
  } catch (error) {
    console.error('Error fetching student pending enrollment requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pending enrollment requests. Please try again.' },
      { status: 500 }
    );
  }
}
