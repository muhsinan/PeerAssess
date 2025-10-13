# Aggregated Feedback Synthesis Implementation Guide

## Overview
This implementation saves AI-generated synthesis of multiple peer reviews to the database to avoid regenerating it on every page load. The synthesis is only generated when a submission has multiple completed reviews and is stored efficiently for retrieval.

## How It Works
When a peer reviewer submits their completed review (status = 'completed'), the system:
1. Checks if this submission now has multiple completed reviews
2. If yes, generates an aggregated AI synthesis combining all feedback
3. Saves the synthesis to the `submissions` table
4. UI retrieves the stored synthesis instead of regenerating it

## Database Schema Changes

### Migration File: `aggregated_feedback_synthesis_migration.sql`

```sql
-- Add aggregated synthesis columns to submissions table
ALTER TABLE peer_assessment.submissions 
ADD COLUMN aggregated_feedback_synthesis TEXT;

ALTER TABLE peer_assessment.submissions 
ADD COLUMN aggregated_synthesis_generated_at TIMESTAMP WITH TIME ZONE;

-- Add indexes for performance
CREATE INDEX idx_submissions_has_aggregated_synthesis 
ON peer_assessment.submissions(aggregated_feedback_synthesis) 
WHERE aggregated_feedback_synthesis IS NOT NULL;
```

**To run:**
```bash
psql postgresql://peerassess_user:gWJ8i4h3#W2s@95.8.132.203:5432/peerassess_db -f aggregated_feedback_synthesis_migration.sql
```

## Key Implementation Files

### 1. Peer Review Submission API
**File**: `src/app/api/peer-reviews/[reviewId]/submit/route.ts`

**Key Changes**:
- Added `generateMultiFeedbackSynthesis()` function
- Added logic to check for multiple completed reviews after each submission
- Saves aggregated synthesis to `submissions.aggregated_feedback_synthesis`
- Only generates synthesis when there are 2+ completed reviews

### 2. Student Dashboard API
**File**: `src/app/api/dashboard/student/route.ts`

**Key Changes**:
- Modified query to fetch `aggregated_feedback_synthesis` from submissions table
- Removed real-time synthesis generation (uses stored synthesis instead)
- Much faster response times - no OpenAI API calls on page load

### 3. UI Components
**Files**: 
- `src/app/peer-reviews/page.tsx` - Shows aggregated synthesis for multiple reviews
- `src/app/dashboard/page.tsx` - Dashboard displays stored synthesis

## Benefits

### ✅ **Performance**
- **Before**: Generated synthesis on every `/peer-reviews` page load
- **After**: Synthesis generated once when 2nd review is completed, then cached

### ✅ **Cost Efficiency**
- **Before**: Multiple OpenAI API calls for same synthesis
- **After**: One-time generation, stored in database

### ✅ **Reliability**
- **Before**: Could fail if OpenAI API was down during page load
- **After**: Synthesis always available once generated

### ✅ **Consistency**
- **Before**: Synthesis could vary slightly between page loads
- **After**: Consistent synthesis content for same set of reviews

## Synthesis Generation Logic

```typescript
// Triggered when a peer review is completed
if (status === 'completed') {
  // Get all completed reviews for this submission
  const completedReviews = await getCompletedReviews(submissionId);
  
  // Generate synthesis if multiple reviews exist
  if (completedReviews.length > 1) {
    const synthesis = await generateMultiFeedbackSynthesis(completedReviews);
    
    // Save to database
    await saveAggregatedSynthesis(submissionId, synthesis);
  }
}
```

## Access Control
- Synthesis is only visible to feedback receivers (students viewing their own submission feedback)
- Generated only for submissions with 2+ completed peer reviews
- Displayed in `/peer-reviews` page and student dashboard

## Error Handling
- If synthesis generation fails, review submission continues normally
- Synthesis is optional - core review functionality unaffected
- Errors are logged for debugging
- Falls back to individual review display if no aggregated synthesis exists

## Environment Requirements
- `NEXT_PUBLIC_OPENAI_API_KEY` environment variable must be set
- OpenAI API quota/billing must be configured
- Database migration must be applied before use

## Testing
1. Run the database migration
2. Create a submission with multiple peer reviews
3. Complete 2+ reviews for the same submission
4. Check that `aggregated_feedback_synthesis` is populated in submissions table
5. Verify synthesis appears on `/peer-reviews` page without regeneration
