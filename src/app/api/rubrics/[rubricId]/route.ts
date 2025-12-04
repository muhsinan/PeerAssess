import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET: Fetch a specific rubric by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ rubricId: string }> }
) {
  try {
    const { rubricId } = await params;
    
    if (!rubricId || isNaN(parseInt(rubricId))) {
      return NextResponse.json(
        { error: 'Valid rubric ID is required' },
        { status: 400 }
      );
    }

    // Get rubric basic info and associated assignments
    const rubricResult = await pool.query(`
      SELECT 
        r.rubric_id as id,
        r.name,
        r.description,
        r.created_at,
        r.updated_at,
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
      WHERE r.rubric_id = $1
      GROUP BY r.rubric_id, r.name, r.description, r.created_at, r.updated_at
    `, [rubricId]);

    if (rubricResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Rubric not found' },
        { status: 404 }
      );
    }

    // Get rubric criteria with performance levels and subitems
    const criteriaResult = await pool.query(`
      SELECT 
        criterion_id as id,
        name,
        description,
        max_points,
        weight,
        COALESCE(criterion_type, 'levels') AS "criterionType"
      FROM peer_assessment.rubric_criteria
      WHERE rubric_id = $1
      ORDER BY criterion_id
    `, [rubricId]);

    // Get performance levels and subitems for each criterion
    const criteriaWithLevels = await Promise.all(criteriaResult.rows.map(async (criterion) => {
      const levelsResult = await pool.query(`
        SELECT 
          level_id as id,
          name,
          description,
          points as score,
          order_position as "orderPosition"
        FROM 
          peer_assessment.rubric_performance_levels
        WHERE 
          criterion_id = $1
        ORDER BY 
          order_position ASC
      `, [criterion.id]);

      const subitemsResult = await pool.query(`
        SELECT 
          subitem_id as id,
          name,
          description,
          points,
          order_position as "orderPosition"
        FROM 
          peer_assessment.rubric_subitems
        WHERE 
          criterion_id = $1
        ORDER BY 
          order_position ASC
      `, [criterion.id]);

      return {
        ...criterion,
        levels: levelsResult.rows,
        subitems: subitemsResult.rows
      };
    }));

    const rubric = rubricResult.rows[0];
    
    return NextResponse.json({
      ...rubric,
      criteria: criteriaWithLevels
    });
  } catch (error) {
    console.error('Error fetching rubric:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rubric' },
      { status: 500 }
    );
  }
}

// PUT: Update a rubric
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ rubricId: string }> }
) {
  try {
    const { rubricId } = await params;
    const body = await request.json();
    const { name, description, assignmentIds = [] } = body;

    if (!rubricId || isNaN(parseInt(rubricId))) {
      return NextResponse.json(
        { error: 'Valid rubric ID is required' },
        { status: 400 }
      );
    }

    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: 'Rubric name is required' },
        { status: 400 }
      );
    }

    // Check if rubric exists
    const rubricCheck = await pool.query(
      'SELECT rubric_id FROM peer_assessment.rubrics WHERE rubric_id = $1',
      [rubricId]
    );

    if (rubricCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Rubric not found' },
        { status: 404 }
      );
    }

    // Update rubric basic info
    await pool.query(
      'UPDATE peer_assessment.rubrics SET name = $1, description = $2, updated_at = NOW() WHERE rubric_id = $3',
      [name, description || null, rubricId]
    );

    // Update assignment associations
    // First, remove all existing associations
    await pool.query(
      'DELETE FROM peer_assessment.assignment_rubrics WHERE rubric_id = $1',
      [rubricId]
    );

    // Validate new assignment assignments - check if any assignments already have rubrics (excluding current rubric)
    if (assignmentIds && assignmentIds.length > 0) {
      const existingAssignments = await pool.query(
        'SELECT assignment_id FROM peer_assessment.assignment_rubrics WHERE assignment_id = ANY($1) AND rubric_id != $2',
        [assignmentIds, rubricId]
      );
      
      if (existingAssignments.rows.length > 0) {
        const conflictingIds = existingAssignments.rows.map(row => row.assignment_id);
        return NextResponse.json(
          { error: `Assignments with IDs ${conflictingIds.join(', ')} already have rubrics assigned. Each assignment can only have one rubric.` },
          { status: 400 }
        );
      }
    }

    // Then add new associations
    if (assignmentIds.length > 0) {
      const insertPromises = assignmentIds.map((assignmentId: number) =>
        pool.query(
          'INSERT INTO peer_assessment.assignment_rubrics (assignment_id, rubric_id) VALUES ($1, $2)',
          [assignmentId, rubricId]
        )
      );
      
      await Promise.all(insertPromises);
    }

    return NextResponse.json({
      message: 'Rubric updated successfully'
    });
  } catch (error) {
    console.error('Error updating rubric:', error);
    return NextResponse.json(
      { error: 'Failed to update rubric' },
      { status: 500 }
    );
  }
}

// DELETE: Remove a rubric
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ rubricId: string }> }
) {
  try {
    const { rubricId } = await params;
    
    if (!rubricId || isNaN(parseInt(rubricId))) {
      return NextResponse.json(
        { error: 'Valid rubric ID is required' },
        { status: 400 }
      );
    }

    // Check if rubric exists
    const rubricCheck = await pool.query(
      'SELECT rubric_id FROM peer_assessment.rubrics WHERE rubric_id = $1',
      [rubricId]
    );

    if (rubricCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Rubric not found' },
        { status: 404 }
      );
    }

    // Delete rubric (cascading will handle criteria and assignment associations)
    await pool.query(
      'DELETE FROM peer_assessment.rubrics WHERE rubric_id = $1',
      [rubricId]
    );

    return NextResponse.json({
      message: 'Rubric deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting rubric:', error);
    return NextResponse.json(
      { error: 'Failed to delete rubric' },
      { status: 500 }
    );
  }
} 