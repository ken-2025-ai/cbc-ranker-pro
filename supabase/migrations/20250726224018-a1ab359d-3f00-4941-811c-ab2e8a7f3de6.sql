-- Insert CBC subjects for Grade 4-9
INSERT INTO public.subjects (name, code, level) VALUES
-- Core subjects
('English', 'ENG', 'Primary'),
('Kiswahili', 'KIS', 'Primary'),
('Kenyan Sign Language (KSL)', 'KSL', 'Primary'),
('Mathematics', 'MAT', 'Primary'),
('Science and Technology', 'SCI', 'Primary'),
('Integrated Science', 'INT_SCI', 'Secondary'),
('Social Studies', 'SOC', 'Primary'),
('Agriculture', 'AGR', 'Primary'),
('Home Science', 'HMS', 'Primary'),
('Religious Education (CRE)', 'CRE', 'Primary'),
('Religious Education (IRE)', 'IRE', 'Primary'),
('Religious Education (HRE)', 'HRE', 'Primary'),
('Life Skills Education', 'LSE', 'Primary'),
('Creative Arts', 'CRA', 'Primary'),
('Visual Arts', 'VIS', 'Primary'),
('Performing Arts', 'PER', 'Primary'),
('Business Studies', 'BUS', 'Secondary'),
('Pre-Technical and Pre-Career Education', 'PTC', 'Primary'),
('Physical and Health Education', 'PHE', 'Primary'),
('Health Education', 'HED', 'Primary'),
('Computer Science', 'COM', 'Primary'),
-- Indigenous Languages
('Indigenous Languages', 'IND', 'Primary'),
-- Foreign Languages
('French', 'FRE', 'Primary'),
('German', 'GER', 'Primary'),
('Mandarin', 'MAN', 'Primary'),
('Arabic', 'ARA', 'Primary')
ON CONFLICT (code) DO NOTHING;