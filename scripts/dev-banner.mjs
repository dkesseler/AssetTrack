// Printed once at the top of `npm run dev` so the URL is impossible to miss.
const lines = [
  "",
  "  AssetTrack dev environment",
  "  → http://localhost:4321",
  "",
  "  Services are starting (give it ~30s on first run).",
  "  Logs are at WARN level. Run `npm run dev:verbose` for full logs.",
  "",
];
for (const l of lines) console.log(l);
