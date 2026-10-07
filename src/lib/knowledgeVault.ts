export type VaultChunk = { id: string; sourceId: string; sourceName: string; index: number; text: string; tokens: string[] };
export type VaultSource = { id: string; name: string; mimeType: string; size: number; createdAt: string; characterCount: number; chunks: VaultChunk[] };
export type RetrievalConfidence = 'high' | 'medium' | 'exploratory';
export type VaultHit = {
  chunk: VaultChunk;
  score: number;
  excerpt: string;
  confidence: RetrievalConfidence;
  coverage: number;
  matchedTerms: string[];
  reasons: ('exact_phrase' | 'bilingual_bridge' | 'term_coverage' | 'rare_term')[];
  location: string;
};

const DB_NAME = 'fahim-knowledge-v1';
const STORE = 'sources';
const MAX_FILE_SIZE = 15 * 1024 * 1024;
const MAX_CHARACTERS = 600_000;

/** Import learner-supplied captions; never implies access to an online video's transcript. */
export function parseTranscriptText(input: string): string {
  const blocks = input.replace(/^\uFEFF/, '').replace(/\r/g, '').slice(0, MAX_CHARACTERS).split(/\n\s*\n/);
  const cues: string[] = [];
  const timeMs = (time: string) => {
    const parts = time.replace(',', '.').split(':').map(Number);
    const seconds = parts.pop() || 0; const minutes = parts.pop() || 0; const hours = parts.pop() || 0;
    return minutes < 60 && seconds < 60 ? ((hours * 60 + minutes) * 60 + seconds) * 1000 : NaN;
  };
  for (const block of blocks) {
    if (/^(NOTE|STYLE|REGION)(?:\s|$)/.test(block.trim())) continue;
    const lines = block.split('\n');
    const index = lines.findIndex(line => line.includes('-->'));
    if (index < 0) continue;
    const match = lines[index].match(/^\s*((?:\d{2}:)?\d{2}:\d{2}[.,]\d{3})\s+-->\s+((?:\d{2}:)?\d{2}:\d{2}[.,]\d{3})(?:\s.*)?$/);
    if (!match || !Number.isFinite(timeMs(match[1])) || !Number.isFinite(timeMs(match[2])) || timeMs(match[2]) <= timeMs(match[1])) continue;
    const text = lines.slice(index + 1).join(' ').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').trim();
    if (text) cues.push(`[Time ${match[1].replace(',', '.')}] ${text}`);
  }
  if (!cues.length) throw new Error('empty-transcript');
  return cues.join('\n\n').slice(0, MAX_CHARACTERS);
}
const ARABIC_DIACRITICS = /[\u0610-\u061a\u064b-\u065f\u0670\u06d6-\u06ed]/g;
const CONCEPT_BRIDGES: Record<string, string[]> = {
  acceleration: ['التسارع', 'العجلة'],
  velocity: ['السرعة المتجهة', 'السرعة'],
  force: ['القوة'],
  mass: ['الكتلة'],
  energy: ['الطاقة'],
  mitosis: ['الانقسام المتساوي', 'الانقسام الميتوزي'],
  meiosis: ['الانقسام المنصف', 'الانقسام الميوزي'],
  photosynthesis: ['البناء الضوئي', 'التمثيل الضوئي'],
  derivative: ['المشتقة', 'التفاضل'],
  probability: ['الاحتمال', 'الاحتمالات'],
};

function openDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => { if (!request.result.objectStoreNames.contains(STORE)) request.result.createObjectStore(STORE, { keyPath: 'id' }); };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export function normalizeVaultText(value: string) {
  return value.toLowerCase().normalize('NFKD').replace(ARABIC_DIACRITICS, '').replace(/[\u0623\u0625\u0622]/g, '\u0627').replace(/\u0649/g, '\u064a').replace(/\u0629/g, '\u0647').replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();
}

const tokenize = (value: string) => normalizeVaultText(value).split(' ').filter((token) => token.length > 1);

export function buildVaultChunks(sourceId: string, sourceName: string, text: string): VaultChunk[] {
  const clean = text.replace(/\r/g, '').replace(/\n{3,}/g, '\n\n').trim().slice(0, MAX_CHARACTERS);
  const chunks: VaultChunk[] = [];
  let cursor = 0;
  while (cursor < clean.length) {
    let end = Math.min(clean.length, cursor + 1_000);
    if (end < clean.length) {
      const boundary = Math.max(clean.lastIndexOf('\n', end), clean.lastIndexOf('. ', end), clean.lastIndexOf('\u061f ', end));
      if (boundary > cursor + 550) end = boundary + 1;
    }
    const value = clean.slice(cursor, end).trim();
    if (value.length > 60) chunks.push({ id: `${sourceId}-${chunks.length}`, sourceId, sourceName, index: chunks.length, text: value, tokens: tokenize(value) });
    if (end === clean.length) break;
    cursor = Math.max(end - 140, cursor + 1);
  }
  return chunks.slice(0, 800);
}

async function extractPdf(file: File) {
  const pdfjs = await import('pdfjs-dist');
  const worker = await import('pdfjs-dist/build/pdf.worker.min.mjs?url');
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
  const document = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()), isEvalSupported: false }).promise;
  const pages: string[] = [];
  let pagesWithText = 0;
  const pageCount = Math.min(document.numPages, 200);
  for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
    const page = await document.getPage(pageNumber);
    const content = await page.getTextContent();
    const pageText = content.items.map((item) => 'str' in item ? item.str : '').join(' ').replace(/\s+/g, ' ').trim();
    if (pageText.length >= 20) { pages.push(`[Page ${pageNumber}]\n${pageText}`); pagesWithText += 1; }
    if (pages.join('').length >= MAX_CHARACTERS) break;
  }
  if (pageCount > 0 && pagesWithText === 0) throw new Error('ocr-required');
  return pages.join('\n\n');
}

export async function importVaultFile(file: File): Promise<VaultSource> {
  if (file.size > MAX_FILE_SIZE) throw new Error('file-too-large');
  const extension = file.name.split('.').pop()?.toLowerCase();
  const supported = ['pdf', 'txt', 'md', 'csv', 'json', 'html', 'htm', 'srt', 'vtt'];
  if (!extension || !supported.includes(extension)) throw new Error('unsupported-file');
  const raw = extension === 'pdf' ? await extractPdf(file) : await file.text();
  const text = ['srt', 'vtt'].includes(extension) ? parseTranscriptText(raw) : raw;
  const clean = text.trim().slice(0, MAX_CHARACTERS);
  if (clean.length < 80) throw new Error('empty-file');
  const id = crypto.randomUUID();
  const source: VaultSource = { id, name: file.name.slice(0, 140), mimeType: file.type || extension, size: file.size, createdAt: new Date().toISOString(), characterCount: clean.length, chunks: buildVaultChunks(id, file.name, clean) };
  const database = await openDatabase();
  await new Promise<void>((resolve, reject) => { const request = database.transaction(STORE, 'readwrite').objectStore(STORE).put(source); request.onsuccess = () => resolve(); request.onerror = () => reject(request.error); });
  database.close();
  return source;
}

export async function loadVaultSources(): Promise<VaultSource[]> {
  const database = await openDatabase();
  const items = await new Promise<VaultSource[]>((resolve, reject) => { const request = database.transaction(STORE).objectStore(STORE).getAll(); request.onsuccess = () => resolve(request.result as VaultSource[]); request.onerror = () => reject(request.error); });
  database.close();
  return items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function removeVaultSource(id: string) {
  const database = await openDatabase();
  await new Promise<void>((resolve, reject) => { const request = database.transaction(STORE, 'readwrite').objectStore(STORE).delete(id); request.onsuccess = () => resolve(); request.onerror = () => reject(request.error); });
  database.close();
}

function expandQuery(query: string) {
  const normalized = normalizeVaultText(query);
  const additions: string[] = [];
  for (const [english, arabic] of Object.entries(CONCEPT_BRIDGES)) {
    const normalizedArabic = arabic.map(normalizeVaultText);
    if (normalized.includes(english) || normalizedArabic.some((term) => normalized.includes(term))) additions.push(english, ...normalizedArabic);
  }
  return [...new Set([...tokenize(query), ...additions.flatMap(tokenize)])];
}

function fuzzyTermMatch(term: string, candidate: string) {
  if (term === candidate) return 1;
  if (term.length >= 4 && (candidate.startsWith(term) || term.startsWith(candidate))) return .72;
  if (term.length < 4 || candidate.length < 4) return 0;
  const grams = (value: string) => new Set(Array.from({ length: value.length - 2 }, (_, index) => value.slice(index, index + 3)));
  const a = grams(term); const b = grams(candidate);
  const intersection = [...a].filter((gram) => b.has(gram)).length;
  const union = new Set([...a, ...b]).size;
  return union ? intersection / union : 0;
}

function pageLocation(value: string, index: number) {
  const match = value.match(/^\[Page (\d+)]/);
  const timestamp = value.match(/\[Time ([\d:.]+)]/);
  if (timestamp) return `Transcript ${timestamp[1]} (within chunk)`;
  return match ? `Page ${match[1]}` : `Chunk ${index + 1}`;
}

export function searchVault(sources: VaultSource[], query: string, limit = 8): VaultHit[] {
  const originalTokens = [...new Set(tokenize(query))];
  const queryTokens = expandQuery(query);
  if (!queryTokens.length) return [];
  const chunks = sources.flatMap((source) => source.chunks);
  if (!chunks.length) return [];
  const averageLength = chunks.reduce((sum, chunk) => sum + chunk.tokens.length, 0) / chunks.length;
  const documentFrequency = new Map<string, number>();
  for (const token of queryTokens) documentFrequency.set(token, chunks.reduce((sum, chunk) => sum + (chunk.tokens.some((candidate) => fuzzyTermMatch(token, candidate) >= .72) ? 1 : 0), 0));
  const phrase = normalizeVaultText(query);
  return chunks.map((chunk) => {
    const normalized = normalizeVaultText(chunk.text);
    const frequencies = new Map<string, number>();
    for (const token of chunk.tokens) frequencies.set(token, (frequencies.get(token) || 0) + 1);
    const matchedTerms = new Set<string>();
    let rareTermMatches = 0;
    const lexical = queryTokens.reduce((score, token) => {
      let tf = frequencies.get(token) || 0;
      let matchStrength = tf ? 1 : 0;
      if (!tf) {
        const nearest = chunk.tokens.reduce((best, candidate) => {
          const similarity = fuzzyTermMatch(token, candidate);
          return similarity > best.similarity ? { candidate, similarity } : best;
        }, { candidate: '', similarity: 0 });
        if (nearest.similarity >= .72) { tf = frequencies.get(nearest.candidate) || 1; matchStrength = nearest.similarity; }
      }
      if (!tf) return score;
      matchedTerms.add(token);
      const frequency = documentFrequency.get(token) || 0;
      const idf = Math.log(1 + (chunks.length - frequency + .5) / (frequency + .5));
      if (idf > 1.4) rareTermMatches += 1;
      const bm25 = idf * ((tf * 2.2) / (tf + 1.2 * (1 - .75 + .75 * (chunk.tokens.length / Math.max(1, averageLength)))));
      return score + bm25 * matchStrength;
    }, 0);
    const exactPhrase = phrase.length > 4 && normalized.includes(phrase);
    const phraseBoost = exactPhrase ? 7 : 0;
    const coverage = originalTokens.length ? originalTokens.filter((token) => chunk.tokens.some((candidate) => fuzzyTermMatch(token, candidate) >= .72)).length / originalTokens.length : 0;
    const bilingualBridge = queryTokens.length > originalTokens.length && [...matchedTerms].some((token) => !originalTokens.includes(token));
    const score = lexical + phraseBoost + coverage * 5 + (bilingualBridge ? 1.6 : 0);
    const reasons: VaultHit['reasons'] = [];
    if (exactPhrase) reasons.push('exact_phrase');
    if (bilingualBridge) reasons.push('bilingual_bridge');
    if (coverage >= .6) reasons.push('term_coverage');
    if (rareTermMatches) reasons.push('rare_term');
    const confidence: RetrievalConfidence = score >= 10 && coverage >= .6 ? 'high' : score >= 5 ? 'medium' : 'exploratory';
    return { chunk, score, excerpt: chunk.text.slice(0, 720), confidence, coverage, matchedTerms: [...matchedTerms].slice(0, 8), reasons, location: pageLocation(chunk.text, chunk.index) };
  }).filter((item) => item.score > 1.2 && item.matchedTerms.length > 0).sort((a, b) => b.score - a.score || b.coverage - a.coverage).slice(0, limit);
}
