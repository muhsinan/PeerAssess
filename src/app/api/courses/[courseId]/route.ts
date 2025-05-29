import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId } = await params;
    
    if (!courseId || isNaN(Number(courseId))) {
      return NextResponse.json(
        { error: 'Invalid course ID' },
        { status: 400 }
      );
    }

    // Get user role from request to determine what data to return
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const userRole = searchParams.get('role');

    // Basic course info
    const courseQuery = `
      SELECT 
        c.course_id as id,
        c.name,
        c.description,
        c.instructor_id as "instructorId",
        u.name as "instructorName",
        u.email as "instructorEmail",
        c.created_at as "createdAt",
        c.updated_at as "updatedAt"
      FROM 
        peer_assessment.courses c
      JOIN 
        peer_assessment.users u ON c.instructor_id = u.user_id
      WHERE 
        c.course_id = $1
    `;
    
    const courseResult = await pool.query(courseQuery, [courseId]);
    
    if (courseResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }
    
    const course = courseResult.rows[0];
    
    // Get assignments for the course
    const assignmentsQuery = `
      SELECT 
        a.assignment_id as id,
        a.title,
        a.description,
        a.due_date as "dueDate",
        a.created_at as "createdAt",
        a.updated_at as "updatedAt",
        CASE 
          WHEN a.due_date < NOW() THEN 'past'
          WHEN a.due_date < NOW() + INTERVAL '3 days' THEN 'soon'
          ELSE 'upcoming'
        END as status,
        (
          SELECT COUNT(*) 
          FROM peer_assessment.submissions s 
          WHERE s.assignment_id = a.assignment_id
        ) as "submissionCount"
      FROM 
        peer_assessment.assignments a
      WHERE 
        a.course_id = $1
      ORDER BY 
        a.due_date ASC
    `;
    
    const assignmentsResult = await pool.query(assignmentsQuery, [courseId]);
    const assignments = assignmentsResult.rows;

    // If the user is a student, check which assignments they've submitted
    let studentSubmissions = [];
    if (userRole === 'student' && userId) {
      const submissionsQuery = `
        SELECT 
          assignment_id,
          status
        FROM 
          peer_assessment.submissions
        WHERE 
          student_id = $1 AND
          assignment_id IN (
            SELECT assignment_id 
            FROM peer_assessment.assignments 
            WHERE course_id = $2
          )
      `;
      
      const submissionsResult = await pool.query(submissionsQuery, [userId, courseId]);
      studentSubmissions = submissionsResult.rows;
    }

    // Get enrolled students count
    const enrollmentCountQuery = `
      SELECT COUNT(*) as count
      FROM peer_assessment.course_enrollments
      WHERE course_id = $1
    `;
    
    const enrollmentResult = await pool.query(enrollmentCountQuery, [courseId]);
    const enrollmentCount = parseInt(enrollmentResult.rows[0].count);

    // Get enrollment date for current student (if user is a student)
    let enrollmentDate = null;
    if (userRole === 'student' && userId) {
      const enrollmentDateQuery = `
        SELECT enrollment_date as "enrollmentDate"
        FROM peer_assessment.course_enrollments
        WHERE course_id = $1 AND student_id = $2
      `;
      
      const enrollmentDateResult = await pool.query(enrollmentDateQuery, [courseId, userId]);
      if (enrollmentDateResult.rows.length > 0) {
        enrollmentDate = enrollmentDateResult.rows[0].enrollmentDate;
      }
    }

    // Create response object
    const response = {
      ...course,
      enrolledStudentCount: enrollmentCount,
      enrollmentDate: enrollmentDate,
      assignments: assignments.map(assignment => {
        // If user is a student, add submission status
        if (userRole === 'student' && userId) {
          const submission = studentSubmissions.find(s => s.assignment_id === assignment.id);
          return {
            ...assignment,
            hasSubmitted: !!submission,
            submissionStatus: submission ? submission.status : null
          };
        }
        return assignment;
      })
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching course details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch course details', details: String(error) },
      { status: 500 }
    );
  }
}

// Add PUT method to update course
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId } = await params;
    
    if (!courseId || isNaN(parseInt(courseId))) {
      return NextResponse.json(
        { error: 'Valid course ID is required' },
        { status: 400 }
      );
    }

    // Parse request body
    const { name, description } = await request.json();

    // Validate input
    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Course name is required' },
        { status: 400 }
      );
    }

    // Check if course exists and get instructor ID
    const courseCheck = await pool.query(
      'SELECT instructor_id FROM peer_assessment.courses WHERE course_id = $1',
      [courseId]
    );

    if (courseCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    // Update course in database
    const result = await pool.query(
      `UPDATE peer_assessment.courses
       SET name = $1, description = $2, updated_at = CURRENT_TIMESTAMP
       WHERE course_id = $3
       RETURNING course_id, name, description, instructor_id, created_at, updated_at`,
      [name.trim(), description?.trim() || null, courseId]
    );

    const updatedCourse = result.rows[0];

    // Get instructor name
    const instructorResult = await pool.query(
      'SELECT name FROM peer_assessment.users WHERE user_id = $1',
      [updatedCourse.instructor_id]
    );

    const instructorName = instructorResult.rows[0]?.name || 'Unknown';

    // Get student count
    const studentsResult = await pool.query(
      'SELECT COUNT(*) as count FROM peer_assessment.course_enrollments WHERE course_id = $1',
      [courseId]
    );

    const studentsCount = parseInt(studentsResult.rows[0]?.count || '0');

    // Get assignment count
    const assignmentsResult = await pool.query(
      'SELECT COUNT(*) as count FROM peer_assessment.assignments WHERE course_id = $1',
      [courseId]
    );

    const assignmentsCount = parseInt(assignmentsResult.rows[0]?.count || '0');

    // Return updated course
    return NextResponse.json({
      message: 'Course updated successfully',
      course: {
        id: updatedCourse.course_id,
        name: updatedCourse.name,
        description: updatedCourse.description,
        instructorId: updatedCourse.instructor_id,
        instructorName,
        createdAt: updatedCourse.created_at,
        updatedAt: updatedCourse.updated_at,
        studentsCount,
        assignmentsCount
      }
    });
  } catch (error) {
    console.error('Error updating course:', error);
    return NextResponse.json(
      { error: 'Failed to update course. Please try again.' },
      { status: 500 }
    );
  }
} 