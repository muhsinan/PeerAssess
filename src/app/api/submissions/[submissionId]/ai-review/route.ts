import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import OpenAI from 'openai';

// POST endpoint for generating AI review
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ submissionId: string }> }
) {
  try {
    const { submissionId } = await params;
    const body = await request.json();
    const { instructorId } = body;
    
    if (!submissionId || isNaN(Number(submissionId))) {
      return NextResponse.json(
        { error: 'Invalid submission ID' },
        { status: 400 }
      );
    }

    if (!instructorId || isNaN(Number(instructorId))) {
      return NextResponse.json(
        { error: 'Invalid instructor ID' },
        { status: 400 }
      );
    }

    // Verify instructor role
    const instructorCheck = await pool.query(
      `SELECT user_id, role FROM peer_assessment.users WHERE user_id = $1 AND role = 'instructor'`,
      [instructorId]
    );
    
    if (instructorCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Only instructors can generate AI reviews' },
        { status: 403 }
      );
    }

    // Get submission details including instructor AI prompt settings
    const submissionResult = await pool.query(`
      SELECT 
        s.submission_id,
        s.title,
        s.content,
        s.assignment_id,
        s.student_id,
        a.title as assignment_title,
        a.description as assignment_description,
        a.ai_instructor_prompt,
        a.ai_instructor_enabled,
        u.name as student_name
      FROM peer_assessment.submissions s
      JOIN peer_assessment.assignments a ON s.assignment_id = a.assignment_id
      JOIN peer_assessment.users u ON s.student_id = u.user_id
      WHERE s.submission_id = $1
    `, [submissionId]);

    if (submissionResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      );
    }

    const submission = submissionResult.rows[0];

    // Check if instructor AI reviews are enabled for this assignment
    if (!submission.ai_instructor_enabled) {
      return NextResponse.json(
        { error: 'AI instructor reviews are disabled for this assignment' },
        { status: 400 }
      );
    }

    // Get rubric criteria for this assignment
    const criteriaResult = await pool.query(`
      SELECT 
        rc.criterion_id,
        rc.name,
        rc.description,
        rc.max_points
      FROM peer_assessment.rubric_criteria rc
      JOIN peer_assessment.assignment_rubrics ar ON rc.rubric_id = ar.rubric_id
      WHERE ar.assignment_id = $1
      ORDER BY rc.criterion_id
    `, [submission.assignment_id]);

    if (criteriaResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'No rubric criteria found for this assignment' },
        { status: 400 }
      );
    }

    const criteria = criteriaResult.rows;

    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY
    });

    if (!process.env.NEXT_PUBLIC_OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    // Generate AI review using custom instructor prompt if available
    const defaultPrompt = `You are a college student peer reviewer helping a fellow student improve their work. Write a peer review that sounds like it comes from another student, not a teacher or AI. Be helpful, friendly, and constructive while following the rubric.

Assignment: ${submission.assignment_title}
Assignment Description: ${submission.assignment_description}

Student Submission Title: ${submission.title}
Student Submission Content: ${submission.content}

Rubric Criteria:
${criteria.map(c => `- ${c.name} (${c.max_points} points): ${c.description}`).join('\n')}

Write your review as if you're talking to a classmate. Use casual but respectful language. Share what you found interesting, what worked well, and what could be improved. Be encouraging but honest about areas that need work.

Format your response as JSON with this structure:
{
  "overallFeedback": "Your overall feedback here (write as a peer, use 'I think', 'I noticed', 'you did well', etc.)...",
  "criteriaScores": [
    {
      "criterionId": ${criteria[0]?.criterion_id},
      "score": score_out_of_max_points,
      "feedback": "Peer feedback for this criterion (sound like a fellow student)..."
    }
  ],
  "totalScore": calculated_total,
  "suggestionsForImprovement": ["suggestion1", "suggestion2", "suggestion3"]
}

Guidelines for peer-style feedback:
- Use first person ("I think", "I found", "I noticed")
- Sound encouraging and supportive like a helpful classmate
- Use casual but respectful language
- Share personal reactions ("This part really caught my attention", "I was a bit confused by...")
- Be specific with examples from their work
- Offer suggestions as a peer would ("Maybe you could try...", "What if you...")
- Balance praise with constructive criticism
- Sound genuine and relatable, not formal or academic
- Don't mention being an AI or reviewer identity`;

    // Use custom instructor prompt if provided, otherwise use default
    let prompt;
    if (submission.ai_instructor_prompt && submission.ai_instructor_prompt.trim()) {
      // If instructor provided custom prompt, use it with context
      prompt = `${submission.ai_instructor_prompt}

Context Information:
Assignment: ${submission.assignment_title}
Assignment Description: ${submission.assignment_description}

Student Submission Title: ${submission.title}
Student Submission Content: ${submission.content}

Rubric Criteria:
${criteria.map(c => `- ${c.name} (${c.max_points} points): ${c.description}`).join('\n')}

IMPORTANT: Always format your response as JSON with this exact structure:
{
  "overallFeedback": "Your feedback here...",
  "criteriaScores": [
    {
      "criterionId": ${criteria[0]?.criterion_id},
      "score": score_out_of_max_points,
      "feedback": "Feedback for this criterion..."
    }
  ],
  "totalScore": calculated_total,
  "suggestionsForImprovement": ["suggestion1", "suggestion2", "suggestion3"]
}`;
    } else {
      prompt = defaultPrompt;
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a helpful college student who is good at giving peer feedback. Write reviews that sound like they come from a fellow student - be friendly, encouraging, and relatable. Use casual language while still being thorough and helpful. Focus on being a supportive classmate who wants to help their peer improve."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    });

    const aiResponse = completion.choices[0]?.message?.content;
    
    if (!aiResponse) {
      return NextResponse.json(
        { error: 'Failed to generate AI review' },
        { status: 500 }
      );
    }

    let parsedReview;
    try {
      parsedReview = JSON.parse(aiResponse);
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      return NextResponse.json(
        { error: 'Failed to parse AI review response' },
        { status: 500 }
      );
    }

    // Validate the parsed review structure
    if (!parsedReview.overallFeedback || !parsedReview.criteriaScores || !Array.isArray(parsedReview.criteriaScores)) {
      return NextResponse.json(
        { error: 'Invalid AI review format' },
        { status: 500 }
      );
    }

    // Return the generated review for preview (don't save yet)
    return NextResponse.json({
      success: true,
      preview: {
        submissionId: submission.submission_id,
        studentName: submission.student_name,
        assignmentTitle: submission.assignment_title,
        submissionTitle: submission.title,
        overallFeedback: parsedReview.overallFeedback,
        criteriaScores: parsedReview.criteriaScores,
        totalScore: parsedReview.totalScore,
        suggestionsForImprovement: parsedReview.suggestionsForImprovement || [],
        criteria: criteria,
        generatedBy: instructorId,
        aiModel: 'gpt-3.5-turbo'
      }
    });

  } catch (error) {
    console.error('Error generating AI review:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST endpoint for confirming and saving AI review
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ submissionId: string }> }
) {
  try {
    const { submissionId } = await params;
    const body = await request.json();
    const { 
      instructorId, 
      overallFeedback, 
      criteriaScores, 
      totalScore,
      aiModel = 'gpt-3.5-turbo'
    } = body;
    
    if (!submissionId || isNaN(Number(submissionId))) {
      return NextResponse.json(
        { error: 'Invalid submission ID' },
        { status: 400 }
      );
    }

    if (!instructorId || isNaN(Number(instructorId))) {
      return NextResponse.json(
        { error: 'Invalid instructor ID' },
        { status: 400 }
      );
    }

    // Verify instructor role
    const instructorCheck = await pool.query(
      `SELECT user_id, role FROM peer_assessment.users WHERE user_id = $1 AND role = 'instructor'`,
      [instructorId]
    );
    
    if (instructorCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Only instructors can save AI reviews' },
        { status: 403 }
      );
    }

    // Start a transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Create AI review record with special reviewer_id (instructor) but marked as AI-generated
      const reviewResult = await client.query(`
        INSERT INTO peer_assessment.peer_reviews (
          submission_id,
          reviewer_id,
          overall_feedback,
          total_score,
          status,
          assigned_date,
          completed_date,
          is_ai_generated,
          ai_model_used,
          generated_by_instructor
        ) VALUES ($1, $2, $3, $4, 'completed', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, true, $5, $6)
        RETURNING review_id
      `, [submissionId, instructorId, overallFeedback, totalScore, aiModel, instructorId]);

      const reviewId = reviewResult.rows[0].review_id;

      // Save individual criterion scores
      for (const criterionScore of criteriaScores) {
        await client.query(`
          INSERT INTO peer_assessment.peer_review_scores (
            review_id,
            criterion_id,
            score,
            feedback
          ) VALUES ($1, $2, $3, $4)
        `, [reviewId, criterionScore.criterionId, criterionScore.score, criterionScore.feedback]);
      }

      // Update submission status to reviewed
      await client.query(
        `UPDATE peer_assessment.submissions SET status = 'reviewed' WHERE submission_id = $1`,
        [submissionId]
      );

      await client.query('COMMIT');

      return NextResponse.json({
        success: true,
        reviewId: reviewId,
        message: 'AI review saved successfully'
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error saving AI review:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
