import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET pending enrollment requests for a course
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId } = await params;
    
    if (!courseId || isNaN(parseInt(courseId))) {
      return NextResponse.json(
        { error: 'Valid course ID is required' },
        { status: 400 }
      );
    }

    // Get all pending enrollment requests for the course
    const result = await pool.query(`
      SELECT 
        per.request_id,
        per.student_id,
        per.student_name,
        per.student_email,
        per.status,
        per.requested_at,
        per.reviewed_at,
        per.rejection_reason,
        c.name as course_name,
        u.name as reviewer_name
      FROM 
        peer_assessment.pending_enrollment_requests per
      JOIN 
        peer_assessment.courses c ON per.course_id = c.course_id
      LEFT JOIN 
        peer_assessment.users u ON per.reviewed_by = u.user_id
      WHERE 
        per.course_id = $1
      ORDER BY 
        per.requested_at DESC
    `, [courseId]);

    return NextResponse.json({
      pendingRequests: result.rows.map(request => ({
        id: request.request_id,
        studentId: request.student_id,
        studentName: request.student_name,
        studentEmail: request.student_email,
        status: request.status,
        requestedAt: request.requested_at,
        reviewedAt: request.reviewed_at,
        rejectionReason: request.rejection_reason,
        courseName: request.course_name,
        reviewerName: request.reviewer_name
      }))
    });
  } catch (error) {
    console.error('Error fetching pending enrollment requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pending enrollment requests. Please try again.' },
      { status: 500 }
    );
  }
}

// POST to approve or reject an enrollment request
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId } = await params;
    
    if (!courseId || isNaN(parseInt(courseId))) {
      return NextResponse.json(
        { error: 'Valid course ID is required' },
        { status: 400 }
      );
    }
    
    // Get request body
    const { requestId, action, rejectionReason, instructorId } = await request.json();
    
    if (!requestId || !action || !instructorId) {
      return NextResponse.json(
        { error: 'Request ID, action, and instructor ID are required' },
        { status: 400 }
      );
    }
    
    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Action must be either "approve" or "reject"' },
        { status: 400 }
      );
    }
    
    if (action === 'reject' && !rejectionReason) {
      return NextResponse.json(
        { error: 'Rejection reason is required when rejecting a request' },
        { status: 400 }
      );
    }
    
    // Begin transaction
    await pool.query('BEGIN');
    
    try {
      // Get the pending request details
      const requestResult = await pool.query(
        'SELECT * FROM peer_assessment.pending_enrollment_requests WHERE request_id = $1 AND course_id = $2 AND status = $3',
        [requestId, courseId, 'pending']
      );
      
      if (requestResult.rows.length === 0) {
        await pool.query('ROLLBACK');
        return NextResponse.json(
          { error: 'Pending request not found or already processed' },
          { status: 404 }
        );
      }
      
      const pendingRequest = requestResult.rows[0];
      
      if (action === 'approve') {
        // Check if student is already enrolled (in case of race condition)
        const enrollmentCheck = await pool.query(
          'SELECT enrollment_id FROM peer_assessment.course_enrollments WHERE course_id = $1 AND student_id = $2',
          [courseId, pendingRequest.student_id]
        );
        
        if (enrollmentCheck.rows.length > 0) {
          await pool.query('ROLLBACK');
          return NextResponse.json(
            { error: 'Student is already enrolled in this course' },
            { status: 400 }
          );
        }
        
        // Enroll the student
        await pool.query(
          'INSERT INTO peer_assessment.course_enrollments (course_id, student_id) VALUES ($1, $2)',
          [courseId, pendingRequest.student_id]
        );
        
        // Update the request status to approved
        await pool.query(
          'UPDATE peer_assessment.pending_enrollment_requests SET status = $1, reviewed_at = CURRENT_TIMESTAMP, reviewed_by = $2 WHERE request_id = $3',
          ['approved', instructorId, requestId]
        );
        
        await pool.query('COMMIT');
        
        return NextResponse.json({
          message: 'Enrollment request approved successfully',
          action: 'approved',
          studentName: pendingRequest.student_name,
          studentEmail: pendingRequest.student_email
        });
        
      } else if (action === 'reject') {
        // Update the request status to rejected
        await pool.query(
          'UPDATE peer_assessment.pending_enrollment_requests SET status = $1, reviewed_at = CURRENT_TIMESTAMP, reviewed_by = $2, rejection_reason = $3 WHERE request_id = $4',
          ['rejected', instructorId, rejectionReason, requestId]
        );
        
        await pool.query('COMMIT');
        
        return NextResponse.json({
          message: 'Enrollment request rejected',
          action: 'rejected',
          studentName: pendingRequest.student_name,
          studentEmail: pendingRequest.student_email,
          rejectionReason
        });
      }
      
    } catch (transactionError) {
      await pool.query('ROLLBACK');
      throw transactionError;
    }
    
  } catch (error) {
    console.error('Error processing enrollment request:', error);
    return NextResponse.json(
      { error: 'Failed to process enrollment request. Please try again.' },
      { status: 500 }
    );
  }
}
