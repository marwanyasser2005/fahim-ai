import { mkdir, writeFile } from 'node:fs/promises';
import { benchmarkCases, rubric } from '../tests/fixtures/ai-benchmark.mjs';
import { inspectAnswer, QUALITY_VERSION } from '../api/_lib/ai-quality.mjs';

const results = benchmarkCases.map((entry) => {
  const quality = inspectAnswer(entry.text, entry.sources);
  return { id: entry.id, subject: entry.subject, language: entry.language, passed: quality.passed === entry.expectedPass, expectedPass: entry.expectedPass, issues: quality.issues };
});
const failed = results.filter((entry) => !entry.passed);
const report = {
  version: QUALITY_VERSION, generatedAt: new Date().toISOString(),
  mode: 'synthetic-contract-screening', total: results.length, passed: results.length - failed.length,
  providerCalls: 0, humanParticipants: 0,
  limitations: ['Does not measure scientific correctness, live model performance, learning gains, cost savings, or semantic entailment.', 'Six subjects, two languages, ten structural/citation variants; not 120 independently authored questions.', 'Source URLs are synthetic fixtures and were not fetched.'],
  unmeasuredRubric: rubric, results,
};
await mkdir(new URL('../public/quality/', import.meta.url), { recursive: true });
await writeFile(new URL('../public/quality/benchmark.json', import.meta.url), `${JSON.stringify(report, null, 2)}\n`);
console.log(`AI contract benchmark: ${report.passed}/${report.total}. Live accuracy and educational impact: unmeasured.`);
if (failed.length) { console.error(failed.map((entry) => entry.id).join('\n')); process.exitCode = 1; }
