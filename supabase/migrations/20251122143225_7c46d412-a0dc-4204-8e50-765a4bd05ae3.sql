-- Phase 2: Backup triggers and data migration support

-- Create trigger to backup marks before deletion or archival
CREATE OR REPLACE FUNCTION backup_marks_before_archive()
RETURNS TRIGGER AS $$
BEGIN
  -- Copy to permanent marks table before deletion
  INSERT INTO marks (student_id, subject_id, exam_period_id, score, grade, remarks, submitted_at, updated_at)
  VALUES (OLD.student_id, OLD.subject_id, OLD.exam_period_id, OLD.score, OLD.grade, '', OLD.created_at, OLD.updated_at)
  ON CONFLICT (student_id, subject_id, exam_period_id) DO UPDATE
  SET score = EXCLUDED.score, grade = EXCLUDED.grade, updated_at = EXCLUDED.updated_at;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER backup_marks_on_delete
BEFORE DELETE ON marks_active
FOR EACH ROW
EXECUTE FUNCTION backup_marks_before_archive();

-- Create function to migrate existing marks to marks_active with expiry
CREATE OR REPLACE FUNCTION migrate_marks_to_active(p_exam_period_id UUID, p_expiry_months INTEGER DEFAULT 12)
RETURNS TABLE(migrated_count BIGINT) AS $$
DECLARE
  count_migrated BIGINT;
BEGIN
  -- Calculate expiry date
  DECLARE
    expiry_date TIMESTAMPTZ := now() + (p_expiry_months || ' months')::INTERVAL;
  BEGIN
    -- Insert from marks to marks_active
    INSERT INTO marks_active (student_id, subject_id, exam_period_id, score, grade, expires_at, created_at, updated_at)
    SELECT 
      m.student_id,
      m.subject_id,
      m.exam_period_id,
      m.score,
      m.grade,
      expiry_date,
      m.submitted_at,
      m.updated_at
    FROM marks m
    WHERE m.exam_period_id = p_exam_period_id
    ON CONFLICT (student_id, subject_id, exam_period_id) 
    DO UPDATE SET 
      score = EXCLUDED.score,
      grade = EXCLUDED.grade,
      expires_at = EXCLUDED.expires_at,
      updated_at = now();
    
    GET DIAGNOSTICS count_migrated = ROW_COUNT;
  END;
  
  RETURN QUERY SELECT count_migrated;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to sync student metadata from students table
CREATE OR REPLACE FUNCTION sync_student_metadata()
RETURNS BIGINT AS $$
DECLARE
  synced_count BIGINT;
BEGIN
  INSERT INTO students_meta (id, grade, stream, institution_id, is_active)
  SELECT 
    s.id,
    s.grade,
    s.stream,
    s.institution_id,
    true
  FROM students s
  ON CONFLICT (id) 
  DO UPDATE SET 
    grade = EXCLUDED.grade,
    stream = EXCLUDED.stream,
    institution_id = EXCLUDED.institution_id,
    updated_at = now();
  
  GET DIAGNOSTICS synced_count = ROW_COUNT;
  RETURN synced_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-sync student metadata on student insert/update
CREATE OR REPLACE FUNCTION auto_sync_student_metadata()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO students_meta (id, grade, stream, institution_id, is_active)
  VALUES (NEW.id, NEW.grade, NEW.stream, NEW.institution_id, true)
  ON CONFLICT (id) 
  DO UPDATE SET 
    grade = NEW.grade,
    stream = NEW.stream,
    institution_id = NEW.institution_id,
    updated_at = now();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER sync_student_meta_on_change
AFTER INSERT OR UPDATE ON students
FOR EACH ROW
EXECUTE FUNCTION auto_sync_student_metadata();

-- Function to initialize expiry dates for existing marks_active records
CREATE OR REPLACE FUNCTION set_default_expiry_dates()
RETURNS BIGINT AS $$
DECLARE
  updated_count BIGINT;
BEGIN
  UPDATE marks_active
  SET expires_at = created_at + INTERVAL '12 months'
  WHERE expires_at IS NULL;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create scheduled cleanup job function (to be called by cron or manually)
CREATE OR REPLACE FUNCTION run_scheduled_cleanup()
RETURNS TABLE(
  table_name TEXT,
  rows_cleaned BIGINT,
  execution_time TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM cleanup_expired_data();
  
  RETURN QUERY
  SELECT 
    'execution_completed'::TEXT,
    0::BIGINT,
    now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;