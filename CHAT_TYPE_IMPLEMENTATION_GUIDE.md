# Chat Type Implementation Guide

## Overview

This implementation changes the default chat behavior in the feedback section to use AI chat by default, while giving instructors the option to choose between AI chat and peer-to-peer chat for each assignment.

## Key Changes

### Previous Behavior
- Chat type was determined by whether the review was AI-generated or peer-generated
- AI reviews → AI chat
- Peer reviews → Peer chat

### New Behavior  
- Chat type is determined by assignment setting (defaulting to AI)
- All reviews → AI chat (default) OR peer chat (instructor choice)
- Students always have consistent chat experience per assignment

## Implementation Details

### 1. Database Changes

**New Migration**: `chat_type_preference_migration.sql`
```sql
-- Add column to assignments table to store chat preference
ALTER TABLE assignments 
ADD COLUMN feedback_chat_type VARCHAR(20) DEFAULT 'ai' CHECK (feedback_chat_type IN ('ai', 'peer'));
```

- Adds `feedback_chat_type` column to assignments table
- Defaults to 'ai' for all new assignments
- Existing assignments will use AI chat by default

### 2. API Updates

#### Assignment Creation API (`src/app/api/assignments/route.ts`)
- Added `feedbackChatType` parameter handling
- Updated INSERT statement to include the new field
- Returns the chat type in assignment responses

#### Assignment Details API (`src/app/api/assignments/[assignmentId]/route.ts`)
- Updated GET to return `feedbackChatType`
- Updated PUT to accept and save `feedbackChatType` changes
- Includes field in both read and update operations

#### Chat Conversations API (`src/app/api/chat/conversations/route.ts`)
- **Key Change**: Modified logic to check assignment's `feedback_chat_type` instead of review's `is_ai_generated`
- Updated query to JOIN with assignments table to get chat preference
- AI chat vs peer chat now determined by assignment setting, not review type

### 3. Frontend Updates

#### Assignment Creation Form (`src/app/assignments/create/page.tsx`)
- Added new "Feedback Chat Settings" section
- Radio button selection between:
  - **AI Chat (Recommended)**: Students chat with AI assistant
  - **Peer-to-Peer Chat**: Students chat with anonymous reviewers
- Defaults to AI chat
- Clear descriptions of each option

#### Assignment Edit Form (`src/app/assignments/[id]/edit/page.tsx`)
- Added same feedback chat settings section
- Loads current assignment's chat type preference
- Allows instructors to change chat type for existing assignments

### 4. User Experience

#### For Instructors
- When creating/editing assignments, can choose chat type
- AI chat is recommended and set as default
- Clear explanations of each option:
  - AI: Always available, consistent responses
  - Peer: Direct communication, requires both parties online

#### For Students
- **AI Chat Mode**: Chat with AI assistant that responds as a helpful peer reviewer
- **Peer Chat Mode**: Chat with the anonymous student who reviewed their work
- Consistent experience per assignment (all students use same chat type)
- Chat behavior no longer varies based on whether review was AI-generated or peer-written

## Technical Details

### Chat Logic Flow

1. Student opens feedback page and clicks chat
2. System creates/gets conversation for the review
3. **NEW**: Query checks `assignments.feedback_chat_type` instead of `peer_reviews.is_ai_generated`
4. If `feedback_chat_type = 'ai'`: Create AI conversation
5. If `feedback_chat_type = 'peer'`: Create peer-to-peer conversation

### Backward Compatibility

- All existing assignments will default to AI chat
- No breaking changes to existing chat functionality
- Migration is safe to run on production

### Benefits

1. **Consistent Experience**: All students in an assignment use the same chat type
2. **Always Available**: AI chat provides 24/7 availability
3. **Instructor Control**: Instructors can choose the best chat type for their assignment
4. **Better Default**: AI chat provides more consistent, helpful responses

## Migration Instructions

1. **Run the database migration**:
   ```bash
   psql [your_connection_string] -f chat_type_preference_migration.sql
   ```

2. **Deploy the code changes**
   - All modified files are backward compatible
   - No additional configuration needed

3. **Test the implementation**
   - Create a new assignment and verify chat type options appear
   - Test both AI and peer chat modes work correctly
   - Verify existing assignments default to AI chat

## Files Modified

### Database
- `chat_type_preference_migration.sql` (new)

### Backend APIs
- `src/app/api/assignments/route.ts`
- `src/app/api/assignments/[assignmentId]/route.ts`
- `src/app/api/chat/conversations/route.ts`

### Frontend
- `src/app/assignments/create/page.tsx`
- `src/app/assignments/[id]/edit/page.tsx`

## Testing Checklist

- [ ] Database migration runs successfully
- [ ] New assignments can be created with chat type selection
- [ ] Assignment edit form shows current chat type and allows changes
- [ ] AI chat works correctly (students chat with AI assistant)
- [ ] Peer chat works correctly (students chat with reviewers)
- [ ] Existing assignments default to AI chat
- [ ] Assignment APIs return the feedbackChatType field
- [ ] No breaking changes to existing functionality
