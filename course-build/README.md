# course-build — ACC learner branch system

This directory owns the machinery that produces checkout-ready **`start-of-module-N`** branches for the [Advanced Copilot CLI (ACC)](https://github.com/github-samples/advanced-copilot-cli) course. It is course infrastructure and is **never** part of a learner's checked-out state.

Start with **[`REFS.md`](./REFS.md)** — the authoritative ref model + trigger (pull) model.

## Layout

| Path | Purpose |
| ---- | ------- |
| [`REFS.md`](./REFS.md) | Ref/naming model, module map, dispatch payload contract, lifecycle. |
| [`manifest.json`](./manifest.json) | Machine-readable delta index: base ref, per-module patch order, expected trees/assets. |
| [`deprecated-branches.md`](./deprecated-branches.md) | Deprecation mapping for the two legacy `-solution` branches. |
| `deltas/module-NN/*.patch` | Ordered `git format-patch` series per module (M01–M04 backfilled; M05–M06 pending ACC content). |
| `scripts/build-branches.mjs` | Generator: base + ordered deltas → staging refs, with `--check` verification. |
| `scripts/detect-affected-modules.mjs` | Map changed ACC paths → affected module numbers (pull-model trigger). |
| `scripts/rederive-asset-module.mjs` | Deterministically re-derive an `asset`-class module's delta from ACC assets (no AI). |
| `scripts/selftest.mjs` | Unit checks for classification + path detection (run in CI). |
| `scripts/validate-branch.sh` | Build one branch and run the suites present in that state. |
| `.last-acc-sha` | Last ACC SHA reflected by the promoted branches (advances on regen PR merge). |

## Quick start

```bash
# Verify the whole delta store is deterministic (trees match, ancestry linear):
node course-build/scripts/build-branches.mjs --check

# Stage the buildable branches under a namespace (creates regen/<id>/start-of-module-K):
node course-build/scripts/build-branches.mjs --dispatch-id local

# Build + test a single learner branch end-to-end:
course-build/scripts/validate-branch.sh start-of-module-04
```

## Workflows (in `../.github/workflows/`)

- `validate-branches.yml` — CI gate: deterministic delta check + secret scan + build/test every buildable branch (reusable via `workflow_call` with a `ref` input).
- `promote-branches.yml` — atomic promotion of mutable aliases + immutable version tags (environment-gated).
- `regenerate-branches.yml` — pull-model regeneration (daily cron + manual button): clone public ACC, diff vs `.last-acc-sha`, regenerate downstream range, invoke the module-runner, validate in-run, open a PR. Runs on the built-in `GITHUB_TOKEN` with no secrets.

## Status

M01–M04 deltas are backfilled and verified. M05–M06 are `pending-acc-content` (need the barcode feature / modernization code + seed runs). Regeneration triggers require no secrets; the only human provisioning is the `production-branches` environment and (optional) repo variables — see [`OPERATIONS.md`](./OPERATIONS.md).
