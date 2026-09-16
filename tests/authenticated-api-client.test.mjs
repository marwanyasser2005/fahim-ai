import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const client = readFileSync(new URL('../src/lib/supabase/client.ts', import.meta.url), 'utf8');
const quiz = readFileSync(new URL('../src/lib/quiz.ts', import.meta.url), 'utf8');
const tutor = readFileSync(new URL('../src/lib/aiTutor.ts', import.meta.url), 'utf8');

describe('authenticated first-party API client', () => {
  it('attaches a current access token and performs only one forced refresh on 401', () => {
    expect(client).toContain("headers.set('Authorization', `Bearer ${accessToken}`)");
    expect(client).toContain("getFreshSession({ force: true })");
    expect(client).toContain("if (retried.status === 401)");
    expect(client).not.toMatch(/while\s*\([^)]*401/);
  });

  it('routes quiz generation, grading, and chat through the recovered session client', () => {
    expect(quiz).toMatch(/authenticatedFetch\('\/api\/quiz'/);
    expect(tutor.match(/authenticatedFetch\('\/api\/chat'/g)).toHaveLength(2);
    expect(quiz).not.toMatch(/fetch\('\/api\/quiz'/);
  });
});
