# AI Feedback Suggestions Implementation Guide

## Overview

This implementation adds AI-powered feedback suggestions for peer reviewers during chat conversations. When a reviewer sends a message in a peer-to-peer chat, the AI analyzes their message against the submission analysis and provides constructive suggestions to help them give better feedback.

## How It Works

1. **Trigger**: When a peer reviewer sends a message in a peer-to-peer chat (not AI chat)
2. **Analysis**: The system uses the existing AI submission analysis to understand the submission's strengths and weaknesses
3. **Suggestion Generation**: AI generates a brief, constructive suggestion to help the reviewer provide more specific or balanced feedback
4. **Display**: Suggestions appear in a special highlighted section at the bottom of the chat widget

## Key Features

- **Smart Detection**: Only triggers for peer reviewers (not submission owners) in peer-to-peer conversations
- **Context-Aware**: Uses detailed submission analysis, original review feedback, and current message context
- **Non-Intrusive**: Suggestions appear in a separate section and fail silently if unavailable
- **Constructive Focus**: Suggestions help reviewers be more specific, balanced, and thorough

## Files Created/Modified

### 1. Database Migration
**File**: `ai_feedback_suggestions_migration.sql`
- Adds `ai_suggestion` message type to chat messages
- Updates constraints to allow AI suggestions with null sender_id
- Includes proper documentation

**To run**:
```bash
psql postgresql://peerassess_user:gWJ8i4h3#W2s@95.8.132.203:5432/peerassess_db -f ai_feedback_suggestions_migration.sql
```

### 2. API Enhancement
**File**: `src/app/api/chat/conversations/[conversationId]/messages/route.ts`

**New Function**: `generateAIFeedbackSuggestion()`
- Takes reviewer message, conversation, and review context
- Uses submission analysis to generate constructive suggestions
- Focuses on helping reviewers provide more specific feedback
- Returns formatted suggestion or null if unavailable

**Integration Logic**:
- Detects when reviewer (not submission owner) sends message in peer-to-peer chat
- Generates AI suggestion based on message content and submission analysis
- Inserts suggestion as special message type `ai_suggestion`
- Fails gracefully if submission analysis unavailable or AI generation fails

### 3. UI Component Updates
**File**: `src/components/chat/ChatWidget.tsx`

**Message Type Enhancement**:
- Added `ai_suggestion` to message type interface
- Filters out AI suggestions from main message flow

**New UI Section**:
- Special amber-colored suggestion box at bottom of chat
- Appears between message area and input field
- Shows only the most recent suggestion
- Includes star icon and clear labeling as "AI Feedback Suggestion"
- Styled to be helpful but not overwhelming

## AI Prompt Engineering

The AI suggestion system uses a carefully crafted prompt that:

1. **Contextualizes** the reviewer's role and the submission details
2. **Provides** comprehensive submission analysis from the database
3. **Includes** the reviewer's original feedback for context
4. **Analyzes** the current message for improvement opportunities
5. **Focuses** on specific improvement areas:
   - Making vague feedback more specific
   - Balancing harsh criticism with constructive suggestions
   - Highlighting missed issues from the submission analysis

**Example Suggestion Output**:
> "💡 Suggestion: Based on the submission analysis, you could be more specific about the methodology issues. Try mentioning the missing sample size details or timeline gaps that were identified in the analysis."

## Technical Details

### Database Schema Updates
```sql
-- New message type added to constraint
CHECK (message_type IN ('text', 'system', 'ai_response', 'ai_suggestion'))

-- Updated sender constraint
CHECK (
    message_type = 'system' OR 
    message_type = 'ai_response' OR 
    message_type = 'ai_suggestion' OR
    sender_id IS NOT NULL
)
```

### Message Flow
1. **User sends message** → Standard message insertion
2. **System checks** → Is sender the reviewer in peer-to-peer chat?
3. **AI analyzes** → Submission analysis + reviewer message → Generate suggestion
4. **Database stores** → Suggestion as `ai_suggestion` message type
5. **UI displays** → Suggestion in special section below chat

### Error Handling
- **No submission analysis**: Suggestion generation skipped silently
- **AI API failure**: Error logged, no fallback message (graceful degradation)
- **Database errors**: Standard error handling applies

## Integration Points

### Prerequisites
- AI submission analysis must be enabled and working
- OpenAI API key must be configured
- Chat system must be in peer-to-peer mode (not AI chat mode)

### Dependencies
- Existing submission analysis system (`ai_submission_analysis` column)
- Chat conversation system with peer-to-peer support
- OpenAI integration for AI suggestion generation

## Usage Scenarios

### Ideal Use Cases
1. **Vague feedback**: "This is bad" → AI suggests specific areas to address
2. **Missing context**: Reviewer misses key issues → AI points toward submission analysis findings
3. **Harsh criticism**: Overly negative feedback → AI suggests more balanced approach

### When Suggestions Don't Appear
- Submission owner sends message (not reviewer)
- AI chat mode is active (not peer-to-peer)
- No submission analysis available
- OpenAI API unavailable
- Message content already very specific/constructive

## Future Enhancements

1. **Suggestion History**: Track and display multiple suggestions over time
2. **Feedback Quality Metrics**: Measure improvement in feedback quality with suggestions
3. **Customizable Prompts**: Allow instructors to customize suggestion prompts
4. **Suggestion Categories**: Classify suggestions by type (specificity, balance, completeness)

## Monitoring and Analytics

**Key Metrics to Track**:
- Suggestion generation rate (% of reviewer messages that get suggestions)
- Suggestion relevance (user feedback on helpfulness)
- Feedback quality improvement (before/after suggestion implementation)
- API usage and costs for suggestion generation

**Logging Points**:
- Suggestion generation attempts and outcomes
- Failed generations (API errors, missing data)
- User interactions with suggestions
