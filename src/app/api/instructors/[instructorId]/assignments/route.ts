import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ instructorId: string }> }
) {
  try {
    const { instructorId } = await params;
    
    if (!instructorId || isNaN(parseInt(instructorId))) {
      return NextResponse.json(
        { error: 'Valid instructor ID is required' },
        { status: 400 }
      );
    }

    // Check if instructor exists and is an instructor
    const instructorCheck = await pool.query(
      'SELECT user_id FROM peer_assessment.users WHERE user_id = $1 AND role = $2',
      [instructorId, 'instructor']
    );

    if (instructorCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Instructor not found' },
        { status: 404 }
      );
    }

    // Get assignments for courses taught by this instructor
    const result = await pool.query(`
      SELECT 
        a.assignment_id as id,
        a.title,
        a.description,
        a.due_date,
        a.course_id,
        c.name as course_name,
        c.instructor_id,
        COALESCE(
          (SELECT json_agg(
            json_build_object(
              'id', r.rubric_id,
              'name', r.name,
              'description', r.description
            )
          ) FROM peer_assessment.assignment_rubrics ar
           JOIN peer_assessment.rubrics r ON ar.rubric_id = r.rubric_id
           WHERE ar.assignment_id = a.assignment_id),
          '[]'::json
        ) as rubrics,
        CASE 
          WHEN EXISTS (
            SELECT 1 FROM peer_assessment.assignment_rubrics ar 
            WHERE ar.assignment_id = a.assignment_id
          ) THEN true 
          ELSE false 
        END as has_rubric
      FROM 
        peer_assessment.assignments a
      JOIN 
        peer_assessment.courses c ON a.course_id = c.course_id
      WHERE 
        c.instructor_id = $1
      ORDER BY 
        a.created_at DESC
    `, [instructorId]);

    // Format the data for the frontend
    const assignments = result.rows.map(row => ({
      id: row.id,
      title: row.title,
      description: row.description,
      dueDate: row.due_date,
      courseId: row.course_id,
      courseName: row.course_name,
      instructorId: row.instructor_id,
      rubrics: row.rubrics,
      hasRubric: row.has_rubric
    }));

    return NextResponse.json({
      assignments: assignments
    });
  } catch (error) {
    console.error('Error fetching assignments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assignments. Please try again.' },
      { status: 500 }
    );
  }
} 