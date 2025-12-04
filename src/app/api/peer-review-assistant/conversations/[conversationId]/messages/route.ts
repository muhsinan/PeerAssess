import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import OpenAI from 'openai';

// Generate AI assistance response for peer review feedback
async function generateAIAssistance(
  conversationId: number,
  criterionId: number | null,
  criterionName: string | null,
  criterionDescription: string | null,
  maxPoints: number | null,
  currentScore: number | null,
  currentFeedback: string | null,
  userMessage: string,
  submissionAnalysis: string | null,
  assignmentTitle: string,
  assignmentDescription: string,
  submissionTitle: string,
  submissionContent: string,
  conversationHistory: any[]
) {
  try {
    const openai = new OpenAI({
      apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY || '',
      dangerouslyAllowBrowser: false
    });

    // Build context with submission analysis
    let contextPrompt = `You are an AI assistant helping a student write better peer review feedback.

Assignment: ${assignmentTitle}
Assignment Description: ${assignmentDescription}

Submission Being Reviewed: ${submissionTitle}
Submission Content: ${submissionContent.substring(0, 2000)}${submissionContent.length > 2000 ? '...' : ''}`;

    // Add submission analysis if available
    if (submissionAnalysis) {
      contextPrompt += `

IMPORTANT CONTEXT - SUBMISSION ANALYSIS:
${submissionAnalysis}

The above analysis describes the ACTUAL SUBMISSION and its TYPE (coding/essay/design/etc.).
When providing assistance:
- Match your suggestions to the TYPE of assignment mentioned in the analysis
- If it's a CODING assignment, focus on code quality, functionality, algorithms, etc.
- If it's an ESSAY, focus on writing, arguments, evidence, structure, etc.
- If it's a DESIGN project, focus on visual elements, UX, usability, etc.
- DO NOT give essay-related suggestions for coding assignments
- DO NOT give code-related suggestions for essay assignments`;
    }

    // Add criterion-specific context if provided
    if (criterionId && criterionName) {
      contextPrompt += `

CURRENT CRITERION BEING REVIEWED:
Name: ${criterionName}
Description: ${criterionDescription}
Max Points: ${maxPoints}
Score Given: ${currentScore !== null ? `${currentScore}/${maxPoints}` : 'Not yet scored'}
Current Feedback: ${currentFeedback || 'No feedback written yet'}`;
    }

    contextPrompt += `

Your role is to:
1. Help the reviewer write constructive, specific, and actionable feedback
2. Provide suggestions based on the actual content of the submission
3. Be concise and helpful
4. Focus on improving the quality of peer feedback, not on grading the submission

DO NOT provide revised feedback examples. Instead, provide guidance, suggestions, and tips that help the reviewer write their own feedback.`;

    // Build conversation history for context
    const messages: any[] = [
      {
        role: 'system',
        content: contextPrompt
      }
    ];

    // Add recent conversation history (last 10 messages)
    const recentHistory = conversationHistory.slice(-10);
    for (const msg of recentHistory) {
      if (msg.senderType === 'reviewer') {
        messages.push({
          role: 'user',
          content: msg.messageText
        });
      } else if (msg.senderType === 'ai') {
        messages.push({
          role: 'assistant',
          content: msg.messageText
        });
      }
    }

    // Add current user message
    messages.push({
      role: 'user',
      content: userMessage
    });

    // Generate AI response
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: messages,
      max_tokens: 500,
      temperature: 0.7
    });

    const aiResponse = response.choices[0]?.message?.content || 'I apologize, but I could not generate a response. Please try again.';

    return aiResponse;

  } catch (error) {
    console.error('Error generating AI assistance:', error);
    return 'I encountered an error while processing your request. Please try again.';
  }
}

// POST: Send a message and get AI assistance
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const { conversationId } = await params;
    const body = await request.json();
    const { messageText, reviewerId, criterionId, criterionName, criterionDescription, maxPoints, currentScore, currentFeedback } = body;
    
    if (!conversationId || isNaN(Number(conversationId))) {
      return NextResponse.json(
        { error: 'Invalid conversation ID' },
        { status: 400 }
      );
    }

    if (!messageText || typeof messageText !== 'string') {
      return NextResponse.json(
        { error: 'Invalid message text' },
        { status: 400 }
      );
    }

    if (!reviewerId || isNaN(Number(reviewerId))) {
      return NextResponse.json(
        { error: 'Invalid reviewer ID' },
        { status: 400 }
      );
    }

    // Verify conversation belongs to this reviewer
    const conversationCheck = await pool.query(`
      SELECT 
        prac.reviewer_id,
        prac.submission_id,
        s.title as submission_title,
        s.content as submission_content,
        s.ai_submission_analysis,
        a.title as assignment_title,
        a.description as assignment_description
      FROM peer_assessment.peer_review_assistant_conversations prac
      JOIN peer_assessment.submissions s ON prac.submission_id = s.submission_id
      JOIN peer_assessment.assignments a ON s.assignment_id = a.assignment_id
      WHERE prac.conversation_id = $1
    `, [conversationId]);

    if (conversationCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    const conversation = conversationCheck.rows[0];

    if (conversation.reviewer_id !== Number(reviewerId)) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Get conversation history
    const historyResult = await pool.query(`
      SELECT 
        sender_type as "senderType",
        message_text as "messageText",
        message_type as "messageType"
      FROM peer_assessment.peer_review_assistant_messages
      WHERE conversation_id = $1
      ORDER BY sent_at ASC
    `, [conversationId]);

    // Save reviewer's message
    const reviewerMessageResult = await pool.query(`
      INSERT INTO peer_assessment.peer_review_assistant_messages (
        conversation_id,
        sender_type,
        message_text,
        criterion_id,
        message_type
      )
      VALUES ($1, 'reviewer', $2, $3, 'text')
      RETURNING 
        message_id as id,
        sender_type as "senderType",
        message_text as "messageText",
        criterion_id as "criterionId",
        message_type as "messageType",
        sent_at as "sentAt"
    `, [conversationId, messageText, criterionId || null]);

    const reviewerMessage = reviewerMessageResult.rows[0];

    // Generate AI response
    const aiResponse = await generateAIAssistance(
      Number(conversationId),
      criterionId || null,
      criterionName || null,
      criterionDescription || null,
      maxPoints || null,
      currentScore || null,
      currentFeedback || null,
      messageText,
      conversation.ai_submission_analysis || null,
      conversation.assignment_title,
      conversation.assignment_description,
      conversation.submission_title,
      conversation.submission_content,
      historyResult.rows
    );

    // Save AI response
    const aiMessageResult = await pool.query(`
      INSERT INTO peer_assessment.peer_review_assistant_messages (
        conversation_id,
        sender_type,
        message_text,
        criterion_id,
        message_type
      )
      VALUES ($1, 'ai', $2, $3, 'ai_response')
      RETURNING 
        message_id as id,
        sender_type as "senderType",
        message_text as "messageText",
        criterion_id as "criterionId",
        message_type as "messageType",
        sent_at as "sentAt"
    `, [conversationId, aiResponse, criterionId || null]);

    const aiMessage = aiMessageResult.rows[0];

    // Update conversation timestamp
    await pool.query(`
      UPDATE peer_assessment.peer_review_assistant_conversations
      SET updated_at = CURRENT_TIMESTAMP
      WHERE conversation_id = $1
    `, [conversationId]);

    return NextResponse.json({
      messages: [reviewerMessage, aiMessage]
    });

  } catch (error) {
    console.error('Error processing assistant message:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}



