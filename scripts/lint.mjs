import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const ROOT = process.cwd();
const SOURCE_DIR = join(ROOT, 'src');

const JS_FILES = [];
const TEXT_FILES = [];
const TEXT_EXTENSIONS = new Set(['.js', '.jsx', '.css', '.md', '.json']);

function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === '.git') {
      continue;
    }

    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath);
      continue;
    }

    const ext = entry.name.slice(entry.name.lastIndexOf('.'));
    if (entry.name.endsWith('.js')) {
      JS_FILES.push(fullPath);
    }

    if (TEXT_EXTENSIONS.has(ext)) {
      TEXT_FILES.push(fullPath);
    }
  }
}

function runNodeCheck(filePath) {
  const result = spawnSync(process.execPath, ['--check', filePath], {
    cwd: ROOT,
    encoding: 'utf8',
  });

  if (result.status !== 0) {
    process.stderr.write(result.stderr || result.stdout || `Syntax check failed: ${filePath}\n`);
    return false;
  }

  return true;
}

walk(SOURCE_DIR);

let hasErrors = false;

for (const filePath of JS_FILES) {
  const ok = runNodeCheck(filePath);
  if (!ok) {
    hasErrors = true;
  }
}

for (const filePath of TEXT_FILES) {
  const contents = readFileSync(filePath, 'utf8');
  const hasConflictMarkers = /^(<{7}|={7}|>{7})/m.test(contents);
  if (hasConflictMarkers) {
    process.stderr.write(`Merge conflict marker found in ${filePath}\n`);
    hasErrors = true;
  }
}

if (hasErrors) {
  process.exit(1);
}

process.stdout.write(`Lint checks passed (${JS_FILES.length} JS syntax checks, ${TEXT_FILES.length} text scans).\n`);
