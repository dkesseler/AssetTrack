# web (Astro SSR + React islands + Bootstrap 5)

The AssetTrack UI. Renders pages server-side and calls all backend services from the Astro server (BFF pattern). No data access from the browser.

## Pages

| Path                | Description                                      |
|---------------------|--------------------------------------------------|
| `/`                 | Dashboard (counts, utilization, status breakdown) |
| `/assets`           | Assets list + filter form                        |
| `/assets/new`       | Create-asset form                                |
| `/assets/:id`       | Asset detail + assignment history                |
| `/employees`        | Employees list + filter                          |
| `/employees/:id`    | Employee detail + assignments                    |
| `/assignments`      | All assignments, grouped by active/returned     |
| `/reports`          | Warranty + utilization reports (via reporting-svc) |

## Run locally

```bash
npm install
npm run dev
```

Default URL: http://localhost:4321. Service URLs come from env vars (see `src/lib/api/client.ts`).

## Known gaps (course material)

- The status-badge color mapping in `src/components/StatusBadge.astro` has wrong colors for `retired` and `lost`. Course exercise #8.
- The new-asset form (`src/pages/assets/new.astro`) has no validation. Pairs with `assets-svc` exercise #7.
- No "assets by department" page exists yet. Adding one is a candidate new exercise.
