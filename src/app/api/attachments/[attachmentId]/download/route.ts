import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { readFile } from 'fs/promises';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ attachmentId: string }> }
) {
  try {
    const { attachmentId } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!attachmentId || isNaN(Number(attachmentId))) {
      return NextResponse.json(
        { error: 'Invalid attachment ID' },
        { status: 400 }
      );
    }

    // Get attachment details and verify permissions
    const attachmentResult = await pool.query(`
      SELECT 
        sa.attachment_id as id,
        sa.file_name as "fileName",
        sa.file_path as "filePath",
        sa.file_size as "fileSize",
        sa.file_type as "fileType",
        sa.submission_id as "submissionId",
        s.student_id as "studentId",
        s.assignment_id as "assignmentId",
        a.course_id as "courseId",
        c.instructor_id as "instructorId"
      FROM 
        peer_assessment.submission_attachments sa
      JOIN 
        peer_assessment.submissions s ON sa.submission_id = s.submission_id
      JOIN 
        peer_assessment.assignments a ON s.assignment_id = a.assignment_id
      JOIN 
        peer_assessment.courses c ON a.course_id = c.course_id
      WHERE 
        sa.attachment_id = $1
    `, [attachmentId]);

    if (attachmentResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Attachment not found' },
        { status: 404 }
      );
    }

    const attachment = attachmentResult.rows[0];

    // Check permissions - allow access if:
    // 1. User is the student who submitted the assignment
    // 2. User is the instructor of the course
    // 3. User is a peer reviewer assigned to review this submission
    if (userId) {
      const isStudent = attachment.studentId.toString() === userId;
      const isInstructor = attachment.instructorId.toString() === userId;
      
      // Check if user is a peer reviewer for this submission
      let isPeerReviewer = false;
      if (!isStudent && !isInstructor) {
        const peerReviewCheck = await pool.query(`
          SELECT review_id 
          FROM peer_assessment.peer_reviews 
          WHERE submission_id = $1 AND reviewer_id = $2
        `, [attachment.submissionId, userId]);
        
        isPeerReviewer = peerReviewCheck.rows.length > 0;
      }
      
      if (!isStudent && !isInstructor && !isPeerReviewer) {
        return NextResponse.json(
          { error: 'Unauthorized access to this attachment' },
          { status: 403 }
        );
      }
    }

    // Read the file from disk
    const fullFilePath = path.join(process.cwd(), attachment.filePath);
    
    try {
      const fileBuffer = await readFile(fullFilePath);
      
      // Set appropriate headers for file download
      const headers = new Headers();
      headers.set('Content-Type', attachment.fileType || 'application/octet-stream');
      headers.set('Content-Disposition', `attachment; filename="${attachment.fileName}"`);
      const fileArray = new Uint8Array(fileBuffer);
      headers.set('Content-Length', fileArray.byteLength.toString());
      
      return new NextResponse(fileArray, {
        status: 200,
        headers: headers
      });
      
    } catch (fileError) {
      console.error('Error reading file:', fileError);
      return NextResponse.json(
        { error: 'File not found on server' },
        { status: 404 }
      );
    }

  } catch (error) {
    console.error('Error downloading attachment:', error);
    return NextResponse.json(
      { error: 'Failed to download attachment', details: String(error) },
      { status: 500 }
    );
  }
} 