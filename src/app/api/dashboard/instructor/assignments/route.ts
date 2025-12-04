import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Get instructor ID from request params
    const url = new URL(request.url);
    const instructorId = url.searchParams.get('instructorId');
    
    console.log('Fetching assignments for instructor ID:', instructorId);

    if (!instructorId) {
      return NextResponse.json(
        { error: 'Instructor ID is required' },
        { status: 400 }
      );
    }

    // Get limit parameter with default of 5
    const limit = parseInt(url.searchParams.get('limit') || '5');

    // Test DB connection
    const testQuery = await pool.query('SELECT NOW()');
    console.log('Database connection test successful:', testQuery.rows[0]);

    // Query to get assignments for courses taught by the instructor
    const queryText = `
      SELECT 
        a.assignment_id as id,
        a.title,
        c.name as course, 
        a.due_date,
        a.course_id,
        a.is_hidden,
        (SELECT COUNT(*) FROM peer_assessment.submissions s WHERE s.assignment_id = a.assignment_id) as submissions_count,
        (SELECT COUNT(*) FROM peer_assessment.course_enrollments ce WHERE ce.course_id = a.course_id) as total_students
      FROM 
        peer_assessment.assignments a
      JOIN 
        peer_assessment.courses c ON a.course_id = c.course_id
      WHERE 
        c.instructor_id = $1
      ORDER BY 
        a.created_at DESC
      LIMIT $2
    `;
    
    console.log('Executing query:', queryText);
    const result = await pool.query(queryText, [instructorId, limit]);
    console.log('Query result:', result.rows);

    return NextResponse.json({
      assignments: result.rows.map(assignment => ({
        id: assignment.id,
        title: assignment.title,
        course: assignment.course,
        courseId: assignment.course_id,
        dueDate: assignment.due_date ? assignment.due_date.toISOString().split('T')[0] : '', // Format as YYYY-MM-DD
        isHidden: assignment.is_hidden || false,
        submissionsCount: parseInt(assignment.submissions_count || '0'),
        totalStudents: parseInt(assignment.total_students || '0')
      }))
    });
  } catch (error) {
    console.error('Error fetching instructor assignments:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch assignments. Please try again.',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 