/*
  # Create lessons table

  1. New Tables
    - `lessons`
      - `id` (uuid, primary key)
      - `course_id` (uuid, foreign key to courses)
      - `title` (text, required)
      - `content` (text)
      - `media_url` (text)
      - `media_type` (text)
      - `order_index` (integer)
      - `duration_minutes` (integer)
      - `is_published` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `lessons` table
    - Students can read lessons from published courses they're enrolled in
    - Teachers can manage lessons in their courses
    - Admins can manage all lessons
*/

CREATE TABLE IF NOT EXISTS lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text,
  media_url text,
  media_type text CHECK (media_type IN ('video', 'audio', 'document', 'interactive')) DEFAULT 'video',
  order_index integer DEFAULT 0,
  duration_minutes integer DEFAULT 30,
  is_published boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Students can read published lessons from enrolled courses"
  ON lessons
  FOR SELECT
  TO authenticated
  USING (
    is_published = true AND
    EXISTS (
      SELECT 1 FROM courses c
      WHERE c.id = course_id AND c.is_published = true
    )
  );

CREATE POLICY "Teachers can manage lessons in their courses"
  ON lessons
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
CREATE INDEX IF NOT EXISTS lessons_course_id_idx ON lessons(course_id);
CREATE INDEX IF NOT EXISTS lessons_order_idx ON lessons(course_id, order_index);