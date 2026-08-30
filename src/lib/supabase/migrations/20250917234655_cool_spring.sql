/*
  # Create student_assessments table

  1. New Tables
    - `student_assessments`
      - `id` (uuid, primary key)
      - `student_id` (uuid, foreign key to users)
      - `assessment_id` (uuid, foreign key to assessments)
      - `answers` (jsonb)
      - `score` (integer)
      - `max_score` (integer)
      - `time_spent_minutes` (integer)
      - `submitted_at` (timestamp)

  2. Security
    - Enable RLS on `student_assessments` table
    - Students can only access their own assessment results
    - Teachers can view results for their course assessments
*/

CREATE TABLE IF NOT EXISTS student_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES users(id) ON DELETE CASCADE,
  assessment_id uuid REFERENCES assessments(id) ON DELETE CASCADE,
  answers jsonb DEFAULT '{}'::jsonb,
  score integer DEFAULT 0,
  max_score integer DEFAULT 0,
  time_spent_minutes integer DEFAULT 0,
  submitted_at timestamptz DEFAULT now(),
  UNIQUE(student_id, assessment_id)
);

-- Enable RLS
ALTER TABLE student_assessments ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Students can read their own assessment results"
  ON student_assessments
  FOR SELECT
  TO authenticated
  USING (student_id = auth.uid());

CREATE POLICY "Students can submit their own assessments"
  ON student_assessments
  FOR INSERT
  TO authenticated
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students can update their own assessments"
  ON student_assessments
  FOR UPDATE
  TO authenticated
  USING (student_id = auth.uid());

CREATE POLICY "Teachers can view results for their course assessments"
  ON student_assessments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM assessments a
      JOIN courses c ON a.course_id = c.id
      WHERE a.id = assessment_id AND c.teacher_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS student_assessments_student_id_idx ON student_assessments(student_id);
CREATE INDEX IF NOT EXISTS student_assessments_assessment_id_idx ON student_assessments(assessment_id);