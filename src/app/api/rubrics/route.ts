import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET: List all rubrics or filter by instructor ID
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const instructorId = searchParams.get('instructorId');
    
    let query = `
      SELECT 
        r.rubric_id as id,
        r.name,
        r.description,
        r.created_at,
        r.updated_at,
        c.instructor_id,
        u.name as instructor_name,
        a.assignment_id,
        a.title as assignment_title,
        c.course_id,
        c.name as course_name,
        (SELECT COUNT(*) FROM peer_assessment.rubric_criteria rc WHERE rc.rubric_id = r.rubric_id) as criteria_count
      FROM 
        peer_assessment.rubrics r
      JOIN 
        peer_assessment.assignments a ON r.assignment_id = a.assignment_id
      JOIN 
        peer_assessment.courses c ON a.course_id = c.course_id
      JOIN 
        peer_assessment.users u ON c.instructor_id = u.user_id
    `;
    
    const params: any[] = [];
    
    if (instructorId) {
      query += ` WHERE c.instructor_id = $1`;
      params.push(instructorId);
    }
    
    query += ` ORDER BY r.updated_at DESC`;
    
    const result = await pool.query(query, params);
    
    return NextResponse.json({
      rubrics: result.rows.map(rubric => ({
        id: rubric.id,
        name: rubric.name,
        description: rubric.description,
        createdAt: rubric.created_at,
        updatedAt: rubric.updated_at,
        instructorId: rubric.instructor_id,
        instructorName: rubric.instructor_name,
        assignmentId: rubric.assignment_id,
        assignmentTitle: rubric.assignment_title,
        courseId: rubric.course_id,
        courseName: rubric.course_name,
        criteriaCount: parseInt(rubric.criteria_count || '0')
      }))
    });
  } catch (error) {
    console.error('Error fetching rubrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rubrics. Please try again.' },
      { status: 500 }
    );
  }
}

// POST: Create a new rubric
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const { name, description, assignmentId } = await request.json();
    
    // Validate input
    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Rubric name is required' },
        { status: 400 }
      );
    }
    
    if (!assignmentId) {
      return NextResponse.json(
        { error: 'Assignment ID is required' },
        { status: 400 }
      );
    }
    
    // Validate the assignment ID exists
    const assignmentCheck = await pool.query(
      'SELECT assignment_id FROM peer_assessment.assignments WHERE assignment_id = $1',
      [assignmentId]
    );
    
    if (assignmentCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Assignment not found' },
        { status: 404 }
      );
    }
    
    // Insert rubric into database
    const result = await pool.query(
      `INSERT INTO peer_assessment.rubrics
        (name, description, assignment_id) 
       VALUES 
        ($1, $2, $3) 
       RETURNING rubric_id, name, description, assignment_id, created_at, updated_at`,
      [
        name.trim(), 
        description?.trim() || null, 
        assignmentId
      ]
    );
    
    const newRubric = result.rows[0];
    
    // Return newly created rubric
    return NextResponse.json({
      message: 'Rubric created successfully',
      rubric: {
        id: newRubric.rubric_id,
        name: newRubric.name,
        description: newRubric.description,
        assignmentId: newRubric.assignment_id,
        createdAt: newRubric.created_at,
        updatedAt: newRubric.updated_at,
        criteriaCount: 0
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Rubric creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create rubric. Please try again.' },
      { status: 500 }
    );
  }
} 