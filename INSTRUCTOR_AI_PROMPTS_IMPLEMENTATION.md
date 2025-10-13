# Instructor AI Prompts Implementation Guide

## Overview
This implementation adds a **separate** AI system for instructors to generate customizable peer reviews, while keeping the existing student AI assistance system completely unchanged.

## Two Distinct AI Systems

### 1. **Existing Student AI Assistance** (UNCHANGED)
- **Purpose**: Helps students improve their own peer review writing
- **Database Fields**: `ai_prompts_enabled`, `ai_overall_prompt`, `ai_criteria_prompt`
- **Usage**: Students get AI suggestions to improve their feedback
- **UI**: Available in review writing interface for students

### 2. **New Instructor AI Generation** (NEW)
- **Purpose**: Allows instructors to generate complete AI peer reviews
- **Database Fields**: `ai_instructor_enabled`, `ai_instructor_prompt`
- **Usage**: Instructors can generate anonymous AI peer reviews for submissions
- **UI**: Available in assignment creation/edit and submission management

## Implementation Details

### Database Changes
**New Migration**: `ai_instructor_prompts_migration.sql`
```sql
ALTER TABLE peer_assessment.assignments 
ADD COLUMN ai_instructor_prompt TEXT,
ADD COLUMN ai_instructor_enabled BOOLEAN DEFAULT true;
```

### API Updates

#### AI Review Generation API
**File**: `src/app/api/submissions/[submissionId]/ai-review/route.ts`
- Added fetching of `ai_instructor_prompt` and `ai_instructor_enabled`
- Added check for instructor AI enablement
- Added custom prompt logic using `ai_instructor_prompt` field
- Falls back to default peer-style prompt if no custom prompt provided

#### Assignment Creation API
**File**: `src/app/api/assignments/route.ts`
- Added handling of `aiInstructorEnabled` and `aiInstructorPrompt` parameters
- Updated INSERT statement to include new fields

### UI Changes

#### Assignment Creation Form
**File**: `src/app/assignments/create/page.tsx`
- Added new section "Instructor AI Review Generation"
- Added toggle for enabling/disabling instructor AI reviews
- Added textarea for custom AI prompt (optional)
- Separate from existing student AI assistance section

### How It Works

#### For Instructors:
1. **Assignment Creation/Edit**: 
   - Configure both student AI assistance (existing) and instructor AI generation (new)
   - Set custom prompt for AI review generation (optional)
   - Enable/disable instructor AI reviews independently

2. **Review Generation**:
   - Click "AI Peer Review" button on submissions page
   - System uses custom instructor prompt if provided
   - Falls back to default peer-style prompt
   - Generates anonymous peer review for student

#### For Students:
- **No change** in experience
- Still receive AI assistance for writing their own reviews (existing system)
- Receive anonymous AI-generated reviews from instructors (new system)
- Cannot distinguish between AI and human reviews

## Custom Prompt Examples

### Creative Writing Focus
```
You are a creative writing student reviewing a peer's work. Focus especially on creative elements, originality, and imaginative aspects. Be encouraging about their creative choices and suggest ways to enhance their creative expression. Use casual language and mention specific creative elements that caught your attention.
```

### Technical Focus
```
You are a computer science student reviewing code documentation. Focus on clarity, technical accuracy, and completeness. Point out good technical explanations and suggest improvements for unclear sections. Use casual but precise language when discussing technical concepts.
```

### Encouraging Style
```
You are an encouraging peer reviewer who focuses on strengths first. Always start with what worked well, be specific about good aspects, and frame suggestions positively. Use phrases like "I really liked..." and "Maybe you could try..." to maintain a supportive tone.
```

## Technical Architecture

### API Flow
1. Instructor clicks "AI Peer Review" button
2. System fetches assignment with `ai_instructor_prompt` and `ai_instructor_enabled`
3. Checks if instructor AI is enabled for assignment
4. Uses custom prompt if provided, otherwise default peer-style prompt
5. Adds context (assignment details, submission, rubric)
6. Calls OpenAI API with constructed prompt
7. Returns preview for instructor approval
8. Saves as anonymous AI review when confirmed

### Database Structure
```
assignments table:
├── ai_prompts_enabled (existing - student AI assistance)
├── ai_overall_prompt (existing - student AI assistance)
├── ai_criteria_prompt (existing - student AI assistance)
├── ai_instructor_enabled (new - instructor AI generation)
└── ai_instructor_prompt (new - instructor AI generation)
```

## Migration Steps

1. **Run Database Migration**:
   ```bash
   psql [connection_string] -f ai_instructor_prompts_migration.sql
   ```

2. **Deploy Code Changes**:
   - Updated API endpoints
   - Updated UI forms
   - New prompt handling logic

3. **Test Features**:
   - Create assignment with custom instructor prompt
   - Generate AI review with custom prompt
   - Verify existing student AI assistance still works

## Backward Compatibility

- **Existing assignments**: All have instructor AI enabled by default
- **Student AI assistance**: Completely unchanged and continues to work
- **Custom prompts**: Optional - uses default if not provided
- **UI**: Clearly separated sections for different AI systems

## Future Enhancements

- **Prompt templates**: Pre-built prompts for different subjects
- **Course-level defaults**: Set default instructor prompts per course
- **Analytics**: Track effectiveness of custom vs default prompts
- **A/B testing**: Compare different prompt styles

## Security & Privacy

- **API Key Protection**: OpenAI key stored server-side only
- **Instructor Only**: Only instructors can set custom prompts
- **Student Anonymity**: AI reviews appear anonymous to students
- **Data Minimization**: Only necessary context sent to OpenAI

## Configuration Options

### Assignment Level
- Enable/disable instructor AI reviews
- Set custom prompt for AI generation
- Independent from student AI assistance settings

### System Level
- Configure OpenAI API key
- Set default peer-style prompt behavior
- Enable/disable feature globally if needed

This implementation provides maximum flexibility while maintaining clear separation between student assistance and instructor generation capabilities.
