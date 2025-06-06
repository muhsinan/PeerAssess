import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const instructorId = searchParams.get('instructorId');
    
    if (!instructorId || isNaN(parseInt(instructorId))) {
      return NextResponse.json(
        { error: 'Valid instructor ID is required', details: 'Missing or invalid instructorId parameter' },
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
        { error: 'Instructor not found', details: 'No instructor found with the given ID' },
        { status: 404 }
      );
    }

    // Get rubrics associated with assignments in courses taught by this instructor
    const result = await pool.query(`
      SELECT 
        r.rubric_id as id,
        r.name as title,
        r.description,
        r.created_at,
        r.updated_at,
        (SELECT COUNT(*) FROM peer_assessment.rubric_criteria rc WHERE rc.rubric_id = r.rubric_id) as criteria_count
      FROM 
        peer_assessment.rubrics r
      WHERE r.rubric_id IN (
        SELECT DISTINCT ar.rubric_id 
        FROM peer_assessment.assignment_rubrics ar
        JOIN peer_assessment.assignments a ON ar.assignment_id = a.assignment_id
        JOIN peer_assessment.courses c ON a.course_id = c.course_id
        WHERE c.instructor_id = $1
      )
      ORDER BY 
        r.updated_at DESC
      LIMIT 5
    `, [instructorId]);

    return NextResponse.json({
      rubrics: result.rows.map(rubric => ({
        id: rubric.id,
        title: rubric.title,
        description: rubric.description,
        criteria: rubric.criteria_count,
        lastUpdated: new Date(rubric.updated_at).toLocaleDateString()
      }))
    });
  } catch (error) {
    console.error('Error fetching rubrics for dashboard:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch rubrics. Please try again.', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
} 