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

    // Get rubric criteria for this assignment (including criterion type)
    const criteriaResult = await pool.query(`
      SELECT 
        rc.criterion_id,
        rc.name,
        rc.description,
        rc.max_points,
        COALESCE(rc.criterion_type, 'levels') as criterion_type
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

    // Get subitems for criteria that use subitems
    const criteriaWithSubitems = await Promise.all(criteriaResult.rows.map(async (criterion: any) => {
      if (criterion.criterion_type === 'subitems') {
        const subitemsResult = await pool.query(`
          SELECT 
            subitem_id,
            name,
            description,
            points,
            order_position
          FROM peer_assessment.rubric_subitems
          WHERE criterion_id = $1
          ORDER BY order_position
        `, [criterion.criterion_id]);
        
        return {
          ...criterion,
          subitems: subitemsResult.rows
        };
      }
      return {
        ...criterion,
        subitems: []
      };
    }));

    const criteria = criteriaWithSubitems;

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

    // Build criteria description including subitems
    const buildCriteriaDescription = () => {
      return criteria.map((c: any) => {
        if (c.criterion_type === 'subitems' && c.subitems.length > 0) {
          const subitemsList = c.subitems.map((s: any) => `    * ${s.name} (${s.points} pts): ${s.description || 'No description'}`).join('\n');
          return `- ${c.name} (${c.max_points} points total) [CHECKLIST - evaluate each item]:
${subitemsList}`;
        }
        return `- ${c.name} (${c.max_points} points) [LEVEL-BASED]: ${c.description}`;
      }).join('\n');
    };

    // Build JSON structure example for the prompt
    const buildJsonExample = () => {
      const criteriaExamples = criteria.map((c: any) => {
        if (c.criterion_type === 'subitems' && c.subitems.length > 0) {
          return `    {
      "criterionId": ${c.criterion_id},
      "criterionType": "subitems",
      "score": calculated_sum_of_checked_subitems,
      "feedback": "Overall feedback for this category...",
      "subitemScores": [
${c.subitems.map((s: any) => `        {
          "subitemId": ${s.subitem_id},
          "subitemName": "${s.name}",
          "checked": true_or_false,
          "points": ${s.points},
          "feedback": "Specific feedback for this item..."
        }`).join(',\n')}
      ]
    }`;
        }
        return `    {
      "criterionId": ${c.criterion_id},
      "criterionType": "levels",
      "score": score_out_of_${c.max_points},
      "feedback": "Feedback for this criterion..."
    }`;
      }).join(',\n');

      return `{
  "overallFeedback": "Your overall feedback here...",
  "criteriaScores": [
${criteriaExamples}
  ],
  "totalScore": calculated_total,
  "suggestionsForImprovement": ["suggestion1", "suggestion2", "suggestion3"]
}`;
    };

    // Generate AI review using custom instructor prompt if available
    const defaultPrompt = `You are a college student peer reviewer helping a fellow student improve their work. Write a peer review that sounds like it comes from another student, not a teacher or AI. Be helpful, friendly, and constructive while following the rubric.

Assignment: ${submission.assignment_title}
Assignment Description: ${submission.assignment_description}

Student Submission Title: ${submission.title}
Student Submission Content: ${submission.content}

Rubric Criteria:
${buildCriteriaDescription()}

IMPORTANT INSTRUCTIONS:
- For LEVEL-BASED criteria: Give a single score based on overall quality
- For CHECKLIST criteria: Evaluate EACH subitem individually:
  * Set "checked" to true if the requirement is met, false if not
  * Provide specific feedback for each subitem
  * The score should be the sum of points for all checked items

Write your review as if you're talking to a classmate. Use casual but respectful language. Share what you found interesting, what worked well, and what could be improved. Be encouraging but honest about areas that need work.

Format your response as JSON with this EXACT structure:
${buildJsonExample()}

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
${buildCriteriaDescription()}

IMPORTANT INSTRUCTIONS:
- For LEVEL-BASED criteria: Give a single score based on overall quality
- For CHECKLIST criteria: Evaluate EACH subitem individually with "checked": true/false and specific feedback

IMPORTANT: Always format your response as JSON with this exact structure:
${buildJsonExample()}`;
    } else {
      prompt = defaultPrompt;
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
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
      // Clean the AI response - remove markdown code blocks if present
      let cleanedResponse = aiResponse.trim();
      
      // Remove ```json or ``` from the start
      if (cleanedResponse.startsWith('```json')) {
        cleanedResponse = cleanedResponse.slice(7);
      } else if (cleanedResponse.startsWith('```')) {
        cleanedResponse = cleanedResponse.slice(3);
      }
      
      // Remove ``` from the end
      if (cleanedResponse.endsWith('```')) {
        cleanedResponse = cleanedResponse.slice(0, -3);
      }
      
      cleanedResponse = cleanedResponse.trim();
      
      parsedReview = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      console.error('Raw AI response:', aiResponse);
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

    // Merge actual subitem points from rubric into AI response
    // This ensures we use the correct points from the database, not AI-generated ones
    const enrichedCriteriaScores = parsedReview.criteriaScores.map((cs: any) => {
      const criterion = criteria.find((c: any) => c.criterion_id === cs.criterionId);
      
      if (criterion && criterion.criterion_type === 'subitems' && criterion.subitems) {
        // For subitem-based criteria, merge actual points from rubric
        const enrichedSubitemScores = (cs.subitemScores || []).map((ss: any) => {
          // Try to find the matching subitem from the rubric
          const actualSubitem = criterion.subitems.find((s: any) => 
            s.subitem_id === ss.subitemId || 
            s.name.toLowerCase() === (ss.subitemName || '').toLowerCase()
          );
          
          return {
            subitemId: actualSubitem?.subitem_id || ss.subitemId,
            subitemName: actualSubitem?.name || ss.subitemName,
            checked: ss.checked || false,
            points: actualSubitem?.points || ss.points || 0,
            feedback: ss.feedback || ''
          };
        });

        // If AI didn't return subitem scores, create them from the rubric
        if (!cs.subitemScores || cs.subitemScores.length === 0) {
          const defaultSubitemScores = criterion.subitems.map((s: any) => ({
            subitemId: s.subitem_id,
            subitemName: s.name,
            checked: false,
            points: s.points,
            feedback: ''
          }));
          
          return {
            ...cs,
            criterionType: 'subitems',
            subitemScores: defaultSubitemScores,
            score: 0 // Will be calculated from checked items
          };
        }

        // Recalculate score from checked items with correct points
        const calculatedScore = enrichedSubitemScores
          .filter((ss: any) => ss.checked)
          .reduce((sum: number, ss: any) => sum + ss.points, 0);

        return {
          ...cs,
          criterionType: 'subitems',
          subitemScores: enrichedSubitemScores,
          score: calculatedScore
        };
      }
      
      // For level-based criteria, just pass through
      return {
        ...cs,
        criterionType: 'levels'
      };
    });

    // Recalculate total score
    const calculatedTotalScore = enrichedCriteriaScores.reduce((sum: number, cs: any) => sum + (cs.score || 0), 0);

    // Return the generated review for preview (don't save yet)
    return NextResponse.json({
      success: true,
      preview: {
        submissionId: submission.submission_id,
        studentName: submission.student_name,
        assignmentTitle: submission.assignment_title,
        submissionTitle: submission.title,
        overallFeedback: parsedReview.overallFeedback,
        criteriaScores: enrichedCriteriaScores,
        totalScore: calculatedTotalScore,
        suggestionsForImprovement: parsedReview.suggestionsForImprovement || [],
        criteria: criteria,
        generatedBy: instructorId,
        aiModel: 'gpt-4o-mini'
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
      aiModel = 'gpt-4o-mini'
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

      // Save individual criterion scores (including subitem details in feedback as JSON if present)
      for (const criterionScore of criteriaScores) {
        // If this criterion has subitem scores, include them in the feedback
        let feedbackToSave = criterionScore.feedback || '';
        if (criterionScore.subitemScores && Array.isArray(criterionScore.subitemScores)) {
          // Store subitem evaluations as JSON at the end of feedback
          const subitemData = {
            type: 'subitems',
            evaluations: criterionScore.subitemScores
          };
          feedbackToSave = `${feedbackToSave}\n\n<!--SUBITEM_DATA:${JSON.stringify(subitemData)}-->`;
        }
        
        await client.query(`
          INSERT INTO peer_assessment.peer_review_scores (
            review_id,
            criterion_id,
            score,
            feedback
          ) VALUES ($1, $2, $3, $4)
        `, [reviewId, criterionScore.criterionId, criterionScore.score, feedbackToSave]);
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
