import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const search = url.searchParams.get('search') || '';
    const courseId = url.searchParams.get('courseId');
    
    let queryText = `
      SELECT 
        u.user_id as id,
        u.name,
        u.email
      FROM 
        peer_assessment.users u
      WHERE 
        u.role = 'student'
    `;
    
    const queryParams: any[] = [];
    
    // Add search filter if provided
    if (search) {
      queryText += ` AND (u.name ILIKE $${queryParams.length + 1} OR u.email ILIKE $${queryParams.length + 1})`;
      queryParams.push(`%${search}%`);
    }
    
    queryText += ` ORDER BY u.name ASC`;
    
    const result = await pool.query(queryText, queryParams);
    
    // If courseId is provided, mark which students are enrolled in the course
    let enrolledStudentIds: number[] = [];
    
    if (courseId) {
      const enrollmentsResult = await pool.query(`
        SELECT student_id
        FROM peer_assessment.course_enrollments
        WHERE course_id = $1
      `, [courseId]);
      
      enrolledStudentIds = enrollmentsResult.rows.map(row => row.student_id);
    }
    
    return NextResponse.json({
      students: result.rows.map(student => ({
        id: student.id,
        name: student.name,
        email: student.email,
        isEnrolled: courseId ? enrolledStudentIds.includes(student.id) : false
      }))
    });
  } catch (error) {
    console.error('Error fetching students:', error);
    return NextResponse.json(
      { error: 'Failed to fetch students. Please try again.' },
      { status: 500 }
    );
  }
} 