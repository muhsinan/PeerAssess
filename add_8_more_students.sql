-- Add 8 more students to the Python Programming course
-- This script creates 8 additional students and enrolls them in the course

SET search_path TO peer_assessment;

-- Insert 8 more students
INSERT INTO users (name, email, password_hash, role) VALUES
('Charlie Davis', 'charlie.student@test.com', '$2b$12$ZbB3dNvXL/6fkHzSdG5IR.Nkfe5GC2SwEywOFf36rnf8faXhXSUBW', 'student'),
('Diana Wilson', 'diana.student@test.com', '$2b$12$ecwVIGRQ84KCBwx.hkT2EOmQtzKOgF/WHcsnq88P/AAD9MrCVEM32', 'student'),
('Ethan Brown', 'ethan.student@test.com', '$2b$12$MY3jhAoGUHlGNbcoC8/qXeVRf5oFJiObjCNjz6vM.9l8ZRuK/sUei', 'student'),
('Fiona Taylor', 'fiona.student@test.com', '$2b$12$n6D8OIkSRukSc0tjpPW41e3YdS/9WlIJN96Ba8b/hSyhbfMZ01K9W', 'student'),
('George Miller', 'george.student@test.com', '$2b$12$ClGrdHmclxcePq78ecIe2uN0YdF4xecy1/t3DnitMo5Lx58OblsVi', 'student'),
('Hannah Garcia', 'hannah.student@test.com', '$2b$12$oLuO/jTrdbkk6IaCTKb28u7bl2yZa/6hn8DTTJZimLl9jsgXguIhq', 'student'),
('Ivan Rodriguez', 'ivan.student@test.com', '$2b$12$/zskwu7pRLHzL7zrGr5e7OniaFP7v7ZGHaMVdaZ0PvZ7wVYYRL3LC', 'student'),
('Julia Martinez', 'julia.student@test.com', '$2b$12$lhQmy3rtycSFRMwdFqGBNurXi3PpFy9HO/SaPWDYV47fw/lNyqa8y', 'student');

-- Enroll all 8 students in the Python Programming course
DO $$
DECLARE
    python_course_id INTEGER;
    student_ids INTEGER[];
    student_names TEXT[] := ARRAY['Charlie Davis', 'Diana Wilson', 'Ethan Brown', 'Fiona Taylor', 'George Miller', 'Hannah Garcia', 'Ivan Rodriguez', 'Julia Martinez'];
    student_emails TEXT[] := ARRAY['charlie.student@test.com', 'diana.student@test.com', 'ethan.student@test.com', 'fiona.student@test.com', 'george.student@test.com', 'hannah.student@test.com', 'ivan.student@test.com', 'julia.student@test.com'];
    student_passwords TEXT[] := ARRAY['student001', 'student002', 'student003', 'student004', 'student005', 'student006', 'student007', 'student008'];
    i INTEGER;
    current_student_id INTEGER;
BEGIN
    -- Get the Python course ID
    SELECT course_id INTO python_course_id 
    FROM courses 
    WHERE name = 'Introduction to Python Programming';
    
    -- Enroll each student and collect their IDs
    FOR i IN 1..8 LOOP
        -- Get student ID
        SELECT user_id INTO current_student_id 
        FROM users 
        WHERE email = student_emails[i];
        
        -- Enroll student in the course
        INSERT INTO course_enrollments (course_id, student_id) 
        VALUES (python_course_id, current_student_id);
        
        -- Output info for each student
        RAISE NOTICE '- % (ID: %, Email: %, Password: %)', 
            student_names[i], current_student_id, student_emails[i], student_passwords[i];
    END LOOP;
    
    -- Output summary
    RAISE NOTICE '8 additional students created and enrolled successfully in course ID: % (Introduction to Python Programming)', python_course_id;
    
END $$;

-- Verify all enrollments in the Python course
SELECT 
    'ALL PYTHON COURSE ENROLLMENTS:' as info,
    u.name as student_name,
    u.email as student_email,
    ce.enrollment_date
FROM users u
JOIN course_enrollments ce ON u.user_id = ce.student_id
JOIN courses c ON ce.course_id = c.course_id
WHERE c.name = 'Introduction to Python Programming'
ORDER BY u.name;

-- Show updated course summary
SELECT 
    'UPDATED COURSE SUMMARY:' as info,
    c.name as course_name,
    i.name as instructor_name,
    COUNT(DISTINCT ce.student_id) as total_enrolled_students,
    COUNT(DISTINCT a.assignment_id) as total_assignments
FROM courses c
JOIN users i ON c.instructor_id = i.user_id
LEFT JOIN course_enrollments ce ON c.course_id = ce.course_id
LEFT JOIN assignments a ON c.course_id = a.course_id
WHERE c.name = 'Introduction to Python Programming'
GROUP BY c.course_id, c.name, i.name;
