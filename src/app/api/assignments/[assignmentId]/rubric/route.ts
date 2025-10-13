import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ assignmentId: string }> }
) {
  try {
    const { assignmentId } = await params;
    
    if (!assignmentId || isNaN(Number(assignmentId))) {
      return NextResponse.json(
        { error: 'Invalid assignment ID' },
        { status: 400 }
      );
    }

    // First, get the rubrics for this assignment using the junction table
    const rubricResult = await pool.query(`
      SELECT 
        r.rubric_id as id,
        r.name,
        r.description
      FROM 
        peer_assessment.rubrics r
      JOIN peer_assessment.assignment_rubrics ar ON r.rubric_id = ar.rubric_id
      WHERE 
        ar.assignment_id = $1
      LIMIT 1
    `, [assignmentId]);
    
    if (rubricResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Rubric not found for this assignment' },
        { status: 404 }
      );
    }

    const rubric = rubricResult.rows[0];
    
    // Get the criteria for this rubric
    const criteriaResult = await pool.query(`
      SELECT 
        rc.criterion_id as id,
        rc.name,
        rc.description,
        rc.max_points as "maxPoints",
        rc.weight
      FROM 
        peer_assessment.rubric_criteria rc
      WHERE 
        rc.rubric_id = $1
      ORDER BY 
        rc.criterion_id
    `, [rubric.id]);
    
    // Get performance levels for each criterion
    const criteria = await Promise.all(criteriaResult.rows.map(async (criterion) => {
      const levelsResult = await pool.query(`
        SELECT 
          level_id as id,
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

      return {
        ...criterion,
        levels: levelsResult.rows
      };
    }));
    
    return NextResponse.json({
      rubric: {
        id: rubric.id,
        name: rubric.name,
        description: rubric.description,
      },
      criteria
    });
  } catch (error) {
    console.error('Error fetching assignment rubric:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rubric. Please try again.' },
      { status: 500 }
    );
  }
} 