-- Phase 1: CBC Pro Ranker - WhatsApp-Style Storage Optimization
-- Creates optimized tables with TTL, caching, and automated cleanup

-- 1. Students Metadata Table (lightweight, permanent)
CREATE TABLE IF NOT EXISTS students_meta (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES admin_institutions(id) ON DELETE CASCADE,
  admission_number TEXT NOT NULL,
  full_name TEXT NOT NULL,
  grade TEXT NOT NULL,
  stream TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(institution_id, admission_number)
);

CREATE INDEX idx_students_meta_institution ON students_meta(institution_id);
CREATE INDEX idx_students_meta_active ON students_meta(institution_id, is_active) WHERE is_active = true;
CREATE INDEX idx_students_meta_grade_stream ON students_meta(institution_id, grade, stream) WHERE is_active = true;

-- 2. Active Marks Table (temporary, auto-deleted after term ends)
CREATE TABLE IF NOT EXISTS marks_active (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students_meta(id) ON DELETE CASCADE,
  exam_period_id UUID NOT NULL REFERENCES exam_periods(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  score NUMERIC NOT NULL CHECK (score >= 0),
  grade TEXT,
  version INTEGER DEFAULT 1,
  expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '90 days'),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(student_id, exam_period_id, subject_id)
);

CREATE INDEX idx_marks_active_student ON marks_active(student_id, exam_period_id);
CREATE INDEX idx_marks_active_exam ON marks_active(exam_period_id, subject_id);
CREATE INDEX idx_marks_active_expires ON marks_active(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX idx_marks_active_version ON marks_active(student_id, exam_period_id, version);

-- 3. Rankings Cache Table (temporary, computed on-demand)
CREATE TABLE IF NOT EXISTS rankings_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES admin_institutions(id) ON DELETE CASCADE,
  exam_period_id UUID NOT NULL REFERENCES exam_periods(id) ON DELETE CASCADE,
  grade TEXT NOT NULL,
  stream TEXT,
  student_id UUID NOT NULL REFERENCES students_meta(id) ON DELETE CASCADE,
  total_marks NUMERIC NOT NULL,
  average_score NUMERIC NOT NULL,
  rank_overall INTEGER NOT NULL,
  rank_stream INTEGER,
  subject_scores JSONB,
  computed_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '7 days'),
  UNIQUE(exam_period_id, grade, stream, student_id)
);

CREATE INDEX idx_rankings_cache_exam ON rankings_cache(exam_period_id, grade, stream);
CREATE INDEX idx_rankings_cache_student ON rankings_cache(student_id, exam_period_id);
CREATE INDEX idx_rankings_cache_expires ON rankings_cache(expires_at);
CREATE INDEX idx_rankings_cache_rank ON rankings_cache(exam_period_id, grade, stream, rank_overall);

-- 4. Active Exam Periods Table (extends existing exam_periods)
ALTER TABLE exam_periods ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE exam_periods ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;
ALTER TABLE exam_periods ADD COLUMN IF NOT EXISTS backup_sent BOOLEAN DEFAULT false;

CREATE INDEX idx_exam_periods_active ON exam_periods(institution_id, is_active) WHERE is_active = true;
CREATE INDEX idx_exam_periods_archived ON exam_periods(archived_at) WHERE archived_at IS NOT NULL;

-- 5. Backup Logs Table (minimal metadata only)
CREATE TABLE IF NOT EXISTS backup_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES admin_institutions(id) ON DELETE CASCADE,
  exam_period_id UUID REFERENCES exam_periods(id) ON DELETE SET NULL,
  backup_type TEXT NOT NULL CHECK (backup_type IN ('email', 'download', 'auto')),
  file_size_bytes BIGINT,
  recipient_email TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '30 days')
);

CREATE INDEX idx_backup_logs_institution ON backup_logs(institution_id, created_at DESC);
CREATE INDEX idx_backup_logs_expires ON backup_logs(expires_at);

-- 6. Function: Fast Ranking Computation
CREATE OR REPLACE FUNCTION compute_rankings_fast(
  p_exam_period_id UUID,
  p_grade TEXT,
  p_stream TEXT DEFAULT NULL
)
RETURNS TABLE(
  student_id UUID,
  total_marks NUMERIC,
  average_score NUMERIC,
  rank_overall INTEGER,
  rank_stream INTEGER,
  subject_scores JSONB
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH student_totals AS (
    SELECT 
      m.student_id,
      sm.grade,
      sm.stream,
      SUM(m.score) as total,
      AVG(m.score) as average,
      jsonb_object_agg(s.name, m.score) as subjects
    FROM marks_active m
    JOIN students_meta sm ON m.student_id = sm.id
    JOIN subjects s ON m.subject_id = s.id
    WHERE m.exam_period_id = p_exam_period_id
      AND sm.grade = p_grade
      AND (p_stream IS NULL OR sm.stream = p_stream)
      AND sm.is_active = true
    GROUP BY m.student_id, sm.grade, sm.stream
  ),
  overall_ranks AS (
    SELECT 
      st.student_id,
      st.total,
      st.average,
      st.subjects,
      st.stream,
      DENSE_RANK() OVER (ORDER BY st.total DESC) as rank_overall
    FROM student_totals st
  ),
  stream_ranks AS (
    SELECT 
      student_id,
      DENSE_RANK() OVER (PARTITION BY stream ORDER BY total DESC) as rank_stream
    FROM student_totals
  )
  SELECT 
    or_table.student_id,
    or_table.total as total_marks,
    or_table.average as average_score,
    or_table.rank_overall::INTEGER,
    COALESCE(sr.rank_stream, or_table.rank_overall)::INTEGER as rank_stream,
    or_table.subjects as subject_scores
  FROM overall_ranks or_table
  LEFT JOIN stream_ranks sr ON or_table.student_id = sr.student_id
  ORDER BY or_table.rank_overall;
END;
$$;

-- 7. Function: Automated Data Cleanup
CREATE OR REPLACE FUNCTION cleanup_expired_data()
RETURNS TABLE(
  table_name TEXT,
  rows_deleted BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  marks_deleted BIGINT;
  rankings_deleted BIGINT;
  backups_deleted BIGINT;
BEGIN
  -- Delete expired marks
  DELETE FROM marks_active WHERE expires_at < now();
  GET DIAGNOSTICS marks_deleted = ROW_COUNT;
  
  -- Delete expired rankings cache
  DELETE FROM rankings_cache WHERE expires_at < now();
  GET DIAGNOSTICS rankings_deleted = ROW_COUNT;
  
  -- Delete old backup logs
  DELETE FROM backup_logs WHERE expires_at < now();
  GET DIAGNOSTICS backups_deleted = ROW_COUNT;
  
  -- Return results
  RETURN QUERY
  SELECT 'marks_active'::TEXT, marks_deleted
  UNION ALL
  SELECT 'rankings_cache'::TEXT, rankings_deleted
  UNION ALL
  SELECT 'backup_logs'::TEXT, backups_deleted;
END;
$$;

-- 8. Function: Archive Term Data
CREATE OR REPLACE FUNCTION archive_term_data(p_exam_period_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSONB;
  marks_count BIGINT;
  rankings_count BIGINT;
BEGIN
  -- Mark exam period as archived
  UPDATE exam_periods 
  SET is_active = false, archived_at = now()
  WHERE id = p_exam_period_id;
  
  -- Delete marks for this period
  DELETE FROM marks_active WHERE exam_period_id = p_exam_period_id;
  GET DIAGNOSTICS marks_count = ROW_COUNT;
  
  -- Delete rankings cache
  DELETE FROM rankings_cache WHERE exam_period_id = p_exam_period_id;
  GET DIAGNOSTICS rankings_count = ROW_COUNT;
  
  result := jsonb_build_object(
    'exam_period_id', p_exam_period_id,
    'marks_deleted', marks_count,
    'rankings_deleted', rankings_count,
    'archived_at', now()
  );
  
  RETURN result;
END;
$$;

-- 9. RLS Policies for new tables

ALTER TABLE students_meta ENABLE ROW LEVEL SECURITY;
ALTER TABLE marks_active ENABLE ROW LEVEL SECURITY;
ALTER TABLE rankings_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_logs ENABLE ROW LEVEL SECURITY;

-- Students Meta Policies
CREATE POLICY "Users can view students from their institution"
  ON students_meta FOR SELECT
  USING (institution_id = get_user_institution());

CREATE POLICY "Admins can manage students"
  ON students_meta FOR ALL
  USING (
    institution_id = get_user_institution() AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'principal', 'teacher')
    )
  );

-- Marks Active Policies
CREATE POLICY "Users can view marks from their institution"
  ON marks_active FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM students_meta sm
      WHERE sm.id = marks_active.student_id
      AND sm.institution_id = get_user_institution()
    )
  );

CREATE POLICY "Teachers can manage marks"
  ON marks_active FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM students_meta sm
      JOIN profiles p ON p.user_id = auth.uid()
      WHERE sm.id = marks_active.student_id
      AND sm.institution_id = get_user_institution()
      AND p.role IN ('admin', 'principal', 'teacher')
    )
  );

-- Rankings Cache Policies
CREATE POLICY "Users can view rankings from their institution"
  ON rankings_cache FOR SELECT
  USING (institution_id = get_user_institution());

CREATE POLICY "System can manage rankings"
  ON rankings_cache FOR ALL
  USING (institution_id = get_user_institution());

-- Backup Logs Policies
CREATE POLICY "Admins can view backup logs"
  ON backup_logs FOR SELECT
  USING (
    institution_id = get_user_institution() AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'principal')
    )
  );

CREATE POLICY "System can manage backup logs"
  ON backup_logs FOR ALL
  USING (institution_id = get_user_institution());

-- 10. Triggers for auto-update timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER students_meta_updated_at
  BEFORE UPDATE ON students_meta
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER marks_active_updated_at
  BEFORE UPDATE ON marks_active
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 11. Comment documentation
COMMENT ON TABLE students_meta IS 'Lightweight student metadata (permanent storage)';
COMMENT ON TABLE marks_active IS 'Temporary marks storage with TTL (auto-deleted after term)';
COMMENT ON TABLE rankings_cache IS 'Computed rankings cache (7-day TTL)';
COMMENT ON TABLE backup_logs IS 'Minimal backup metadata (30-day TTL)';

COMMENT ON FUNCTION compute_rankings_fast IS 'High-performance ranking computation using window functions';
COMMENT ON FUNCTION cleanup_expired_data IS 'Automated cleanup job for expired data (schedule with pg_cron)';
COMMENT ON FUNCTION archive_term_data IS 'Archive and delete term data after backup';
