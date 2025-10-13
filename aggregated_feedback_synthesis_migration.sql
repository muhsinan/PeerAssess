-- Migration to add aggregated feedback synthesis column to submissions table
-- This stores AI-generated synthesis when a submission has multiple completed peer reviews

ALTER TABLE peer_assessment.submissions 
ADD COLUMN aggregated_feedback_synthesis TEXT;

-- Add a timestamp to track when the synthesis was generated
ALTER TABLE peer_assessment.submissions 
ADD COLUMN aggregated_synthesis_generated_at TIMESTAMP WITH TIME ZONE;

-- Add comment for documentation
COMMENT ON COLUMN peer_assessment.submissions.aggregated_feedback_synthesis IS 'AI-generated synthesis of multiple peer reviews for this submission highlighting combined strengths and weaknesses';
COMMENT ON COLUMN peer_assessment.submissions.aggregated_synthesis_generated_at IS 'Timestamp when the aggregated feedback synthesis was last generated';

-- Create index for better query performance when filtering by synthesis presence
CREATE INDEX idx_submissions_has_aggregated_synthesis ON peer_assessment.submissions(aggregated_feedback_synthesis) WHERE aggregated_feedback_synthesis IS NOT NULL;
