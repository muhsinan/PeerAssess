import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import OpenAI from 'openai';

// Function to generate auto AI review for submission
async function generateAutoAIReview(
  assignment: any,
  submissionTitle: string,
  submissionContent: string,
  rubricCriteria: any[]
) {
  try {
    const openai = new OpenAI({
      apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY
    });

    if (!process.env.NEXT_PUBLIC_OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }

    // Build criteria description including subitems
    const buildCriteriaDescription = () => {
      return rubricCriteria.map(c => {
        if (c.criterion_type === 'subitems' && c.subitems && c.subitems.length > 0) {
          const subitemsList = c.subitems.map((s: any) => 
            `    * Subitem ID ${s.subitem_id}: ${s.name} (${s.points} pts): ${s.description || 'No description'}`
          ).join('\n');
          return `- Criterion ID ${c.criterion_id}: ${c.name} (${c.max_points} points total) [CHECKLIST - evaluate each item]:
${subitemsList}`;
        }
        return `- Criterion ID ${c.criterion_id}: ${c.name} (${c.max_points} points) [LEVEL-BASED]: ${c.description}`;
      }).join('\n');
    };

    // Build JSON structure example for the prompt
    const buildJsonExample = () => {
      const criteriaExamples = rubricCriteria.map(c => {
        if (c.criterion_type === 'subitems' && c.subitems && c.subitems.length > 0) {
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

    const defaultPrompt = `You are a college student peer reviewer helping a fellow student improve their work. Write a peer review that sounds like it comes from another student, not a teacher or AI. Be helpful, friendly, and constructive while following the rubric.

Assignment: ${assignment.title}
Assignment Description: ${assignment.description}

Student Submission Title: ${submissionTitle}
Student Submission Content: ${submissionContent}

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
    if (assignment.ai_instructor_prompt && assignment.ai_instructor_prompt.trim()) {
      prompt = `${assignment.ai_instructor_prompt}

Context Information:
Assignment: ${assignment.title}
Assignment Description: ${assignment.description}

Student Submission Title: ${submissionTitle}
Student Submission Content: ${submissionContent}

Rubric Criteria:
${buildCriteriaDescription()}

IMPORTANT INSTRUCTIONS:
- For LEVEL-BASED criteria: Give a single score based on overall quality
- For CHECKLIST criteria: Evaluate EACH subitem individually with "checked": true/false and specific feedback

Format your response as JSON with this EXACT structure:
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
      max_tokens: 3000
    });

    const aiResponse = completion.choices[0]?.message?.content;
    
    if (!aiResponse) {
      throw new Error('No response from AI');
    }

    // Clean the AI response - remove markdown code blocks if present
    let cleanedResponse = aiResponse.trim();
    if (cleanedResponse.startsWith('```json')) {
      cleanedResponse = cleanedResponse.slice(7);
    } else if (cleanedResponse.startsWith('```')) {
      cleanedResponse = cleanedResponse.slice(3);
    }
    if (cleanedResponse.endsWith('```')) {
      cleanedResponse = cleanedResponse.slice(0, -3);
    }
    cleanedResponse = cleanedResponse.trim();

    const parsedReview = JSON.parse(cleanedResponse);

    // Validate the parsed review structure
    if (!parsedReview.overallFeedback || !parsedReview.criteriaScores || !Array.isArray(parsedReview.criteriaScores)) {
      throw new Error('Invalid AI review format');
    }

    // Validate and fix criterion IDs - map AI response to actual criterion IDs
    const validatedScores = [];
    for (let i = 0; i < rubricCriteria.length; i++) {
      const criterion = rubricCriteria[i];
      // Try to find the matching score from AI response
      let aiScore = parsedReview.criteriaScores.find(
        (s: any) => s.criterionId === criterion.criterion_id
      );
      
      // If not found by ID, try to match by index (fallback)
      if (!aiScore && parsedReview.criteriaScores[i]) {
        aiScore = parsedReview.criteriaScores[i];
      }
      
      if (criterion.criterion_type === 'subitems' && criterion.subitems && criterion.subitems.length > 0) {
        // Handle subitem-based criteria
        let enrichedSubitemScores = [];
        
        if (aiScore && aiScore.subitemScores && Array.isArray(aiScore.subitemScores)) {
          // Map AI subitem scores to actual subitems
          enrichedSubitemScores = criterion.subitems.map((subitem: any) => {
            const aiSubitemScore = aiScore.subitemScores.find(
              (ss: any) => ss.subitemId === subitem.subitem_id || 
                          (ss.subitemName && ss.subitemName.toLowerCase() === subitem.name.toLowerCase())
            );
            
            return {
              subitemId: subitem.subitem_id,
              subitemName: subitem.name,
              checked: aiSubitemScore?.checked || false,
              points: subitem.points,
              feedback: aiSubitemScore?.feedback || ''
            };
          });
        } else {
          // Create default subitem scores if AI didn't provide them
          enrichedSubitemScores = criterion.subitems.map((subitem: any) => ({
            subitemId: subitem.subitem_id,
            subitemName: subitem.name,
            checked: false,
            points: subitem.points,
            feedback: ''
          }));
        }
        
        // Calculate score from checked subitems
        const calculatedScore = enrichedSubitemScores
          .filter((ss: any) => ss.checked)
          .reduce((sum: number, ss: any) => sum + ss.points, 0);
        
        validatedScores.push({
          criterionId: criterion.criterion_id,
          criterionType: 'subitems',
          score: calculatedScore,
          feedback: aiScore?.feedback || 'Evaluated based on checklist items.',
          subitemScores: enrichedSubitemScores
        });
      } else {
        // Handle level-based criteria
        if (aiScore) {
          validatedScores.push({
            criterionId: criterion.criterion_id,
            criterionType: 'levels',
            score: Math.min(aiScore.score || 0, criterion.max_points),
            feedback: aiScore.feedback || 'No feedback provided'
          });
        } else {
          validatedScores.push({
            criterionId: criterion.criterion_id,
            criterionType: 'levels',
            score: Math.floor(criterion.max_points * 0.7),
            feedback: 'Score assigned automatically.'
          });
        }
      }
    }

    // Recalculate total score
    const calculatedTotalScore = validatedScores.reduce((sum, cs) => sum + (cs.score || 0), 0);

    // Replace with validated scores
    parsedReview.criteriaScores = validatedScores;
    parsedReview.totalScore = calculatedTotalScore;

    return parsedReview;
  } catch (error) {
    console.error('Error generating auto AI review:', error);
    throw error;
  }
}

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

    // Detect the type of assignment based on content patterns
    const detectAssignmentType = (content: string, title: string, description: string) => {
      const combinedText = `${title} ${description} ${content}`.toLowerCase();
      
      // Check for code patterns
      const codePatterns = [
        /function\s+\w+\s*\(/,
        /class\s+\w+/,
        /def\s+\w+\s*\(/,
        /public\s+(class|void|static)/,
        /import\s+[\w.]+/,
        /#include\s*</,
        /const\s+\w+\s*=/,
        /var\s+\w+\s*=/,
        /let\s+\w+\s*=/,
        /\/\*[\s\S]*?\*\//,
        /\/\/.+$/m,
        /\{[\s\S]*\}/,
        /<\?php/,
        /<!DOCTYPE|<html/i
      ];
      
      const hasCode = codePatterns.some(pattern => pattern.test(content));
      const mentionsCoding = /\b(code|coding|program|algorithm|function|implementation|debug|compile|syntax|programming)\b/i.test(combinedText);
      
      if (hasCode || mentionsCoding) {
        return 'coding';
      }
      
      // Check for research/essay patterns
      const essayPatterns = [
        /\b(essay|research|paper|thesis|argument|analysis|discussion)\b/i,
        /\b(introduction|conclusion|references|bibliography|abstract)\b/i,
        /\b(paragraph|cite|source|quote)\b/i
      ];
      
      if (essayPatterns.some(pattern => pattern.test(combinedText))) {
        return 'essay';
      }
      
      // Check for design/presentation
      if (/\b(design|mockup|wireframe|prototype|presentation|slides)\b/i.test(combinedText)) {
        return 'design';
      }
      
      // Default to generic
      return 'generic';
    };

    const assignmentType = detectAssignmentType(submissionContent, assignmentTitle, assignmentDescription);

    // Create type-specific analysis prompts
    let analysisInstructions = '';
    
    switch (assignmentType) {
      case 'coding':
        analysisInstructions = `This is a CODING/PROGRAMMING assignment. Focus your analysis on:
1. Code quality, structure, and organization
2. Correct implementation of algorithms and logic
3. Code readability, commenting, and documentation
4. Proper use of programming concepts (functions, classes, data structures, etc.)
5. Functionality and whether the code meets requirements
6. Potential bugs, edge cases, or efficiency improvements
7. Best practices and coding standards

DO NOT mention things like "supporting evidence", "paragraph structure", or "citations" - this is CODE, not an essay.`;
        break;
      
      case 'essay':
        analysisInstructions = `This is a WRITING/ESSAY assignment. Focus your analysis on:
1. Clarity and coherence of arguments
2. Quality of supporting evidence and examples
3. Organization and paragraph structure
4. Thesis statement and conclusion
5. Writing style and grammar
6. Citation quality and use of sources
7. Critical thinking and depth of analysis`;
        break;
      
      case 'design':
        analysisInstructions = `This is a DESIGN/VISUAL assignment. Focus your analysis on:
1. Design principles (balance, contrast, alignment, etc.)
2. User experience and usability
3. Visual appeal and aesthetics
4. Functionality and purpose
5. Innovation and creativity
6. Technical execution`;
        break;
      
      default:
        analysisInstructions = `Analyze this submission based on its specific type and requirements. Focus on:
1. How well it meets the stated assignment requirements
2. Quality of execution
3. Strengths demonstrated
4. Areas needing improvement
5. Specific, actionable suggestions`;
    }

    const prompt = `Please analyze this student submission against the assignment requirements and rubric criteria.

ASSIGNMENT DETAILS:
Title: ${assignmentTitle}
Description: ${assignmentDescription}

STUDENT SUBMISSION:
Title: ${submissionTitle}
Content: ${submissionContent}

RUBRIC CRITERIA:
${criteriaDescription || 'No specific rubric criteria provided.'}

ANALYSIS TYPE: ${assignmentType.toUpperCase()} ASSIGNMENT

${analysisInstructions}

Provide a constructive assessment (150-200 words) that:
- Identifies the assignment TYPE correctly (coding/essay/design/other)
- Uses terminology appropriate to that type
- Gives specific, relevant feedback for that type of work
- Helps peer reviewers understand what to focus on

Format as a cohesive paragraph without bullet points.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an experienced educator who adapts feedback style based on assignment type. For coding assignments, focus on code quality and functionality. For essays, focus on writing and argumentation. For design work, focus on visual and UX principles. Always match your analysis to the actual type of work being assessed."
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
        ) as "completedReviewCount",
        (
          SELECT pr.review_id
          FROM peer_assessment.peer_reviews pr
          WHERE pr.submission_id = s.submission_id AND pr.is_ai_generated = true
          LIMIT 1
        ) as "aiReviewId",
        (
          SELECT pr.is_released
          FROM peer_assessment.peer_reviews pr
          WHERE pr.submission_id = s.submission_id AND pr.is_ai_generated = true
          LIMIT 1
        ) as "aiReviewReleased",
        (
          SELECT pr.total_score
          FROM peer_assessment.peer_reviews pr
          WHERE pr.submission_id = s.submission_id AND pr.is_ai_generated = true
          LIMIT 1
        ) as "aiReviewScore",
        (
          SELECT pr.status
          FROM peer_assessment.peer_reviews pr
          WHERE pr.submission_id = s.submission_id AND pr.is_ai_generated = true
          LIMIT 1
        ) as "aiReviewStatus"
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
    
    // Set title to empty string if not provided
    const title = body.title || '';
    
    // Validate required fields
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
        `, [title, body.content, assignmentId, body.studentId]);
        
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
      `, [assignmentId, body.studentId, title, body.content, status]);
      
      const submission = insertResult.rows[0];

      // Generate AI analysis only for actual submissions (not drafts)
      if (status === 'submitted') {
        try {
          // Fetch assignment details for analysis and auto-review
          const assignmentResult = await client.query(`
            SELECT 
              title, 
              description, 
              ai_auto_review_enabled,
              ai_instructor_enabled,
              ai_instructor_prompt
            FROM peer_assessment.assignments
            WHERE assignment_id = $1
          `, [assignmentId]);
          
          const assignment = assignmentResult.rows[0];
          
          // Fetch rubric criteria for analysis (including criterion type)
          const rubricResult = await client.query(`
            SELECT 
              rc.criterion_id,
              rc.name, 
              rc.description, 
              rc.max_points,
              COALESCE(rc.criterion_type, 'levels') as criterion_type
            FROM peer_assessment.rubric_criteria rc
            INNER JOIN peer_assessment.assignment_rubrics ar ON rc.rubric_id = ar.rubric_id
            WHERE ar.assignment_id = $1
            ORDER BY rc.criterion_id
          `, [assignmentId]);
          
          // Fetch subitems for criteria that use subitems
          const rubricCriteria = await Promise.all(rubricResult.rows.map(async (criterion: any) => {
            if (criterion.criterion_type === 'subitems') {
              const subitemsResult = await client.query(`
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
          
          // Generate AI analysis
          const analysis = await generateSubmissionAnalysis(
            assignment.title,
            assignment.description,
            title,
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

          // Auto-generate AI review if enabled
          if (assignment.ai_auto_review_enabled && assignment.ai_instructor_enabled && rubricCriteria.length > 0) {
            try {
              // Get the course instructor ID to use as the reviewer
              const instructorResult = await client.query(`
                SELECT c.instructor_id
                FROM peer_assessment.courses c
                JOIN peer_assessment.assignments a ON c.course_id = a.course_id
                WHERE a.assignment_id = $1
              `, [assignmentId]);
              
              const instructorId = instructorResult.rows[0]?.instructor_id;
              
              if (!instructorId) {
                throw new Error('Instructor not found for this assignment');
              }

              const aiReview = await generateAutoAIReview(
                assignment,
                title,
                body.content,
                rubricCriteria
              );

              if (aiReview) {
                // Create AI review record with is_released = FALSE
                // Use instructor ID as reviewer so it doesn't appear in student's "Given Feedback"
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
                    generated_by_instructor,
                    is_released
                  ) VALUES ($1, $2, $3, $4, 'completed', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, true, $5, $6, false)
                  RETURNING review_id
                `, [submission.id, instructorId, aiReview.overallFeedback, aiReview.totalScore, 'gpt-4o-mini', instructorId]);

                const reviewId = reviewResult.rows[0].review_id;

                // Save individual criterion scores (including subitem data in feedback)
                for (const criterionScore of aiReview.criteriaScores) {
                  // If this criterion has subitem scores, include them in the feedback as JSON
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

                console.log('Auto AI review generated and saved for submission:', submission.id);
              }
            } catch (autoReviewError) {
              console.error('Failed to generate auto AI review:', autoReviewError);
              // Continue - don't fail submission if auto-review fails
            }
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