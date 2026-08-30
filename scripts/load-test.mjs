const target = process.env.TARGET_URL || 'http://127.0.0.1:5173';
const concurrency = Math.max(1, Math.min(100, Number(process.env.CONCURRENCY) || 10));
const requestsPerWorker = Math.max(1, Math.min(1000, Number(process.env.REQUESTS_PER_WORKER) || 20));
const paths = (process.env.LOAD_PATHS || '/,/courses,/library,/api/health').split(',').map((value) => value.trim()).filter(Boolean);
const samples = []; const pathSamples = new Map(); let failures = 0; const started = performance.now();
async function worker(workerId) {
  for (let index = 0; index < requestsPerWorker; index += 1) {
    const path = paths[(workerId + index) % paths.length]; const begin = performance.now();
    let ok = false;
    try { const response = await fetch(new URL(path, target), { signal: AbortSignal.timeout(10000), headers: { 'User-Agent': 'FahimLoadAudit/1.0' } }); await response.arrayBuffer(); ok = response.ok; if (!ok) failures += 1; }
    catch { failures += 1; }
    const elapsed = performance.now() - begin;
    samples.push(elapsed);
    const current = pathSamples.get(path) || { samples: [], failures: 0 };
    current.samples.push(elapsed); if (!ok) current.failures += 1; pathSamples.set(path, current);
  }
}
await Promise.all(Array.from({ length: concurrency }, (_, index) => worker(index)));
samples.sort((a, b) => a - b); const totalMs = performance.now() - started; const percentile = (value) => samples[Math.min(samples.length - 1, Math.floor(samples.length * value))] || 0;
const byPath = Object.fromEntries([...pathSamples].map(([path, value]) => { value.samples.sort((a, b) => a - b); const at = (ratio) => value.samples[Math.min(value.samples.length - 1, Math.floor(value.samples.length * ratio))] || 0; return [path, { requests: value.samples.length, failures: value.failures, p50: Math.round(at(.5)), p95: Math.round(at(.95)), max: Math.round(value.samples.at(-1) || 0) }]; }));
const result = { target, requests: samples.length, concurrency, failures, errorRate: samples.length ? failures / samples.length : 1, durationMs: Math.round(totalMs), requestsPerSecond: Math.round((samples.length / totalMs) * 1000 * 100) / 100, latencyMs: { p50: Math.round(percentile(.5)), p95: Math.round(percentile(.95)), p99: Math.round(percentile(.99)), max: Math.round(samples.at(-1) || 0) }, byPath };
console.log(JSON.stringify(result, null, 2));
if (result.errorRate > .01 || result.latencyMs.p95 > 2500) process.exitCode = 1;
