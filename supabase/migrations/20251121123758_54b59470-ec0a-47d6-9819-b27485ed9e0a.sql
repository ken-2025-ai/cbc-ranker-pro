-- Exams Kenya: KNEC/CBC Exam Generation System

-- Main exams table
CREATE TABLE IF NOT EXISTS public.exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES auth.users(id),
  institution_id UUID REFERENCES public.admin_institutions(id),
  school_name TEXT NOT NULL,
  school_code TEXT,
  class_level TEXT NOT NULL,
  exam_type TEXT NOT NULL,
  subject TEXT NOT NULL,
  paper_number INTEGER DEFAULT 1,
  time_allowed_minutes INTEGER NOT NULL DEFAULT 60,
  total_marks INTEGER NOT NULL DEFAULT 0,
  question_count INTEGER NOT NULL DEFAULT 10,
  difficulty JSONB DEFAULT '{"easy": 40, "medium": 40, "hard": 20}'::jsonb,
  strands JSONB NOT NULL,
  include_omr BOOLEAN DEFAULT false,
  include_diagrams BOOLEAN DEFAULT false,
  extra_instructions TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'generating', 'generated', 'error', 'final')),
  generated_at TIMESTAMPTZ,
  ai_metadata JSONB DEFAULT '{}'::jsonb,
  print_html TEXT,
  cover_html TEXT,
  marking_scheme_text TEXT,
  omr_sheet JSONB,
  validation_errors JSONB DEFAULT '[]'::jsonb,
  warnings JSONB DEFAULT '[]'::jsonb,
  pdf_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Questions table
CREATE TABLE IF NOT EXISTS public.exam_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID REFERENCES public.exams(id) ON DELETE CASCADE,
  number INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('multiple_choice', 'short_answer', 'long_answer', 'calculation', 'diagram', 'practical', 'matching', 'fill_in_the_blank', 'true_false')),
  marks INTEGER NOT NULL,
  strand TEXT NOT NULL,
  sub_strand TEXT,
  bloom_level TEXT CHECK (bloom_level IN ('remember', 'understand', 'apply', 'analyse', 'evaluate', 'create')),
  difficulty_score NUMERIC(3,2) CHECK (difficulty_score >= 0 AND difficulty_score <= 1),
  question_text TEXT NOT NULL,
  options JSONB,
  expected_answer TEXT NOT NULL,
  marking_rubric JSONB NOT NULL,
  math_work_area JSONB,
  diagram_instructions JSONB,
  answer_space_lines INTEGER NOT NULL DEFAULT 2,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Curriculum embeddings for context-aware generation
CREATE TABLE IF NOT EXISTS public.curriculum_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject TEXT NOT NULL,
  class_level TEXT NOT NULL,
  strand TEXT NOT NULL,
  sub_strand TEXT,
  passage TEXT NOT NULL,
  learning_outcomes TEXT[],
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_exams_owner ON public.exams(owner_id);
CREATE INDEX IF NOT EXISTS idx_exams_institution ON public.exams(institution_id);
CREATE INDEX IF NOT EXISTS idx_exams_status ON public.exams(status);
CREATE INDEX IF NOT EXISTS idx_exam_questions_exam_id ON public.exam_questions(exam_id);
CREATE INDEX IF NOT EXISTS idx_curriculum_subject ON public.curriculum_embeddings(subject, class_level);

-- RLS Policies
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.curriculum_embeddings ENABLE ROW LEVEL SECURITY;

-- Exams policies
CREATE POLICY "Users can view their own exams"
  ON public.exams FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert their own exams"
  ON public.exams FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own exams"
  ON public.exams FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own exams"
  ON public.exams FOR DELETE
  USING (auth.uid() = owner_id);

-- Questions policies
CREATE POLICY "Users can view questions for their exams"
  ON public.exam_questions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.exams 
    WHERE exams.id = exam_questions.exam_id 
    AND exams.owner_id = auth.uid()
  ));

CREATE POLICY "Users can insert questions for their exams"
  ON public.exam_questions FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.exams 
    WHERE exams.id = exam_questions.exam_id 
    AND exams.owner_id = auth.uid()
  ));

CREATE POLICY "Users can update questions for their exams"
  ON public.exam_questions FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.exams 
    WHERE exams.id = exam_questions.exam_id 
    AND exams.owner_id = auth.uid()
  ));

CREATE POLICY "Users can delete questions for their exams"
  ON public.exam_questions FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.exams 
    WHERE exams.id = exam_questions.exam_id 
    AND exams.owner_id = auth.uid()
  ));

-- Curriculum embeddings are readable by all authenticated users
CREATE POLICY "Authenticated users can view curriculum"
  ON public.curriculum_embeddings FOR SELECT
  TO authenticated
  USING (true);

-- Auto-update trigger
CREATE OR REPLACE FUNCTION update_exam_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_exams_updated_at
  BEFORE UPDATE ON public.exams
  FOR EACH ROW
  EXECUTE FUNCTION update_exam_updated_at();