import { sound } from '../../apps/portal/js/shared/audio.js';

// Turbo Car Racing game engine with animated neon highway skyline, headlight beams, turbo speed lines & sound
export function start(canvas) {
  const ctx = canvas.getContext('2d');
  let width = (canvas.width = canvas.clientWidth || window.innerWidth || 800);
  let height = (canvas.height = canvas.clientHeight || window.innerHeight || 600);

  function resize() {
    if (!canvas) return;
    width = canvas.width = canvas.clientWidth || window.innerWidth || 800;
    height = canvas.height = canvas.clientHeight || window.innerHeight || 600;
  }
  window.addEventListener('resize', resize);
  setTimeout(resize, 50);

  let running = true;
  let score = 0;
  let distance = 0;
  let coinsCollected = 0;
  let nitro = 100;
  let speed = 7;
  let baseSpeed = 7;
  let maxSpeed = 16;
  let isBoosting = false;

  const roadWidth = Math.min(width * 0.88, 540);
  const roadLeft = (width - roadWidth) / 2;
  const laneWidth = roadWidth / 4;

  const player = {
    x: width / 2,
    y: height - 130,
    w: 46,
    h: 80,
    targetX: width / 2,
    vx: 0,
    color: '#e63946'
  };

  const keys = { left: false, right: false, up: false, down: false, boost: false };
  let roadOffset = 0;
  let traffic = [];
  let coins = [];
  let particles = [];
  let speedLines = [];
  let spawnTimer = 0;
  let coinSpawnTimer = 0;

  // Initialize animated speed lines
  for (let s = 0; s < 25; s++) {
    speedLines.push({
      x: Math.random() * width,
      y: Math.random() * height,
      len: 20 + Math.random() * 40,
      speed: 8 + Math.random() * 12
    });
  }

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

  function onPointerMove(e) {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX ?? (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
    const x = clientX - rect.left;
    player.targetX = Math.max(roadLeft + 30, Math.min(roadLeft + roadWidth - 30, x));
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  canvas.addEventListener('mousemove', onPointerMove);
  canvas.addEventListener('touchmove', onPointerMove, { passive: true });

  const TRAFFIC_TYPES = [
    { color: '#2b7fff', w: 44, h: 74, speedFactor: 0.55 },
    { color: '#ffb703', w: 44, h: 78, speedFactor: 0.65 },
    { color: '#888899', w: 52, h: 105, speedFactor: 0.4 },
    { color: '#00cc66', w: 42, h: 72, speedFactor: 0.75 },
    { color: '#9b5de5', w: 46, h: 80, speedFactor: 0.7 }
  ];

  function spawnTraffic() {
    const laneIndex = Math.floor(Math.random() * 4);
    const laneCenter = roadLeft + laneIndex * laneWidth + laneWidth / 2;
    const type = TRAFFIC_TYPES[Math.floor(Math.random() * TRAFFIC_TYPES.length)];

    const tooClose = traffic.some(t => Math.abs(t.x - laneCenter) < 20 && t.y < 140);
    if (tooClose) return;

    traffic.push({
      x: laneCenter,
      y: -120,
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
      radius: 16,
      rotation: 0
    });
  }

  function createExhaust(x, y, isNitro) {
    particles.push({
      x: x + (Math.random() - 0.5) * 12,
      y: y,
      vx: (Math.random() - 0.5) * 2,
      vy: isNitro ? 6 + Math.random() * 5 : 3 + Math.random() * 4,
      radius: isNitro ? 6 + Math.random() * 5 : 3.5 + Math.random() * 3,
      color: isNitro ? '#00f0ff' : '#ff9900',
      alpha: 1.0,
      decay: 0.045
    });
  }

  function triggerCrash() {
    running = false;
    sound.playCrash();
    
    for (let i = 0; i < 45; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = 3 + Math.random() * 9;
      particles.push({
        x: player.x,
        y: player.y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        radius: 3 + Math.random() * 7,
        color: Math.random() < 0.5 ? '#ff2a2a' : '#ffd700',
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

    if (keys.boost && nitro > 0) {
      isBoosting = true;
      speed = Math.min(maxSpeed, speed + 0.35);
      nitro = Math.max(0, nitro - 0.65);
    } else {
      isBoosting = false;
      if (keys.up) {
        speed = Math.min(baseSpeed + 4, speed + 0.12);
      } else if (keys.down) {
        speed = Math.max(3, speed - 0.25);
      } else {
        speed += (baseSpeed - speed) * 0.05;
      }
      if (nitro < 100) nitro += 0.08;
    }

    if (keys.left) player.targetX = Math.max(roadLeft + 30, player.targetX - 10);
    if (keys.right) player.targetX = Math.min(roadLeft + roadWidth - 30, player.targetX + 10);
    player.x += (player.targetX - player.x) * 0.2;

    distance += speed * 0.085;
    roadOffset = (roadOffset + speed) % 60;

    spawnTimer++;
    if (spawnTimer > Math.max(30, 85 - speed * 4)) {
      spawnTimer = 0;
      spawnTraffic();
    }
    coinSpawnTimer++;
    if (coinSpawnTimer > 55) {
      coinSpawnTimer = 0;
      spawnCoin();
    }

    // --- DRAW BACKGROUND: CITY SKYLINE AT NIGHT ---
    ctx.fillStyle = '#06080e';
    ctx.fillRect(0, 0, width, height);

    // Distant Neon Grid & Building Silhouettes
    ctx.fillStyle = '#0f1422';
    for (let b = 0; b < width; b += 70) {
      const bHeight = 80 + (Math.sin(b * 0.04) * 0.5 + 0.5) * 60;
      ctx.fillRect(b, 0, 65, bHeight);
      // Window dots
      ctx.fillStyle = 'rgba(212, 175, 55, 0.25)';
      for (let w = 15; w < bHeight - 10; w += 16) {
        ctx.fillRect(b + 10, w, 6, 8);
        ctx.fillRect(b + 30, w, 6, 8);
      }
      ctx.fillStyle = '#0f1422';
    }

    // Speed Lines Effect in background
    if (isBoosting || speed > 10) {
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.35)';
      ctx.lineWidth = 1.5;
      for (const sl of speedLines) {
        sl.y += sl.speed + speed;
        if (sl.y > height) { sl.y = -40; sl.x = Math.random() * width; }
        ctx.beginPath();
        ctx.moveTo(sl.x, sl.y);
        ctx.lineTo(sl.x, sl.y + sl.len);
        ctx.stroke();
      }
    }

    // Road Grass/Side Barriers
    ctx.fillStyle = '#14111a';
    ctx.fillRect(roadLeft - 30, 0, roadWidth + 60, height);

    // Main Road Asphalt
    const roadGrad = ctx.createLinearGradient(roadLeft, 0, roadLeft + roadWidth, 0);
    roadGrad.addColorStop(0, '#1c1b24');
    roadGrad.addColorStop(0.5, '#252330');
    roadGrad.addColorStop(1, '#1c1b24');
    ctx.fillStyle = roadGrad;
    ctx.fillRect(roadLeft, 0, roadWidth, height);

    // Glowing Neon Road Borders
    ctx.strokeStyle = isBoosting ? '#00f0ff' : '#d4af37';
    ctx.lineWidth = 5;
    ctx.shadowColor = isBoosting ? '#00f0ff' : '#d4af37';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.moveTo(roadLeft, 0); ctx.lineTo(roadLeft, height);
    ctx.moveTo(roadLeft + roadWidth, 0); ctx.lineTo(roadLeft + roadWidth, height);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Dashed Lane Dividers
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 3.5;
    ctx.setLineDash([28, 32]);
    ctx.lineDashOffset = -roadOffset;

    for (let l = 1; l < 4; l++) {
      const lx = roadLeft + l * laneWidth;
      ctx.beginPath();
      ctx.moveTo(lx, 0);
      ctx.lineTo(lx, height);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // Headlight Beams from player car
    const headBeam = ctx.createLinearGradient(player.x, player.y, player.x, player.y - 220);
    headBeam.addColorStop(0, 'rgba(255, 255, 255, 0.45)');
    headBeam.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = headBeam;
    ctx.beginPath();
    ctx.moveTo(player.x - 18, player.y - 20);
    ctx.lineTo(player.x - 55, player.y - 220);
    ctx.lineTo(player.x + 55, player.y - 220);
    ctx.lineTo(player.x + 18, player.y - 20);
    ctx.closePath();
    ctx.fill();

    // Exhaust particles
    createExhaust(player.x - 14, player.y + player.h / 2, isBoosting);
    createExhaust(player.x + 14, player.y + player.h / 2, isBoosting);

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
      c.rotation += 0.06;

      const dist = Math.hypot(c.x - player.x, c.y - player.y);
      if (dist < c.radius + player.w / 2) {
        coinsCollected++;
        sound.playCoin();
        for (let s = 0; s < 10; s++) {
          particles.push({
            x: c.x, y: c.y,
            vx: (Math.random() - 0.5) * 5, vy: (Math.random() - 0.5) * 5,
            radius: 3.5, color: '#ffd700', alpha: 1, decay: 0.05
          });
        }
        coins.splice(i, 1);
        continue;
      }

      if (c.y > height + 50) {
        coins.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.scale(Math.cos(c.rotation), 1);
      ctx.beginPath();
      ctx.arc(0, 0, c.radius, 0, Math.PI * 2);
      ctx.fillStyle = '#ffd700';
      ctx.shadowColor = '#d4af37';
      ctx.shadowBlur = 12;
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.restore();
    }

    // UPDATE & DRAW TRAFFIC
    for (let i = traffic.length - 1; i >= 0; i--) {
      const t = traffic[i];
      t.y += speed - (baseSpeed * t.speedFactor);

      if (t.y > height + 140) {
        traffic.splice(i, 1);
        continue;
      }

      if (
        Math.abs(t.x - player.x) < (t.w + player.w) * 0.42 &&
        Math.abs(t.y - player.y) < (t.h + player.h) * 0.42
      ) {
        triggerCrash();
        return;
      }

      ctx.save();
      ctx.translate(t.x, t.y);

      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillRect(-t.w / 2 + 5, -t.h / 2 + 7, t.w, t.h);

      // Chassis
      ctx.fillStyle = t.color;
      ctx.beginPath();
      ctx.roundRect(-t.w / 2, -t.h / 2, t.w, t.h, 12);
      ctx.fill();

      // Windshield
      ctx.fillStyle = '#0f1422';
      ctx.fillRect(-t.w * 0.35, -t.h * 0.22, t.w * 0.7, t.h * 0.46);

      // Taillights
      ctx.fillStyle = '#ff2222';
      ctx.shadowColor = '#ff0000';
      ctx.shadowBlur = 8;
      ctx.fillRect(-t.w * 0.42, t.h / 2 - 6, 9, 5);
      ctx.fillRect(t.w * 0.42 - 9, t.h / 2 - 6, 9, 5);

      ctx.restore();
    }

    // DRAW PLAYER SUPERCAR
    ctx.save();
    ctx.translate(player.x, player.y);

    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(-player.w / 2 + 6, -player.h / 2 + 8, player.w, player.h);

    ctx.shadowColor = isBoosting ? '#00f0ff' : '#ffaa00';
    ctx.shadowBlur = 18;

    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.roundRect(-player.w / 2, -player.h / 2, player.w, player.h, 14);
    ctx.fill();

    // Windshield & Racing Decals
    ctx.fillStyle = '#00f0ff';
    ctx.fillRect(-player.w * 0.35, -player.h * 0.32, player.w * 0.7, player.h * 0.26);

    // Headlights
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-player.w * 0.42, -player.h / 2, 9, 5);
    ctx.fillRect(player.w * 0.42 - 9, -player.h / 2, 9, 5);

    // Golden Racing Stripe
    ctx.fillStyle = '#ffd700';
    ctx.fillRect(-3, -player.h / 2 + 2, 6, player.h - 8);

    ctx.restore();

    // HUD: DISTANCE, SPEED, COINS, NITRO
    ctx.save();
    ctx.font = '900 24px Cinzel, serif';
    ctx.fillStyle = '#ffd700';
    ctx.shadowColor = '#d4af37';
    ctx.shadowBlur = 10;
    ctx.fillText(`${Math.floor(distance)} m`, 28, 45);

    ctx.font = '700 16px Cinzel, serif';
    ctx.fillStyle = isBoosting ? '#00f0ff' : '#fff';
    ctx.fillText(`${Math.floor(speed * 18)} KM/H`, 28, 70);

    ctx.fillStyle = '#ffd700';
    ctx.fillText(`🪙 ${coinsCollected}`, width - 120, 45);

    // Nitro Bar
    ctx.fillStyle = 'rgba(20, 15, 24, 0.85)';
    ctx.roundRect(width - 160, 58, 134, 16, 8);
    ctx.fill();

    ctx.fillStyle = isBoosting ? '#00f0ff' : '#d4af37';
    ctx.roundRect(width - 158, 60, (nitro / 100) * 130, 12, 6);
    ctx.fill();

    ctx.font = '700 10px Cinzel, serif';
    ctx.fillStyle = '#fff';
    ctx.fillText('NITRO (SPACE/SHIFT)', width - 160, 88);
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
