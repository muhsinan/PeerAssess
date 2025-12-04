import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

// POST: Create or get existing assistant conversation for a peer review session
export async function POST(request: NextRequest) {
  try {
    const { reviewerId, submissionId } = await request.json();
    
    if (!reviewerId || isNaN(Number(reviewerId))) {
      return NextResponse.json(
        { error: 'Invalid reviewer ID' },
        { status: 400 }
      );
    }

    if (!submissionId || isNaN(Number(submissionId))) {
      return NextResponse.json(
        { error: 'Invalid submission ID' },
        { status: 400 }
      );
    }

    // Check if conversation already exists for this reviewer and submission
    const existingConversation = await pool.query(`
      SELECT conversation_id as id
      FROM peer_assessment.peer_review_assistant_conversations
      WHERE reviewer_id = $1 AND submission_id = $2
    `, [reviewerId, submissionId]);

    if (existingConversation.rows.length > 0) {
      return NextResponse.json({
        conversationId: existingConversation.rows[0].id,
        isNew: false
      });
    }

    // Create new conversation
    const newConversation = await pool.query(`
      INSERT INTO peer_assessment.peer_review_assistant_conversations (
        reviewer_id, 
        submission_id
      )
      VALUES ($1, $2)
      RETURNING conversation_id as id
    `, [reviewerId, submissionId]);
    
    const conversationId = newConversation.rows[0].id;

    // Add system message to start the conversation
    const systemMessage = 'AI Assistant ready to help you write better peer review feedback. Ask me about any criterion!';
    
    await pool.query(`
      INSERT INTO peer_assessment.peer_review_assistant_messages (
        conversation_id, 
        sender_type, 
        message_text, 
        message_type
      )
      VALUES ($1, 'system', $2, 'system')
    `, [conversationId, systemMessage]);

    return NextResponse.json({
      conversationId,
      isNew: true
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error creating assistant conversation:', error);
    
    // Handle duplicate key constraint violation
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'Conversation already exists' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}



