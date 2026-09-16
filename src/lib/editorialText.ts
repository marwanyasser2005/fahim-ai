const ARABIC_CHARACTER = /[\u0600-\u06ff]/;

function polishSegment(segment: string) {
  if (!segment.trim()) return segment;
  const arabic = ARABIC_CHARACTER.test(segment);

  return segment
    .replace(/[ \t]*[—–][ \t]*/g, arabic ? '، ' : '; ')
    .replace(/(^|\n)[ \t]*---+[ \t]*(?=\n|$)/g, '$1')
    .replace(/[ \t]+([،؛:؟!?.,])/g, '$1')
    .replace(/([،؛:؟!?.,])([^\s\n\d])/g, '$1 $2')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Makes generated prose read like edited product copy without touching code.
 * Code fences stay byte-for-byte intact; only natural-language segments are
 * normalised. This keeps Arabic punctuation calm and removes the long-dash
 * habit that makes otherwise useful answers feel machine-written.
 */
export function polishGeneratedText(value: string) {
  return value
    .split(/(```[\s\S]*?```)/g)
    .map((segment) => (segment.startsWith('```') ? segment : polishSegment(segment)))
    .join('');
}

