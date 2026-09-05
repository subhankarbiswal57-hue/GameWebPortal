export function createControls() {
  const state = { x: 0 };
  const onKey = (e) => {
    if (e.key === 'ArrowLeft') state.x = Math.max(-3, state.x - 0.5);
    if (e.key === 'ArrowRight') state.x = Math.min(3, state.x + 0.5);
  };
  let touchStartX = null;
  const onTouchStart = (e) => { touchStartX = e.touches[0].clientX; };
  const DEAD_ZONE = 4; // px — ignore sub-pixel jitter from touch sensors
  const onTouchMove = (e) => {
    if (touchStartX == null) return;
    const dx = e.touches[0].clientX - touchStartX;
    if (Math.abs(dx) < DEAD_ZONE) return;
    state.x = Math.max(-3, Math.min(3, state.x + dx / 100));
    touchStartX = e.touches[0].clientX;
  };
  window.addEventListener('keydown', onKey);
  window.addEventListener('touchstart', onTouchStart);
  window.addEventListener('touchmove', onTouchMove);

  return {
    state,
    destroy() {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
    }
  };
}
