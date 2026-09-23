#!/usr/bin/env node
// Detect which ACC course modules changed between two ACC commits, by mapping
// changed paths to module numbers. Used by the pull-model regenerate workflow.
//
// Mapping rules (a path affects module N when it matches):
//   content/NN-*.md            -> module NN   (module body)
//   content/NN-<slug>.md       -> module NN
//   assets/NN/**               -> module NN   (module solution assets)
//
// Usage:
//   node detect-affected-modules.mjs --acc <acc-repo-path> --from <sha> --to <sha>
//   node detect-affected-modules.mjs --acc <path> --to <sha>        # no --from: treat as first run
//
// Output (stdout, JSON): { "modules": [4,6], "min": 4, "fromModule": 4, "firstRun": false, "baselineMissing": false }
//   modules         sorted unique affected module numbers (1..7)
//   min             smallest affected module (the cascade root), or null when none
//   fromModule      generator --from value = min (module N produces start-of-module-(N+1))
//   firstRun        true when --from was absent/empty OR unreachable (caller: full regen)
//   baselineMissing true when a --from was supplied but is not a reachable commit in --acc
//
// Robustness: if the supplied --from is not a reachable commit in the ACC repo (e.g. the
// ACC history was rewritten/force-pushed and the recorded baseline was orphaned), we do NOT
// crash on `git diff <bad-object>`. Instead we fall back to first-run semantics (full regen).

import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

function parseArgs(argv) {
  const a = { acc: null, from: null, to: null };
  for (let i = 0; i < argv.length; i++) {
    switch (argv[i]) {
      case '--acc': a.acc = argv[++i]; break;
      case '--from': a.from = argv[++i]; break;
      case '--to': a.to = argv[++i]; break;
      default: throw new Error(`Unknown arg: ${argv[i]}`);
    }
  }
  if (!a.acc) throw new Error('--acc <path> is required');
  if (!a.to) throw new Error('--to <sha> is required');
  return a;
}

function git(cwd, ...args) {
  return execFileSync('git', args, { cwd, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
}

// True when `rev` resolves to a commit object that is actually present in the repo at `cwd`.
// Guards against a recorded baseline SHA that was orphaned by an ACC history rewrite, which
// would otherwise make `git diff <bad-object>` abort with "fatal: bad object".
function commitExists(cwd, rev) {
  try {
    execFileSync('git', ['rev-parse', '--verify', '--quiet', `${rev}^{commit}`], { cwd, stdio: 'ignore' });
    return true;
  } catch (err) {
    // `git rev-parse --verify --quiet` exits 1 (silently) for a well-formed but
    // unknown/unreachable revision. Any other failure (bad --acc path, not a git repo,
    // git missing) exits 128 or fails to spawn; rethrow so real errors fail fast instead
    // of masquerading as a missing baseline and silently triggering a full regen.
    if (err && err.status === 1) return false;
    throw err;
  }
}

export { commitExists };

function moduleForPath(p) {
  // content/NN-*.md
  let m = p.match(/^content\/(\d{2})-.*\.md$/);
  if (m) return parseInt(m[1], 10);
  // assets/NN/...
  m = p.match(/^assets\/(\d{2})(\/|$)/);
  if (m) return parseInt(m[1], 10);
  return null;
}

export { moduleForPath };

function main() {
  const args = parseArgs(process.argv.slice(2));
  // Normalize revisions once so the existence check and the diff always use the exact
  // same strings (a stray newline/space, e.g. from a file, must not let the check pass
  // while `git diff` still aborts on a bad revision).
  const from = (args.from || '').trim();
  const to = (args.to || '').trim();
  const hasFrom = from !== '';

  // A supplied baseline that is no longer reachable in the ACC repo (history rewrite / orphaned
  // SHA) is treated as a missing baseline: fall back to first-run instead of crashing on git diff.
  const baselineMissing = hasFrom && !commitExists(args.acc, from);
  if (baselineMissing) {
    console.error(`WARN: baseline commit ${from} is not reachable in --acc; treating as first run (full regen).`);
  }
  const firstRun = !hasFrom || baselineMissing;

  let files = [];
  if (!firstRun) {
    const out = git(args.acc, 'diff', '--name-only', from, to);
    files = out.split('\n').map(s => s.trim()).filter(Boolean);
  }

  const set = new Set();
  for (const f of files) {
    const n = moduleForPath(f);
    if (n && n >= 1 && n <= 7) set.add(n);
  }
  const modules = [...set].sort((x, y) => x - y);
  const min = modules.length ? modules[0] : null;

  process.stdout.write(JSON.stringify({
    modules,
    min,
    fromModule: min,
    firstRun,
    baselineMissing,
  }));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  try { main(); } catch (e) { console.error('ERROR: ' + e.message); process.exit(1); }
}
