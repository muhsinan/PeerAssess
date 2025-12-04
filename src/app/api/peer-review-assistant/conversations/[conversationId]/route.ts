import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET: Fetch conversation details and messages
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const { conversationId } = await params;
    const { searchParams } = new URL(request.url);
    const reviewerId = searchParams.get('reviewerId');
    
    if (!conversationId || isNaN(Number(conversationId))) {
      return NextResponse.json(
        { error: 'Invalid conversation ID' },
        { status: 400 }
      );
    }

    if (!reviewerId || isNaN(Number(reviewerId))) {
      return NextResponse.json(
        { error: 'Invalid reviewer ID' },
        { status: 400 }
      );
    }

    // Get conversation details
    const conversationResult = await pool.query(`
      SELECT 
        prac.conversation_id as id,
        prac.reviewer_id as "reviewerId",
        prac.submission_id as "submissionId",
        prac.created_at as "createdAt",
        s.title as "submissionTitle",
        s.content as "submissionContent",
        s.ai_submission_analysis as "submissionAnalysis",
        a.title as "assignmentTitle",
        a.description as "assignmentDescription",
        a.ai_criteria_prompt as "aiCriteriaPrompt",
        c.name as "courseName"
      FROM peer_assessment.peer_review_assistant_conversations prac
      JOIN peer_assessment.submissions s ON prac.submission_id = s.submission_id
      JOIN peer_assessment.assignments a ON s.assignment_id = a.assignment_id
      JOIN peer_assessment.courses c ON a.course_id = c.course_id
      WHERE prac.conversation_id = $1 AND prac.reviewer_id = $2
    `, [conversationId, reviewerId]);

    if (conversationResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Conversation not found or access denied' },
        { status: 404 }
      );
    }

    const conversation = conversationResult.rows[0];

    // Get messages for this conversation
    const messagesResult = await pool.query(`
      SELECT 
        message_id as id,
        sender_type as "senderType",
        message_text as "messageText",
        criterion_id as "criterionId",
        message_type as "messageType",
        sent_at as "sentAt"
      FROM peer_assessment.peer_review_assistant_messages
      WHERE conversation_id = $1
      ORDER BY sent_at ASC
    `, [conversationId]);

    return NextResponse.json({
      conversation,
      messages: messagesResult.rows
    });

  } catch (error) {
    console.error('Error fetching assistant conversation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}



