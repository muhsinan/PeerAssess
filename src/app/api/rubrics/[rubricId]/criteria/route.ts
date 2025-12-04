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
        COALESCE(rc.criterion_type, 'levels') AS "criterionType",
        rc.created_at AS "createdAt",
        rc.updated_at AS "updatedAt"
      FROM 
        peer_assessment.rubric_criteria rc
      WHERE 
        rc.rubric_id = $1
      ORDER BY 
        rc.criterion_id ASC
    `, [rubricId]);

    // Get performance levels and subitems for each criterion
    const criteria = await Promise.all(criteriaResult.rows.map(async (criterion) => {
      // Get performance levels
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

      // Get subitems
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
        orderPosition: criterion.id,
        levels: levelsResult.rows,
        subitems: subitemsResult.rows
      };
    }));

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

    // Validate criterion type
    const validCriterionType = criterionType === 'subitems' ? 'subitems' : 'levels';

    // Create the criterion
    const criterionResult = await pool.query(
      `INSERT INTO peer_assessment.rubric_criteria 
       (rubric_id, name, description, max_points, weight, criterion_type) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING criterion_id, name, description, max_points, weight, criterion_type, created_at, updated_at`,
      [
        rubricId, 
        title.trim(), 
        description?.trim() || null, 
        maxPoints,
        1.0, // Default weight to 1.0
        validCriterionType
      ]
    );

    const newCriterion = criterionResult.rows[0];
    const criterionId = newCriterion.criterion_id;

    const savedLevels = [];
    const savedSubitems = [];

    if (validCriterionType === 'subitems') {
      // Save subitems
      if (subitems && Array.isArray(subitems) && subitems.length > 0) {
        for (let i = 0; i < subitems.length; i++) {
          const subitem = subitems[i];
          const subitemResult = await pool.query(
            `INSERT INTO peer_assessment.rubric_subitems 
             (criterion_id, name, description, points, order_position) 
             VALUES ($1, $2, $3, $4, $5) 
             RETURNING subitem_id, name, description, points, order_position`,
            [criterionId, subitem.name || `Item ${i + 1}`, subitem.description || '', subitem.points || 0, i + 1]
          );
          savedSubitems.push({
            id: subitemResult.rows[0].subitem_id,
            name: subitemResult.rows[0].name,
            description: subitemResult.rows[0].description,
            points: subitemResult.rows[0].points,
            orderPosition: subitemResult.rows[0].order_position
          });
        }
      } else {
        // Create a default subitem
        const subitemResult = await pool.query(
          `INSERT INTO peer_assessment.rubric_subitems 
           (criterion_id, name, description, points, order_position) 
           VALUES ($1, $2, $3, $4, $5) 
           RETURNING subitem_id, name, description, points, order_position`,
          [criterionId, 'Item 1', 'Description of this item', maxPoints, 1]
        );
        savedSubitems.push({
          id: subitemResult.rows[0].subitem_id,
          name: subitemResult.rows[0].name,
          description: subitemResult.rows[0].description,
          points: subitemResult.rows[0].points,
          orderPosition: subitemResult.rows[0].order_position
        });
      }
    } else {
      // Save performance levels
      if (levels && Array.isArray(levels) && levels.length > 0) {
        for (let i = 0; i < levels.length; i++) {
          const level = levels[i];
          const levelName = level.name || `Level ${i + 1}`;
          const levelResult = await pool.query(
            `INSERT INTO peer_assessment.rubric_performance_levels 
             (criterion_id, name, description, points, order_position) 
             VALUES ($1, $2, $3, $4, $5) 
             RETURNING level_id, name, description, points, order_position`,
            [criterionId, levelName, level.description || '', level.score || 0, i + 1]
          );
          savedLevels.push({
            id: levelResult.rows[0].level_id,
            name: levelResult.rows[0].name,
            description: levelResult.rows[0].description,
            score: levelResult.rows[0].points,
            orderPosition: levelResult.rows[0].order_position
          });
        }
      } else {
        // Create default levels if none provided
        const defaultLevels = [
          { name: 'Beginning', description: 'Does not meet expectations', points: Math.round(maxPoints * 0.25) },
          { name: 'Developing', description: 'Partially meets expectations', points: Math.round(maxPoints * 0.5) },
          { name: 'Proficient', description: 'Meets expectations', points: Math.round(maxPoints * 0.75) },
          { name: 'Exemplary', description: 'Exceeds expectations', points: maxPoints }
        ];
        
        for (let i = 0; i < defaultLevels.length; i++) {
          const level = defaultLevels[i];
          const levelResult = await pool.query(
            `INSERT INTO peer_assessment.rubric_performance_levels 
             (criterion_id, name, description, points, order_position) 
             VALUES ($1, $2, $3, $4, $5) 
             RETURNING level_id, name, description, points, order_position`,
            [criterionId, level.name, level.description, level.points, i + 1]
          );
          savedLevels.push({
            id: levelResult.rows[0].level_id,
            name: levelResult.rows[0].name,
            description: levelResult.rows[0].description,
            score: levelResult.rows[0].points,
            orderPosition: levelResult.rows[0].order_position
          });
        }
      }
    }

    return NextResponse.json({
      message: 'Criterion created successfully',
      criterion: {
        id: newCriterion.criterion_id,
        title: newCriterion.name,
        description: newCriterion.description,
        maxPoints: newCriterion.max_points,
        weight: newCriterion.weight,
        criterionType: newCriterion.criterion_type,
        orderPosition: newCriterion.criterion_id,
        createdAt: newCriterion.created_at,
        updatedAt: newCriterion.updated_at,
        levels: savedLevels,
        subitems: savedSubitems
      }
    });
  } catch (error) {
    console.error('Error creating criterion:', error);
    return NextResponse.json(
      { error: 'Failed to create criterion: ' + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
} 