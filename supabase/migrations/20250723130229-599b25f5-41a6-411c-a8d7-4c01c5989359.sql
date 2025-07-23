-- Create institutions table for multi-tenancy
CREATE TABLE public.institutions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  code TEXT UNIQUE NOT NULL,
  address TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create students table
CREATE TABLE public.students (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  admission_number TEXT NOT NULL,
  full_name TEXT NOT NULL,
  grade TEXT NOT NULL,
  stream TEXT,
  year INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM now()),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(institution_id, admission_number)
);

-- Create subjects table
CREATE TABLE public.subjects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  level TEXT NOT NULL CHECK (level IN ('upper_primary', 'junior_secondary')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create exam periods table
CREATE TABLE public.exam_periods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  term INTEGER NOT NULL CHECK (term IN (1, 2, 3)),
  year INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM now()),
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create marks table for storing student marks
CREATE TABLE public.marks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  exam_period_id UUID NOT NULL REFERENCES exam_periods(id) ON DELETE CASCADE,
  score NUMERIC(5,2) NOT NULL CHECK (score >= 0 AND score <= 100),
  grade TEXT,
  remarks TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(student_id, subject_id, exam_period_id)
);

-- Create institution_users table to link users to institutions
CREATE TABLE public.institution_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'teacher' CHECK (role IN ('admin', 'teacher', 'principal')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, institution_id)
);

-- Enable Row Level Security
ALTER TABLE public.institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.institution_users ENABLE ROW LEVEL SECURITY;

-- RLS Policies for institutions
CREATE POLICY "Users can view their own institution" ON public.institutions
FOR SELECT USING (
  id IN (
    SELECT institution_id FROM institution_users 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own institution" ON public.institutions
FOR UPDATE USING (
  id IN (
    SELECT institution_id FROM institution_users 
    WHERE user_id = auth.uid() AND role IN ('admin', 'principal')
  )
);

-- RLS Policies for students
CREATE POLICY "Users can view students from their institution" ON public.students
FOR SELECT USING (
  institution_id IN (
    SELECT institution_id FROM institution_users 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert students to their institution" ON public.students
FOR INSERT WITH CHECK (
  institution_id IN (
    SELECT institution_id FROM institution_users 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update students from their institution" ON public.students
FOR UPDATE USING (
  institution_id IN (
    SELECT institution_id FROM institution_users 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete students from their institution" ON public.students
FOR DELETE USING (
  institution_id IN (
    SELECT institution_id FROM institution_users 
    WHERE user_id = auth.uid() AND role IN ('admin', 'principal')
  )
);

-- RLS Policies for subjects (public read)
CREATE POLICY "Anyone can view subjects" ON public.subjects
FOR SELECT USING (true);

-- RLS Policies for exam periods
CREATE POLICY "Users can view exam periods from their institution" ON public.exam_periods
FOR SELECT USING (
  institution_id IN (
    SELECT institution_id FROM institution_users 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert exam periods to their institution" ON public.exam_periods
FOR INSERT WITH CHECK (
  institution_id IN (
    SELECT institution_id FROM institution_users 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update exam periods from their institution" ON public.exam_periods
FOR UPDATE USING (
  institution_id IN (
    SELECT institution_id FROM institution_users 
    WHERE user_id = auth.uid()
  )
);

-- RLS Policies for marks
CREATE POLICY "Users can view marks from their institution students" ON public.marks
FOR SELECT USING (
  student_id IN (
    SELECT s.id FROM students s
    JOIN institution_users iu ON s.institution_id = iu.institution_id
    WHERE iu.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert marks for their institution students" ON public.marks
FOR INSERT WITH CHECK (
  student_id IN (
    SELECT s.id FROM students s
    JOIN institution_users iu ON s.institution_id = iu.institution_id
    WHERE iu.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update marks for their institution students" ON public.marks
FOR UPDATE USING (
  student_id IN (
    SELECT s.id FROM students s
    JOIN institution_users iu ON s.institution_id = iu.institution_id
    WHERE iu.user_id = auth.uid()
  )
);

-- RLS Policies for institution_users
CREATE POLICY "Users can view their own institution relationships" ON public.institution_users
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can insert institution users" ON public.institution_users
FOR INSERT WITH CHECK (
  institution_id IN (
    SELECT institution_id FROM institution_users 
    WHERE user_id = auth.uid() AND role IN ('admin', 'principal')
  )
);

-- Insert default subjects
INSERT INTO public.subjects (name, code, level) VALUES
('Mathematics', 'MATH', 'upper_primary'),
('English', 'ENG', 'upper_primary'),
('Kiswahili', 'KIS', 'upper_primary'),
('Science and Technology', 'SCI', 'upper_primary'),
('Social Studies', 'SST', 'upper_primary'),
('Creative Arts', 'CA', 'upper_primary'),
('Physical and Health Education', 'PHE', 'upper_primary'),
('Christian Religious Education', 'CRE', 'upper_primary'),
('Islamic Religious Education', 'IRE', 'upper_primary'),
('Hindu Religious Education', 'HRE', 'upper_primary'),
('Mathematics', 'MATH', 'junior_secondary'),
('English', 'ENG', 'junior_secondary'),
('Kiswahili', 'KIS', 'junior_secondary'),
('Integrated Science', 'SCI', 'junior_secondary'),
('Social Studies', 'SST', 'junior_secondary'),
('Pre-Technical Studies', 'PTS', 'junior_secondary'),
('Creative Arts', 'CA', 'junior_secondary'),
('Physical and Health Education', 'PHE', 'junior_secondary'),
('Christian Religious Education', 'CRE', 'junior_secondary'),
('Islamic Religious Education', 'IRE', 'junior_secondary'),
('Hindu Religious Education', 'HRE', 'junior_secondary');

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_institutions_updated_at
  BEFORE UPDATE ON public.institutions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_students_updated_at
  BEFORE UPDATE ON public.students
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_marks_updated_at
  BEFORE UPDATE ON public.marks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();