import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase/client';
import { resolveProfileRole, staffRoles, type ProfileRole } from '@/lib/roleResolution';

export type { ProfileRole } from '@/lib/roleResolution';

/** Module-level cache so Navbar and Sidebar share one role lookup per user. */
let cachedRole: ProfileRole | null = null;
let cachedUserId: string | null = null;
const listeners = new Set<(role: ProfileRole) => void>();

export function useProfileRole() {
  const { user } = useAuth();
  const [role, setRole] = useState<ProfileRole>(cachedUserId === user?.id && cachedRole ? cachedRole : 'student');

  useEffect(() => {
    let active = true;
    if (!user) {
      cachedRole = null;
      cachedUserId = null;
      setRole('student');
      return;
    }
    if (cachedUserId === user.id && cachedRole) {
      setRole(cachedRole);
      return;
    }
    setRole('student');
    if (supabase) {
      void supabase
        .from('user_roles')
        .select('roles!inner(key)')
        .eq('user_id', user.id)
        .then(({ data }) => {
          if (!active) return;
          const rows = (data || []) as unknown as {
            roles: { key: string } | { key: string }[] | null;
          }[];
          const keys = rows.flatMap((row) => {
            if (!row.roles) return [];
            return Array.isArray(row.roles) ? row.roles.map((entry) => entry.key) : [row.roles.key];
          });
          const resolved = resolveProfileRole(keys);
          cachedRole = resolved;
          cachedUserId = user.id;
          setRole(resolved);
          listeners.forEach((listener) => listener(resolved));
        });
    }
    const listener = (value: ProfileRole) => setRole(value);
    listeners.add(listener);
    return () => {
      active = false;
      listeners.delete(listener);
    };
  }, [user]);

  return {
    role,
    isStaff: staffRoles.includes(role),
    isAdmin: role === 'admin',
  };
}
