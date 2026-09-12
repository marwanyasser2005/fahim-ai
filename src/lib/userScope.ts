/**
 * Per-user localStorage scoping. Learning stores append the signed-in user id
 * so two accounts on one device never see each other's data. The pre-scope
 * legacy key is migrated once into the first account that opens the app, and
 * is left untouched afterwards to avoid destroying shared-device data.
 */

let currentUserId: string | null = null;

export function setUserScope(userId: string | null) {
  currentUserId = userId;
}

export function getUserScope() {
  return currentUserId;
}

export function scopedKey(base: string) {
  return currentUserId ? `${base}:${currentUserId}` : base;
}

/** Copy legacy unscoped data into this user's scope exactly once. */
export function migrateLegacyKey(base: string) {
  const storage = availableStorage();
  if (!storage || !currentUserId) return;
  const scoped = scopedKey(base);
  if (storage.getItem(scoped) !== null) return;
  const legacy = storage.getItem(base);
  if (legacy !== null) storage.setItem(scoped, legacy);
}

/** Some runtimes define localStorage only on one of window/globalThis. */
function availableStorage(): Storage | null {
  if (typeof window === 'undefined' && typeof localStorage === 'undefined') return null;
  try {
    const candidate = typeof localStorage !== 'undefined' ? localStorage : window.localStorage;
    return candidate ?? null;
  } catch {
    return null;
  }
}

export function readScopedJson<T>(base: string, fallback: T): T {
  const storage = availableStorage();
  if (!storage) return fallback;
  migrateLegacyKey(base);
  try {
    const parsed = JSON.parse(storage.getItem(scopedKey(base)) || '') as T;
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

export function writeScopedJson(base: string, value: unknown) {
  const storage = availableStorage();
  if (!storage) return;
  storage.setItem(scopedKey(base), JSON.stringify(value));
}
