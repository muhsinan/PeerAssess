import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { instructorId: string } }
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
        c.instructor_id
      FROM 
        peer_assessment.assignments a
      JOIN 
        peer_assessment.courses c ON a.course_id = c.course_id
      WHERE 
        c.instructor_id = $1
      ORDER BY 
        a.due_date DESC
    `, [instructorId]);

    return NextResponse.json({
      assignments: result.rows.map(assignment => ({
        id: assignment.id,
        title: assignment.title,
        description: assignment.description,
        dueDate: assignment.due_date,
        courseId: assignment.course_id,
        courseName: assignment.course_name
      }))
    });
  } catch (error) {
    console.error('Error fetching assignments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assignments. Please try again.' },
      { status: 500 }
    );
  }
} 