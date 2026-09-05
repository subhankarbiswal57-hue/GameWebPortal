import { sound } from '../../apps/portal/js/shared/audio.js';

// Turbo Car Racing game engine with lane physics, nitro boost, coins & traffic
export function start(canvas) {
  const ctx = canvas.getContext('2d');
  let width = (canvas.width = canvas.clientWidth || 800);
  let height = (canvas.height = canvas.clientHeight || 600);

  function resize() {
    width = canvas.width = canvas.clientWidth || 800;
    height = canvas.height = canvas.clientHeight || 600;
  }
  window.addEventListener('resize', resize);

  let running = true;
  let score = 0;
  let distance = 0;
  let coinsCollected = 0;
  let nitro = 100;
  let speed = 6;
  let baseSpeed = 6;
  let maxSpeed = 14;
  let isBoosting = false;

  // Road lane coordinates (4 lanes)
  const roadWidth = Math.min(width * 0.85, 520);
  const roadLeft = (width - roadWidth) / 2;
  const laneWidth = roadWidth / 4;

  const player = {
    x: width / 2,
    y: height - 120,
    w: 44,
    h: 75,
    targetX: width / 2,
    vx: 0,
    color: '#ff2a2a',
    shield: false
  };

  const keys = { left: false, right: false, up: false, down: false, boost: false };
  let roadOffset = 0;
  let traffic = [];
  let coins = [];
  let particles = [];
  let spawnTimer = 0;
  let coinSpawnTimer = 0;

  function onKeyDown(e) {
    sound.init();
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.left = true;
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.right = true;
    if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') keys.up = true;
    if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') keys.down = true;
    if (e.key === ' ' || e.key === 'Shift') {
      keys.boost = true;
      if (nitro > 10) sound.playNitro();
    }
  }

  function onKeyUp(e) {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.left = false;
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.right = false;
    if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') keys.up = false;
    if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') keys.down = false;
    if (e.key === ' ' || e.key === 'Shift') keys.boost = false;
  }

  // Touch / mouse steering support
  function onPointerMove(e) {
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
    player.targetX = Math.max(roadLeft + 30, Math.min(roadLeft + roadWidth - 30, x));
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  canvas.addEventListener('mousemove', onPointerMove);
  canvas.addEventListener('touchmove', onPointerMove, { passive: true });

  const TRAFFIC_TYPES = [
    { color: '#2b7fff', w: 42, h: 72, speedFactor: 0.55 }, // Blue Sedan
    { color: '#ffb703', w: 44, h: 78, speedFactor: 0.65 }, // Yellow Taxi
    { color: '#555566', w: 50, h: 100, speedFactor: 0.4 }, // Gray Truck
    { color: '#00cc66', w: 40, h: 70, speedFactor: 0.75 }  // Green Coupe
  ];

  function spawnTraffic() {
    const laneIndex = Math.floor(Math.random() * 4);
    const laneCenter = roadLeft + laneIndex * laneWidth + laneWidth / 2;
    const type = TRAFFIC_TYPES[Math.floor(Math.random() * TRAFFIC_TYPES.length)];

    // Prevent immediate overlapping spawn
    const tooClose = traffic.some(t => Math.abs(t.x - laneCenter) < 20 && t.y < 120);
    if (tooClose) return;

    traffic.push({
      x: laneCenter,
      y: -100,
      w: type.w,
      h: type.h,
      color: type.color,
      speedFactor: type.speedFactor
    });
  }

  function spawnCoin() {
    const laneIndex = Math.floor(Math.random() * 4);
    const laneCenter = roadLeft + laneIndex * laneWidth + laneWidth / 2;
    coins.push({
      x: laneCenter,
      y: -40,
      radius: 14,
      rotation: 0
    });
  }

  function createExhaust(x, y, isNitro) {
    particles.push({
      x: x + (Math.random() - 0.5) * 12,
      y: y,
      vx: (Math.random() - 0.5) * 2,
      vy: isNitro ? 5 + Math.random() * 4 : 2 + Math.random() * 3,
      radius: isNitro ? 5 + Math.random() * 4 : 3 + Math.random() * 3,
      color: isNitro ? '#00f0ff' : '#ffaa00',
      alpha: 1.0,
      decay: 0.04
    });
  }

  function triggerCrash() {
    running = false;
    sound.playCrash();
    
    // Multi-particle explosion
    for (let i = 0; i < 40; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = 3 + Math.random() * 8;
      particles.push({
        x: player.x,
        y: player.y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        radius: 3 + Math.random() * 6,
        color: Math.random() < 0.5 ? '#ff2a2a' : '#ffaa00',
        alpha: 1.0,
        decay: 0.025
      });
    }

    const finalScore = Math.floor(distance * 10 + coinsCollected * 100);
    canvas.dispatchEvent(new CustomEvent('gameover', {
      detail: {
        score: finalScore,
        stats: [
          { label: 'Distance', value: `${Math.floor(distance)} m` },
          { label: 'Coins Collected', value: coinsCollected },
          { label: 'Top Speed', value: `${Math.floor(speed * 18)} km/h` }
        ]
      }
    }));
  }

  let rafId = null;

  function render(time) {
    if (!running) return;

    // Handle Speed & Nitro
    if (keys.boost && nitro > 0) {
      isBoosting = true;
      speed = Math.min(maxSpeed, speed + 0.3);
      nitro = Math.max(0, nitro - 0.6);
    } else {
      isBoosting = false;
      if (keys.up) {
        speed = Math.min(baseSpeed + 3, speed + 0.1);
      } else if (keys.down) {
        speed = Math.max(3, speed - 0.2);
      } else {
        speed += (baseSpeed - speed) * 0.05;
      }
      // Slowly recharge nitro
      if (nitro < 100) nitro += 0.08;
    }

    // Steering keyboard
    if (keys.left) player.targetX = Math.max(roadLeft + 30, player.targetX - 9);
    if (keys.right) player.targetX = Math.min(roadLeft + roadWidth - 30, player.targetX + 9);
    player.x += (player.targetX - player.x) * 0.18;

    distance += speed * 0.08;
    roadOffset = (roadOffset + speed) % 60;

    // Spawns
    spawnTimer++;
    if (spawnTimer > Math.max(35, 90 - speed * 4)) {
      spawnTimer = 0;
      spawnTraffic();
    }
    coinSpawnTimer++;
    if (coinSpawnTimer > 60) {
      coinSpawnTimer = 0;
      spawnCoin();
    }

    // DRAW BACKGROUND (Highway at night / cyberpunk)
    ctx.fillStyle = '#0a0d14';
    ctx.fillRect(0, 0, width, height);

    // Road Grass/Side stripes
    ctx.fillStyle = '#111724';
    ctx.fillRect(roadLeft - 20, 0, roadWidth + 40, height);

    // Main Road Asphalt
    ctx.fillStyle = '#1c2333';
    ctx.fillRect(roadLeft, 0, roadWidth, height);

    // Glowing Neon Road Borders
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(roadLeft, 0); ctx.lineTo(roadLeft, height);
    ctx.moveTo(roadLeft + roadWidth, 0); ctx.lineTo(roadLeft + roadWidth, height);
    ctx.stroke();

    // Dashed Lane dividers
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 3;
    ctx.setLineDash([25, 35]);
    ctx.lineDashOffset = -roadOffset;

    for (let l = 1; l < 4; l++) {
      const lx = roadLeft + l * laneWidth;
      ctx.beginPath();
      ctx.moveTo(lx, 0);
      ctx.lineTo(lx, height);
      ctx.stroke();
    }
    ctx.setLineDash([]); // Reset dash

    // Exhaust particles from player car
    createExhaust(player.x - 12, player.y + player.h / 2, isBoosting);
    createExhaust(player.x + 12, player.y + player.h / 2, isBoosting);

    // UPDATE & DRAW PARTICLES
    for (let i = particles.length - 1; i >= 0; i--) {
      const pt = particles[i];
      pt.x += pt.vx;
      pt.y += pt.vy;
      pt.alpha -= pt.decay;
      if (pt.alpha <= 0) {
        particles.splice(i, 1);
        continue;
      }
      ctx.save();
      ctx.globalAlpha = pt.alpha;
      ctx.fillStyle = pt.color;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // UPDATE & DRAW COINS
    for (let i = coins.length - 1; i >= 0; i--) {
      const c = coins[i];
      c.y += speed;
      c.rotation += 0.05;

      // Check pickup
      const dist = Math.hypot(c.x - player.x, c.y - player.y);
      if (dist < c.radius + player.w / 2) {
        coinsCollected++;
        sound.playCoin();
        // create shine
        for (let s = 0; s < 8; s++) {
          particles.push({
            x: c.x, y: c.y,
            vx: (Math.random() - 0.5) * 4, vy: (Math.random() - 0.5) * 4,
            radius: 3, color: '#ffd700', alpha: 1, decay: 0.05
          });
        }
        coins.splice(i, 1);
        continue;
      }

      if (c.y > height + 50) {
        coins.splice(i, 1);
        continue;
      }

      // Draw Gold Coin
      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.scale(Math.cos(c.rotation), 1);
      ctx.beginPath();
      ctx.arc(0, 0, c.radius, 0, Math.PI * 2);
      ctx.fillStyle = '#ffd700';
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
    }

    // UPDATE & DRAW TRAFFIC
    for (let i = traffic.length - 1; i >= 0; i--) {
      const t = traffic[i];
      t.y += speed - (baseSpeed * t.speedFactor);

      if (t.y > height + 120) {
        traffic.splice(i, 1);
        continue;
      }

      // Collision Check (AABB box test)
      if (
        Math.abs(t.x - player.x) < (t.w + player.w) * 0.42 &&
        Math.abs(t.y - player.y) < (t.h + player.h) * 0.42
      ) {
        triggerCrash();
        return;
      }

      // Draw Traffic Car
      ctx.save();
      ctx.translate(t.x, t.y);

      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.fillRect(-t.w / 2 + 4, -t.h / 2 + 6, t.w, t.h);

      // Chassis
      ctx.fillStyle = t.color;
      ctx.beginPath();
      ctx.roundRect(-t.w / 2, -t.h / 2, t.w, t.h, 10);
      ctx.fill();

      // Roof / Glass
      ctx.fillStyle = '#111c2e';
      ctx.fillRect(-t.w * 0.35, -t.h * 0.2, t.w * 0.7, t.h * 0.45);

      // Taillights
      ctx.fillStyle = '#ff2222';
      ctx.fillRect(-t.w * 0.4, t.h / 2 - 6, 8, 4);
      ctx.fillRect(t.w * 0.4 - 8, t.h / 2 - 6, 8, 4);

      ctx.restore();
    }

    // DRAW PLAYER CAR
    ctx.save();
    ctx.translate(player.x, player.y);

    // Car shadow
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(-player.w / 2 + 5, -player.h / 2 + 8, player.w, player.h);

    // Neon Glow Underglow
    ctx.shadowColor = isBoosting ? '#00f0ff' : '#ff0055';
    ctx.shadowBlur = 15;

    // Body
    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.roundRect(-player.w / 2, -player.h / 2, player.w, player.h, 12);
    ctx.fill();

    // Windshield & Racing stripes
    ctx.fillStyle = '#00f0ff';
    ctx.fillRect(-player.w * 0.35, -player.h * 0.3, player.w * 0.7, player.h * 0.25);

    // Headlights
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-player.w * 0.4, -player.h / 2, 8, 4);
    ctx.fillRect(player.w * 0.4 - 8, -player.h / 2, 8, 4);

    // Rear wing / Spoiler
    ctx.fillStyle = '#111';
    ctx.fillRect(-player.w * 0.45, player.h / 2 - 6, player.w * 0.9, 6);

    ctx.restore();

    // HUD: Speedometer, Distance, Coins, Nitro Bar
    ctx.save();
    // Distance & Speed
    ctx.font = '900 24px system-ui, sans-serif';
    ctx.fillStyle = '#fff';
    ctx.fillText(`${Math.floor(distance)} m`, 24, 40);

    ctx.font = '700 16px system-ui, sans-serif';
    ctx.fillStyle = '#00f0ff';
    ctx.fillText(`${Math.floor(speed * 18)} KM/H`, 24, 65);

    // Coins
    ctx.fillStyle = '#ffd700';
    ctx.fillText(`🟡 ${coinsCollected}`, width - 110, 40);

    // Nitro Bar
    ctx.fillStyle = '#222838';
    ctx.roundRect(width - 150, 55, 126, 14, 7);
    ctx.fill();

    ctx.fillStyle = isBoosting ? '#00f0ff' : '#ff5a1f';
    ctx.roundRect(width - 148, 57, (nitro / 100) * 122, 10, 5);
    ctx.fill();

    ctx.font = '10px system-ui, sans-serif';
    ctx.fillStyle = '#fff';
    ctx.fillText('NITRO (SPACE/SHIFT)', width - 150, 82);
    ctx.restore();

    rafId = requestAnimationFrame(render);
  }

  rafId = requestAnimationFrame(render);

  return {
    stop() {
      running = false;
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      canvas.removeEventListener('mousemove', onPointerMove);
      canvas.removeEventListener('touchmove', onPointerMove);
    }
  };
}
