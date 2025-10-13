import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET pending enrollment counts for all courses taught by an instructor
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const instructorId = url.searchParams.get('instructorId');
    
    if (!instructorId) {
      return NextResponse.json(
        { error: 'Instructor ID is required' },
        { status: 400 }
      );
    }

    // Get pending enrollment counts for all instructor's courses
    const result = await pool.query(`
      SELECT 
        c.course_id,
        c.name as course_name,
        COUNT(per.request_id) as pending_count
      FROM 
        peer_assessment.courses c
      LEFT JOIN 
        peer_assessment.pending_enrollment_requests per ON c.course_id = per.course_id AND per.status = 'pending'
      WHERE 
        c.instructor_id = $1
      GROUP BY 
        c.course_id, c.name
      ORDER BY 
        c.name ASC
    `, [instructorId]);

    // Also get total pending count across all courses
    const totalResult = await pool.query(`
      SELECT 
        COUNT(per.request_id) as total_pending
      FROM 
        peer_assessment.courses c
      LEFT JOIN 
        peer_assessment.pending_enrollment_requests per ON c.course_id = per.course_id AND per.status = 'pending'
      WHERE 
        c.instructor_id = $1
    `, [instructorId]);

    return NextResponse.json({
      coursesPendingCounts: result.rows.map(course => ({
        courseId: course.course_id,
        courseName: course.course_name,
        pendingCount: parseInt(course.pending_count || '0')
      })),
      totalPendingCount: parseInt(totalResult.rows[0]?.total_pending || '0')
    });
  } catch (error) {
    console.error('Error fetching pending enrollment counts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pending enrollment counts. Please try again.' },
      { status: 500 }
    );
  }
}
