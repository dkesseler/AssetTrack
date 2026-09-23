#!/usr/bin/env node
// Branch generator for the ACC learner start-of-module-N system.
//
// Reads course-build/manifest.json and assembles the base ref plus the ordered
// per-module delta patch series into cumulative branches. In a real regeneration
// run these are written as staging refs (regen/<dispatch_id>/start-of-module-K)
// that a later promotion step moves atomically onto the mutable aliases.
//
// Usage:
//   node course-build/scripts/build-branches.mjs --check
//       Dry-run: apply every backfilled module in order onto the base and verify
//       each cumulative tree matches manifest.expectedTreeSha. Creates no refs.
//
//   node course-build/scripts/build-branches.mjs --dispatch-id <id> [--from N] [--to M]
//       Build staging refs regen/<id>/start-of-module-K for the buildable range.
//
// Options:
//   --check              Verify only; do not create refs. (implies no --dispatch-id needed)
//   --dispatch-id <id>   Staging namespace. Required unless --check.
//   --from <N>           First module number to build (default: 1).
//   --to <M>             Last module number to build (default: last backfilled).
//   --base-sha <sha>     Override manifest base sha (advanced/testing).
//   --manifest <path>    Manifest path (default: course-build/manifest.json).
//   --keep-worktree      Do not remove the temp worktree on exit (debugging).
//   --quiet              Less output.

import { execFileSync } from 'node:child_process';
import { readFileSync, mkdtempSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..', '..');

function parseArgs(argv) {
  const args = { from: null, to: null, check: false, dispatchId: null, baseSha: null, manifest: null, keepWorktree: false, quiet: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    switch (a) {
      case '--check': args.check = true; break;
      case '--keep-worktree': args.keepWorktree = true; break;
      case '--quiet': args.quiet = true; break;
      case '--from': args.from = parseInt(argv[++i], 10); break;
      case '--to': args.to = parseInt(argv[++i], 10); break;
      case '--dispatch-id': args.dispatchId = argv[++i]; break;
      case '--base-sha': args.baseSha = argv[++i]; break;
      case '--manifest': args.manifest = argv[++i]; break;
      default:
        throw new Error(`Unknown argument: ${a}`);
    }
  }
  return args;
}

function git(cwd, ...gitArgs) {
  return execFileSync('git', gitArgs, { cwd, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }).trim();
}

function log(quiet, ...m) { if (!quiet) console.log(...m); }

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.check && !args.dispatchId) {
    throw new Error('Refusing to build: pass --dispatch-id <id> to create staging refs, or --check for a dry run.');
  }

  const manifestPath = args.manifest
    ? (isAbsolute(args.manifest) ? args.manifest : resolve(repoRoot, args.manifest))
    : join(repoRoot, 'course-build', 'manifest.json');
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  const courseBuildDir = join(repoRoot, 'course-build');

  const baseSha = args.baseSha || manifest.base.sha;
  // Verify base object exists locally.
  try { git(repoRoot, 'cat-file', '-e', `${baseSha}^{commit}`); }
  catch { throw new Error(`Base commit ${baseSha} not found locally. Fetch it first (git fetch origin).`); }

  // Determine the contiguous buildable prefix: cumulative state requires every
  // earlier module to be backfilled. Stop at the first module without patches.
  const buildable = [];
  for (const mod of manifest.modules.sort((a, b) => a.module - b.module)) {
    const hasPatches = Array.isArray(mod.patches) && mod.patches.length > 0;
    if (mod.status === 'backfilled' && hasPatches) buildable.push(mod);
    else break;
  }
  if (buildable.length === 0) throw new Error('No backfilled modules with patches found in manifest.');

  const from = args.from ?? buildable[0].module;
  const to = args.to ?? buildable[buildable.length - 1].module;
  const lastBuildable = buildable[buildable.length - 1].module;
  if (to > lastBuildable) {
    throw new Error(`--to ${to} exceeds last buildable module ${lastBuildable} (later modules are pending-acc-content).`);
  }

  log(args.quiet, `Base: ${baseSha}`);
  log(args.quiet, `Buildable modules: ${buildable.map(m => m.module).join(', ')}`);
  log(args.quiet, `Requested range: M${from}..M${to}${args.check ? '  (check-only)' : ''}`);

  const wt = mkdtempSync(join(tmpdir(), 'acc-build-'));
  let ok = true;
  const built = [];
  try {
    git(repoRoot, 'worktree', 'add', '-q', '--detach', wt, baseSha);

    for (const mod of buildable) {
      if (mod.module > to) break;

      // Apply this module's ordered patch series (always applied in order to keep
      // cumulative state correct, even for modules below --from).
      const patchPaths = mod.patches.map(p => join(courseBuildDir, mod.deltaDir, p));
      for (const p of patchPaths) {
        if (!existsSync(p)) throw new Error(`Missing patch file: ${p}`);
      }
      try {
        git(wt, 'am', '-q', '--whitespace=nowarn', ...patchPaths);
      } catch (e) {
        try { git(wt, 'am', '--abort'); } catch { /* ignore */ }
        throw new Error(`git am failed applying Module ${mod.module} (${mod.deltaDir}): ${e.message}`);
      }

      const tree = git(wt, 'rev-parse', 'HEAD^{tree}');
      const head = git(wt, 'rev-parse', 'HEAD');
      const treeOk = !mod.expectedTreeSha || tree === mod.expectedTreeSha;
      if (!treeOk) {
        ok = false;
        console.error(`✗ Module ${mod.module}: tree ${tree} != expected ${mod.expectedTreeSha}`);
      } else {
        log(args.quiet, `✓ Module ${mod.module} -> ${mod.startBranch}  tree ${tree.slice(0, 12)}${mod.expectedTreeSha ? ' (matches manifest)' : ''}`);
      }

      // Verify expected assets exist in the built tree.
      for (const asset of (mod.expectedAssets || [])) {
        try { git(wt, 'cat-file', '-e', `HEAD:${asset}`); }
        catch {
          // asset may be a directory; check via ls-tree
          const listed = git(wt, 'ls-tree', '--name-only', 'HEAD', asset);
          if (!listed) { ok = false; console.error(`✗ Module ${mod.module}: expected asset missing: ${asset}`); }
        }
      }

      if (mod.module >= from) {
        built.push({ module: mod.module, startBranch: mod.startBranch, head, tree });
        if (!args.check && ok) {
          const stagingRef = `regen/${args.dispatchId}/${mod.startBranch}`;
          git(repoRoot, 'branch', '-f', stagingRef, head);
          log(args.quiet, `  created staging ref ${stagingRef}`);
        }
      }
    }

    // Ancestry check: each built cumulative state must contain the base and be a
    // linear descendant of the previous built module.
    let prev = baseSha;
    for (const b of built) {
      git(repoRoot, 'merge-base', '--is-ancestor', prev, b.head); // throws if not ancestor
      prev = b.head;
    }
    log(args.quiet, 'Ancestry: linear base -> ' + built.map(b => `M${b.module}`).join(' -> ') + ' OK');
  } finally {
    if (!args.keepWorktree) {
      try { git(repoRoot, 'worktree', 'remove', '--force', wt); } catch { /* ignore */ }
      try { rmSync(wt, { recursive: true, force: true }); } catch { /* ignore */ }
      git(repoRoot, 'worktree', 'prune');
    } else {
      log(args.quiet, `Kept worktree: ${wt}`);
    }
  }

  if (!ok) {
    console.error('\nBuild FAILED: one or more modules did not match expected state.');
    process.exit(1);
  }
  console.log(`\nBuild ${args.check ? 'check ' : ''}OK: ${built.length} module state(s) ${args.check ? 'verified' : 'staged'}.`);
}

try {
  main();
} catch (e) {
  console.error('ERROR: ' + e.message);
  process.exit(1);
}
