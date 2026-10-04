/**
 * Public competition mode: every visitor receives an isolated anonymous
 * Supabase identity and can explore the complete learner experience without
 * seeing registration or sign-in UI. Set VITE_OPEN_JUDGE_MODE=false to restore
 * the account-entry surfaces after the competition window.
 */
export const OPEN_JUDGE_MODE = import.meta.env.VITE_OPEN_JUDGE_MODE !== 'false';
