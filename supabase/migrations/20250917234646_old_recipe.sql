/*
  # Create assessments table

  1. New Tables
    - `assessments`
      - `id` (uuid, primary key)
      - `course_id` (uuid, foreign key to courses)
      - `lesson_id` (uuid, foreign key to lessons, optional)
      - `title` (text, required)
      - `question` (text, required)
      - `options` (jsonb)
      - `correct_answer` (text)
      - `points` (integer)
      - `assessment_type` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `assessments` table
    - Students can read assessments from enrolled courses
    - Teachers can manage assessments in their courses
*/

CREATE TABLE IF NOT EXISTS assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE,
  lesson_id uuid REFERENCES lessons(id) ON DELETE CASCADE,
  title text NOT NULL,
  question text NOT NULL,
  options jsonb DEFAULT '[]'::jsonb,
  correct_answer text,
  points integer DEFAULT 1,
  assessment_type text CHECK (assessment_type IN ('quiz', 'assignment', 'project', 'diagnostic')) DEFAULT 'quiz',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Students can read assessments from enrolled courses"
  ON assessments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM courses c
      WHERE c.id = course_id AND c.is_published = true
    )
  );

CREATE POLICY "Teachers can manage assessments in their courses"
  ON assessments
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM courses c
      WHERE c.id = course_id AND c.teacher_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS assessments_course_id_idx ON assessments(course_id);
CREATE INDEX IF NOT EXISTS assessments_lesson_id_idx ON assessments(lesson_id);