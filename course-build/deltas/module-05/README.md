# Module 05 delta — LANDED

**Produces:** `start-of-module-06` (= cumulative end state of Module 05)

**Adds** (seed — Copilot-authored app code, performing ACC module 05):
- Barcode/QR feature in `services/assets-svc` (.NET): `qr_payload` column + migration/backfill, `GET /assets/{id}/qr` SVG endpoint (pure-managed `Net.Codecrete.QrCodeGenerator`), tests.
- `services/web` (Astro): `qrPayload` model field + accessible QR card on the asset detail page.
- `.github/agents/qa.agent.md` (Quality assurance agent), `reports/qr-code-research.md`, `docs/plans/qr-support.md`, Playwright spec.

**Verified:** `build-branches.mjs --check` reproduces `expectedTreeSha` `83337f347a5ee8b7d86374abbc738e89d9534e94`. assets-svc: 28/28 tests pass; web builds. See `manifest.json` (module 5).
