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
    const userId = searchParams.get('userId');
    
    if (!conversationId || isNaN(Number(conversationId))) {
      return NextResponse.json(
        { error: 'Invalid conversation ID' },
        { status: 400 }
      );
    }

    if (!userId || isNaN(Number(userId))) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      );
    }

    // Verify user is a participant in this conversation
    const participantCheck = await pool.query(`
      SELECT 1 FROM peer_assessment.chat_conversations
      WHERE conversation_id = $1 
        AND (participant1_id = $2 OR (participant2_id = $2 AND NOT is_ai_conversation))
    `, [conversationId, userId]);

    if (participantCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Access denied. You are not a participant in this conversation.' },
        { status: 403 }
      );
    }

    // Fetch conversation details including criterion and subitem info
    const conversationResult = await pool.query(`
      SELECT 
        cc.conversation_id as id,
        cc.review_id as "reviewId",
        cc.created_at as "createdAt",
        cc.updated_at as "updatedAt",
        cc.last_message_at as "lastMessageAt",
        cc.is_ai_conversation as "isAiConversation",
        cc.criterion_id as "criterionId",
        cc.subitem_id as "subitemId",
        
        -- Criterion and subitem names
        rc.name as "criterionName",
        rs.name as "subitemName",
        
        -- Participants info (anonymized)
        u1.user_id as "participant1Id",
        'Anonymous User' as "participant1Name",
        CASE WHEN cc.is_ai_conversation THEN -1 ELSE u2.user_id END as "participant2Id", 
        'Anonymous Reviewer' as "participant2Name",
        
        -- Review and submission context
        s.title as "submissionTitle",
        s.student_id as "submissionOwnerId",
        a.title as "assignmentTitle",
        c.name as "courseName",
        pr.reviewer_id as "reviewerId",
        pr.status as "reviewStatus",
        pr.overall_feedback as "reviewFeedback"
        
      FROM peer_assessment.chat_conversations cc
      JOIN peer_assessment.users u1 ON cc.participant1_id = u1.user_id
      LEFT JOIN peer_assessment.users u2 ON cc.participant2_id = u2.user_id AND NOT cc.is_ai_conversation
      JOIN peer_assessment.peer_reviews pr ON cc.review_id = pr.review_id
      JOIN peer_assessment.submissions s ON pr.submission_id = s.submission_id
      JOIN peer_assessment.assignments a ON s.assignment_id = a.assignment_id
      JOIN peer_assessment.courses c ON a.course_id = c.course_id
      LEFT JOIN peer_assessment.rubric_criteria rc ON cc.criterion_id = rc.criterion_id
      LEFT JOIN peer_assessment.rubric_subitems rs ON cc.subitem_id = rs.subitem_id
      
      WHERE cc.conversation_id = $1
    `, [conversationId]);

    if (conversationResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    const conversation = conversationResult.rows[0];

    // Fetch messages for this conversation
    const messagesResult = await pool.query(`
      SELECT 
        cm.message_id as id,
        cm.sender_id as "senderId",
        cm.message_text as "messageText",
        cm.sent_at as "sentAt",
        cm.message_type as "messageType",
        CASE 
          WHEN cm.sender_id = $2 THEN 'You'
          ELSE 'Anonymous Reviewer'
        END as "senderName",
        
        -- Check if current user has read this message
        CASE WHEN rs.read_status_id IS NOT NULL THEN true ELSE false END as "isRead"
        
      FROM peer_assessment.chat_messages cm
      LEFT JOIN peer_assessment.users u ON cm.sender_id = u.user_id
      LEFT JOIN peer_assessment.chat_message_read_status rs 
        ON cm.message_id = rs.message_id AND rs.user_id = $2
        
      WHERE cm.conversation_id = $1
      ORDER BY cm.sent_at ASC
    `, [conversationId, userId]);

    // Mark all unread messages as read for this user
    await pool.query(`
      INSERT INTO peer_assessment.chat_message_read_status (message_id, user_id)
      SELECT cm.message_id, $2
      FROM peer_assessment.chat_messages cm
      LEFT JOIN peer_assessment.chat_message_read_status rs 
        ON cm.message_id = rs.message_id AND rs.user_id = $2
      WHERE cm.conversation_id = $1 
        AND cm.sender_id != $2
        AND rs.read_status_id IS NULL
        AND cm.message_type = 'text'
    `, [conversationId, userId]);

    return NextResponse.json({
      conversation,
      messages: messagesResult.rows
    });

  } catch (error) {
    console.error('Error fetching conversation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
