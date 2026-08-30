type MetricName = 'LCP' | 'CLS' | 'INP' | 'FCP' | 'TTFB';
type Metric = { name: MetricName; value: number; rating: 'good' | 'needs-improvement' | 'poor' };
const thresholds: Record<MetricName, [number, number]> = { LCP: [2500, 4000], CLS: [.1, .25], INP: [200, 500], FCP: [1800, 3000], TTFB: [800, 1800] };
const rate = (name: MetricName, value: number): Metric['rating'] => value <= thresholds[name][0] ? 'good' : value <= thresholds[name][1] ? 'needs-improvement' : 'poor';

export function startWebVitalsTelemetry() {
  if (!('PerformanceObserver' in window)) return;
  const values = new Map<MetricName, number>();
  const observe = (type: string, handler: (entry: PerformanceEntry) => void) => { try { const observer = new PerformanceObserver((list) => list.getEntries().forEach(handler)); observer.observe({ type, buffered: true }); return observer; } catch { return undefined; } };
  const observers = [
    observe('largest-contentful-paint', (entry) => values.set('LCP', entry.startTime)),
    observe('layout-shift', (entry) => { const shift = entry as PerformanceEntry & { value: number; hadRecentInput: boolean }; if (!shift.hadRecentInput) values.set('CLS', (values.get('CLS') || 0) + shift.value); }),
    observe('event', (entry) => { if (entry.duration > (values.get('INP') || 0)) values.set('INP', entry.duration); }),
    observe('paint', (entry) => { if (entry.name === 'first-contentful-paint') values.set('FCP', entry.startTime); }),
  ].filter(Boolean) as PerformanceObserver[];
  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
  if (navigation) values.set('TTFB', navigation.responseStart);
  let sent = false;
  const send = () => {
    if (sent || !values.size) return; sent = true;
    const metrics: Metric[] = [...values].map(([name, value]) => ({ name, value: Math.round(value * 100) / 100, rating: rate(name, value) }));
    navigator.sendBeacon('/api/telemetry', new Blob([JSON.stringify({ path: location.pathname, metrics })], { type: 'application/json' }));
    observers.forEach((observer) => observer.disconnect());
  };
  window.addEventListener('pagehide', send, { once: true });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') send(); }, { once: true });
}
