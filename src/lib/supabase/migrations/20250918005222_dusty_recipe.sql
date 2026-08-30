/*
  # Fix JSON operator syntax error

  1. Security
    - Fix the JSON operator syntax in admin policy
    - Use proper PostgreSQL JSON extraction syntax
*/

-- Drop the problematic policy
DROP POLICY IF EXISTS "Admins can manage all users" ON users;

-- Recreate admin policy with correct JSON syntax
CREATE POLICY "Admins can manage all users"
  ON users
  FOR ALL
  TO authenticated
  USING (
    COALESCE(
      (auth.jwt() -> 'user_metadata' ->> 'role')::text,
      (auth.jwt() -> 'app_metadata' ->> 'role')::text,
      ''
    ) = 'admin'
  );