/*
  # Create progress_tracking table

  1. New Tables
    - `progress_tracking`
      - `id` (uuid, primary key)
      - `student_id` (uuid, foreign key to users)
      - `course_id` (uuid, foreign key to courses)
      - `lesson_id` (uuid, foreign key to lessons)
      - `status` (text with check constraint)
      - `completion_percentage` (integer)
      - `time_spent_minutes` (integer)
      - `last_accessed_at` (timestamp)
      - `completed_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `progress_tracking` table
    - Students can only access their own progress
    - Teachers can view progress for their courses
*/

CREATE TABLE IF NOT EXISTS progress_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES users(id) ON DELETE CASCADE,
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE,
  lesson_id uuid REFERENCES lessons(id) ON DELETE CASCADE,
  status text CHECK (status IN ('not_started', 'in_progress', 'completed')) DEFAULT 'not_started',
  completion_percentage integer DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
  time_spent_minutes integer DEFAULT 0,
  last_accessed_at timestamptz,
  completed_at timestamptz,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(student_id, lesson_id)
);

-- Enable RLS
ALTER TABLE progress_tracking ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Students can manage their own progress"
  ON progress_tracking
  FOR ALL
  TO authenticated
  USING (student_id = auth.uid());

CREATE POLICY "Teachers can view progress for their courses"
  ON progress_tracking
  FOR SELECT
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
CREATE INDEX IF NOT EXISTS progress_tracking_student_id_idx ON progress_tracking(student_id);
CREATE INDEX IF NOT EXISTS progress_tracking_course_id_idx ON progress_tracking(course_id);
CREATE INDEX IF NOT EXISTS progress_tracking_lesson_id_idx ON progress_tracking(lesson_id);