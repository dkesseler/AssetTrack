# Deprecated solution branches

Two hand-authored solution branches predate the `start-of-module-N` system. They are **frozen and kept** so existing links and bookmarks keep working. New course content and learners should use the canonical `start-of-module-N` branches instead.

| Deprecated branch | Use instead | Equivalent state |
| ----------------- | ----------- | ---------------- |
| `02-building-ai-infra-solution` | `start-of-module-03` | end of Module 02 |
| `03-test-suite-remote-delegation-solution` | `start-of-module-04` | end of Module 03 |

These branches are not deleted and will not receive further updates. The canonical branches are rebuilt deterministically from the delta store (see `REFS.md`) and are the ones maintained by the agentic regeneration workflow.

## Suggested notice for the branch tip (optional, requires push auth)

If/when a deprecation commit is added to each legacy branch, use a top-level `DEPRECATED.md`:

```
# ⚠️ Deprecated branch

This branch is frozen. It is equivalent to `start-of-module-0X` and will not be updated.
Please switch to `start-of-module-0X`, which is maintained automatically from the ACC delta store.
See course-build/REFS.md on `main` for details.
```

> [!NOTE]
> Adding that commit requires push access to these branches. This session did not assume push authorization; the mapping above is the authoritative record regardless of whether the tip commit is added.
