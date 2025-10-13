import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET: Fetch all conversations for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId || isNaN(Number(userId))) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      );
    }

    // Fetch conversations where the user is a participant
    const conversationsResult = await pool.query(`
      SELECT 
        cc.conversation_id as id,
        cc.review_id as "reviewId",
        cc.created_at as "createdAt",
        cc.updated_at as "updatedAt",
        cc.last_message_at as "lastMessageAt",
        cc.is_ai_conversation as "isAiConversation",
        
        -- Participant info (the other person in the conversation, anonymized)
        CASE 
          WHEN cc.is_ai_conversation THEN -1
          WHEN cc.participant1_id = $1 THEN u2.user_id
          ELSE u1.user_id
        END as "otherParticipantId",
        'Anonymous Reviewer' as "otherParticipantName",
        
        -- Submission and assignment info
        s.title as "submissionTitle",
        a.title as "assignmentTitle",
        c.name as "courseName",
        
        -- Last message info
        lm.message_text as "lastMessageText",
        lm.sent_at as "lastMessageSentAt",
        lm.sender_id as "lastMessageSenderId",
        
        -- Unread count for this user
        COALESCE(unread_count.count, 0) as "unreadCount",
        
        -- Review status
        pr.status as "reviewStatus"
        
      FROM peer_assessment.chat_conversations cc
      LEFT JOIN peer_assessment.users u1 ON cc.participant1_id = u1.user_id
      LEFT JOIN peer_assessment.users u2 ON cc.participant2_id = u2.user_id AND NOT cc.is_ai_conversation
      JOIN peer_assessment.peer_reviews pr ON cc.review_id = pr.review_id
      JOIN peer_assessment.submissions s ON pr.submission_id = s.submission_id
      JOIN peer_assessment.assignments a ON s.assignment_id = a.assignment_id
      JOIN peer_assessment.courses c ON a.course_id = c.course_id
      
      -- Get the last message
      LEFT JOIN (
        SELECT DISTINCT ON (conversation_id) 
          conversation_id, message_text, sent_at, sender_id
        FROM peer_assessment.chat_messages
        WHERE message_type = 'text'
        ORDER BY conversation_id, sent_at DESC
      ) lm ON cc.conversation_id = lm.conversation_id
      
      -- Count unread messages for this user
      LEFT JOIN (
        SELECT 
          cm.conversation_id,
          COUNT(*) as count
        FROM peer_assessment.chat_messages cm
        LEFT JOIN peer_assessment.chat_message_read_status rs 
          ON cm.message_id = rs.message_id AND rs.user_id = $1
        WHERE cm.sender_id != $1 
          AND rs.read_status_id IS NULL
          AND cm.message_type = 'text'
        GROUP BY cm.conversation_id
      ) unread_count ON cc.conversation_id = unread_count.conversation_id
      
      WHERE cc.participant1_id = $1 OR (cc.participant2_id = $1 AND NOT cc.is_ai_conversation)
      ORDER BY cc.last_message_at DESC
    `, [userId]);

    return NextResponse.json({
      conversations: conversationsResult.rows
    });

  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: Create or get existing conversation for a review
export async function POST(request: NextRequest) {
  try {
    const { reviewId, userId } = await request.json();
    
    if (!reviewId || isNaN(Number(reviewId))) {
      return NextResponse.json(
        { error: 'Invalid review ID' },
        { status: 400 }
      );
    }

    if (!userId || isNaN(Number(userId))) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      );
    }

    // Check if conversation already exists for this review
    const existingConversation = await pool.query(`
      SELECT conversation_id as id
      FROM peer_assessment.chat_conversations
      WHERE review_id = $1
    `, [reviewId]);

    if (existingConversation.rows.length > 0) {
      return NextResponse.json({
        conversationId: existingConversation.rows[0].id,
        isNew: false
      });
    }

    // Get review details to identify participants and check assignment's chat preference
    const reviewResult = await pool.query(`
      SELECT 
        pr.reviewer_id,
        s.student_id as submission_owner_id,
        pr.status,
        pr.is_ai_generated,
        pr.generated_by_instructor,
        a.feedback_chat_type
      FROM peer_assessment.peer_reviews pr
      JOIN peer_assessment.submissions s ON pr.submission_id = s.submission_id
      JOIN peer_assessment.assignments a ON s.assignment_id = a.assignment_id
      WHERE pr.review_id = $1
    `, [reviewId]);

    if (reviewResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      );
    }

    const review = reviewResult.rows[0];
    
    // Check access based on assignment's chat type preference (defaulting to 'ai' if not set)
    const usesAIChat = (review.feedback_chat_type || 'ai') === 'ai';
    
    if (usesAIChat) {
      // For AI chat (default), only allow the submission owner to chat
      console.log('AI chat enabled for reviewId:', reviewId, 'chat type:', review.feedback_chat_type);
      if (Number(userId) !== review.submission_owner_id) {
        return NextResponse.json(
          { error: 'Access denied. Only the submission owner can use AI chat for feedback.' },
          { status: 403 }
        );
      }
    } else {
      // For peer-to-peer chat, verify that the requesting user is one of the participants
      if (Number(userId) !== review.reviewer_id && Number(userId) !== review.submission_owner_id) {
        return NextResponse.json(
          { error: 'Access denied. You are not a participant in this review.' },
          { status: 403 }
        );
      }
    }

    // Only allow chat creation if review is completed or in progress
    if (review.status !== 'completed' && review.status !== 'in_progress') {
      return NextResponse.json(
        { error: `Chat is only available for completed or in-progress reviews. Current status: ${review.status}` },
        { status: 400 }
      );
    }

    // Create new conversation (handle potential race condition)
    let conversationId;
    try {
      if (usesAIChat) {
        // Create AI conversation - use NULL for participant2_id since it's AI
        console.log('Creating AI conversation for reviewId:', reviewId, 'submissionOwnerId:', review.submission_owner_id);
        const newConversation = await pool.query(`
          INSERT INTO peer_assessment.chat_conversations (
            review_id, 
            participant1_id, 
            participant2_id, 
            is_ai_conversation, 
            ai_assistant_id
          )
          VALUES ($1, $2, NULL, true, -1)
          RETURNING conversation_id as id
        `, [reviewId, review.submission_owner_id]);
        
        conversationId = newConversation.rows[0].id;
        console.log('AI conversation created with ID:', conversationId);
      } else {
        // Create regular peer conversation
        const newConversation = await pool.query(`
          INSERT INTO peer_assessment.chat_conversations (review_id, participant1_id, participant2_id)
          VALUES ($1, $2, $3)
          RETURNING conversation_id as id
        `, [reviewId, review.submission_owner_id, review.reviewer_id]);
        
        conversationId = newConversation.rows[0].id;
      }
    } catch (error: any) {
      // If duplicate key constraint violation, conversation already exists
      if (error.code === '23505') {
        const existingConversation = await pool.query(`
          SELECT conversation_id as id
          FROM peer_assessment.chat_conversations
          WHERE review_id = $1
        `, [reviewId]);
        
        if (existingConversation.rows.length > 0) {
          return NextResponse.json({
            conversationId: existingConversation.rows[0].id,
            isNew: false
          });
        }
      }
      throw error;
    }

    // Add system message to start the conversation
    const systemMessage = 'Chat conversation started. You can now discuss the peer review feedback.';
    
    await pool.query(`
      INSERT INTO peer_assessment.chat_messages (conversation_id, sender_id, message_text, message_type)
      VALUES ($1, NULL, $2, 'system')
    `, [conversationId, systemMessage]);

    return NextResponse.json({
      conversationId,
      isNew: true
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating conversation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
