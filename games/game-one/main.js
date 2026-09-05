import * as THREE from 'three';
import { createSceneManager } from '../../engine/scene-manager.js';
import { createObjectPool } from '../../engine/object-pool.js';
import { createPerfMonitor } from '../../apps/portal/js/shared/perf-monitor.js';
import { createPlayer, makeObstacleTemplate } from './objects.js';
import { createControls } from './controls.js';
import { sound } from '../../apps/portal/js/shared/audio.js';

export function start(canvas) {
  const sm = createSceneManager(canvas);
  sm.camera.position.set(0, 2, 8);
  sm.scene.add(new THREE.AmbientLight(0xffffff, 0.6));
  const dir = new THREE.DirectionalLight(0xffffff, 0.8);
  dir.position.set(3, 5, 2);
  sm.scene.add(dir);

  const player = createPlayer();
  sm.track(player);
  sm.scene.add(player);

  const makeObstacle = makeObstacleTemplate();
  const pool = createObjectPool(
    () => { const m = makeObstacle(); sm.scene.add(m); return m; },
    (m) => { m.position.set((Math.random() - 0.5) * 6, 0, -20); m.visible = true; }
  );

  const controls = createControls();
  const perf = createPerfMonitor({ enabled: true });

  let spawnTimer = 0;
  let alive = true;
  let dodgedCount = 0;
  let score = 0;
  const active = [];

  sm.loop((t) => {
    if (!alive) return;
    perf.tick();
    player.position.x += (controls.state.x - player.position.x) * 0.2;

    spawnTimer += 1;
    if (spawnTimer > 40) {
      spawnTimer = 0;
      active.push(pool.acquire());
    }

    for (let i = active.length - 1; i >= 0; i--) {
      const o = active[i];
      o.position.z += 0.15;
      if (o.position.distanceTo(player.position) < 0.8) {
        alive = false;
        sound.playCrash();
        canvas.dispatchEvent(new CustomEvent('gameover', {
          detail: {
            score: score,
            stats: [
              { label: 'Obstacles Dodged', value: dodgedCount },
              { label: 'Survival Time', value: `${Math.floor(score / 50)}s` }
            ]
          }
        }));
      }
      if (o.position.z > 8) {
        o.visible = false;
        pool.release(o);
        active.splice(i, 1);
        dodgedCount++;
        score += 50;
      }
    }
  });

  return {
    stop() {
      alive = false;
      controls.destroy();
      perf.destroy();
      pool.releaseAll();
      sm.stop();
    }
  };
}
