import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Get instructor ID from request params (this would be from auth in a real app)
    const url = new URL(request.url);
    const instructorId = url.searchParams.get('instructorId');
    
    console.log('Fetching courses for instructor ID:', instructorId);

    if (!instructorId) {
      return NextResponse.json(
        { error: 'Instructor ID is required' },
        { status: 400 }
      );
    }

    // Try a simple DB query first to test connection
    const testQuery = await pool.query('SELECT NOW()');
    console.log('Database connection test successful:', testQuery.rows[0]);

    // Query to get courses taught by instructor with student count and assignment count
    const queryText = `
      SELECT 
        c.course_id as id,
        c.name as title,
        CONCAT('C', c.course_id) as code, -- Generate a simple course code if not available
        c.description,
        (SELECT COUNT(*) FROM peer_assessment.course_enrollments ce WHERE ce.course_id = c.course_id) as students_count,
        (SELECT COUNT(*) FROM peer_assessment.assignments a WHERE a.course_id = c.course_id) as assignments_count
      FROM 
        peer_assessment.courses c
      WHERE 
        c.instructor_id = $1
      ORDER BY 
        c.name ASC
    `;
    
    console.log('Executing query:', queryText);
    const result = await pool.query(queryText, [instructorId]);
    console.log('Query result:', result.rows);

    return NextResponse.json({
      courses: result.rows.map(course => ({
        id: course.id,
        title: course.title,
        code: course.code,
        description: course.description,
        studentsCount: parseInt(course.students_count || '0'),
        assignmentsCount: parseInt(course.assignments_count || '0')
      }))
    });
  } catch (error) {
    console.error('Error fetching instructor courses:', error);
    // Return more detailed error information
    return NextResponse.json(
      { 
        error: 'Failed to fetch courses. Please try again.',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 