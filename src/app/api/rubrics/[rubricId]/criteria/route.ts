import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET: Fetch all criteria for a specific rubric
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

    // Check if rubric exists
    const rubricResult = await pool.query(
      'SELECT rubric_id FROM peer_assessment.rubrics WHERE rubric_id = $1',
      [rubricId]
    );
    
    if (rubricResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Rubric not found' },
        { status: 404 }
      );
    }

    // Get criteria for the rubric
    const criteriaResult = await pool.query(`
      SELECT 
        rc.criterion_id AS id,
        rc.name AS title,
        rc.description,
        rc.max_points AS "maxPoints",
        rc.weight,
        rc.created_at AS "createdAt",
        rc.updated_at AS "updatedAt"
      FROM 
        peer_assessment.rubric_criteria rc
      WHERE 
        rc.rubric_id = $1
      ORDER BY 
        rc.criterion_id ASC
    `, [rubricId]);

    // Since rubric_levels table doesn't exist, create mock levels for each criterion
    const criteria = criteriaResult.rows.map(criterion => {
      // Create default levels based on max points (4 levels)
      const maxPoints = criterion.maxPoints || 10;
      const levels = [
        {
          id: 1,
          description: 'Does not meet expectations',
          points: Math.round(maxPoints * 0.25),
          orderPosition: 1
        },
        {
          id: 2,
          description: 'Partially meets expectations',
          points: Math.round(maxPoints * 0.5),
          orderPosition: 2
        },
        {
          id: 3,
          description: 'Meets expectations',
          points: Math.round(maxPoints * 0.75),
          orderPosition: 3
        },
        {
          id: 4,
          description: 'Exceeds expectations',
          points: maxPoints,
          orderPosition: 4
        }
      ];

      return {
        ...criterion,
        orderPosition: criterion.id, // Use ID as the order position
        levels // Add mock levels
      };
    });

    return NextResponse.json({ criteria });
  } catch (error) {
    console.error('Error fetching rubric criteria:', error);
    // Log more detailed error information
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      if ('stack' in error) {
        console.error('Stack trace:', error.stack);
      }
    }
    return NextResponse.json(
      { error: 'Failed to fetch rubric criteria: ' + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
}

// POST: Create a new criterion for a rubric
export async function POST(
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

    // Parse request body
    const { title, description, maxPoints, levels } = await request.json();
    
    // Validate input
    if (!title || !title.trim()) {
      return NextResponse.json(
        { error: 'Criterion title is required' },
        { status: 400 }
      );
    }

    if (!maxPoints || isNaN(parseInt(maxPoints)) || parseInt(maxPoints) <= 0) {
      return NextResponse.json(
        { error: 'Valid maximum points are required' },
        { status: 400 }
      );
    }

    // Check if rubric exists
    const rubricResult = await pool.query(
      'SELECT rubric_id FROM peer_assessment.rubrics WHERE rubric_id = $1',
      [rubricId]
    );
    
    if (rubricResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Rubric not found' },
        { status: 404 }
      );
    }

    // Create the criterion (using 'name' instead of 'title')
    const criterionResult = await pool.query(
      `INSERT INTO peer_assessment.rubric_criteria 
       (rubric_id, name, description, max_points, weight) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING criterion_id, name, description, max_points, weight, created_at, updated_at`,
      [
        rubricId, 
        title.trim(), 
        description?.trim() || null, 
        maxPoints,
        1.0 // Default weight to 1.0
      ]
    );

    const newCriterion = criterionResult.rows[0];

    // Since rubric_levels table doesn't exist, just return the criterion with mock levels
    return NextResponse.json({
      message: 'Criterion created successfully',
      criterion: {
        id: newCriterion.criterion_id,
        title: newCriterion.name, // Map name to title
        description: newCriterion.description,
        maxPoints: newCriterion.max_points,
        weight: newCriterion.weight,
        orderPosition: newCriterion.criterion_id,
        createdAt: newCriterion.created_at,
        updatedAt: newCriterion.updated_at,
        // Create mock levels
        levels: [
          {
            id: 1,
            description: 'Does not meet expectations',
            points: Math.round(maxPoints * 0.25),
            orderPosition: 1
          },
          {
            id: 2,
            description: 'Partially meets expectations',
            points: Math.round(maxPoints * 0.5),
            orderPosition: 2
          },
          {
            id: 3,
            description: 'Meets expectations',
            points: Math.round(maxPoints * 0.75),
            orderPosition: 3
          },
          {
            id: 4,
            description: 'Exceeds expectations',
            points: maxPoints,
            orderPosition: 4
          }
        ]
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating criterion:', error);
    return NextResponse.json(
      { error: 'Failed to create criterion: ' + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
} 