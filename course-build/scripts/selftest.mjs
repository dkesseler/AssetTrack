#!/usr/bin/env node
// Self-test for the course-build classification + detection logic. No framework;
// run with `node course-build/scripts/selftest.mjs`. Exits non-zero on failure.

import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { moduleForPath } from './detect-affected-modules.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..', '..');

let failures = 0;
function check(name, cond) {
  if (cond) { console.log(`  ok  ${name}`); }
  else { console.error(`FAIL  ${name}`); failures++; }
}

console.log('detect-affected-modules.moduleForPath:');
check('content/04-lifecycle-hooks.md -> 4', moduleForPath('content/04-lifecycle-hooks.md') === 4);
check('content/01-intro.md -> 1', moduleForPath('content/01-intro.md') === 1);
check('assets/04/.github/hooks/hooks.json -> 4', moduleForPath('assets/04/.github/hooks/hooks.json') === 4);
check('assets/06/x -> 6', moduleForPath('assets/06/x') === 6);
check('README.md -> null', moduleForPath('README.md') === null);
check('content/notes.md -> null (no NN prefix)', moduleForPath('content/notes.md') === null);
check('assets/4/x -> null (not zero-padded)', moduleForPath('assets/4/x') === null);
check('src/assets/04/x -> null (not at root)', moduleForPath('src/assets/04/x') === null);

console.log('manifest source classification:');
const manifest = JSON.parse(readFileSync(resolve(repoRoot, 'course-build/manifest.json'), 'utf8'));
const VALID = new Set(['asset', 'seed', 'stored']);
for (const m of manifest.modules) {
  check(`module ${m.module} has valid source '${m.source}'`, VALID.has(m.source));
  if (m.source === 'asset') {
    check(`module ${m.module} (asset) has assetRoot`, typeof m.assetRoot === 'string' && m.assetRoot.length > 0);
  }
}
// Known classification (guards against accidental reclassification).
const bySource = Object.fromEntries(manifest.modules.map(m => [m.module, m.source]));
check('M01=stored', bySource[1] === 'stored');
check('M02=stored', bySource[2] === 'stored');
check('M03=stored', bySource[3] === 'stored');
check('M04=asset', bySource[4] === 'asset');
check('M05=seed', bySource[5] === 'seed');
check('M06=seed', bySource[6] === 'seed');

// Baseline reachability + first-run fallback (integration: real temp git repo).
// Guards the regenerate workflow against an orphaned .last-acc-sha crashing `git diff`.
console.log('detect-affected-modules baseline fallback:');
{
  const { execFileSync } = await import('node:child_process');
  const { mkdtempSync, writeFileSync, mkdirSync, rmSync } = await import('node:fs');
  const { tmpdir } = await import('node:os');
  const { join } = await import('node:path');
  const { commitExists } = await import('./detect-affected-modules.mjs');

  const script = resolve(__dirname, 'detect-affected-modules.mjs');
  const repo = mkdtempSync(join(tmpdir(), 'acc-detect-'));
  const g = (...a) => execFileSync('git', a, { cwd: repo, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  const detect = (...a) => JSON.parse(execFileSync(process.execPath, [script, '--acc', repo, ...a], { encoding: 'utf8' }));
  try {
    g('init', '-q');
    g('config', 'user.email', 'test@example.com');
    g('config', 'user.name', 'test');
    mkdirSync(join(repo, 'content'));
    writeFileSync(join(repo, 'content', '03-x.md'), 'a\n');
    g('add', '-A'); g('commit', '-q', '-m', 'c1');
    const from = g('rev-parse', 'HEAD').trim();
    writeFileSync(join(repo, 'content', '05-y.md'), 'b\n');
    g('add', '-A'); g('commit', '-q', '-m', 'c2');
    const to = g('rev-parse', 'HEAD').trim();

    check('commitExists true for real commit', commitExists(repo, from) === true);
    const BOGUS = 'b17669201ec145c91db7175e1fa4a1d60ba9fc01';
    check('commitExists false for orphaned SHA', commitExists(repo, BOGUS) === false);

    // A non-git directory is a real error, not a missing baseline: must rethrow, not return false.
    const notARepo = mkdtempSync(join(tmpdir(), 'acc-norepo-'));
    let threw = false;
    try { commitExists(notARepo, from); } catch { threw = true; } finally { rmSync(notARepo, { recursive: true, force: true }); }
    check('commitExists rethrows on non-git dir (fails fast)', threw === true);

    const good = detect('--from', from, '--to', to);
    check('valid baseline diffs (module 5 detected)', good.min === 5 && good.firstRun === false && good.baselineMissing === false);

    // A baseline with surrounding whitespace (e.g. read from a file) must be normalized
    // so the existence check and the diff agree; it must not fall into a spurious regen.
    const padded = detect('--from', `\n  ${from}\n`, '--to', to);
    check('whitespace-padded baseline is normalized (still module 5)', padded.min === 5 && padded.firstRun === false);

    const missing = detect('--from', BOGUS, '--to', to);
    check('orphaned baseline -> firstRun (no crash)', missing.firstRun === true && missing.baselineMissing === true);
  } finally {
    rmSync(repo, { recursive: true, force: true });
  }
}

if (failures) { console.error(`\n${failures} check(s) failed.`); process.exit(1); }
console.log('\nAll self-test checks passed.');
