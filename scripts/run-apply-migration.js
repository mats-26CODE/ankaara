const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const payloadPath = process.argv[2];
if (!payloadPath) {
  console.error('Usage: node scripts/run-apply-migration.js <payload.json>');
  process.exit(1);
}

const payload = JSON.parse(fs.readFileSync(payloadPath, 'utf8'));
const workdir = path.resolve(__dirname, '..');

const sqlFile = path.join(workdir, '.tmp-apply-migration.sql');
fs.writeFileSync(sqlFile, payload.query, 'utf8');

try {
  const out = execFileSync(
    'npx',
    ['supabase@2.107.0', 'db', 'query', '--linked', '-f', sqlFile, '-o', 'json', '--yes'],
    { cwd: workdir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }
  );
  console.log(JSON.stringify({ success: true, name: payload.name, output: out.trim() }));
} catch (err) {
  const stderr = err.stderr ? err.stderr.toString() : String(err);
  const stdout = err.stdout ? err.stdout.toString() : '';
  console.log(JSON.stringify({ success: false, name: payload.name, error: stderr || stdout || String(err) }));
  process.exit(1);
} finally {
  try { fs.unlinkSync(sqlFile); } catch {}
}
