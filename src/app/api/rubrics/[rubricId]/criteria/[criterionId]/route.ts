import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET: Fetch a specific criterion by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ rubricId: string, criterionId: string }> }
) {
  try {
    const { rubricId, criterionId } = await params;
    
    if (!rubricId || isNaN(parseInt(rubricId)) || !criterionId || isNaN(parseInt(criterionId))) {
      return NextResponse.json(
        { error: 'Valid rubric ID and criterion ID are required' },
        { status: 400 }
      );
    }

    // Get criterion details
    const criterionResult = await pool.query(`
      SELECT 
        rc.criterion_id AS id,
        rc.name AS title,
        rc.description,
        rc.max_points AS "maxPoints",
        rc.weight,
        COALESCE(rc.criterion_type, 'levels') AS "criterionType",
        rc.created_at AS "createdAt",
        rc.updated_at AS "updatedAt"
      FROM 
        peer_assessment.rubric_criteria rc
      WHERE 
        rc.rubric_id = $1 AND rc.criterion_id = $2
    `, [rubricId, criterionId]);
    
    if (criterionResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Criterion not found' },
        { status: 404 }
      );
    }

    const criterion = criterionResult.rows[0];
    
    // Get performance levels for this criterion
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
    `, [criterionId]);

    // Get subitems for this criterion
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
    `, [criterionId]);

    return NextResponse.json({
      criterion: {
        ...criterion,
        orderPosition: criterion.id,
        levels: levelsResult.rows,
        subitems: subitemsResult.rows
      }
    });
  } catch (error) {
    console.error('Error fetching criterion details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch criterion details: ' + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
}

// PUT: Update a criterion
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ rubricId: string, criterionId: string }> }
) {
  try {
    const { rubricId, criterionId } = await params;
    
    if (!rubricId || isNaN(parseInt(rubricId)) || !criterionId || isNaN(parseInt(criterionId))) {
      return NextResponse.json(
        { error: 'Valid rubric ID and criterion ID are required' },
        { status: 400 }
      );
    }

    // Parse request body
    const { title, description, maxPoints, criterionType = 'levels', levels, subitems } = await request.json();
    
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

    // Check if criterion exists and belongs to the specified rubric
    const criterionCheck = await pool.query(
      'SELECT criterion_id FROM peer_assessment.rubric_criteria WHERE rubric_id = $1 AND criterion_id = $2',
      [rubricId, criterionId]
    );
    
    if (criterionCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Criterion not found' },
        { status: 404 }
      );
    }

    // Validate criterion type
    const validCriterionType = criterionType === 'subitems' ? 'subitems' : 'levels';

    // Update criterion
    await pool.query(
      `UPDATE peer_assessment.rubric_criteria 
       SET name = $1, description = $2, max_points = $3, criterion_type = $4, updated_at = NOW()
       WHERE criterion_id = $5`,
      [title.trim(), description?.trim() || null, maxPoints, validCriterionType, criterionId]
    );

    if (validCriterionType === 'subitems') {
      // Delete existing subitems and levels
      await pool.query('DELETE FROM peer_assessment.rubric_subitems WHERE criterion_id = $1', [criterionId]);
      await pool.query('DELETE FROM peer_assessment.rubric_performance_levels WHERE criterion_id = $1', [criterionId]);

      // Insert new subitems
      if (subitems && Array.isArray(subitems)) {
        for (let i = 0; i < subitems.length; i++) {
          const subitem = subitems[i];
          await pool.query(
            `INSERT INTO peer_assessment.rubric_subitems 
             (criterion_id, name, description, points, order_position) 
             VALUES ($1, $2, $3, $4, $5)`,
            [criterionId, subitem.name || `Item ${i + 1}`, subitem.description || '', subitem.points || 0, i + 1]
          );
        }
      }
    } else {
      // Delete existing levels and subitems
      await pool.query('DELETE FROM peer_assessment.rubric_performance_levels WHERE criterion_id = $1', [criterionId]);
      await pool.query('DELETE FROM peer_assessment.rubric_subitems WHERE criterion_id = $1', [criterionId]);

      // Insert new levels
      if (levels && Array.isArray(levels)) {
        for (let i = 0; i < levels.length; i++) {
          const level = levels[i];
          const levelName = level.name || `Level ${i + 1}`;
          await pool.query(
            `INSERT INTO peer_assessment.rubric_performance_levels 
             (criterion_id, name, description, points, order_position) 
             VALUES ($1, $2, $3, $4, $5)`,
            [criterionId, levelName, level.description || '', level.score || 0, i + 1]
          );
        }
      }
    }

    // Get updated criterion
    const updatedCriterionResult = await pool.query(`
      SELECT 
        criterion_id AS id,
        name AS title,
        description,
        max_points AS "maxPoints",
        weight,
        COALESCE(criterion_type, 'levels') AS "criterionType",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM 
        peer_assessment.rubric_criteria
      WHERE 
        criterion_id = $1
    `, [criterionId]);

    const updatedCriterion = updatedCriterionResult.rows[0];
    
    // Get updated performance levels
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
    `, [criterionId]);

    // Get updated subitems
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
    `, [criterionId]);

    return NextResponse.json({
      message: 'Criterion updated successfully',
      criterion: {
        ...updatedCriterion,
        orderPosition: updatedCriterion.id,
        levels: levelsResult.rows,
        subitems: subitemsResult.rows
      }
    });
  } catch (error) {
    console.error('Error updating criterion:', error);
    return NextResponse.json(
      { error: 'Failed to update criterion: ' + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
}

// DELETE: Remove a criterion
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ rubricId: string, criterionId: string }> }
) {
  try {
    const { rubricId, criterionId } = await params;
    
    if (!rubricId || isNaN(parseInt(rubricId)) || !criterionId || isNaN(parseInt(criterionId))) {
      return NextResponse.json(
        { error: 'Valid rubric ID and criterion ID are required' },
        { status: 400 }
      );
    }

    // Check if criterion exists and belongs to the specified rubric
    const criterionCheck = await pool.query(
      'SELECT criterion_id FROM peer_assessment.rubric_criteria WHERE rubric_id = $1 AND criterion_id = $2',
      [rubricId, criterionId]
    );
    
    if (criterionCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Criterion not found' },
        { status: 404 }
      );
    }

    // Delete the criterion
    await pool.query(
      'DELETE FROM peer_assessment.rubric_criteria WHERE criterion_id = $1',
      [criterionId]
    );

    return NextResponse.json({
      message: 'Criterion deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting criterion:', error);
    return NextResponse.json(
      { error: 'Failed to delete criterion: ' + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
} 