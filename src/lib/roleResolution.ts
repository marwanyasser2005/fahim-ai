export type ProfileRole = 'student' | 'instructor' | 'moderator' | 'admin';

/** Role keys the database seeds in `public.roles` (see the roles seed migration). */
export const KNOWN_ROLES: ProfileRole[] = ['student', 'instructor', 'moderator', 'admin'];

/** Roles that unlock staff-only navigation and cockpit entry points. */
export const staffRoles: ProfileRole[] = ['instructor', 'moderator', 'admin'];

/** Highest privilege wins when an account holds more than one role. */
const roleRank: Record<ProfileRole, number> = { student: 0, instructor: 1, moderator: 2, admin: 3 };

export function isProfileRole(value: unknown): value is ProfileRole {
  return typeof value === 'string' && (KNOWN_ROLES as string[]).includes(value);
}

/** Resolves the effective role from the set of role keys a learner holds. */
export function resolveProfileRole(roleKeys: readonly string[]): ProfileRole {
  return roleKeys.reduce<ProfileRole>((best, key) => {
    if (!isProfileRole(key)) return best;
    return roleRank[key] > roleRank[best] ? key : best;
  }, 'student');
}
