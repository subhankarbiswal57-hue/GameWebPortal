// Generic reusable-object pool. create() builds a fresh instance,
// reset() restores state before reuse — avoids GC churn from spawn-heavy games.
export function createObjectPool(create, reset, { maxFree = 64, onDrop } = {}) {
  const free = [];
  const active = new Set();

  function acquire(...args) {
    const obj = free.pop() ?? create();
    reset(obj, ...args);
    active.add(obj);
    return obj;
  }
  function release(obj) {
    if (!active.has(obj)) return;
    active.delete(obj);
    if (free.length < maxFree) {
      free.push(obj);
    } else {
      // Pool is already full of spares — actually dispose instead of hoarding.
      onDrop?.(obj);
    }
  }
  function releaseAll() { active.forEach(release); }

  return { acquire, release, releaseAll, get activeCount() { return active.size; } };
}
