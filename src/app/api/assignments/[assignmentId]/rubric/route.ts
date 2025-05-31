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

    // First, get the rubric ID for this assignment
    const rubricResult = await pool.query(`
      SELECT 
        r.rubric_id as id,
        r.name,
        r.description
      FROM 
        peer_assessment.rubrics r
      WHERE 
        r.assignment_id = $1
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
    
    // Add performance levels to each criterion (mock levels for now since they're not stored in DB)
    const criteria = criteriaResult.rows.map(criterion => {
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
        levels
      };
    });
    
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