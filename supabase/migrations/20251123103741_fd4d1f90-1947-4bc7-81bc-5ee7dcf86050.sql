-- Enhanced year-end promotion with comprehensive cleanup
CREATE OR REPLACE FUNCTION year_end_promotion(
  p_institution_id uuid,
  apply_changes boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSONB;
  students_promoted INTEGER := 0;
  students_deleted INTEGER := 0;
  marks_deleted INTEGER := 0;
  exam_periods_deleted INTEGER := 0;
  exams_deleted INTEGER := 0;
  grade_9_count INTEGER;
  storage_before_kb NUMERIC;
  storage_after_kb NUMERIC;
BEGIN
  -- Get storage estimate before
  SELECT pg_total_relation_size('students')::NUMERIC / 1024 +
         pg_total_relation_size('marks')::NUMERIC / 1024 +
         pg_total_relation_size('marks_active')::NUMERIC / 1024 +
         pg_total_relation_size('exam_periods')::NUMERIC / 1024 +
         pg_total_relation_size('exams')::NUMERIC / 1024
  INTO storage_before_kb;
  
  IF apply_changes THEN
    -- Lock to prevent concurrent execution
    PERFORM pg_advisory_xact_lock(hashtext('year_end_' || p_institution_id::text));
    
    -- 1. Count and delete Grade 9 students
    SELECT COUNT(*) INTO grade_9_count
    FROM students
    WHERE institution_id = p_institution_id AND grade = '9';
    
    DELETE FROM students
    WHERE institution_id = p_institution_id AND grade = '9';
    students_deleted := grade_9_count;
    
    -- 2. Promote students from grades 1-8
    UPDATE students
    SET grade = (grade::integer + 1)::text,
        updated_at = now()
    WHERE institution_id = p_institution_id 
      AND grade::integer BETWEEN 1 AND 8;
    GET DIAGNOSTICS students_promoted = ROW_COUNT;
    
    -- 3. Delete all marks (both active and permanent)
    DELETE FROM marks_active 
    WHERE student_id IN (
      SELECT id FROM students WHERE institution_id = p_institution_id
    );
    
    DELETE FROM marks 
    WHERE student_id IN (
      SELECT id FROM students WHERE institution_id = p_institution_id
    );
    GET DIAGNOSTICS marks_deleted = ROW_COUNT;
    
    -- 4. Delete all exam periods
    DELETE FROM exam_periods
    WHERE institution_id = p_institution_id;
    GET DIAGNOSTICS exam_periods_deleted = ROW_COUNT;
    
    -- 5. Delete all exams
    DELETE FROM exams
    WHERE institution_id = p_institution_id;
    GET DIAGNOSTICS exams_deleted = ROW_COUNT;
    
    -- 6. Delete rankings cache
    DELETE FROM rankings_cache
    WHERE institution_id = p_institution_id;
    
    -- Get storage estimate after
    SELECT pg_total_relation_size('students')::NUMERIC / 1024 +
           pg_total_relation_size('marks')::NUMERIC / 1024 +
           pg_total_relation_size('marks_active')::NUMERIC / 1024 +
           pg_total_relation_size('exam_periods')::NUMERIC / 1024 +
           pg_total_relation_size('exams')::NUMERIC / 1024
    INTO storage_after_kb;
    
    -- Build result
    result := jsonb_build_object(
      'yearEndDate', now(),
      'studentsPromoted', students_promoted,
      'studentsDeleted', students_deleted,
      'marksDeleted', marks_deleted,
      'examPeriodsDeleted', exam_periods_deleted,
      'examsDeleted', exams_deleted,
      'serverStorageBeforeKB', storage_before_kb,
      'serverStorageAfterCleanupKB', storage_after_kb,
      'storageSavedKB', storage_before_kb - storage_after_kb,
      'backupStatus', jsonb_build_object(
        'required', true,
        'recommendation', 'Backup must be downloaded before promotion'
      ),
      'message', 'Year-end promotion completed successfully'
    );
    
  ELSE
    -- Dry run - return preview
    SELECT COUNT(*) INTO grade_9_count
    FROM students
    WHERE institution_id = p_institution_id AND grade = '9';
    
    SELECT COUNT(*) INTO students_promoted
    FROM students
    WHERE institution_id = p_institution_id 
      AND grade::integer BETWEEN 1 AND 8;
    
    SELECT COUNT(*) INTO marks_deleted
    FROM marks
    WHERE student_id IN (
      SELECT id FROM students WHERE institution_id = p_institution_id
    );
    
    SELECT COUNT(*) INTO exam_periods_deleted
    FROM exam_periods
    WHERE institution_id = p_institution_id;
    
    SELECT COUNT(*) INTO exams_deleted
    FROM exams
    WHERE institution_id = p_institution_id;
    
    result := jsonb_build_object(
      'preview', true,
      'studentsToPromote', students_promoted,
      'studentsToDelete', grade_9_count,
      'marksToDelete', marks_deleted,
      'examPeriodsToDelete', exam_periods_deleted,
      'examsToDelete', exams_deleted,
      'warning', 'This is a preview. Run with apply_changes=true to execute.'
    );
  END IF;
  
  RETURN result;
END;
$$;