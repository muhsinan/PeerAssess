-- Create performance levels table to store custom performance levels for rubric criteria
CREATE TABLE IF NOT EXISTS peer_assessment.rubric_performance_levels (
    level_id SERIAL PRIMARY KEY,
    criterion_id INTEGER REFERENCES peer_assessment.rubric_criteria(criterion_id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    points INTEGER NOT NULL,
    order_position INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(criterion_id, order_position)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_performance_levels_criterion_id ON peer_assessment.rubric_performance_levels(criterion_id);
CREATE INDEX IF NOT EXISTS idx_performance_levels_order ON peer_assessment.rubric_performance_levels(criterion_id, order_position);

-- Verify the table was created
SELECT 'Performance levels table created successfully' as status; 