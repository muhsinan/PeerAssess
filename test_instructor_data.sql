-- Test data for instructor@test.com with Python course
-- This script creates a complete setup for testing

SET search_path TO peer_assessment;

-- Insert test instructor (only if not exists)
INSERT INTO users (name, email, password_hash, role) 
SELECT 'Test Instructor', 'instructor@test.com', '$2b$12$3.smmyNTyspfGo62nVtkI.AW9olzGG6avx8x.8xfAwNkHr8I0ZXtC', 'instructor'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'instructor@test.com');

-- Get the instructor ID for subsequent inserts
-- We'll use a DO block to handle the dynamic ID
DO $$
DECLARE
    instructor_user_id INTEGER;
    new_course_id INTEGER;
    new_rubric_id INTEGER;
    new_assignment_id INTEGER;
BEGIN
    -- Get the instructor ID
    SELECT user_id INTO instructor_user_id FROM users WHERE email = 'instructor@test.com';
    
    -- Insert Python course
    INSERT INTO courses (name, description, instructor_id) 
    VALUES ('Introduction to Python Programming', 'A comprehensive course covering Python fundamentals, data structures, and object-oriented programming concepts.', instructor_user_id)
    RETURNING course_id INTO new_course_id;
    
    -- Insert rubric for Python assignments
    INSERT INTO rubrics (name, description) 
    VALUES ('Python Programming Rubric', 'Assessment criteria for Python programming assignments including code quality, functionality, and documentation.')
    RETURNING rubric_id INTO new_rubric_id;
    
    -- Insert rubric criteria
    INSERT INTO rubric_criteria (rubric_id, name, description, max_points, weight) VALUES
    (new_rubric_id, 'Code Functionality', 'Does the code execute correctly and produce the expected output? Are all requirements met?', 30, 1.0),
    (new_rubric_id, 'Code Quality & Style', 'Is the code well-structured, readable, and following Python best practices (PEP 8)?', 25, 1.0),
    (new_rubric_id, 'Algorithm & Logic', 'Are the algorithms efficient and logical? Is the problem-solving approach sound?', 25, 1.0),
    (new_rubric_id, 'Documentation & Comments', 'Are functions documented? Are comments clear and helpful? Is there a proper README?', 20, 1.0);
    
    -- Insert performance levels for each criterion
    -- For Code Functionality (first criterion)
    INSERT INTO rubric_performance_levels (criterion_id, description, points, order_position) VALUES
    ((SELECT criterion_id FROM rubric_criteria WHERE rubric_id = new_rubric_id AND name = 'Code Functionality'), 'Excellent: Code runs perfectly, handles edge cases, all requirements exceeded', 30, 1),
    ((SELECT criterion_id FROM rubric_criteria WHERE rubric_id = new_rubric_id AND name = 'Code Functionality'), 'Good: Code runs well with minor issues, most requirements met', 24, 2),
    ((SELECT criterion_id FROM rubric_criteria WHERE rubric_id = new_rubric_id AND name = 'Code Functionality'), 'Satisfactory: Code runs with some issues, basic requirements met', 18, 3),
    ((SELECT criterion_id FROM rubric_criteria WHERE rubric_id = new_rubric_id AND name = 'Code Functionality'), 'Needs Improvement: Code has significant issues, some requirements missing', 12, 4),
    ((SELECT criterion_id FROM rubric_criteria WHERE rubric_id = new_rubric_id AND name = 'Code Functionality'), 'Unsatisfactory: Code doesn''t run or major requirements missing', 6, 5);
    
    -- For Code Quality & Style
    INSERT INTO rubric_performance_levels (criterion_id, description, points, order_position) VALUES
    ((SELECT criterion_id FROM rubric_criteria WHERE rubric_id = new_rubric_id AND name = 'Code Quality & Style'), 'Excellent: Perfect code style, very readable, follows all best practices', 25, 1),
    ((SELECT criterion_id FROM rubric_criteria WHERE rubric_id = new_rubric_id AND name = 'Code Quality & Style'), 'Good: Good code style with minor issues, mostly readable', 20, 2),
    ((SELECT criterion_id FROM rubric_criteria WHERE rubric_id = new_rubric_id AND name = 'Code Quality & Style'), 'Satisfactory: Acceptable code style, somewhat readable', 15, 3),
    ((SELECT criterion_id FROM rubric_criteria WHERE rubric_id = new_rubric_id AND name = 'Code Quality & Style'), 'Needs Improvement: Poor code style, hard to read', 10, 4),
    ((SELECT criterion_id FROM rubric_criteria WHERE rubric_id = new_rubric_id AND name = 'Code Quality & Style'), 'Unsatisfactory: Very poor code style, unreadable', 5, 5);
    
    -- For Algorithm & Logic
    INSERT INTO rubric_performance_levels (criterion_id, description, points, order_position) VALUES
    ((SELECT criterion_id FROM rubric_criteria WHERE rubric_id = new_rubric_id AND name = 'Algorithm & Logic'), 'Excellent: Highly efficient algorithms, excellent problem-solving approach', 25, 1),
    ((SELECT criterion_id FROM rubric_criteria WHERE rubric_id = new_rubric_id AND name = 'Algorithm & Logic'), 'Good: Good algorithms with minor inefficiencies, solid approach', 20, 2),
    ((SELECT criterion_id FROM rubric_criteria WHERE rubric_id = new_rubric_id AND name = 'Algorithm & Logic'), 'Satisfactory: Acceptable algorithms, basic problem-solving', 15, 3),
    ((SELECT criterion_id FROM rubric_criteria WHERE rubric_id = new_rubric_id AND name = 'Algorithm & Logic'), 'Needs Improvement: Inefficient algorithms, poor logic', 10, 4),
    ((SELECT criterion_id FROM rubric_criteria WHERE rubric_id = new_rubric_id AND name = 'Algorithm & Logic'), 'Unsatisfactory: Very poor algorithms, flawed logic', 5, 5);
    
    -- For Documentation & Comments
    INSERT INTO rubric_performance_levels (criterion_id, description, points, order_position) VALUES
    ((SELECT criterion_id FROM rubric_criteria WHERE rubric_id = new_rubric_id AND name = 'Documentation & Comments'), 'Excellent: Comprehensive documentation, clear comments, excellent README', 20, 1),
    ((SELECT criterion_id FROM rubric_criteria WHERE rubric_id = new_rubric_id AND name = 'Documentation & Comments'), 'Good: Good documentation with minor gaps, clear comments', 16, 2),
    ((SELECT criterion_id FROM rubric_criteria WHERE rubric_id = new_rubric_id AND name = 'Documentation & Comments'), 'Satisfactory: Basic documentation, some helpful comments', 12, 3),
    ((SELECT criterion_id FROM rubric_criteria WHERE rubric_id = new_rubric_id AND name = 'Documentation & Comments'), 'Needs Improvement: Minimal documentation, few comments', 8, 4),
    ((SELECT criterion_id FROM rubric_criteria WHERE rubric_id = new_rubric_id AND name = 'Documentation & Comments'), 'Unsatisfactory: No documentation, no meaningful comments', 4, 5);
    
    -- Insert assignment with peer-to-peer chat
    INSERT INTO assignments (title, description, course_id, due_date, feedback_chat_type, ai_prompts_enabled, ai_instructor_enabled) 
    VALUES (
        'Python Data Structures Assignment',
        'Create a Python program that implements and demonstrates the use of lists, dictionaries, and sets. Your program should:

1. Create a student management system using dictionaries
2. Implement functions to add, remove, and search for students
3. Use lists to store student grades and calculate averages
4. Use sets to track unique courses taken by students
5. Include proper error handling and input validation
6. Write unit tests for your functions
7. Document your code with docstrings and comments

Submission Requirements:
- Submit a .py file with your complete program
- Include a README.md file explaining how to run your program
- Include test cases that demonstrate all functionality
- Code should follow PEP 8 style guidelines

Grading will be based on functionality, code quality, algorithm efficiency, and documentation.',
        new_course_id,
        CURRENT_TIMESTAMP + INTERVAL '14 days',
        'peer',  -- Set to peer-to-peer chat instead of AI
        true,    -- Keep AI prompts enabled for flexibility
        true     -- Keep AI instructor enabled for flexibility
    )
    RETURNING assignment_id INTO new_assignment_id;
    
    -- Link the rubric to the assignment
    INSERT INTO assignment_rubrics (assignment_id, rubric_id) VALUES (new_assignment_id, new_rubric_id);
    
    -- Output summary
    RAISE NOTICE 'Test data created successfully:';
    RAISE NOTICE '- Instructor ID: %', instructor_user_id;
    RAISE NOTICE '- Course ID: % (Python Programming)', new_course_id;
    RAISE NOTICE '- Rubric ID: % (Python Programming Rubric)', new_rubric_id;
    RAISE NOTICE '- Assignment ID: % (Data Structures Assignment)', new_assignment_id;
    RAISE NOTICE '- Assignment chat type: peer-to-peer';
    RAISE NOTICE '- Due date: %', (CURRENT_TIMESTAMP + INTERVAL '14 days');
    
END $$;

-- Verify the data was created correctly
SELECT 
    'VERIFICATION:' as info,
    u.name as instructor_name,
    u.email as instructor_email,
    c.name as course_name,
    r.name as rubric_name,
    a.title as assignment_title,
    a.feedback_chat_type as chat_type,
    a.due_date
FROM users u
JOIN courses c ON u.user_id = c.instructor_id
JOIN assignments a ON c.course_id = a.course_id
JOIN assignment_rubrics ar ON a.assignment_id = ar.assignment_id
JOIN rubrics r ON ar.rubric_id = r.rubric_id
WHERE u.email = 'instructor@test.com';
