-- Migration to add AI prompt configuration to assignments table
-- Add columns for storing custom AI prompts

ALTER TABLE peer_assessment.assignments 
ADD COLUMN ai_overall_prompt TEXT,
ADD COLUMN ai_criteria_prompt TEXT,
ADD COLUMN ai_prompts_enabled BOOLEAN DEFAULT true;

-- Update existing assignments to have default prompts enabled
UPDATE peer_assessment.assignments 
SET ai_prompts_enabled = true 
WHERE ai_prompts_enabled IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN peer_assessment.assignments.ai_overall_prompt IS 'Custom AI prompt for overall feedback analysis';
COMMENT ON COLUMN peer_assessment.assignments.ai_criteria_prompt IS 'Custom AI prompt for criteria-specific feedback analysis';
COMMENT ON COLUMN peer_assessment.assignments.ai_prompts_enabled IS 'Whether AI analysis is enabled for this assignment'; 