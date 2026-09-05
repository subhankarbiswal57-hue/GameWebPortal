# Web Game Portal — SIGGRAPH Induction Task

**Name:** Subhankar Biswal
**Tech stack:** HTML5, CSS3, JavaScript (ES Modules), Three.js, Vercel (serverless + hosting), Firebase (optional leaderboard)
**Live demo:** _add after deploy_

## Run locally
Any static server works (ES module imports need http(s), not file://):
```
npx serve .
```
Open the printed localhost URL and navigate to `/apps/portal/index.html` in the
address bar directly (don't click through folder listings — some static
servers redirect folder/index requests in a way that briefly breaks relative
paths; this repo uses root-absolute paths internally so it's unaffected once
loaded, but always load `index.html` directly).

## Structure
- `apps/portal/` — hub UI (routing, cards, shared perf/asset utilities)
- `games/<id>/` — self-contained game modules; add a game by creating a folder + `manifest.json`, then adding its id to `games/index.json`
- `engine/` — shared Three.js utilities (scene lifecycle/disposal, object pooling, loaders, LOD)
- `backend/functions/` — optional Vercel serverless endpoints for score leaderboard
- `workers/service-worker.js` — offline app-shell caching

## Adding a new game
1. `games/my-game/manifest.json` — `{id, title, description, thumbnail, entry}`
2. `games/my-game/main.js` — export `start(canvas)` returning `{ stop() }`
3. Append `"my-game"` to `games/index.json`
