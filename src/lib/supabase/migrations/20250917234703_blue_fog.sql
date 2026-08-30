/*
  # Create projects table

  1. New Tables
    - `projects`
      - `id` (uuid, primary key)
      - `student_id` (uuid, foreign key to users)
      - `course_id` (uuid, foreign key to courses)
      - `title` (text, required)
      - `description` (text)
      - `file_url` (text)
      - `github_url` (text)
      - `demo_url` (text)
      - `status` (text)
      - `grade` (integer)
      - `feedback` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `projects` table
    - Students can manage their own projects
    - Teachers can view and grade projects in their courses
*/

CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES users(id) ON DELETE CASCADE,
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  file_url text,
  github_url text,
  demo_url text,
  status text CHECK (status IN ('draft', 'submitted', 'reviewed', 'approved')) DEFAULT 'draft',
  grade integer CHECK (grade >= 0 AND grade <= 100),
  feedback text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Students can manage their own projects"
  ON projects
  FOR ALL
  TO authenticated
  USING (student_id = auth.uid());

CREATE POLICY "Teachers can view and grade projects in their courses"
  ON projects
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

CREATE POLICY "Teachers can update grades and feedback"
  ON projects
  FOR UPDATE
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
CREATE INDEX IF NOT EXISTS projects_student_id_idx ON projects(student_id);
CREATE INDEX IF NOT EXISTS projects_course_id_idx ON projects(course_id);