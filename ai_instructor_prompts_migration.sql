-- Migration to add AI instructor review prompt configuration to assignments table
-- This is separate from the existing student AI assistance prompts

ALTER TABLE peer_assessment.assignments 
ADD COLUMN ai_instructor_prompt TEXT,
ADD COLUMN ai_instructor_enabled BOOLEAN DEFAULT true;

-- Update existing assignments to have instructor AI enabled by default
UPDATE peer_assessment.assignments 
SET ai_instructor_enabled = true 
WHERE ai_instructor_enabled IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN peer_assessment.assignments.ai_instructor_prompt IS 'Custom AI prompt for instructor-generated peer reviews';
COMMENT ON COLUMN peer_assessment.assignments.ai_instructor_enabled IS 'Whether instructors can generate AI peer reviews for this assignment';
