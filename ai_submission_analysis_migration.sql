-- Migration to add AI submission analysis column
-- Add column to store AI-generated analysis of student submissions against rubric criteria

ALTER TABLE peer_assessment.submissions 
ADD COLUMN ai_submission_analysis TEXT;

-- Add comment for documentation
COMMENT ON COLUMN peer_assessment.submissions.ai_submission_analysis IS 'AI-generated analysis of submission quality against rubric criteria, providing initial feedback to students';

-- Create index for better query performance when filtering by analysis presence
CREATE INDEX idx_submissions_has_analysis ON peer_assessment.submissions(ai_submission_analysis) WHERE ai_submission_analysis IS NOT NULL;
