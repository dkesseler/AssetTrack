# Module 04 delta — LANDED

**Produces:** `start-of-module-05` (= cumulative end state of Module 04)

**Adds** (deterministic; not agent-authored):
- `.github/hooks/scripts/test-router.sh` — mode `0755`, ACC blob `fc8d073eb5324d77a817550f88f745a83eb696e1`
- `.github/hooks/hooks.json` — mode `0644`, canonical body from ACC `content/04-lifecycle-hooks.md`

**Verification:** `build-branches.mjs --check` confirms M4 → `start-of-module-05` reproduces `expectedTreeSha` `9bb1cb347bb20bce703a9bd9fc1aefba7113f936`.

See `manifest.json` (module 4) and the patch in this directory.
