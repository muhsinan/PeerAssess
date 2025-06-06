-- Peer Assessment Tool Database Schema

-- Create a dedicated schema
CREATE SCHEMA IF NOT EXISTS peer_assessment;

-- Set the search path to our schema
SET search_path TO peer_assessment;

-- Users table (for students and instructors)
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('student', 'instructor')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Courses table
CREATE TABLE courses (
    course_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    instructor_id INTEGER REFERENCES users(user_id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Course enrollment (which students are in which courses)
CREATE TABLE course_enrollments (
    enrollment_id SERIAL PRIMARY KEY,
    course_id INTEGER REFERENCES courses(course_id) ON DELETE CASCADE,
    student_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    enrollment_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(course_id, student_id)
);

-- Assignments table
CREATE TABLE assignments (
    assignment_id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    course_id INTEGER REFERENCES courses(course_id) ON DELETE CASCADE,
    due_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Rubric table (for storing assessment criteria)
CREATE TABLE rubrics (
    rubric_id SERIAL PRIMARY KEY,
    assignment_id INTEGER REFERENCES assignments(assignment_id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Rubric criteria table (stores individual criteria for each rubric)
CREATE TABLE rubric_criteria (
    criterion_id SERIAL PRIMARY KEY,
    rubric_id INTEGER REFERENCES rubrics(rubric_id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    max_points INTEGER NOT NULL CHECK (max_points > 0),
    weight DECIMAL(5,2) DEFAULT 1.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Submissions table (student assignment submissions)
CREATE TABLE submissions (
    submission_id SERIAL PRIMARY KEY,
    assignment_id INTEGER REFERENCES assignments(assignment_id) ON DELETE CASCADE,
    student_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    submission_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'submitted' CHECK (status IN ('draft', 'submitted', 'reviewed')),
    UNIQUE(assignment_id, student_id)
);

-- Submission attachments
CREATE TABLE submission_attachments (
    attachment_id SERIAL PRIMARY KEY,
    submission_id INTEGER REFERENCES submissions(submission_id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(255) NOT NULL,
    file_size INTEGER NOT NULL,
    file_type VARCHAR(100),
    upload_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Peer reviews table (stores reviews)
CREATE TABLE peer_reviews (
    review_id SERIAL PRIMARY KEY,
    submission_id INTEGER REFERENCES submissions(submission_id) ON DELETE CASCADE,
    reviewer_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    overall_feedback TEXT,
    total_score INTEGER,
    status VARCHAR(20) DEFAULT 'assigned' CHECK (status IN ('assigned', 'in_progress', 'completed')),
    assigned_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_date TIMESTAMP WITH TIME ZONE,
    UNIQUE(submission_id, reviewer_id)
);

-- Peer review criteria scores (individual scores for each criterion)
CREATE TABLE peer_review_scores (
    score_id SERIAL PRIMARY KEY,
    review_id INTEGER REFERENCES peer_reviews(review_id) ON DELETE CASCADE,
    criterion_id INTEGER REFERENCES rubric_criteria(criterion_id) ON DELETE CASCADE,
    score INTEGER NOT NULL,
    feedback TEXT,
    UNIQUE(review_id, criterion_id)
);

-- Indexes for performance
CREATE INDEX idx_submissions_assignment_id ON submissions(assignment_id);
CREATE INDEX idx_submissions_student_id ON submissions(student_id);
CREATE INDEX idx_peer_reviews_submission_id ON peer_reviews(submission_id);
CREATE INDEX idx_peer_reviews_reviewer_id ON peer_reviews(reviewer_id);
CREATE INDEX idx_peer_review_scores_review_id ON peer_review_scores(review_id);
CREATE INDEX idx_course_enrollments_course_id ON course_enrollments(course_id);
CREATE INDEX idx_course_enrollments_student_id ON course_enrollments(student_id);

-- Course invitations table (for inviting students who aren't registered yet)
CREATE TABLE course_invitations (
    invitation_id SERIAL PRIMARY KEY,
    course_id INTEGER REFERENCES courses(course_id) ON DELETE CASCADE,
    student_email VARCHAR(100) NOT NULL,
    invitation_token VARCHAR(255) NOT NULL UNIQUE,
    invited_by INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_TIMESTAMP + INTERVAL '7 days'),
    accepted_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(course_id, student_email)
);

-- Index for performance
CREATE INDEX idx_course_invitations_course_id ON course_invitations(course_id);
CREATE INDEX idx_course_invitations_email ON course_invitations(student_email);
CREATE INDEX idx_course_invitations_token ON course_invitations(invitation_token);

-- Sample data for testing

-- Insert sample users (1 instructor and 3 students)
INSERT INTO users (name, email, password_hash, role) VALUES
('Professor Johnson', 'professor@example.com', '$2a$12$abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXY', 'instructor'),
('Muhammed Sinan', 'muhsinan@example.com', '$2a$12$abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXY', 'student'),
('Batuhan Sariaslan', 'batuhan@example.com', '$2a$12$abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXY', 'student'),
('Jane Smith', 'jane@example.com', '$2a$12$abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXY', 'student');

-- Insert sample courses
INSERT INTO courses (name, description, instructor_id) VALUES
('Computer Education and Instructional Technology', 'An overview of computer education principles and practices', 1),
('Advanced Software Engineering', 'Modern software engineering methodologies and practices', 1),
('Data Structures and Algorithms', 'Study of fundamental data structures and algorithms', 1),
('Artificial Intelligence Fundamentals', 'Introduction to AI concepts and applications', 1);

-- Enroll students in courses
INSERT INTO course_enrollments (course_id, student_id) VALUES
(1, 2), -- Muhammed in Computer Education
(1, 3), -- Batuhan in Computer Education
(1, 4), -- Jane in Computer Education
(2, 2), -- Muhammed in Software Engineering
(2, 3), -- Batuhan in Software Engineering
(3, 2), -- Muhammed in Data Structures
(4, 3); -- Batuhan in AI Fundamentals

-- Create sample assignments
INSERT INTO assignments (title, description, course_id, due_date) VALUES
('Essay on Climate Change', 'Write a comprehensive essay on climate change and its global impact', 1, CURRENT_TIMESTAMP + INTERVAL '20 days'),
('Research Paper: Artificial Intelligence Ethics', 'Research and analyze ethical considerations in AI development', 2, CURRENT_TIMESTAMP + INTERVAL '30 days'),
('Literature Review: Modernism', 'Review key works of modernist literature and their impact', 1, CURRENT_TIMESTAMP + INTERVAL '15 days'),
('Project Proposal: Renewable Energy', 'Develop a detailed project proposal for renewable energy implementation', 3, CURRENT_TIMESTAMP + INTERVAL '25 days');

-- Create rubrics for assignments
INSERT INTO rubrics (assignment_id, name, description) VALUES
(1, 'Essay Assessment Rubric', 'Criteria for evaluating climate change essays'),
(2, 'Research Paper Rubric', 'Standards for AI ethics research papers');

-- Create rubric criteria for the essay rubric
INSERT INTO rubric_criteria (rubric_id, name, description, max_points) VALUES
(1, 'Content & Understanding', 'Demonstrates comprehensive understanding of the topic with relevant, accurate information.', 30),
(1, 'Organization & Structure', 'Presents ideas in a logical, coherent manner with clear introduction, body, and conclusion.', 25),
(1, 'Critical Analysis', 'Analyzes information critically, presents various perspectives, and draws reasoned conclusions.', 25),
(1, 'Language & Style', 'Uses appropriate academic language, correct grammar, spelling, and citation format.', 20);

-- Create rubric criteria for the research paper rubric
INSERT INTO rubric_criteria (rubric_id, name, description, max_points) VALUES
(2, 'Research Quality', 'Depth and breadth of research with appropriate sources.', 30),
(2, 'Ethical Analysis', 'Thorough analysis of ethical implications and considerations.', 30),
(2, 'Methodology', 'Clear and appropriate research methodology.', 20),
(2, 'Presentation & Format', 'Professional presentation following academic standards.', 20);

-- Create sample submissions
INSERT INTO submissions (assignment_id, student_id, title, content, status) VALUES
(1, 4, 'Climate Change: A Global Challenge', '<h2>Climate Change: A Global Challenge</h2><p>Climate change represents one of the most significant challenges facing humanity in the 21st century. This essay explores the causes, effects, and potential solutions to this global crisis.</p><h3>Causes of Climate Change</h3><p>Human activities have been the primary driver of climate change, primarily due to burning fossil fuels like coal, oil, and natural gas, which results in the greenhouse effect. Deforestation and industrial processes also contribute significantly.</p><h3>Effects of Climate Change</h3><p>The effects of climate change are far-reaching and include rising global temperatures, melting ice caps and glaciers, rising sea levels, more frequent and severe weather events, and disruptions to ecosystems worldwide.</p><h3>Potential Solutions</h3><p>Addressing climate change requires a multi-faceted approach, including transitioning to renewable energy sources, improving energy efficiency, implementing carbon pricing, promoting sustainable land use, and fostering international cooperation.</p><h3>Conclusion</h3><p>Climate change presents an unprecedented challenge that requires immediate and coordinated action at all levels of society. By implementing comprehensive solutions and fostering global collaboration, we can mitigate its worst effects and build a more sustainable future.</p>', 'submitted'),
(2, 2, 'Ethical Considerations in AI Development', '<h2>Ethical Considerations in AI Development</h2><p>This paper examines the ethical implications of artificial intelligence as the technology continues to advance and become more integrated into society.</p>', 'submitted');

-- Assign peer reviews
INSERT INTO peer_reviews (submission_id, reviewer_id, status, assigned_date) VALUES
(1, 2, 'assigned', CURRENT_TIMESTAMP), -- Muhammed reviews Jane's climate essay
(1, 3, 'assigned', CURRENT_TIMESTAMP), -- Batuhan reviews Jane's climate essay
(2, 3, 'assigned', CURRENT_TIMESTAMP); -- Batuhan reviews Muhammed's AI ethics paper

-- Create one completed review as an example
INSERT INTO peer_reviews (submission_id, reviewer_id, overall_feedback, total_score, status, assigned_date, completed_date) VALUES
(2, 4, 'This is a well-researched paper that addresses important ethical considerations in AI development. The arguments are well-structured and supported by evidence. Consider expanding on the potential future implications in the next draft.', 85, 'completed', CURRENT_TIMESTAMP - INTERVAL '2 days', CURRENT_TIMESTAMP - INTERVAL '1 day');

-- Add scores for the completed review
INSERT INTO peer_review_scores (review_id, criterion_id, score, feedback) VALUES
(4, 5, 25, 'Excellent research with diverse and credible sources.'),
(4, 6, 25, 'Good analysis of ethical implications, though could go deeper in some areas.'),
(4, 7, 18, 'Methodology is sound but could be more explicitly described.'),
(4, 8, 17, 'Well-presented overall with minor formatting issues.'); 