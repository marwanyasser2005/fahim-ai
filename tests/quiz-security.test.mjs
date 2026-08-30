import { describe, expect, it } from 'vitest';
import { decodeToken, encodeToken, gradeAnswer, mergeQuizQuestions, parseStructuredJson, validatedQuizQuestions } from '../api/quiz.mjs';

const secret = 'a-test-only-signing-secret-with-enough-entropy';
const payload = {
  v: 1,
  exp: Date.now() + 60_000,
  options: ['A', 'B', 'C', 'D'],
  correctIndex: 2,
  explanation: 'C follows from the stated relationship.',
  misconception: 'The learner reversed the relationship.',
  skill: 'application',
};

describe('server-signed quiz answers', () => {
  it('round-trips a valid signed question', () => {
    const token = encodeToken(payload, secret);
    expect(decodeToken(token, secret)).toMatchObject({ correctIndex: 2, skill: 'application' });
  });

  it('rejects a tampered question token', () => {
    const token = encodeToken(payload, secret);
    const [version, iv, body, tag] = token.split('.');
    const replacement = body.endsWith('A') ? 'B' : 'A';
    const tampered = `${version}.${iv}.${body.slice(0, -1)}${replacement}.${tag}`;
    expect(decodeToken(tampered, secret)).toBeNull();
  });

  it('does not expose the correct answer in a readable token payload', () => {
    const token = encodeToken(payload, secret);
    expect(token).not.toContain(Buffer.from(JSON.stringify(payload)).toString('base64url'));
    expect(token).not.toContain('correctIndex');
    expect(token).not.toContain(payload.explanation);
  });

  it('rejects expired questions', () => {
    const token = encodeToken({ ...payload, exp: Date.now() - 1 }, secret);
    expect(decodeToken(token, secret)).toBeNull();
  });

  it('grades without exposing the answer before submission', () => {
    const token = encodeToken(payload, secret);
    expect(gradeAnswer({ token, answerIndex: 2 }, secret).body).toMatchObject({
      correct: true,
      correctIndex: 2,
      xp: 25,
    });
    expect(gradeAnswer({ token, answerIndex: 0 }, secret).body).toMatchObject({
      correct: false,
      misconception: payload.misconception,
      xp: 10,
    });
  });
});

describe('structured model output parsing', () => {
  it('accepts strict JSON and fenced JSON without evaluating code', () => {
    const value = { title: 'Quiz', questions: [] };
    expect(parseStructuredJson(JSON.stringify(value))).toEqual(value);
    expect(parseStructuredJson(`\`\`\`json\n${JSON.stringify(value)}\n\`\`\``)).toEqual(value);
  });

  it('extracts the first complete JSON object from harmless prose', () => {
    expect(parseStructuredJson(`Result:\n{"title":"Quiz","questions":[]}\nDone.`)).toEqual({
      title: 'Quiz',
      questions: [],
    });
  });

  it('rejects incomplete AI questions before sealing answer tokens', () => {
    const validQuestion = {
      question: 'What is acceleration?',
      options: ['Change in velocity', 'Distance', 'Mass', 'Force'],
      correctIndex: 0,
      explanation: 'Acceleration measures the rate of change of velocity.',
      misconception: 'Confusing acceleration with distance.',
      skill: 'conceptual understanding',
      difficulty: 'medium',
    };
    expect(validatedQuizQuestions({ questions: [validQuestion, validQuestion, validQuestion] }, 3)).toHaveLength(3);
    expect(validatedQuizQuestions({ questions: [{ ...validQuestion, options: ['A', 'B'] }] }, 3)).toHaveLength(0);
    expect(validatedQuizQuestions({ questions: [validQuestion, validQuestion] }, 3)).toHaveLength(2);
  });

  it('keeps valid first-pass questions and fills only the missing slots', () => {
    const question = (label) => ({
      question: `Question ${label}`,
      options: ['A', 'B', 'C', 'D'],
      correctIndex: 0,
      explanation: 'A is supported by the relationship.',
      misconception: 'The relationship was reversed.',
      skill: 'application',
      difficulty: 'medium',
    });
    expect(mergeQuizQuestions([question('1'), question('2')], [question('2'), question('3')], 3).map((item) => item.question)).toEqual([
      'Question 1',
      'Question 2',
      'Question 3',
    ]);
  });
});
