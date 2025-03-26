# Peer Assessment Tool Database

This document provides an overview of the database schema for the Peer Assessment Tool.

## Database Schema

The database is organized in a dedicated schema called `peer_assessment` to isolate the application's tables.

### Tables

1. **users**
   - `user_id`: Primary key, auto-incrementing
   - `name`: User's full name
   - `email`: Unique email address
   - `password_hash`: Hashed password for authentication
   - `role`: Either 'student' or 'instructor'
   - `created_at`: Timestamp when the record was created
   - `updated_at`: Timestamp when the record was last updated

2. **courses**
   - `course_id`: Primary key, auto-incrementing
   - `name`: Course name
   - `description`: Course description
   - `instructor_id`: Foreign key referencing users table
   - `created_at`: Timestamp
   - `updated_at`: Timestamp

3. **course_enrollments**
   - `enrollment_id`: Primary key, auto-incrementing
   - `course_id`: Foreign key referencing courses table
   - `student_id`: Foreign key referencing users table
   - `enrollment_date`: Timestamp
   - UNIQUE constraint on (course_id, student_id) to prevent duplicate enrollments

4. **assignments**
   - `assignment_id`: Primary key, auto-incrementing
   - `title`: Assignment title
   - `description`: Assignment description
   - `course_id`: Foreign key referencing courses table
   - `due_date`: Deadline for submissions
   - `created_at`: Timestamp
   - `updated_at`: Timestamp

5. **rubrics**
   - `rubric_id`: Primary key, auto-incrementing
   - `assignment_id`: Foreign key referencing assignments table
   - `name`: Rubric name
   - `description`: Rubric description
   - `created_at`: Timestamp
   - `updated_at`: Timestamp

6. **rubric_criteria**
   - `criterion_id`: Primary key, auto-incrementing
   - `rubric_id`: Foreign key referencing rubrics table
   - `name`: Criterion name
   - `description`: Detailed criterion description
   - `max_points`: Maximum points possible for this criterion
   - `weight`: Weight factor for this criterion (default 1.0)
   - `created_at`: Timestamp
   - `updated_at`: Timestamp

7. **submissions**
   - `submission_id`: Primary key, auto-incrementing
   - `assignment_id`: Foreign key referencing assignments table
   - `student_id`: Foreign key referencing users table
   - `title`: Submission title
   - `content`: HTML content of the submission
   - `submission_date`: Timestamp
   - `status`: Either 'draft', 'submitted', or 'reviewed'
   - UNIQUE constraint on (assignment_id, student_id) to prevent duplicate submissions

8. **submission_attachments**
   - `attachment_id`: Primary key, auto-incrementing
   - `submission_id`: Foreign key referencing submissions table
   - `file_name`: Original file name
   - `file_path`: Path where the file is stored
   - `file_size`: Size in bytes
   - `file_type`: MIME type
   - `upload_date`: Timestamp

9. **peer_reviews**
   - `review_id`: Primary key, auto-incrementing
   - `submission_id`: Foreign key referencing submissions table
   - `reviewer_id`: Foreign key referencing users table
   - `overall_feedback`: Text feedback
   - `total_score`: Sum of all criteria scores
   - `status`: Either 'assigned', 'in_progress', or 'completed'
   - `assigned_date`: When the review was assigned
   - `completed_date`: When the review was completed
   - UNIQUE constraint on (submission_id, reviewer_id) to prevent duplicate reviews

10. **peer_review_scores**
    - `score_id`: Primary key, auto-incrementing
    - `review_id`: Foreign key referencing peer_reviews table
    - `criterion_id`: Foreign key referencing rubric_criteria table
    - `score`: Numerical score
    - `feedback`: Specific feedback for this criterion
    - UNIQUE constraint on (review_id, criterion_id) to prevent duplicate scores

## Indexes

The following indexes have been created to improve query performance:

- `idx_submissions_assignment_id` on submissions(assignment_id)
- `idx_submissions_student_id` on submissions(student_id)
- `idx_peer_reviews_submission_id` on peer_reviews(submission_id)
- `idx_peer_reviews_reviewer_id` on peer_reviews(reviewer_id)
- `idx_peer_review_scores_review_id` on peer_review_scores(review_id)
- `idx_course_enrollments_course_id` on course_enrollments(course_id)
- `idx_course_enrollments_student_id` on course_enrollments(student_id)

## Entity Relationships

- Each user can be enrolled in multiple courses
- Each course can have multiple assignments
- Each assignment has one rubric
- Each rubric has multiple criteria
- Each student can submit one submission per assignment
- Each submission can have multiple attachments
- Each submission can receive multiple peer reviews from different reviewers
- Each peer review includes scores for all criteria in the assignment's rubric

## Sample Data

The database has been pre-populated with sample data, including:
- 4 users (1 instructor, 3 students)
- 4 courses
- Sample course enrollments
- 4 assignments
- 2 rubrics with 4 criteria each
- 2 submissions
- 4 peer reviews (3 assigned, 1 completed)
- Scores for the completed peer review

## Connecting to the Database

You can connect to the database using the following command:

```
psql -h 95.8.132.203 -U muhsinan -d peerassessdb
```

After connecting, set the search path to use the peer_assessment schema:

```sql
SET search_path TO peer_assessment;
```

## Database Schema File

The complete database schema file is available at [database_schema.sql](./database_schema.sql) in this repository. 