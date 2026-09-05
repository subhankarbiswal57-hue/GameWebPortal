const cache = new Map();

export async function loadTexture(loader, url) {
  if (cache.has(url)) return cache.get(url);
  const tex = await new Promise((res, rej) => loader.load(url, res, undefined, rej));
  cache.set(url, tex);
  return tex;
}

export function clearAssetCache() { cache.clear(); }
