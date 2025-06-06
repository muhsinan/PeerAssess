-- Migration: Fix Rubric-Assignment Relationship
-- From: Many rubrics to one assignment (rubrics.assignment_id)
-- To: Many assignments to one rubric (assignments.rubric_id)

-- Set the search path to our schema
SET search_path TO peer_assessment;

-- Step 1: Create a temporary mapping table to preserve existing relationships
CREATE TEMP TABLE temp_rubric_assignments AS
SELECT 
    r.rubric_id,
    r.assignment_id,
    r.name as rubric_name,
    a.title as assignment_title
FROM rubrics r
JOIN assignments a ON r.assignment_id = a.assignment_id;

-- Step 2: Add rubric_id column to assignments table
ALTER TABLE assignments 
ADD COLUMN rubric_id INTEGER REFERENCES rubrics(rubric_id) ON DELETE SET NULL;

-- Step 3: Create index for the new column
CREATE INDEX idx_assignments_rubric_id ON assignments(rubric_id);

-- Step 4: Migrate existing data from rubrics.assignment_id to assignments.rubric_id
UPDATE assignments 
SET rubric_id = (
    SELECT rubric_id 
    FROM temp_rubric_assignments tra 
    WHERE tra.assignment_id = assignments.assignment_id
    LIMIT 1  -- In case there are multiple rubrics per assignment, take the first one
);

-- Step 5: Remove assignment_id column from rubrics table
-- First, we need to handle any foreign key constraints that might reference this
ALTER TABLE rubrics DROP CONSTRAINT IF EXISTS rubrics_assignment_id_fkey;
ALTER TABLE rubrics DROP COLUMN assignment_id;

-- Step 6: Add unique constraint to ensure one rubric per assignment
ALTER TABLE assignments ADD CONSTRAINT unique_assignment_rubric UNIQUE (rubric_id);

-- Step 7: Create a view to help with queries that need assignment-rubric relationships
CREATE OR REPLACE VIEW assignment_rubric_details AS
SELECT 
    a.assignment_id,
    a.title as assignment_title,
    a.description as assignment_description,
    a.course_id,
    a.due_date,
    a.created_at as assignment_created_at,
    a.updated_at as assignment_updated_at,
    r.rubric_id,
    r.name as rubric_name,
    r.description as rubric_description,
    r.created_at as rubric_created_at,
    r.updated_at as rubric_updated_at,
    c.name as course_name,
    c.instructor_id
FROM assignments a
LEFT JOIN rubrics r ON a.rubric_id = r.rubric_id
JOIN courses c ON a.course_id = c.course_id;

-- Step 8: Show migration summary
DO $$
DECLARE
    total_assignments INTEGER;
    assignments_with_rubrics INTEGER;
    total_rubrics INTEGER;
    orphaned_rubrics INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_assignments FROM assignments;
    SELECT COUNT(*) INTO assignments_with_rubrics FROM assignments WHERE rubric_id IS NOT NULL;
    SELECT COUNT(*) INTO total_rubrics FROM rubrics;
    SELECT COUNT(*) INTO orphaned_rubrics FROM rubrics r 
    WHERE NOT EXISTS (SELECT 1 FROM assignments a WHERE a.rubric_id = r.rubric_id);
    
    RAISE NOTICE 'Migration Summary:';
    RAISE NOTICE '- Total assignments: %', total_assignments;
    RAISE NOTICE '- Assignments with rubrics: %', assignments_with_rubrics;
    RAISE NOTICE '- Total rubrics: %', total_rubrics;
    RAISE NOTICE '- Orphaned rubrics (can be reused): %', orphaned_rubrics;
END $$; 