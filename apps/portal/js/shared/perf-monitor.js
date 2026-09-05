export function createPerfMonitor({ enabled = false } = {}) {
  if (!enabled) return { tick() {}, destroy() {} };
  const el = document.createElement('div');
  Object.assign(el.style, {
    position: 'fixed', top: '8px', right: '8px', color: '#0f0',
    font: '12px monospace', zIndex: 999, background: '#000a', padding: '4px 8px'
  });
  document.body.appendChild(el);
  let frames = 0, last = performance.now();
  return {
    tick() {
      frames++;
      const now = performance.now();
      if (now - last >= 1000) {
        el.textContent = `${frames} FPS`;
        frames = 0; last = now;
      }
    },
    destroy() { el.remove(); }
  };
}
