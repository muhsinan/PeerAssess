-- Migration to add enrollment approval system
-- This adds a new table for pending enrollment requests

-- Create pending enrollment requests table
CREATE TABLE IF NOT EXISTS peer_assessment.pending_enrollment_requests (
    request_id SERIAL PRIMARY KEY,
    course_id INTEGER REFERENCES peer_assessment.courses(course_id) ON DELETE CASCADE,
    student_id INTEGER REFERENCES peer_assessment.users(user_id) ON DELETE CASCADE,
    student_name VARCHAR(100) NOT NULL,
    student_email VARCHAR(100) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by INTEGER REFERENCES peer_assessment.users(user_id),
    rejection_reason TEXT,
    UNIQUE(course_id, student_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_pending_enrollment_requests_course_id ON peer_assessment.pending_enrollment_requests(course_id);
CREATE INDEX IF NOT EXISTS idx_pending_enrollment_requests_student_id ON peer_assessment.pending_enrollment_requests(student_id);
CREATE INDEX IF NOT EXISTS idx_pending_enrollment_requests_status ON peer_assessment.pending_enrollment_requests(status);
CREATE INDEX IF NOT EXISTS idx_pending_enrollment_requests_requested_at ON peer_assessment.pending_enrollment_requests(requested_at DESC);

-- Add comments for documentation
COMMENT ON TABLE peer_assessment.pending_enrollment_requests IS 'Stores pending enrollment requests that require instructor approval';
COMMENT ON COLUMN peer_assessment.pending_enrollment_requests.status IS 'Status of the enrollment request: pending, approved, or rejected';
COMMENT ON COLUMN peer_assessment.pending_enrollment_requests.reviewed_by IS 'Instructor who approved or rejected the request';
COMMENT ON COLUMN peer_assessment.pending_enrollment_requests.rejection_reason IS 'Reason provided when rejecting an enrollment request';
