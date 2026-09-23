# ACC learner branch system — ref model & contract

This directory (`course-build/`) owns the machinery that produces **checkout-ready learner branches** for the [Advanced Copilot CLI (ACC)](https://github.com/github-samples/advanced-copilot-cli) course. It lives in `contoso-inventory` and is **never** part of a learner's checked-out state.

> [!IMPORTANT]
> This document is the authoritative contract for the branch/ref naming scheme and the delta store. Regeneration runs entirely inside `contoso-inventory` (pull model, no cross-repo auth). Changes to the naming scheme are breaking changes for ACC — coordinate before editing.

## Why this exists

ACC learners drop into any module without doing the prior ones. Each module's "Starting state" assumes the cumulative output of every earlier module already exists in `contoso-inventory`. We give learners a branch to `git checkout` that lands them in exactly that state.

`start-of-module-N` = the cumulative **END** state of module `N-1`.

## The module chain

The state-changing chain is `base -> M01 -> M02 -> ... -> M07`. `M00` is the pristine app; `M08` is a wrap-up with no state change; `M07` is fork-only infra management (its end state is still a learner branch target for anyone entering M07).

| Module | What it adds (cumulative delta) | End state = start of |
| ------ | ------------------------------- | -------------------- |
| M01 | Docs: `ARCHITECTURE.md`, README fill-in, devcontainer postCreate | `start-of-module-02` |
| M02 | `.github` instructions + Accessibility Expert agent + make-repo-contribution skill + copilot-instructions + a11y tweaks | `start-of-module-03` |
| M03 | Playwright test foundation + delegation brief + test backfill | `start-of-module-04` |
| M04 | `.github/hooks` lifecycle hooks | `start-of-module-05` |
| M05 | Playwright MCP registration + QA custom agent + REAL barcode feature (assets-svc + web) | `start-of-module-06` |
| M06 | LSP + MCP config + research report + REAL modernization app code | `start-of-module-07` |
| M07 | Fork-only infra management (no cumulative app-state delta) | — |

## Ref layers

Three layers, from most to least durable:

1. **Base (immutable tag) — `acc-base`**
   Pinned at the pristine, tooling-free `contoso-inventory` app tree updated to the current main app state (.NET 10 assets-svc + Spring Boot 3.5.16 / Java 17 Java services): `ab05db6007679f6e122c004d620e4e293bd9d729`. Every module delta applies on top of this. Learner branches contain the app + module content only — never `course-build/` or the course automation workflows. The tag **moves** only via an approved promotion: when a regen PR that advances `manifest.base.sha` is merged, the `acc-base` tag is re-pointed to the new base commit as part of the gated promotion.

2. **Mutable convenience branches — `start-of-module-N`**
   The learner-facing `git checkout` targets. They **move** (only via an approved, all-or-nothing promotion). `N` runs `02..07`.

3. **Immutable version tags — `acc-<YYYY-MM>/start-of-module-N`**
   Cut on every promotion (e.g. `acc-2026-08/start-of-module-05`). They **never move**. They let a learner (or a course revision) pin the exact state shipped in a given month even after the mutable branch advances.

Plus one ephemeral layer used only during a rebuild:

4. **Staging refs — `regen/<dispatch_id>/start-of-module-K`**
   Where a regeneration run assembles candidate branches. Promotion is atomic: validate every staging ref in the affected downstream range, then move all mutable aliases and cut all tags in one step, or abort and touch nothing.

## Deprecation mapping

Two hand-authored solution branches predate this system. They are **kept** (frozen, with a deprecation notice) — not deleted — so existing links keep working.

| Legacy branch | Equivalent to | New canonical branch |
| ------------- | ------------- | -------------------- |
| `02-building-ai-infra-solution` | end of M02 | `start-of-module-03` |
| `03-test-suite-remote-delegation-solution` | end of M03 | `start-of-module-04` |

See `deprecated-branches.md` for the learner-facing notice text.

## Delta store — source of truth

Deltas are deterministic, stored, and canonical. Each module is an **ordered patch series** (`git format-patch`, `--zero-commit`) under `course-build/deltas/module-NN/`, indexed by `course-build/manifest.json`.

- M01–M03 are **backfilled** from the stacked solution-branch commit ranges (verified to reproduce each solution tree byte-for-byte via `expectedTreeSha`).
- M04–M06 are `pending-acc-content`: their app-state is produced by ACC's module-runner. Once a runner-proposed delta is reviewed and merged, the committed patch series becomes canonical and future rebuilds re-apply the stored patches (the runner is not re-invoked to rebuild an unchanged module).

A rebuild is: `checkout acc-base` → for each module in order, `git am` its patch series → the resulting tree is that module's end state / the next module's start branch.

## Module `source` classification

Each module in `manifest.json` carries a `source` field that determines **how a detected ACC change is turned into a delta update** during regeneration:

| `source` | meaning | on an ACC change to that module |
| -------- | ------- | ------------------------------- |
| `asset` | the produced state **is** the checked-in ACC assets under `assetRoot` (e.g. M04 = `assets/04/**`, path-stripped of the prefix, copied with ACC file modes) | **deterministically re-derived** by `rederive-asset-module.mjs` — NO module-runner / AI. If the re-derived produced tree differs from `expectedTreeSha`, a normal human-gated regen PR is opened (and `manifest.expectedTreeSha` updated). |
| `seed` | output is Copilot-generated app code (M05/M06) | proposed via the **module-runner** seed path (AI). PASS with patches → staged; `FAIL`/`BLOCKED`/no-patch → **stale** (see below). |
| `stored` | delta was backfilled once from the contoso-inventory `-solution` branches (M01–M03); no deterministic ACC asset to derive from | **stale** — there is nothing to auto-derive; a human must re-author. (Conservative: if only part of a module is asset-derivable, it is classified `stored`.) |

Current classification: **M01–M03 = `stored`**, **M04 = `asset`** (`assets/04`), **M05–M06 = `seed`**.

### Stale surfacing (no silent no-op, no lost signal)

When a detected ACC change produces **no automatic delta update** (`stored`, or `seed` where the runner emitted no patch / returned `BLOCKED`), the workflow does **not** advance `.last-acc-sha` and does **not** no-op silently. Instead it maintains **one** auto-managed tracking issue **per module** (found/updated by a hidden `<!-- acc-stale-module:NN -->` marker, never duplicated), titled `ACC content changed for module NN — delta review needed`, labelled `acc-stale` + (`needs-human-authoring` for `stored` | `runner-blocked` for `seed`). On each cron tick the issue is updated in place; once the module is no longer detected as stale (the delta was authored and the SHA advanced past it) the issue is auto-closed as superseded.



## Trigger model — contoso-inventory PULLS from ACC (no cross-repo auth)

> [!NOTE]
> The earlier push model (ACC firing a `repository_dispatch` of type `acc-content-changed` into contoso-inventory) is **superseded and no longer used**. The `event_type`/`client_payload` contract below is retained only as historical reference. The ACC side no longer sends a dispatch.

Regeneration runs entirely inside contoso-inventory on the built-in `GITHUB_TOKEN` with **no secrets**. `regenerate-branches.yml`:

- Triggers on **`workflow_dispatch`** (manual button; optional inputs `acc_sha`, `affected_module`, `acc_version`) and a **daily `schedule`** backstop at **07:17 UTC**.
- Clones the **public** ACC repo anonymously via `github.token`, pinned to a target SHA (`acc_sha` input, else ACC `main` HEAD at run time).
- Reads the last successfully processed SHA from **`course-build/.last-acc-sha`**, diffs ACC between it and the target SHA, and maps changed paths to affected modules:
  - `content/NN-*.md` → module `NN`
  - `assets/NN/**` → module `NN`
- Sets the cascade root to the smallest affected module `N` and regenerates `start-of-module-(N+1) .. start-of-module-07`. If `affected_module` is forced, it is used directly. If nothing module-affecting changed, the run exits cleanly with no PR.
- Opens a regen PR with `GITHUB_TOKEN`. **In-run validation:** because `GITHUB_TOKEN`-authored PRs do **not** cascade-trigger the `pull_request` event, the pushed regen branch is validated in the same run via `validate-branches.yml` (`workflow_call` with a `ref` input) rather than relying on the PR trigger. If PR creation is disabled at the org level, the branch is still pushed and the run surfaces the compare URL for manual PR creation.

### last-acc-sha advancement

`course-build/.last-acc-sha` advances **only when a regen PR is merged** — the SHA bump is committed in the same proposal, so an un-merged proposal or a no-op run never advances it. Merging is the human-approval point; gated promotion follows.

### Historical (superseded) dispatch payload

```
POST /repos/github-samples/contoso-inventory/dispatches   # NO LONGER USED
{ "event_type": "acc-content-changed",
  "client_payload": { "acc_sha": "...", "acc_ref": "...", "affected_module": 4,
                      "acc_version": "2026-08", "reason": "content-update", "dispatch_id": "..." } }
```

### Cascade semantics

Changing module `N` re-derives `delta_N`, which changes `end-of-N` (= `start-of-module-(N+1)`) and **every** downstream branch. Regeneration covers `start-of-module-(N+1) .. start-of-module-07`.

App-code cascade conflicts (M05/M06 carry real code) are **flagged for human resolution and never auto-resolved**.

## Module-runner contract (ACC seed/validator skill)

`module-runner` is a **Copilot skill**, invoked by running Copilot CLI in seed mode — not a standalone script. The regenerate workflow expands an invocation template (`ACC_MODULE_RUNNER_CMD`) and runs it from the ACC checkout. Recommended pinned invocation:

```
copilot -p "Run module-runner in validator/seed mode with: mode=seed module={module} base-ref={base-ref} acc-ref={acc_ref} repo={target} out={out}" --allow-all --log-level error
```

Placeholders expanded by the receiver (both hyphen and underscore forms accepted):

| placeholder | value |
| ----------- | ----- |
| `{module}` | affected module number (1..7) |
| `{base-ref}` / `{base_ref}` | starting state to seed from — **zero-padded** `start-of-module-NN` (e.g. `start-of-module-04`), computed by the receiver |
| `{acc-ref}` / `{acc_ref}` | pinned 40-char `acc_sha` from the payload (reproducible seeds) |
| `{repo}` / `{target}` | the contoso-inventory checkout the runner writes into |
| `{out}` | output dir for the proposed patch series + `result.json` |

> [!NOTE]
> ACC's suggested wording `base-ref=start-of-module-{module}` is **not** zero-padded and would produce `start-of-module-4`; our branch names are two-digit. Use `{base-ref}`, which the receiver injects zero-padded, rather than `start-of-module-{module}`.

The runner runs **inside** a Copilot session, so its process exit code is **not** authoritative — the receiver reads `{out}/result.json` and maps its `result` field. `result.json` is written as the final action of every run (including failures):

```json
{ "schema_version": 1, "mode": "seed", "module": 4,
  "base_ref": "start-of-module-04", "acc_ref": "<full-40-char-acc-sha>",
  "produced_branch": "start-of-module-05", "result": "PASS",
  "patches": ["patches/0001-....patch"],
  "verification": [ { "name": "playwright a11y suite", "command": "npm run test:e2e", "status": "pass" } ],
  "issues_report": "issues/04-issues.md",
  "started_at": "<ISO-8601>", "finished_at": "<ISO-8601>" }
```

| `result.json` `result` | meaning | receiver behavior | mapped exit |
| ---------------------- | ------- | ----------------- | ----------- |
| `PASS` | produced + all verification passed | stage `{out}/patches/*.patch`, continue to regen + PR | 0 |
| `FAIL` | a verification step failed | warn; no patches staged; PR still opened from stored deltas | 1 |
| `BLOCKED` | prereq/credential/external service prevented a valid run | flag for human input (`needs-human-resolution`, `runner-blocked`); no auto-proposal | 2 |
| missing / unparseable | no/!valid `result.json` | hard error, fail the run | 3 |

In `mode=validate` (pure gate) the runner omits `patches` and `produced_branch`. Seed patches are a `git format-patch` series in commit order under `{out}/patches/`, with stable messages `chore(seed): module <N> produced-state for start-of-module-<N+1> [acc:<short-sha>]`. The skill never pushes, opens PRs, or promotes — the receiver consumes `patches/` + `result.json`.

Provisioning of `ACC_MODULE_RUNNER_CMD`, `ACC_REPO`, tokens, and the promotion environment is documented in [`OPERATIONS.md`](./OPERATIONS.md).

## Lifecycle summary

```
ACC content change (public repo)
      │  pulled on schedule (daily 07:17 UTC) or manual workflow_dispatch
      ▼
regenerate-branches.yml
      │  clone public ACC@target_sha (anon github.token)
      │  diff vs course-build/.last-acc-sha → affected modules
      │  (re-seed via module-runner) → regenerate (N+1..07) into staging
      │  commit deltas + .last-acc-sha → push branch
      ▼
validate-branches.yml (gate)  ── called IN-RUN via workflow_call (ref = regen branch)
      │  build + all suites + assets/ancestry/secret checks
      ▼
open PR (GITHUB_TOKEN; fallback: compare URL) → human review + approve + merge
      │  merge advances course-build/.last-acc-sha
      ▼
promote-branches.yml (promotion, production-branches env gate)
      │  atomic: move start-of-module-N aliases + cut acc-<version>/start-of-module-N tags
      ▼
learners `git checkout start-of-module-N`
```

## Files in this directory

| Path | Purpose |
| ---- | ------- |
| `REFS.md` | This document — ref model + contract. |
| `manifest.json` | Machine-readable delta store index (base, per-module patch order, expected trees/assets). |
| `.last-acc-sha` | Last ACC SHA whose state is reflected by the promoted branches (advances on regen PR merge). |
| `deltas/module-NN/*.patch` | Ordered `git format-patch` series per module. |
| `deprecated-branches.md` | Deprecation notice text for the two legacy `-solution` branches. |
| `scripts/build-branches.mjs` | Generator: assembles base + ordered deltas into staging refs. |
| `scripts/detect-affected-modules.mjs` | Maps changed ACC paths to affected module numbers. |
| `scripts/rederive-asset-module.mjs` | Deterministically re-derives an `asset`-class module's delta from ACC assets (no AI). |
| `scripts/selftest.mjs` | Unit checks for classification + path detection (run in CI). |
| `../.github/workflows/validate-branches.yml` | CI validation gate (reusable via `workflow_call`). |
| `../.github/workflows/promote-branches.yml` | Atomic promotion of aliases + tags. |
| `../.github/workflows/regenerate-branches.yml` | Pull-model regeneration (schedule + manual). |
