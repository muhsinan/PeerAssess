# Database Schema Migration: Rubric-Assignment Relationship Fix

## Overview

This migration fixes the rubric-assignment relationship to properly implement the business logic where:
- **One assignment can have ONE rubric** (clear assessment criteria)
- **One rubric can be used for MULTIPLE assignments** (reusable rubrics)

## Changes Made

### Database Schema Changes

**Before (Incorrect):**
```sql
-- rubrics.assignment_id -> assignments.assignment_id (Many-to-One)
CREATE TABLE rubrics (
    rubric_id SERIAL PRIMARY KEY,
    assignment_id INTEGER REFERENCES assignments(assignment_id), -- ❌ Wrong direction
    ...
);
```

**After (Correct):**
```sql
-- assignments.rubric_id -> rubrics.rubric_id (Many-to-One)
CREATE TABLE assignments (
    assignment_id SERIAL PRIMARY KEY,
    rubric_id INTEGER REFERENCES rubrics(rubric_id), -- ✅ Correct direction
    ...
    CONSTRAINT unique_assignment_rubric UNIQUE (rubric_id) -- Prevents multiple assignments per rubric
);

CREATE TABLE rubrics (
    rubric_id SERIAL PRIMARY KEY,
    -- assignment_id removed ✅
    ...
);
```

### Key Changes:
1. **Moved `assignment_id`** from `rubrics` table
2. **Added `rubric_id`** to `assignments` table
3. **Added unique constraint** on `assignments.rubric_id` to enforce one assignment per rubric
4. **Added index** for performance: `idx_assignments_rubric_id`

## API Updates

### Updated Endpoints:
- `GET /api/rubrics` - Now shows all assignments using each rubric
- `GET /api/rubrics/[id]` - Includes assignment details and handles multiple assignments
- `PUT /api/rubrics/[id]` - Can assign/reassign rubrics to assignments
- `POST /api/rubrics` - Assignment selection is now optional
- `GET /api/assignments/[id]` - Includes rubric information
- `GET /api/instructors/[id]/assignments` - Includes rubric data

### Frontend Updates:
- **Rubric Edit Form**: Can now change assignment associations
- **Rubric Create Form**: Assignment selection is optional
- **Rubric List**: Shows which assignment(s) each rubric is used for
- **Assignment Details**: Shows associated rubric information

## Migration Steps

### 1. Backup Your Database
```bash
pg_dump peer_assessment > backup_before_migration.sql
```

### 2. Run the Migration
```bash
# Make sure PostgreSQL is running
brew services start postgresql
# or
sudo systemctl start postgresql

# Run the migration script
psql postgres://postgres:asrox123@localhost:5432/peer_assessment -f database_migration_rubric_schema_fix.sql
```

### 3. Verify the Migration
The migration script will output a summary showing:
- Total assignments
- Assignments with rubrics
- Total rubrics
- Orphaned rubrics (available for reuse)

### 4. Update Your Application Code
The frontend and API code has been updated to work with the new schema. No additional changes needed.

## Benefits of New Schema

1. **Logical Relationship**: Assignments reference rubrics (not the other way around)
2. **Rubric Reusability**: Create a rubric once, use it for multiple similar assignments
3. **Data Integrity**: Unique constraint prevents assignment conflicts
4. **Flexibility**: Assignments can exist without rubrics; rubrics can exist without assignments
5. **Better Performance**: Proper indexing for common queries

## Rollback Plan

If you need to rollback:
```sql
-- This would require a more complex script to reverse the changes
-- Recommended: Restore from backup instead
psql peer_assessment < backup_before_migration.sql
```

## Testing the Changes

After migration:
1. **Create a new rubric** without assigning it to an assignment
2. **Edit an existing rubric** and change its assignment association
3. **Assign the same rubric to multiple assignments** (should work)
4. **Try to assign multiple rubrics to one assignment** (should be prevented)

## New Workflow Examples

### Creating Reusable Rubrics:
```
1. Create "Essay Grading Rubric" (no assignment)
2. Use it for "Midterm Essay" assignment
3. Later, use same rubric for "Final Essay" assignment
4. Both assignments share the same consistent grading criteria
```

### Changing Assignment-Rubric Associations:
```
1. Assignment A currently uses Rubric X
2. Edit Rubric X and change it to Assignment B
3. Assignment A now has no rubric
4. Assignment B now uses Rubric X
```

This makes much more sense from a user experience perspective! 