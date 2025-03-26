import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET: Fetch a specific rubric by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { rubricId: string } }
) {
  try {
    const { rubricId } = await params;
    
    if (!rubricId || isNaN(parseInt(rubricId))) {
      return NextResponse.json(
        { error: 'Valid rubric ID is required' },
        { status: 400 }
      );
    }

    const result = await pool.query(`
      SELECT 
        r.rubric_id as id,
        r.name,
        r.description,
        r.created_at,
        r.updated_at,
        a.assignment_id,
        a.title as assignment_title,
        c.course_id,
        c.name as course_name,
        u.user_id as instructor_id,
        u.name as instructor_name,
        (SELECT COUNT(*) FROM peer_assessment.rubric_criteria rc WHERE rc.rubric_id = r.rubric_id) as criteria_count
      FROM 
        peer_assessment.rubrics r
      JOIN 
        peer_assessment.assignments a ON r.assignment_id = a.assignment_id
      JOIN 
        peer_assessment.courses c ON a.course_id = c.course_id
      JOIN 
        peer_assessment.users u ON c.instructor_id = u.user_id
      WHERE 
        r.rubric_id = $1
    `, [rubricId]);
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Rubric not found' },
        { status: 404 }
      );
    }

    const rubric = result.rows[0];
    
    return NextResponse.json({
      rubric: {
        id: rubric.id,
        name: rubric.name,
        description: rubric.description,
        createdAt: rubric.created_at,
        updatedAt: rubric.updated_at,
        assignmentId: rubric.assignment_id,
        assignmentTitle: rubric.assignment_title,
        courseId: rubric.course_id,
        courseName: rubric.course_name,
        instructorId: rubric.instructor_id,
        instructorName: rubric.instructor_name,
        criteriaCount: parseInt(rubric.criteria_count || '0')
      }
    });
  } catch (error) {
    console.error('Error fetching rubric details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rubric details' },
      { status: 500 }
    );
  }
}

// PUT: Update a rubric
export async function PUT(
  request: NextRequest,
  { params }: { params: { rubricId: string } }
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
    const { name, description } = await request.json();
    
    // Validate input
    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Rubric name is required' },
        { status: 400 }
      );
    }

    // Check if rubric exists
    const checkResult = await pool.query(
      'SELECT rubric_id FROM peer_assessment.rubrics WHERE rubric_id = $1',
      [rubricId]
    );
    
    if (checkResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Rubric not found' },
        { status: 404 }
      );
    }

    // Update rubric in database
    await pool.query(
      `UPDATE peer_assessment.rubrics 
       SET name = $1, description = $2, updated_at = NOW() 
       WHERE rubric_id = $3`,
      [name.trim(), description?.trim() || null, rubricId]
    );

    // Get updated rubric
    const result = await pool.query(`
      SELECT 
        r.rubric_id as id,
        r.name,
        r.description,
        r.created_at,
        r.updated_at,
        a.assignment_id,
        a.title as assignment_title,
        c.course_id,
        c.name as course_name,
        u.user_id as instructor_id,
        u.name as instructor_name
      FROM 
        peer_assessment.rubrics r
      JOIN 
        peer_assessment.assignments a ON r.assignment_id = a.assignment_id
      JOIN 
        peer_assessment.courses c ON a.course_id = c.course_id
      JOIN 
        peer_assessment.users u ON c.instructor_id = u.user_id
      WHERE 
        r.rubric_id = $1
    `, [rubricId]);

    const rubric = result.rows[0];
    
    return NextResponse.json({
      message: 'Rubric updated successfully',
      rubric: {
        id: rubric.id,
        name: rubric.name,
        description: rubric.description,
        createdAt: rubric.created_at,
        updatedAt: rubric.updated_at,
        assignmentId: rubric.assignment_id,
        assignmentTitle: rubric.assignment_title,
        courseId: rubric.course_id,
        courseName: rubric.course_name,
        instructorId: rubric.instructor_id,
        instructorName: rubric.instructor_name
      }
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
  { params }: { params: { rubricId: string } }
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
    const checkResult = await pool.query(
      'SELECT rubric_id FROM peer_assessment.rubrics WHERE rubric_id = $1',
      [rubricId]
    );
    
    if (checkResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Rubric not found' },
        { status: 404 }
      );
    }

    // Check if the rubric has criteria
    const criteriaResult = await pool.query(
      'SELECT COUNT(*) FROM peer_assessment.rubric_criteria WHERE rubric_id = $1',
      [rubricId]
    );
    
    // Delete the criteria first if they exist
    if (parseInt(criteriaResult.rows[0].count) > 0) {
      await pool.query(
        'DELETE FROM peer_assessment.rubric_criteria WHERE rubric_id = $1',
        [rubricId]
      );
    }

    // Delete the rubric
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