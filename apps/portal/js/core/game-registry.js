// Paths resolve from site root (works regardless of which page imports this),
// so vercel.json's root rewrite and local `serve .` both work unchanged.
const GAMES_ROOT = '/games';

async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load ${url}: ${res.status}`);
  return res.json();
}

// Reads games/index.json (list of folder ids), then each games/<id>/manifest.json.
// Add a new game = new folder + append id here. No hub.js changes needed.
// Bad/missing games are skipped, not fatal — one broken game shouldn't blank the hub.
export async function loadRegistry() {
  let ids = [];
  try {
    ids = await fetchJSON(`${GAMES_ROOT}/index.json`);
  } catch (err) {
    console.error('Could not load games/index.json', err);
    return [];
  }

  const results = await Promise.allSettled(
    ids.map(id => fetchJSON(`${GAMES_ROOT}/${id}/manifest.json`))
  );

  return results
    .filter(r => r.status === 'fulfilled')
    .map(r => r.value);
}

// Dynamically imports a game's entry module (lazy-loaded, not bundled upfront).
export async function loadGameModule(manifest) {
  try {
    return await import(`${GAMES_ROOT}/${manifest.id}/${manifest.entry}`);
  } catch (err) {
    throw new Error(`Could not load game "${manifest.id}": ${err.message}`);
  }
}
