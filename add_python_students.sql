-- Add two students to the Python Programming course
-- This script creates students and enrolls them in the course

SET search_path TO peer_assessment;

-- Insert two students
INSERT INTO users (name, email, password_hash, role) VALUES
('Alice Johnson', 'alice.student@test.com', '$2b$12$AvlbkVeUTZ2yhTJ7rQdf5OCRcSKQz5MJrSBiVzELe/W0G1U70BGNG', 'student'),
('Bob Smith', 'bob.student@test.com', '$2b$12$hwQC9l203bmE/6H2BjHnZu82MwXQthRN4ZjbxEXKK0IHOhxb6crTi', 'student');

-- Enroll students in the Python Programming course
DO $$
DECLARE
    python_course_id INTEGER;
    alice_user_id INTEGER;
    bob_user_id INTEGER;
BEGIN
    -- Get the Python course ID
    SELECT course_id INTO python_course_id 
    FROM courses 
    WHERE name = 'Introduction to Python Programming';
    
    -- Get student IDs
    SELECT user_id INTO alice_user_id FROM users WHERE email = 'alice.student@test.com';
    SELECT user_id INTO bob_user_id FROM users WHERE email = 'bob.student@test.com';
    
    -- Enroll students in the course
    INSERT INTO course_enrollments (course_id, student_id) VALUES
    (python_course_id, alice_user_id),
    (python_course_id, bob_user_id);
    
    -- Output summary
    RAISE NOTICE 'Students created and enrolled successfully:';
    RAISE NOTICE '- Alice Johnson (ID: %, Email: alice.student@test.com, Password: student123)', alice_user_id;
    RAISE NOTICE '- Bob Smith (ID: %, Email: bob.student@test.com, Password: student456)', bob_user_id;
    RAISE NOTICE '- Both enrolled in course ID: % (Introduction to Python Programming)', python_course_id;
    
END $$;

-- Verify the enrollments
SELECT 
    'ENROLLMENT VERIFICATION:' as info,
    u.name as student_name,
    u.email as student_email,
    c.name as course_name,
    ce.enrollment_date
FROM users u
JOIN course_enrollments ce ON u.user_id = ce.student_id
JOIN courses c ON ce.course_id = c.course_id
WHERE c.name = 'Introduction to Python Programming'
ORDER BY u.name;

-- Show course summary
SELECT 
    'COURSE SUMMARY:' as info,
    c.name as course_name,
    i.name as instructor_name,
    COUNT(ce.student_id) as enrolled_students,
    COUNT(a.assignment_id) as total_assignments
FROM courses c
JOIN users i ON c.instructor_id = i.user_id
LEFT JOIN course_enrollments ce ON c.course_id = ce.course_id
LEFT JOIN assignments a ON c.course_id = a.course_id
WHERE c.name = 'Introduction to Python Programming'
GROUP BY c.course_id, c.name, i.name;
