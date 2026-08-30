import { useCallback, useEffect, useState } from 'react';
import { EMPTY_BADGE_PROGRESS, normalizeBadgeProgress, type BadgeProgress } from '@/lib/badges';
import { getFreshSession, supabase } from '@/lib/supabase/client';

export function useBadgeProgress() {
  const [progress, setProgress] = useState<BadgeProgress>(EMPTY_BADGE_PROGRESS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const refresh = useCallback(async () => {
    if (!supabase) { setError(true); setLoading(false); return; }
    setLoading(true);
    const fresh = await getFreshSession();
    if (!fresh.session) { setError(true); setLoading(false); return; }
    const { data, error: rpcError } = await supabase.rpc('my_badge_progress_v1');
    if (rpcError) setError(true);
    else { setProgress(normalizeBadgeProgress(data)); setError(false); }
    setLoading(false);
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);
  return { progress, loading, error, refresh };
}
