-- Add the new table for submission attachments
CREATE TABLE IF NOT EXISTS peer_assessment.submission_attachments (
    attachment_id SERIAL PRIMARY KEY,
    submission_id INTEGER NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(255) NOT NULL,
    file_size INTEGER NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (submission_id) REFERENCES peer_assessment.submissions(submission_id) ON DELETE CASCADE
); 