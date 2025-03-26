import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const { name, description, instructorId } = await request.json();

    // Validate input
    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Course name is required' },
        { status: 400 }
      );
    }

    if (!instructorId) {
      return NextResponse.json(
        { error: 'Instructor ID is required' },
        { status: 400 }
      );
    }

    // Check if instructor exists
    const instructorCheck = await pool.query(
      'SELECT user_id FROM peer_assessment.users WHERE user_id = $1 AND role = $2',
      [instructorId, 'instructor']
    );

    if (instructorCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Invalid instructor ID' },
        { status: 400 }
      );
    }

    // Insert course into database
    const result = await pool.query(
      `INSERT INTO peer_assessment.courses
        (name, description, instructor_id) 
       VALUES 
        ($1, $2, $3) 
       RETURNING course_id, name, description, instructor_id, created_at`,
      [name.trim(), description?.trim() || null, instructorId]
    );

    const newCourse = result.rows[0];

    // Return newly created course
    return NextResponse.json({
      message: 'Course created successfully',
      course: {
        id: newCourse.course_id,
        name: newCourse.name,
        description: newCourse.description,
        instructorId: newCourse.instructor_id,
        createdAt: newCourse.created_at
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Course creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create course. Please try again.' },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch all courses or courses by instructor
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const instructorId = url.searchParams.get('instructorId');

    let queryText = `
      SELECT 
        c.course_id as id,
        c.name,
        c.description,
        c.instructor_id,
        u.name as instructor_name,
        c.created_at,
        c.updated_at,
        (SELECT COUNT(*) FROM peer_assessment.course_enrollments ce WHERE ce.course_id = c.course_id) as students_count
      FROM 
        peer_assessment.courses c
      JOIN 
        peer_assessment.users u ON c.instructor_id = u.user_id
    `;

    const queryParams = [];

    // If instructorId is provided, filter by it
    if (instructorId) {
      queryText += ` WHERE c.instructor_id = $1`;
      queryParams.push(instructorId);
    }

    queryText += ` ORDER BY c.name ASC`;

    const result = await pool.query(queryText, queryParams);

    return NextResponse.json({
      courses: result.rows.map(course => ({
        id: course.id,
        name: course.name,
        description: course.description,
        instructorId: course.instructor_id,
        instructorName: course.instructor_name,
        createdAt: course.created_at,
        updatedAt: course.updated_at,
        studentsCount: parseInt(course.students_count || '0')
      }))
    });
  } catch (error) {
    console.error('Error fetching courses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch courses. Please try again.' },
      { status: 500 }
    );
  }
} 