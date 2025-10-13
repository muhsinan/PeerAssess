-- Migration to add AI feedback synthesis column
-- Add column to store AI-generated synthesis of peer feedback

ALTER TABLE peer_assessment.peer_reviews 
ADD COLUMN ai_feedback_synthesis TEXT;

-- Add comment for documentation
COMMENT ON COLUMN peer_assessment.peer_reviews.ai_feedback_synthesis IS 'AI-generated synthesis of detailed feedback and overall feedback highlighting main strengths and weaknesses';

-- Create index for better query performance when filtering by synthesis presence
CREATE INDEX idx_peer_reviews_has_synthesis ON peer_assessment.peer_reviews(ai_feedback_synthesis) WHERE ai_feedback_synthesis IS NOT NULL;
