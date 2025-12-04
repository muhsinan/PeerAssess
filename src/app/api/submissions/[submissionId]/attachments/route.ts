import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { writeFile } from 'fs/promises';
import path from 'path';
import { mkdir } from 'fs/promises';

// Maximum file size (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Configure route segment for file operations
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Maximum execution time of 60 seconds

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ submissionId: string }> }
) {
  try {
    const { submissionId } = await params;
    
    console.log('[File Upload] Starting upload for submission:', submissionId);
    
    if (!submissionId || isNaN(Number(submissionId))) {
      console.error('[File Upload] Invalid submission ID:', submissionId);
      return NextResponse.json(
        { error: 'Invalid submission ID' },
        { status: 400 }
      );
    }

    // Check if the form data is valid
    let formData;
    try {
      formData = await request.formData();
      console.log('[File Upload] FormData parsed successfully');
    } catch (formError) {
      console.error('[File Upload] Error parsing FormData:', formError);
      return NextResponse.json(
        { error: 'Failed to parse form data', details: String(formError) },
        { status: 400 }
      );
    }
    
    const file = formData.get('file') as File;
    const studentId = formData.get('studentId') as string;
    
    console.log('[File Upload] File info:', {
      fileName: file?.name,
      fileSize: file?.size,
      fileType: file?.type,
      studentId
    });
    
    if (!file) {
      console.error('[File Upload] No file provided in form data');
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }
    
    if (!studentId) {
      console.error('[File Upload] No student ID provided');
      return NextResponse.json(
        { error: 'Student ID is required' },
        { status: 400 }
      );
    }

    // Check if submission exists and belongs to the student
    try {
      const submissionCheck = await pool.query(
        `SELECT submission_id 
         FROM peer_assessment.submissions 
         WHERE submission_id = $1 AND student_id = $2`,
        [submissionId, studentId]
      );
      
      if (submissionCheck.rows.length === 0) {
        console.error('[File Upload] Submission not found or not owned by student');
        return NextResponse.json(
          { error: 'Submission not found or not owned by this student' },
          { status: 404 }
        );
      }
      console.log('[File Upload] Submission ownership verified');
    } catch (dbError) {
      console.error('[File Upload] Database error checking submission:', dbError);
      return NextResponse.json(
        { error: 'Database error verifying submission', details: String(dbError) },
        { status: 500 }
      );
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      console.error('[File Upload] File size exceeds limit:', file.size);
      return NextResponse.json(
        { error: `File size exceeds the limit of ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      );
    }

    // Check file type
    const fileExtension = path.extname(file.name).toLowerCase();
    const allowedExtensions = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.zip', '.txt', '.jpg', '.jpeg', '.png'];
    
    if (!allowedExtensions.includes(fileExtension)) {
      console.error('[File Upload] File type not allowed:', fileExtension);
      return NextResponse.json(
        { error: `File type ${fileExtension} not allowed` },
        { status: 400 }
      );
    }

    // Create a unique filename
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const uniqueFilename = `${timestamp}_${sanitizedFileName}`;
    
    console.log('[File Upload] Generated unique filename:', uniqueFilename);
    
    // Create directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), 'uploads', 'submissions', submissionId);
    console.log('[File Upload] Creating upload directory:', uploadDir);
    
    try {
      await mkdir(uploadDir, { recursive: true });
      console.log('[File Upload] Upload directory created/verified');
    } catch (mkdirError) {
      console.error('[File Upload] Error creating upload directory:', mkdirError);
      return NextResponse.json(
        { error: 'Failed to create upload directory', details: String(mkdirError) },
        { status: 500 }
      );
    }
    
    // Save file to disk
    const filePath = path.join(uploadDir, uniqueFilename);
    console.log('[File Upload] Saving file to:', filePath);
    
    try {
      const fileBuffer = Buffer.from(await file.arrayBuffer());
      await writeFile(filePath, fileBuffer);
      console.log('[File Upload] File saved successfully');
    } catch (writeError) {
      console.error('[File Upload] Error writing file:', writeError);
      return NextResponse.json(
        { error: 'Failed to save file to disk', details: String(writeError) },
        { status: 500 }
      );
    }
    
    // Get the relative file path for database storage
    const relativeFilePath = path.join('uploads', 'submissions', submissionId, uniqueFilename);
    
    // Save file info to database
    try {
      const insertResult = await pool.query(`
        INSERT INTO peer_assessment.submission_attachments(
          submission_id, 
          file_name, 
          file_path, 
          file_size, 
          file_type, 
          upload_date
        )
        VALUES ($1, $2, $3, $4, $5, NOW())
        RETURNING 
          attachment_id as id,
          file_name as "fileName",
          file_path as "filePath",
          file_size as "fileSize",
          file_type as "fileType",
          upload_date as "uploadDate"
      `, [
        submissionId,
        file.name,
        relativeFilePath,
        file.size,
        file.type
      ]);
      
      console.log('[File Upload] Database record created:', insertResult.rows[0].id);
      
      return NextResponse.json({
        message: 'File uploaded successfully',
        attachment: insertResult.rows[0]
      });
    } catch (dbInsertError) {
      console.error('[File Upload] Database error saving attachment record:', dbInsertError);
      return NextResponse.json(
        { error: 'Failed to save attachment record to database', details: String(dbInsertError) },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[File Upload] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Failed to upload file', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ submissionId: string }> }
) {
  try {
    const { submissionId } = await params;
    
    if (!submissionId || isNaN(Number(submissionId))) {
      return NextResponse.json(
        { error: 'Invalid submission ID' },
        { status: 400 }
      );
    }

    // Get all attachments for the submission
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
    
    return NextResponse.json({
      submissionId,
      attachments: attachmentsResult.rows
    });
  } catch (error) {
    console.error('Error fetching attachments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch attachments', details: String(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ submissionId: string }> }
) {
  try {
    const { submissionId } = await params;
    
    if (!submissionId || isNaN(Number(submissionId))) {
      return NextResponse.json(
        { error: 'Invalid submission ID' },
        { status: 400 }
      );
    }

    // Get the attachment ID from the search params
    const { searchParams } = new URL(request.url);
    const attachmentId = searchParams.get('attachmentId');
    const studentId = searchParams.get('studentId');
    
    if (!attachmentId || isNaN(Number(attachmentId))) {
      return NextResponse.json(
        { error: 'Valid attachment ID is required' },
        { status: 400 }
      );
    }

    if (!studentId) {
      return NextResponse.json(
        { error: 'Student ID is required' },
        { status: 400 }
      );
    }

    // Verify submission belongs to student
    const submissionCheck = await pool.query(
      `SELECT submission_id 
       FROM peer_assessment.submissions 
       WHERE submission_id = $1 AND student_id = $2`,
      [submissionId, studentId]
    );
    
    if (submissionCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Submission not found or not owned by this student' },
        { status: 403 }
      );
    }

    // Delete the attachment from the database
    const deleteResult = await pool.query(
      `DELETE FROM peer_assessment.submission_attachments 
       WHERE attachment_id = $1 AND submission_id = $2
       RETURNING file_path as "filePath"`,
      [attachmentId, submissionId]
    );
    
    if (deleteResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Attachment not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      message: 'Attachment deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting attachment:', error);
    return NextResponse.json(
      { error: 'Failed to delete attachment', details: String(error) },
      { status: 500 }
    );
  }
} 