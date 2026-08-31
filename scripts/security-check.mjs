import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const dist = path.join(root, 'dist');
const failures = [];

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(fullPath));
    else files.push(fullPath);
  }
  return files;
}

const files = await walk(dist);
const relative = files.map((file) => path.relative(dist, file).replaceAll('\\', '/'));
const forbiddenFiles = relative.filter((file) => /(^|\/)(\.env|\.git)(\/|$)|\.(map|tsx?|jsx)$|vite\.config/i.test(file));
if (forbiddenFiles.length) failures.push(`Forbidden production files: ${forbiddenFiles.join(', ')}`);

const textFiles = files.filter((file) => /\.(?:html|js|css|json|xml|txt|webmanifest)$/i.test(file));
const secretPatterns = [
  { name: 'Google API key', pattern: /AIza[0-9A-Za-z_-]{30,}/ },
  { name: 'private key', pattern: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/ },
  { name: 'service-role credential', pattern: /SUPABASE_SERVICE_ROLE_KEY\s*[:=]/i },
  { name: 'generic secret assignment', pattern: /(?:GEMINI_API_KEY|YOUTUBE_API_KEY|QUIZ_TOKEN_SECRET)\s*[:=]\s*["'][^"']{12,}/i },
  { name: 'source map annotation', pattern: /sourceMappingURL\s*=/i },
];

for (const file of textFiles) {
  const content = await readFile(file, 'utf8');
  for (const { name, pattern } of secretPatterns) {
    if (pattern.test(content)) failures.push(`${name} found in ${path.relative(dist, file)}`);
  }
}

const vercel = JSON.parse(await readFile(path.join(root, 'vercel.json'), 'utf8'));
const allHeaders = vercel.headers?.flatMap((item) => item.headers || []) || [];
const headerNames = new Set(allHeaders.map((header) => String(header.key).toLowerCase()));
for (const required of ['content-security-policy', 'strict-transport-security', 'x-content-type-options', 'referrer-policy', 'permissions-policy']) {
  if (!headerNames.has(required)) failures.push(`Missing security header: ${required}`);
}
const csp = allHeaders.find((header) => String(header.key).toLowerCase() === 'content-security-policy')?.value || '';
for (const directive of ["default-src 'self'", "frame-ancestors 'none'", "object-src 'none'", "script-src-attr 'none'"]) {
  if (!csp.includes(directive)) failures.push(`CSP missing directive: ${directive}`);
}

const packageJson = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
if (packageJson.private !== true) failures.push('package.json must remain private.');
const gitignore = await readFile(path.join(root, '.gitignore'), 'utf8');
if (!/(^|\r?\n)\.env\.\*(\r?\n|$)/.test(gitignore) || !/(^|\r?\n)\.vercel(\r?\n|$)/.test(gitignore)) failures.push('.gitignore does not protect environment or Vercel metadata.');

const totalBytes = (await Promise.all(files.map(async (file) => (await stat(file)).size))).reduce((sum, size) => sum + size, 0);
const result = {
  ok: failures.length === 0,
  failures,
  scannedFiles: files.length,
  scannedTextFiles: textFiles.length,
  productionBytes: totalBytes,
  sourceMaps: relative.filter((file) => file.endsWith('.map')).length,
};
console.log(JSON.stringify(result, null, 2));
if (failures.length) process.exitCode = 1;
