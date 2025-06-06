import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET: List all rubrics or filter by instructor ID
export async function GET() {
  try {
    const result = await pool.query(`
      SELECT 
        r.rubric_id as id,
        r.name,
        r.description,
        r.created_at,
        r.updated_at,
        (SELECT COUNT(*) FROM peer_assessment.rubric_criteria rc WHERE rc.rubric_id = r.rubric_id) as criteria_count,
        COALESCE(
          json_agg(
            CASE 
              WHEN a.assignment_id IS NOT NULL THEN
                json_build_object(
                  'id', a.assignment_id,
                  'title', a.title,
                  'courseId', a.course_id,
                  'courseName', c.name
                )
            END
          ) FILTER (WHERE a.assignment_id IS NOT NULL), 
          '[]'::json
        ) as assignments
      FROM 
        peer_assessment.rubrics r
      LEFT JOIN peer_assessment.assignment_rubrics ar ON r.rubric_id = ar.rubric_id
      LEFT JOIN peer_assessment.assignments a ON ar.assignment_id = a.assignment_id  
      LEFT JOIN peer_assessment.courses c ON a.course_id = c.course_id
      GROUP BY r.rubric_id, r.name, r.description, r.created_at, r.updated_at
      ORDER BY r.updated_at DESC
    `);

    return NextResponse.json({
      rubrics: result.rows
    });
  } catch (error) {
    console.error('Error fetching rubrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rubrics' },
      { status: 500 }
    );
  }
}

// POST: Create a new rubric
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, assignmentIds = [] } = body;

    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: 'Rubric name is required' },
        { status: 400 }
      );
    }

    // Validate assignment assignments - check if any assignments already have rubrics
    if (assignmentIds && assignmentIds.length > 0) {
      const existingAssignments = await pool.query(
        'SELECT assignment_id FROM peer_assessment.assignment_rubrics WHERE assignment_id = ANY($1)',
        [assignmentIds]
      );
      
      if (existingAssignments.rows.length > 0) {
        const conflictingIds = existingAssignments.rows.map(row => row.assignment_id);
        return NextResponse.json(
          { error: `Assignments with IDs ${conflictingIds.join(', ')} already have rubrics assigned. Each assignment can only have one rubric.` },
          { status: 400 }
        );
      }
    }

    // Create the rubric
    const rubricResult = await pool.query(
      'INSERT INTO peer_assessment.rubrics (name, description) VALUES ($1, $2) RETURNING rubric_id, name, description, created_at, updated_at',
      [name, description || null]
    );

    const newRubric = rubricResult.rows[0];

    // Assign to assignments if provided
    if (assignmentIds && assignmentIds.length > 0) {
      const assignmentPromises = assignmentIds.map((assignmentId: number) =>
        pool.query(
          'INSERT INTO peer_assessment.assignment_rubrics (assignment_id, rubric_id) VALUES ($1, $2)',
          [assignmentId, newRubric.rubric_id]
        )
      );
      
      await Promise.all(assignmentPromises);
    }

    return NextResponse.json({
      message: 'Rubric created successfully',
      rubric: {
        id: newRubric.rubric_id,
        name: newRubric.name,
        description: newRubric.description,
        created_at: newRubric.created_at,
        updated_at: newRubric.updated_at
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating rubric:', error);
    return NextResponse.json(
      { error: 'Failed to create rubric' },
      { status: 500 }
    );
  }
} 