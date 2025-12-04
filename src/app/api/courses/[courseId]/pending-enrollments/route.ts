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

// POST to approve or reject enrollment request(s)
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
    const { requestId, requestIds, action, rejectionReason, instructorId } = await request.json();
    
    if (!action || !instructorId) {
      return NextResponse.json(
        { error: 'Action and instructor ID are required' },
        { status: 400 }
      );
    }
    
    if (!['approve', 'reject', 'approve_all'].includes(action)) {
      return NextResponse.json(
        { error: 'Action must be either "approve", "reject", or "approve_all"' },
        { status: 400 }
      );
    }
    
    // Support both single and bulk operations
    const isBulk = Array.isArray(requestIds);
    
    // Validate requestId/requestIds for actions that need them
    if (action !== 'approve_all' && !isBulk && !requestId) {
      return NextResponse.json(
        { error: 'Request ID or Request IDs are required' },
        { status: 400 }
      );
    }
    
    if (action === 'reject' && !rejectionReason) {
      return NextResponse.json(
        { error: 'Rejection reason is required when rejecting a request' },
        { status: 400 }
      );
    }
    
    // Handle approve_all action - approve all pending requests for the course
    if (action === 'approve_all') {
      await pool.query('BEGIN');
      
      try {
        // Get all pending requests for this course
        const pendingRequestsResult = await pool.query(
          'SELECT * FROM peer_assessment.pending_enrollment_requests WHERE course_id = $1 AND status = $2',
          [courseId, 'pending']
        );
        
        if (pendingRequestsResult.rows.length === 0) {
          await pool.query('ROLLBACK');
          return NextResponse.json({
            message: 'No pending requests to approve',
            approved: [],
            skipped: []
          });
        }
        
        const approved = [];
        const skipped = [];
        
        // Process each pending request
        for (const pendingRequest of pendingRequestsResult.rows) {
          try {
            // Check if student is already enrolled (in case of race condition)
            const enrollmentCheck = await pool.query(
              'SELECT enrollment_id FROM peer_assessment.course_enrollments WHERE course_id = $1 AND student_id = $2',
              [courseId, pendingRequest.student_id]
            );
            
            if (enrollmentCheck.rows.length > 0) {
              skipped.push({
                id: pendingRequest.request_id,
                studentName: pendingRequest.student_name,
                reason: 'Already enrolled'
              });
              continue;
            }
            
            // Enroll the student
            await pool.query(
              'INSERT INTO peer_assessment.course_enrollments (course_id, student_id) VALUES ($1, $2)',
              [courseId, pendingRequest.student_id]
            );
            
            // Update the request status to approved
            await pool.query(
              'UPDATE peer_assessment.pending_enrollment_requests SET status = $1, reviewed_at = CURRENT_TIMESTAMP, reviewed_by = $2 WHERE request_id = $3',
              ['approved', instructorId, pendingRequest.request_id]
            );
            
            approved.push({
              id: pendingRequest.request_id,
              studentName: pendingRequest.student_name,
              studentEmail: pendingRequest.student_email
            });
          } catch (error) {
            console.error(`Error approving request ${pendingRequest.request_id}:`, error);
            skipped.push({
              id: pendingRequest.request_id,
              studentName: pendingRequest.student_name,
              reason: 'Processing error'
            });
          }
        }
        
        await pool.query('COMMIT');
        
        return NextResponse.json({
          message: `Successfully approved ${approved.length} enrollment request(s)`,
          action: 'approve_all',
          approved,
          skipped,
          total: pendingRequestsResult.rows.length
        });
        
      } catch (transactionError) {
        await pool.query('ROLLBACK');
        throw transactionError;
      }
    }
    
    // Handle bulk operations (approve/reject multiple specific requests)
    if (isBulk && requestIds.length > 0) {
      await pool.query('BEGIN');
      
      try {
        const results = [];
        const errors = [];
        
        for (const reqId of requestIds) {
          try {
            // Get the pending request details
            const requestResult = await pool.query(
              'SELECT * FROM peer_assessment.pending_enrollment_requests WHERE request_id = $1 AND course_id = $2 AND status = $3',
              [reqId, courseId, 'pending']
            );
            
            if (requestResult.rows.length === 0) {
              errors.push({
                requestId: reqId,
                error: 'Request not found or already processed'
              });
              continue;
            }
            
            const pendingRequest = requestResult.rows[0];
            
            if (action === 'approve') {
              // Check if student is already enrolled
              const enrollmentCheck = await pool.query(
                'SELECT enrollment_id FROM peer_assessment.course_enrollments WHERE course_id = $1 AND student_id = $2',
                [courseId, pendingRequest.student_id]
              );
              
              if (enrollmentCheck.rows.length > 0) {
                errors.push({
                  requestId: reqId,
                  error: 'Student is already enrolled'
                });
                continue;
              }
              
              // Enroll the student
              await pool.query(
                'INSERT INTO peer_assessment.course_enrollments (course_id, student_id) VALUES ($1, $2)',
                [courseId, pendingRequest.student_id]
              );
              
              // Update the request status to approved
              await pool.query(
                'UPDATE peer_assessment.pending_enrollment_requests SET status = $1, reviewed_at = CURRENT_TIMESTAMP, reviewed_by = $2 WHERE request_id = $3',
                ['approved', instructorId, reqId]
              );
              
              results.push({
                requestId: reqId,
                studentName: pendingRequest.student_name,
                studentEmail: pendingRequest.student_email,
                action: 'approved'
              });
            }
          } catch (error) {
            console.error(`Error processing request ${reqId}:`, error);
            errors.push({
              requestId: reqId,
              error: 'Processing error'
            });
          }
        }
        
        await pool.query('COMMIT');
        
        return NextResponse.json({
          message: `Processed ${results.length} request(s) successfully`,
          results,
          errors
        });
        
      } catch (transactionError) {
        await pool.query('ROLLBACK');
        throw transactionError;
      }
    }
    
    // Handle single request (original functionality)
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
