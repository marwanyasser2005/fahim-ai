/*
  # Fix JSON operator syntax error

  1. Security
    - Fix the JSON operator syntax in admin policy
    - Use proper PostgreSQL JSON extraction syntax

  Hardened later; do not relax. This policy originally authorised admins from
  `auth.jwt() -> 'user_metadata' -> 'role'`. `user_metadata` is client-writable through
  `supabase.auth.updateUser({ data })`, so any authenticated account could grant itself
  admin on `public.users`. A later migration replaced this policy with `public.has_role`,
  but a fresh database that stops before that migration would still be self-escalatable.
  The trust root is now `app_metadata` (service-role only) plus the `user_roles` table.
*/

-- Drop the problematic policy
DROP POLICY IF EXISTS "Admins can manage all users" ON users;

-- Recreate admin policy with correct JSON syntax and a non-client-forgeable claim
CREATE POLICY "Admins can manage all users"
  ON users
  FOR ALL
  TO authenticated
  USING (
    COALESCE(
      (auth.jwt() -> 'app_metadata' ->> 'role')::text,
      ''
    ) = 'admin'
    OR EXISTS (
      SELECT 1
      FROM public.user_roles ur
      JOIN public.roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid() AND r.key = 'admin'
    )
  );
