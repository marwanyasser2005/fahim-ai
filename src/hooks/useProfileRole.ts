import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase/client';

export type ProfileRole = 'student' | 'teacher' | 'instructor' | 'admin' | 'moderator';

const staffRoles: ProfileRole[] = ['teacher', 'instructor', 'admin', 'moderator'];

/** Module-level cache so Navbar and Sidebar share one profiles lookup per user. */
let cachedRole: string | null = null;
let cachedUserId: string | null = null;
const listeners = new Set<(role: string) => void>();

export function useProfileRole() {
  const { user } = useAuth();
  const [role, setRole] = useState(cachedUserId === user?.id ? cachedRole || 'student' : 'student');

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
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle()
        .then(({ data }) => {
          if (!active) return;
          cachedRole = data?.role || 'student';
          cachedUserId = user.id;
          listeners.forEach((listener) => listener(cachedRole!));
        });
    }
    const listener = (value: string) => setRole(value);
    listeners.add(listener);
    return () => {
      active = false;
      listeners.delete(listener);
    };
  }, [user]);

  return {
    role,
    isStaff: staffRoles.includes(role as ProfileRole),
    isAdmin: role === 'admin',
  };
}
