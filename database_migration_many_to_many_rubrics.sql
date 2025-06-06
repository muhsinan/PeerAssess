-- Migration to implement many-to-many relationship between rubrics and assignments
-- This allows one rubric to be used by multiple assignments

-- Step 1: Create junction table for many-to-many relationship
CREATE TABLE IF NOT EXISTS peer_assessment.assignment_rubrics (
    assignment_id INTEGER REFERENCES peer_assessment.assignments(assignment_id) ON DELETE CASCADE,
    rubric_id INTEGER REFERENCES peer_assessment.rubrics(rubric_id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (assignment_id, rubric_id)
);

-- Step 2: Migrate existing data from assignments.rubric_id to junction table
INSERT INTO peer_assessment.assignment_rubrics (assignment_id, rubric_id)
SELECT assignment_id, rubric_id 
FROM peer_assessment.assignments 
WHERE rubric_id IS NOT NULL;

-- Step 3: Remove the rubric_id column from assignments table
ALTER TABLE peer_assessment.assignments DROP COLUMN IF EXISTS rubric_id;

-- Step 4: Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_assignment_rubrics_assignment_id ON peer_assessment.assignment_rubrics(assignment_id);
CREATE INDEX IF NOT EXISTS idx_assignment_rubrics_rubric_id ON peer_assessment.assignment_rubrics(rubric_id);

-- Step 5: Verify the migration
-- Check that data was migrated correctly
SELECT 
    'Assignment-Rubric associations:' as info,
    COUNT(*) as count 
FROM peer_assessment.assignment_rubrics;

-- Show sample data
SELECT 
    ar.assignment_id,
    a.title as assignment_title,
    ar.rubric_id,
    r.name as rubric_name
FROM peer_assessment.assignment_rubrics ar
JOIN peer_assessment.assignments a ON ar.assignment_id = a.assignment_id
JOIN peer_assessment.rubrics r ON ar.rubric_id = r.rubric_id
LIMIT 10; 