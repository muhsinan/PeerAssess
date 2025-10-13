import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import OpenAI from 'openai';

// Function to generate AI submission analysis based on rubric
async function generateSubmissionAnalysis(
  assignmentTitle: string, 
  assignmentDescription: string, 
  submissionTitle: string, 
  submissionContent: string, 
  rubricCriteria: any[]
) {
  try {
    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
    });

    // Prepare rubric criteria for analysis
    let criteriaDescription = '';
    if (rubricCriteria && rubricCriteria.length > 0) {
      criteriaDescription = rubricCriteria.map((criterion: any) => 
        `- ${criterion.name} (${criterion.max_points} points): ${criterion.description}`
      ).join('\n');
    }

    const prompt = `Please analyze this student submission against the assignment requirements and rubric criteria. Provide a constructive assessment that helps the student understand their performance.

ASSIGNMENT DETAILS:
Title: ${assignmentTitle}
Description: ${assignmentDescription}

STUDENT SUBMISSION:
Title: ${submissionTitle}
Content: ${submissionContent}

RUBRIC CRITERIA:
${criteriaDescription || 'No specific rubric criteria provided.'}

Please provide an analysis that covers:
1. Overall assessment of how well the submission meets the assignment requirements
2. Strengths demonstrated in the submission
3. Areas that could be improved
4. Specific suggestions for enhancement
5. Estimated performance level based on the rubric criteria

Keep the analysis constructive, encouraging, and focused on learning outcomes. Aim for 150-200 words that provide actionable feedback to help the student improve.

Format your response as a cohesive paragraph without bullet points or numbered lists.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are an experienced educator providing constructive feedback on student submissions. Focus on being helpful, encouraging, and specific in your analysis while maintaining high academic standards."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 400
    });

    const analysis = completion.choices[0]?.message?.content;
    return analysis?.trim() || null;
  } catch (error) {
    console.error('Error generating submission analysis:', error);
    throw error;
  }
}

export async function GET(
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

    // Get optional studentId from query parameters
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    
    // Check if assignment exists
    const assignmentCheck = await pool.query(
      `SELECT assignment_id FROM peer_assessment.assignments WHERE assignment_id = $1`,
      [assignmentId]
    );
    
    if (assignmentCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Assignment not found' },
        { status: 404 }
      );
    }

    // Base query for submissions
    let query = `
      SELECT 
        s.submission_id as id,
        s.title,
        s.content,
        s.status,
        s.submission_date as "submissionDate",
        s.student_id as "studentId",
        s.ai_submission_analysis as "aiAnalysis",
        u.name as "studentName",
        u.email as "studentEmail",
        (
          SELECT COUNT(*)
          FROM peer_assessment.peer_reviews pr
          WHERE pr.submission_id = s.submission_id
        ) as "reviewCount",
        (
          SELECT COUNT(*)
          FROM peer_assessment.peer_reviews pr
          WHERE pr.submission_id = s.submission_id AND pr.status = 'completed'
        ) as "completedReviewCount"
      FROM 
        peer_assessment.submissions s
      JOIN 
        peer_assessment.users u ON s.student_id = u.user_id
      WHERE 
        s.assignment_id = $1
    `;
    
    let queryParams = [assignmentId];
    
    // Add student filter if provided
    if (studentId) {
      query += ` AND s.student_id = $2`;
      queryParams.push(studentId);
    }
    
    // Add order by clause
    query += ` ORDER BY s.submission_date DESC`;
    
    const result = await pool.query(query, queryParams);
    
    // For each submission, get its attachments
    const submissionsWithAttachments = await Promise.all(
      result.rows.map(async (submission) => {
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
        `, [submission.id]);
        
        return {
          ...submission,
          attachments: attachmentsResult.rows
        };
      })
    );
    
    return NextResponse.json({
      assignmentId: assignmentId,
      submissions: submissionsWithAttachments
    });
  } catch (error) {
    console.error('Error fetching submissions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch submissions', details: String(error) },
      { status: 500 }
    );
  }
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
    
    const body = await request.json();
    
    // Validate required fields
    if (!body.title) {
      return NextResponse.json(
        { error: 'Submission title is required' },
        { status: 400 }
      );
    }
    
    if (!body.studentId) {
      return NextResponse.json(
        { error: 'Student ID is required' },
        { status: 400 }
      );
    }
    
    if (!body.content) {
      return NextResponse.json(
        { error: 'Submission content is required' },
        { status: 400 }
      );
    }
    
    // Check if assignment exists
    const assignmentCheck = await pool.query(
      `SELECT assignment_id FROM peer_assessment.assignments WHERE assignment_id = $1`,
      [assignmentId]
    );
    
    if (assignmentCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Assignment not found' },
        { status: 404 }
      );
    }
    
    // Check if student is enrolled in the course
    const enrollmentCheck = await pool.query(`
      SELECT ce.enrollment_id
      FROM peer_assessment.course_enrollments ce
      JOIN peer_assessment.assignments a ON ce.course_id = a.course_id
      WHERE a.assignment_id = $1 AND ce.student_id = $2
    `, [assignmentId, body.studentId]);
    
    if (enrollmentCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Student is not enrolled in the course for this assignment' },
        { status: 403 }
      );
    }
    
    // Check if the student already has a submission for this assignment
    const existingSubmission = await pool.query(`
      SELECT submission_id
      FROM peer_assessment.submissions
      WHERE assignment_id = $1 AND student_id = $2
    `, [assignmentId, body.studentId]);
    
    if (existingSubmission.rows.length > 0) {
      // If draft submission exists, update it
      if (body.status === 'draft') {
        const updateResult = await pool.query(`
          UPDATE peer_assessment.submissions
          SET 
            title = $1,
            content = $2,
            updated_at = NOW()
          WHERE 
            assignment_id = $3 AND student_id = $4
          RETURNING submission_id as id
        `, [body.title, body.content, assignmentId, body.studentId]);
        
        return NextResponse.json({
          message: 'Draft submission updated successfully',
          submissionId: updateResult.rows[0].id
        });
      } else {
        return NextResponse.json(
          { error: 'A submission already exists for this assignment' },
          { status: 400 }
        );
      }
    }
    
    // Insert new submission
    const status = body.status || 'submitted'; // Default to 'submitted' if not specified
    
    // Start a transaction for submission creation and analysis
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      const insertResult = await client.query(`
        INSERT INTO peer_assessment.submissions(
          assignment_id, student_id, title, content, status, submission_date
        )
        VALUES ($1, $2, $3, $4, $5, NOW())
        RETURNING 
          submission_id as id,
          title,
          status,
          submission_date as "submissionDate"
      `, [assignmentId, body.studentId, body.title, body.content, status]);
      
      const submission = insertResult.rows[0];

      // Generate AI analysis only for actual submissions (not drafts)
      if (status === 'submitted') {
        try {
          // Fetch assignment details for analysis
          const assignmentResult = await client.query(`
            SELECT title, description
            FROM peer_assessment.assignments
            WHERE assignment_id = $1
          `, [assignmentId]);
          
          const assignment = assignmentResult.rows[0];
          
          // Fetch rubric criteria for analysis
          const rubricResult = await client.query(`
            SELECT rc.name, rc.description, rc.max_points
            FROM peer_assessment.rubric_criteria rc
            INNER JOIN peer_assessment.assignment_rubrics ar ON rc.rubric_id = ar.rubric_id
            WHERE ar.assignment_id = $1
            ORDER BY rc.criterion_id
          `, [assignmentId]);
          
          const rubricCriteria = rubricResult.rows;
          
          // Generate AI analysis
          const analysis = await generateSubmissionAnalysis(
            assignment.title,
            assignment.description,
            body.title,
            body.content,
            rubricCriteria
          );
          
          // Update submission with analysis
          if (analysis) {
            await client.query(`
              UPDATE peer_assessment.submissions
              SET ai_submission_analysis = $1
              WHERE submission_id = $2
            `, [analysis, submission.id]);
          }
        } catch (analysisError) {
          console.error('Failed to generate submission analysis:', analysisError);
          // Continue without analysis - submission creation should not fail
        }
      }
      
      await client.query('COMMIT');
      
      return NextResponse.json({
        message: 'Submission created successfully',
        submission: submission
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error creating submission:', error);
    return NextResponse.json(
      { error: 'Failed to create submission', details: String(error) },
      { status: 500 }
    );
  }
} 