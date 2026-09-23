#!/usr/bin/env node
// Deterministically re-derive an `asset`-class module's delta from the checked-in
// ACC assets under its assetRoot — with NO module-runner / AI. The produced state
// of an asset module IS exactly the files under assets/NN/** (path stripped of the
// assetRoot prefix), copied with their ACC file modes.
//
// It builds the module's start state (start-of-module-N = modules 1..N-1 applied
// onto acc-base), overlays the ACC asset files, and computes the produced tree.
// If that tree already equals manifest.expectedTreeSha, nothing changed. Otherwise
// (with --apply) it regenerates the delta patch series deterministically and
// updates the manifest (expectedTreeSha + expectedAssets).
//
// Usage:
//   node course-build/scripts/rederive-asset-module.mjs --acc <acc-checkout> --module N [--apply]
//
// Output (stdout JSON): { "module": 4, "source": "asset", "changed": false,
//                         "producedTree": "<sha>", "expectedTreeSha": "<sha>",
//                         "targets": ["...","..."] }
// Exit 0 on success (changed or not); non-zero on error / misuse.

import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdtempSync, rmSync, statSync, copyFileSync, mkdirSync, readdirSync, chmodSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..', '..');
// Fixed identity/date so a re-derived patch is byte-stable across runs; the patch
// only regenerates when the produced tree actually changes.
const BOT = { name: 'acc-course-bot', email: 'acc-course-bot@users.noreply.github.com', date: '2020-01-01T00:00:00Z' };

function parseArgs(argv) {
  const a = { acc: null, module: null, apply: false, manifest: null };
  for (let i = 0; i < argv.length; i++) {
    switch (argv[i]) {
      case '--acc': a.acc = argv[++i]; break;
      case '--module': a.module = parseInt(argv[++i], 10); break;
      case '--apply': a.apply = true; break;
      case '--manifest': a.manifest = argv[++i]; break;
      default: throw new Error(`Unknown arg: ${argv[i]}`);
    }
  }
  if (!a.acc) throw new Error('--acc <path> required');
  if (!a.module) throw new Error('--module N required');
  return a;
}

function git(cwd, env, ...args) {
  return execFileSync('git', args, { cwd, env: { ...process.env, ...env }, encoding: 'utf8', maxBuffer: 128 * 1024 * 1024 }).trim();
}

function walk(dir, base, out) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p, base, out);
    else if (e.isFile()) out.push(relative(base, p));
  }
  return out;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const manifestPath = args.manifest ? resolve(args.manifest) : join(repoRoot, 'course-build', 'manifest.json');
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  const courseBuildDir = join(repoRoot, 'course-build');
  const mod = manifest.modules.find(m => m.module === args.module);
  if (!mod) throw new Error(`module ${args.module} not in manifest`);
  if (mod.source !== 'asset') throw new Error(`module ${args.module} is source='${mod.source}', not 'asset'`);
  const assetRoot = mod.assetRoot;
  if (!assetRoot) throw new Error(`module ${args.module} has no assetRoot`);

  const assetDir = join(args.acc, assetRoot);
  let files;
  try { files = walk(assetDir, assetDir, []).sort(); }
  catch { throw new Error(`asset root not found in ACC checkout: ${assetRoot}`); }
  if (files.length === 0) throw new Error(`no files under ${assetRoot} in ACC checkout`);

  const baseSha = manifest.base.sha;
  const wt = mkdtempSync(join(tmpdir(), 'acc-rederive-'));
  try {
    git(repoRoot, {}, 'worktree', 'add', '-q', '--detach', wt, baseSha);
    // Build start-of-module-N: apply every module delta below N in order.
    for (const m of manifest.modules.filter(x => x.module < args.module).sort((a, b) => a.module - b.module)) {
      const patches = (m.patches || []).map(p => join(courseBuildDir, m.deltaDir, p));
      if (patches.length) git(wt, {}, 'am', '-q', '--whitespace=nowarn', ...patches);
    }

    // Overlay the ACC asset files (stripped of assetRoot), preserving mode.
    const targets = [];
    for (const rel of files) {
      const src = join(assetDir, rel);
      const dst = join(wt, rel);
      mkdirSync(dirname(dst), { recursive: true });
      copyFileSync(src, dst);
      chmodSync(dst, statSync(src).mode);
      targets.push(rel);
    }
    git(wt, {}, 'add', '--', ...targets);
    // Commit with fixed identity/date -> deterministic patch bytes.
    const env = {
      GIT_AUTHOR_NAME: BOT.name, GIT_AUTHOR_EMAIL: BOT.email, GIT_AUTHOR_DATE: BOT.date,
      GIT_COMMITTER_NAME: BOT.name, GIT_COMMITTER_EMAIL: BOT.email, GIT_COMMITTER_DATE: BOT.date,
    };
    git(wt, env, 'commit', '-q', '-m', `chore(asset): re-derive module ${args.module} from ${assetRoot}`);
    const producedTree = git(wt, {}, 'rev-parse', 'HEAD^{tree}');
    const changed = producedTree !== mod.expectedTreeSha;

    if (changed && args.apply) {
      // Regenerate the delta patch series into the module's deltaDir.
      const outDir = join(courseBuildDir, mod.deltaDir);
      for (const f of readdirSync(outDir)) { if (f.endsWith('.patch')) rmSync(join(outDir, f)); }
      git(wt, env, 'format-patch', '-1', 'HEAD', '-o', outDir, '--numbered', '--zero-commit', '--no-signature');
      const patchFiles = readdirSync(outDir).filter(f => f.endsWith('.patch')).sort();
      mod.patches = patchFiles;
      mod.expectedTreeSha = producedTree;
      mod.expectedAssets = targets.slice();
      mod.status = 'backfilled';
      writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
    }

    process.stdout.write(JSON.stringify({
      module: args.module, source: 'asset', changed,
      producedTree, expectedTreeSha: mod.expectedTreeSha, targets, applied: !!(changed && args.apply),
    }));
  } finally {
    try { git(repoRoot, {}, 'worktree', 'remove', '--force', wt); } catch { /* ignore */ }
    try { rmSync(wt, { recursive: true, force: true }); } catch { /* ignore */ }
    git(repoRoot, {}, 'worktree', 'prune');
  }
}

try { main(); } catch (e) { console.error('ERROR: ' + e.message); process.exit(1); }
