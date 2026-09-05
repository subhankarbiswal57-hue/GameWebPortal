import * as THREE from 'three';

// Wraps renderer/scene/camera creation and guarantees full GPU cleanup on stop().
export function createSceneManager(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);

  let rafId = null;
  const disposables = new Set();

  function resize() {
    const { clientWidth: w, clientHeight: h } = canvas;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  resize();

  function track(obj) { disposables.add(obj); return obj; }

  function loop(fn) {
    const step = (t) => { fn(t); renderer.render(scene, camera); rafId = requestAnimationFrame(step); };
    rafId = requestAnimationFrame(step);
  }

  function stop() {
    if (rafId) cancelAnimationFrame(rafId);
    ro.disconnect();
    disposables.forEach(o => {
      o.geometry?.dispose?.();
      o.material?.dispose?.();
      o.dispose?.();
    });
    scene.traverse(o => {
      o.geometry?.dispose?.();
      if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => m.dispose());
    });
    renderer.dispose();
  }

  return { renderer, scene, camera, track, loop, stop };
}
