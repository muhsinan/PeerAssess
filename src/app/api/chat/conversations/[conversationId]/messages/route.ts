import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import OpenAI from 'openai';

// Function to generate AI feedback suggestion for peer reviewers
async function generateAIFeedbackSuggestion(conversationId: number, reviewId: number, reviewerMessage: string) {
  try {
    console.log('Generating AI feedback suggestion for reviewId:', reviewId, 'conversationId:', conversationId);
    
    // Get review details and submission analysis
    const reviewResult = await pool.query(`
      SELECT 
        pr.overall_feedback,
        pr.reviewer_id,
        s.title as submission_title,
        s.content as submission_content,
        s.ai_submission_analysis,
        s.student_id as submission_owner_id,
        a.title as assignment_title,
        a.description as assignment_description,
        u.name as student_name,
        
        -- Get criterion scores for context as JSON string
        COALESCE(
          json_agg(
            json_build_object(
              'criterionName', rc.name,
              'feedback', prs.feedback,
              'score', prs.score,
              'maxPoints', rc.max_points
            )
          ) FILTER (WHERE rc.criterion_id IS NOT NULL),
          '[]'::json
        )::text as criteria_feedback
        
      FROM peer_assessment.peer_reviews pr
      JOIN peer_assessment.submissions s ON pr.submission_id = s.submission_id
      JOIN peer_assessment.assignments a ON s.assignment_id = a.assignment_id
      JOIN peer_assessment.users u ON s.student_id = u.user_id
      LEFT JOIN peer_assessment.peer_review_scores prs ON pr.review_id = prs.review_id
      LEFT JOIN peer_assessment.rubric_criteria rc ON prs.criterion_id = rc.criterion_id
      WHERE pr.review_id = $1
      GROUP BY pr.review_id, pr.overall_feedback, pr.reviewer_id, s.title, s.content, s.ai_submission_analysis, s.student_id, a.title, a.description, u.name
    `, [reviewId]);

    if (reviewResult.rows.length === 0) {
      console.error('Review not found for reviewId:', reviewId);
      return null;
    }

    const review = reviewResult.rows[0];
    
    // Only generate suggestions if submission analysis exists
    if (!review.ai_submission_analysis) {
      console.log('No submission analysis found for reviewId:', reviewId);
      return null;
    }

    // Safely parse criteria feedback
    let criteriaFeedback = [];
    try {
      if (review.criteria_feedback && typeof review.criteria_feedback === 'string') {
        criteriaFeedback = JSON.parse(review.criteria_feedback);
      } else if (Array.isArray(review.criteria_feedback)) {
        criteriaFeedback = review.criteria_feedback;
      }
    } catch (parseError) {
      console.warn('Failed to parse criteria_feedback:', parseError);
      criteriaFeedback = [];
    }

    // Initialize OpenAI
    const openai = new OpenAI({
      apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY
    });

    if (!process.env.NEXT_PUBLIC_OPENAI_API_KEY) {
      console.error('OpenAI API key not configured');
      return null;
    }

    const prompt = `You are an AI teaching assistant helping improve peer feedback quality. A peer reviewer just sent the following message in a discussion about their review. Based on the submission analysis, provide a brief suggestion to help them give more constructive feedback.

CONTEXT:
Assignment: ${review.assignment_title}
Student's Submission Title: ${review.submission_title}

DETAILED SUBMISSION ANALYSIS:
${review.ai_submission_analysis}

REVIEWER'S ORIGINAL FEEDBACK:
Overall Feedback: ${review.overall_feedback}

Detailed Criteria Feedback:
${criteriaFeedback.map((item: any) => 
  `- ${item.criterionName || 'Unknown Criterion'} (${item.score || 0}/${item.maxPoints || 0}): ${item.feedback || 'No feedback provided'}`
).join('\n')}

REVIEWER'S RECENT MESSAGE: "${reviewerMessage}"

Based on the submission analysis, provide ONE brief suggestion (1-2 sentences max) to help them give more specific feedback. Focus on the most important improvement opportunity from their recent message.

Be very concise and actionable. Start with "💡" and keep it under 25 words if possible.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a helpful teaching assistant. Give extremely brief suggestions (1 sentence, under 25 words) to improve peer feedback. Be specific and concise."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 50
    });

    const suggestionText = completion.choices[0]?.message?.content;
    
    if (!suggestionText) {
      console.error('OpenAI returned no suggestion content');
      return null;
    }
    
    console.log('AI feedback suggestion generated, length:', suggestionText.length);

    // Insert AI suggestion into database
    const suggestionResult = await pool.query(`
      INSERT INTO peer_assessment.chat_messages (conversation_id, sender_id, message_text, message_type)
      VALUES ($1, NULL, $2, 'ai_suggestion')
      RETURNING 
        message_id as id,
        sender_id as "senderId",
        message_text as "messageText",
        sent_at as "sentAt",
        message_type as "messageType"
    `, [conversationId, suggestionText]);

    const suggestionMessage = suggestionResult.rows[0];
    suggestionMessage.senderName = 'AI Teaching Assistant';

    return suggestionMessage;

  } catch (error) {
    console.error('Error generating AI feedback suggestion:', error);
    return null;
  }
}

// Function to generate AI response
async function generateAIResponse(conversationId: number, reviewId: number, userMessage: string) {
  try {
    console.log('Starting AI response generation for reviewId:', reviewId, 'conversationId:', conversationId);
    
    // Get review details and feedback context
    const reviewResult = await pool.query(`
      SELECT 
        pr.overall_feedback,
        s.title as submission_title,
        s.content as submission_content,
        s.ai_submission_analysis,
        a.title as assignment_title,
        a.description as assignment_description,
        u.name as student_name,
        
        -- Get criterion scores for context as JSON string
        COALESCE(
          json_agg(
            json_build_object(
              'criterionName', rc.name,
              'feedback', prs.feedback,
              'score', prs.score,
              'maxPoints', rc.max_points
            )
          ) FILTER (WHERE rc.criterion_id IS NOT NULL),
          '[]'::json
        )::text as criteria_feedback
        
      FROM peer_assessment.peer_reviews pr
      JOIN peer_assessment.submissions s ON pr.submission_id = s.submission_id
      JOIN peer_assessment.assignments a ON s.assignment_id = a.assignment_id
      JOIN peer_assessment.users u ON s.student_id = u.user_id
      LEFT JOIN peer_assessment.peer_review_scores prs ON pr.review_id = prs.review_id
      LEFT JOIN peer_assessment.rubric_criteria rc ON prs.criterion_id = rc.criterion_id
      WHERE pr.review_id = $1
      GROUP BY pr.review_id, pr.overall_feedback, s.title, s.content, s.ai_submission_analysis, a.title, a.description, u.name
    `, [reviewId]);

    if (reviewResult.rows.length === 0) {
      console.error('Review not found for reviewId:', reviewId);
      throw new Error('Review not found');
    }

    const review = reviewResult.rows[0];
    console.log('Found review data:', { 
      title: review.submission_title, 
      hasOverallFeedback: !!review.overall_feedback,
      criteriaFeedbackType: typeof review.criteria_feedback,
      criteriaFeedbackRaw: review.criteria_feedback
    });
    
    // Safely parse criteria feedback
    let criteriaFeedback = [];
    try {
      if (review.criteria_feedback && typeof review.criteria_feedback === 'string') {
        criteriaFeedback = JSON.parse(review.criteria_feedback);
      } else if (Array.isArray(review.criteria_feedback)) {
        criteriaFeedback = review.criteria_feedback;
      }
    } catch (parseError) {
      console.warn('Failed to parse criteria_feedback:', parseError);
      criteriaFeedback = [];
    }

    // Get recent conversation context (last 10 messages)
    const contextResult = await pool.query(`
      SELECT message_text, message_type, sender_id
      FROM peer_assessment.chat_messages
      WHERE conversation_id = $1
      ORDER BY sent_at DESC
      LIMIT 10
    `, [conversationId]);

    const conversationContext = contextResult.rows.reverse().map(msg => 
      msg.message_type === 'ai_response' 
        ? `AI: ${msg.message_text}`
        : msg.message_type === 'system'
        ? `System: ${msg.message_text}`
        : `Student: ${msg.message_text}`
    ).join('\n');

    // Initialize OpenAI
    const openai = new OpenAI({
      apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY
    });

    if (!process.env.NEXT_PUBLIC_OPENAI_API_KEY) {
      console.error('OpenAI API key not configured');
      throw new Error('OpenAI API key not configured');
    }
    
    console.log('OpenAI API key is configured, generating response...');

    let prompt = `You are a fellow student who provided peer review feedback. You're now chatting with the student whose work you reviewed. Be helpful, encouraging, and speak like a peer - not a teacher or AI. Use casual but respectful language.

CONTEXT:
Assignment: ${review.assignment_title}
Student: ${review.student_name}
Submission Title: ${review.submission_title}

YOUR PEER REVIEW FEEDBACK:
Overall Feedback: ${review.overall_feedback}

Detailed Criteria Feedback:
${criteriaFeedback.map((item: any) => 
  `- ${item.criterionName || item.criterionname || 'Unknown Criterion'} (${item.score || 0}/${item.maxPoints || item.maxpoints || 0}): ${item.feedback || 'No feedback provided'}`
).join('\n')}`;

    // Include submission analysis as context if available
    if (review.ai_submission_analysis) {
      prompt += `

SUBMISSION ANALYSIS (for your context as the reviewer):
When the student submitted their work, it was analyzed and found to have these characteristics:
${review.ai_submission_analysis}

Use this understanding to better explain your feedback choices and provide more helpful responses about the specific areas where the submission needed improvement.`;
    }

    prompt += `

CONVERSATION HISTORY:
${conversationContext}

CURRENT STUDENT MESSAGE: ${userMessage}

Respond as the peer reviewer who gave this feedback. Keep it short and casual like texting a classmate - max 2-3 sentences. Use "I" statements (e.g., "I thought...", "I noticed...", "I gave you that score because..."). Be encouraging but brief. Sound like a real student, not formal or wordy.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a college student texting a classmate about peer review feedback you gave them. Keep responses SHORT (1-3 sentences max), casual, and conversational. Use 'I' statements about your review. Sound like a real student - not an AI or teacher."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.8,
      max_tokens: 100
    });

    const aiResponseText = completion.choices[0]?.message?.content;
    
    if (!aiResponseText) {
      console.error('OpenAI returned no response content');
      throw new Error('Failed to generate AI response');
    }
    
    console.log('OpenAI response generated, length:', aiResponseText.length);

    // Insert AI response into database
    const aiMessageResult = await pool.query(`
      INSERT INTO peer_assessment.chat_messages (conversation_id, sender_id, message_text, message_type)
      VALUES ($1, NULL, $2, 'ai_response')
      RETURNING 
        message_id as id,
        sender_id as "senderId",
        message_text as "messageText",
        sent_at as "sentAt",
        message_type as "messageType"
    `, [conversationId, aiResponseText]);

    const aiMessage = aiMessageResult.rows[0];
    aiMessage.senderName = 'Anonymous Reviewer';

    return aiMessage;

  } catch (error) {
    console.error('Error generating AI response:', error);
    return null;
  }
}

// POST: Send a new message in a conversation
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const { conversationId } = await params;
    const { messageText, senderId } = await request.json();
    
    if (!conversationId || isNaN(Number(conversationId))) {
      return NextResponse.json(
        { error: 'Invalid conversation ID' },
        { status: 400 }
      );
    }

    if (!senderId || isNaN(Number(senderId))) {
      return NextResponse.json(
        { error: 'Invalid sender ID' },
        { status: 400 }
      );
    }

    if (!messageText || messageText.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message text is required' },
        { status: 400 }
      );
    }

    if (messageText.length > 2000) {
      return NextResponse.json(
        { error: 'Message text is too long (max 2000 characters)' },
        { status: 400 }
      );
    }

    // Verify user is a participant in this conversation and get conversation details
    const participantCheck = await pool.query(`
      SELECT cc.is_ai_conversation, cc.review_id, cc.participant1_id, cc.participant2_id, pr.reviewer_id
      FROM peer_assessment.chat_conversations cc
      JOIN peer_assessment.peer_reviews pr ON cc.review_id = pr.review_id
      WHERE cc.conversation_id = $1 
        AND (cc.participant1_id = $2 OR (cc.participant2_id = $2 AND NOT cc.is_ai_conversation))
    `, [conversationId, senderId]);

    if (participantCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Access denied. You are not a participant in this conversation.' },
        { status: 403 }
      );
    }

    const conversation = participantCheck.rows[0];
    console.log('Conversation details:', { 
      conversationId, 
      isAiConversation: conversation.is_ai_conversation, 
      reviewId: conversation.review_id,
      senderId,
      reviewerId: conversation.reviewer_id
    });

    // Insert the new message
    const messageResult = await pool.query(`
      INSERT INTO peer_assessment.chat_messages (conversation_id, sender_id, message_text, message_type)
      VALUES ($1, $2, $3, 'text')
      RETURNING 
        message_id as id,
        sender_id as "senderId",
        message_text as "messageText",
        sent_at as "sentAt",
        message_type as "messageType"
    `, [conversationId, senderId, messageText.trim()]);

    const newMessage = messageResult.rows[0];

    // Set anonymous sender name
    newMessage.senderName = 'You';

    // Mark the message as read by the sender
    await pool.query(`
      INSERT INTO peer_assessment.chat_message_read_status (message_id, user_id)
      VALUES ($1, $2)
    `, [newMessage.id, senderId]);

    const responses = [newMessage];

    // If this is an AI conversation, generate and send AI response
    if (conversation.is_ai_conversation) {
      console.log('AI conversation detected, generating response for reviewId:', conversation.review_id);
      try {
        const aiResponse = await generateAIResponse(parseInt(conversationId), conversation.review_id, messageText);
        if (aiResponse) {
          console.log('AI response generated successfully:', aiResponse.id);
          responses.push(aiResponse);
        } else {
          console.warn('AI response generation returned null');
        }
      } catch (error) {
        console.error('Error generating AI response:', error);
        // Send a fallback message if AI generation fails
        try {
          const fallbackMessage = await pool.query(`
            INSERT INTO peer_assessment.chat_messages (conversation_id, sender_id, message_text, message_type)
            VALUES ($1, NULL, 'I apologize, but I''m having trouble generating a response right now. Please try again in a moment.', 'ai_response')
            RETURNING 
              message_id as id,
              sender_id as "senderId",
              message_text as "messageText",
              sent_at as "sentAt",
              message_type as "messageType"
          `, [parseInt(conversationId)]);
          
          const fallback = fallbackMessage.rows[0];
          fallback.senderName = 'Anonymous Reviewer';
          responses.push(fallback);
          console.log('Fallback AI message sent');
        } catch (fallbackError) {
          console.error('Error sending fallback message:', fallbackError);
        }
      }
    } else {
      // For peer-to-peer conversations, check if reviewer sent a message and generate AI feedback suggestion
      if (senderId === conversation.reviewer_id) {
        console.log('Reviewer message detected in peer conversation, generating AI feedback suggestion');
        try {
          const aiSuggestion = await generateAIFeedbackSuggestion(parseInt(conversationId), conversation.review_id, messageText);
          if (aiSuggestion) {
            console.log('AI feedback suggestion generated successfully:', aiSuggestion.id);
            responses.push(aiSuggestion);
          } else {
            console.log('AI feedback suggestion generation returned null (likely no submission analysis available)');
          }
        } catch (error) {
          console.error('Error generating AI feedback suggestion:', error);
          // Don't add a fallback message for suggestions - they should fail silently
        }
      }
    }

    return NextResponse.json({
      message: newMessage,
      messages: responses
    }, { status: 201 });

  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET: Fetch messages for a conversation (with pagination)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const { conversationId } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const before = searchParams.get('before'); // message ID for pagination
    const limit = parseInt(searchParams.get('limit') || '50');
    
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

    if (limit > 100) {
      return NextResponse.json(
        { error: 'Limit cannot exceed 100 messages' },
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

    // Build query with optional pagination
    let query = `
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
    `;

    const queryParams = [conversationId, userId];

    if (before) {
      query += ` AND cm.message_id < $3`;
      queryParams.push(before);
    }

    query += ` ORDER BY cm.sent_at DESC LIMIT $${queryParams.length + 1}`;
    queryParams.push(limit.toString());

    const messagesResult = await pool.query(query, queryParams);

    // Reverse to get chronological order
    const messages = messagesResult.rows.reverse();

    return NextResponse.json({
      messages,
      hasMore: messagesResult.rows.length === limit
    });

  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
