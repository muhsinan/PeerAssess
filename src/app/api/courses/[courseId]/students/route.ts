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

    // Check if course exists
    const courseCheck = await pool.query(
      `SELECT course_id 
       FROM peer_assessment.courses 
       WHERE course_id = $1`,
      [courseId]
    );
    
    if (courseCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    // Get all students enrolled in the course
    const enrolledStudentsQuery = `
      SELECT 
        u.user_id as id,
        u.name,
        u.email
      FROM 
        peer_assessment.users u
      JOIN 
        peer_assessment.course_enrollments ce ON u.user_id = ce.student_id
      WHERE 
        ce.course_id = $1
        AND u.role = 'student'
      ORDER BY 
        u.name
    `;
    
    const studentsResult = await pool.query(enrolledStudentsQuery, [courseId]);
    
    return NextResponse.json({
      students: studentsResult.rows
    });
  } catch (error) {
    console.error('Error fetching course students:', error);
    return NextResponse.json(
      { error: 'Failed to fetch students. Please try again.' },
      { status: 500 }
    );
  }
} 