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
  { name: 'generic secret assignment', pattern: /(?:GEMINI_API_KEY|YOUTUBE_API_KEY|QUIZ_TOKEN_SECRET|AGENT_ROUTER_API_KEY)\s*[:=]\s*["'][^"']{12,}/i },
  { name: 'Stripe secret key', pattern: /\bsk_(?:live|test)_[0-9A-Za-z]{16,}/ },
  { name: 'Paymob secret', pattern: /(?:PAYMOB_API_KEY|PAYMOB_HMAC_SECRET|PAYMOB_INTEGRATION_ID)\s*[:=]\s*["'][^"']{8,}/i },
  { name: 'source map annotation', pattern: /sourceMappingURL\s*=/i },
];

/**
 * A Supabase JWT is only a leak when it carries the service role. The anonymous key is
 * public by design, so decode the payload instead of pattern-matching on `eyJ`.
 */
function findServiceRoleJwt(content) {
  for (const match of content.matchAll(/eyJ[A-Za-z0-9_-]{10,}\.(eyJ[A-Za-z0-9_-]{10,})\.[A-Za-z0-9_-]{10,}/g)) {
    try {
      const payload = JSON.parse(Buffer.from(match[1], 'base64url').toString('utf8'));
      if (payload?.role === 'service_role') return true;
    } catch { /* not a decodable JWT payload */ }
  }
  return false;
}

for (const file of textFiles) {
  const content = await readFile(file, 'utf8');
  for (const { name, pattern } of secretPatterns) {
    if (pattern.test(content)) failures.push(`${name} found in ${path.relative(dist, file)}`);
  }
  if (findServiceRoleJwt(content)) failures.push(`Supabase service-role JWT found in ${path.relative(dist, file)}`);
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

// ---------------------------------------------------------------------------
// Repository-level policy checks
// ---------------------------------------------------------------------------

// One deploy configuration only. A stale second platform config ships the SPA without
// the security headers above and serves HTML for /api/*, so it must not exist.
const deployConfigs = (await readdir(root)).filter((name) => /^(netlify\.toml|netlify\.json|render\.yaml|app\.yaml)$/i.test(name));
if (deployConfigs.length) failures.push(`Second deploy configuration found: ${deployConfigs.join(', ')}`);

// Exactly one migration tree, and it must be the one the Supabase CLI applies.
const migrationsRoot = path.join(root, 'supabase', 'migrations');
for (const candidate of ['src/lib/supabase/migrations', 'src/supabase/migrations', 'db/migrations']) {
  try {
    await stat(path.join(root, candidate));
    failures.push(`Duplicate migration tree found: ${candidate}`);
  } catch { /* absent is the expected state */ }
}
const migrationFiles = (await readdir(migrationsRoot)).filter((name) => name.endsWith('.sql'));

// Authorization must never trust `user_metadata`, which any client can write through
// supabase.auth.updateUser({ data }).
for (const name of migrationFiles) {
  const content = await readFile(path.join(migrationsRoot, name), 'utf8');
  const inPolicy = content
    .split(/create\s+policy/i)
    .slice(1)
    .some((block) => /user_metadata/i.test(block.split(';')[0]));
  if (inPolicy) failures.push(`RLS policy trusts client-writable user_metadata in supabase/migrations/${name}`);
}

// Every table with a policy must also have row level security switched on. Match with or
// without the `public.` qualifier so schema-less creates cannot slip past the check.
const migrationText = (await Promise.all(migrationFiles.map((name) => readFile(path.join(migrationsRoot, name), 'utf8')))).join('\n');
const createdTables = [...migrationText.matchAll(/create\s+table\s+(?:if\s+not\s+exists\s+)?(?:public\.)?"?(\w+)"?/gi)].map((match) => match[1].toLowerCase());
const rlsTables = new Set([...migrationText.matchAll(/alter\s+table\s+(?:only\s+)?(?:public\.)?"?(\w+)"?\s+enable\s+row\s+level\s+security/gi)].map((match) => match[1].toLowerCase()));
const missingRls = [...new Set(createdTables)].filter((table) => !rlsTables.has(table));
if (missingRls.length) failures.push(`Tables without row level security: ${missingRls.join(', ')}`);

const result = {
  ok: failures.length === 0,
  failures,
  scannedFiles: files.length,
  scannedTextFiles: textFiles.length,
  productionBytes: totalBytes,
  sourceMaps: relative.filter((file) => file.endsWith('.map')).length,
  migrations: migrationFiles.length,
  tablesWithRls: rlsTables.size,
};
console.log(JSON.stringify(result, null, 2));
if (failures.length) process.exitCode = 1;
