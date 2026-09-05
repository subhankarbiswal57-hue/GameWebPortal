import { sound } from '../../apps/portal/js/shared/audio.js';

// Fruit blade game engine with slicing physics, particles & combos
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
  let lives = 3;
  let combo = 0;
  let comboTimer = 0;
  let stats = { fruitsSliced: 0, bombsHit: 0, maxCombo: 0 };

  const FRUIT_TYPES = [
    { type: 'watermelon', radius: 36, color: '#e82a47', rimColor: '#2d8a4e', points: 2 },
    { type: 'orange', radius: 30, color: '#ff7700', rimColor: '#ffa834', points: 1 },
    { type: 'apple', radius: 28, color: '#44cc44', rimColor: '#aaff66', points: 1 },
    { type: 'strawberry', radius: 24, color: '#ff1a75', rimColor: '#44aa22', points: 3 },
    { type: 'banana', radius: 26, color: '#fdd835', rimColor: '#fff59d', points: 2 },
    { type: 'bomb', radius: 32, color: '#22222b', rimColor: '#ff2222', points: 0, isBomb: true }
  ];

  let items = [];
  let slicedPieces = [];
  let particles = [];
  let bladeTrail = [];
  let isPointerDown = false;
  let spawnTimer = 0;
  let spawnInterval = 75;

  // Blade trail listeners
  function onPointerDown(e) {
    isPointerDown = true;
    sound.init();
    addBladePoint(e);
  }
  function onPointerMove(e) {
    if (isPointerDown || e.buttons > 0) {
      addBladePoint(e);
    }
  }
  function onPointerUp() {
    isPointerDown = false;
  }

  function addBladePoint(e) {
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
    const y = (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top;
    bladeTrail.push({ x, y, life: 1.0 });
    checkBladeCuts(x, y);
  }

  canvas.addEventListener('mousedown', onPointerDown);
  canvas.addEventListener('mousemove', onPointerMove);
  window.addEventListener('mouseup', onPointerUp);
  canvas.addEventListener('touchstart', onPointerDown, { passive: true });
  canvas.addEventListener('touchmove', onPointerMove, { passive: true });
  window.addEventListener('touchend', onPointerUp);

  function spawnFruit() {
    const isBomb = Math.random() < 0.22;
    const typeObj = isBomb 
      ? FRUIT_TYPES.find(f => f.isBomb) 
      : FRUIT_TYPES[Math.floor(Math.random() * (FRUIT_TYPES.length - 1))];

    const x = width * 0.15 + Math.random() * (width * 0.7);
    const y = height + 40;
    const vx = (width / 2 - x) * 0.015 + (Math.random() - 0.5) * 4;
    const vy = -(13 + Math.random() * 4);
    const rotation = Math.random() * Math.PI * 2;
    const vRot = (Math.random() - 0.5) * 0.1;

    items.push({
      ...typeObj,
      x, y, vx, vy,
      rotation, vRot,
      sliced: false
    });
  }

  function createSplatter(x, y, color, count = 16) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 7;
      particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 2 + Math.random() * 4,
        color: color,
        alpha: 1.0,
        decay: 0.02 + Math.random() * 0.03
      });
    }
  }

  function checkBladeCuts(x, y) {
    if (bladeTrail.length < 2) return;
    const prev = bladeTrail[bladeTrail.length - 2];
    
    // Check line segment intersection or proximity
    for (let i = items.length - 1; i >= 0; i--) {
      const it = items[i];
      if (it.sliced) continue;

      const dist = Math.hypot(it.x - x, it.y - y);
      if (dist < it.radius + 10) {
        it.sliced = true;
        
        if (it.isBomb) {
          // BOMB DETONATED!
          sound.playBombExplode();
          createSplatter(it.x, it.y, '#ff4400', 35);
          stats.bombsHit++;
          lives--;
          items.splice(i, 1);
          if (lives <= 0) {
            triggerGameOver();
          }
          return;
        }

        // FRUIT SLICED!
        sound.playSlice();
        sound.playFruitHit();
        stats.fruitsSliced++;
        
        combo++;
        comboTimer = 25;
        if (combo > stats.maxCombo) stats.maxCombo = combo;
        const comboBonus = combo > 1 ? combo : 1;
        score += it.points * comboBonus;

        createSplatter(it.x, it.y, it.color, 20);

        // Split into two halves
        const cutAngle = Math.atan2(y - prev.y, x - prev.x);
        const perpX = Math.cos(cutAngle + Math.PI / 2);
        const perpY = Math.sin(cutAngle + Math.PI / 2);

        slicedPieces.push({
          ...it,
          vx: it.vx - perpX * 3,
          vy: it.vy - perpY * 3,
          vRot: it.vRot - 0.08,
          half: 1
        });
        slicedPieces.push({
          ...it,
          vx: it.vx + perpX * 3,
          vy: it.vy + perpY * 3,
          vRot: it.vRot + 0.08,
          half: 2
        });

        items.splice(i, 1);
      }
    }
  }

  function triggerGameOver() {
    running = false;
    canvas.dispatchEvent(new CustomEvent('gameover', {
      detail: {
        score: score,
        stats: [
          { label: 'Fruits Sliced', value: stats.fruitsSliced },
          { label: 'Max Combo', value: `${stats.maxCombo}x` },
          { label: 'Bombs Hit', value: stats.bombsHit }
        ]
      }
    }));
  }

  let lastTime = performance.now();
  let rafId = null;

  function render(time) {
    if (!running) return;

    // Background clearing with wooden dojo vibe
    ctx.fillStyle = '#140f1a';
    ctx.fillRect(0, 0, width, height);

    // Subtle background wooden boards lines
    ctx.strokeStyle = '#221a2c';
    ctx.lineWidth = 1;
    for (let y = 0; y < height; y += 60) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Combo timer tick
    if (comboTimer > 0) {
      comboTimer--;
      if (comboTimer === 0) combo = 0;
    }

    // Spawning logic
    spawnTimer++;
    if (spawnTimer > spawnInterval) {
      spawnTimer = 0;
      const count = 1 + (Math.random() < 0.4 ? 1 : 0) + (score > 50 && Math.random() < 0.3 ? 1 : 0);
      for (let c = 0; c < count; c++) spawnFruit();
      if (spawnInterval > 40) spawnInterval -= 0.2; // gradually speed up
    }

    // Update & draw whole fruits
    for (let i = items.length - 1; i >= 0; i--) {
      const it = items[i];
      it.vy += 0.35; // gravity
      it.x += it.vx;
      it.y += it.vy;
      it.rotation += it.vRot;

      // Missed fruit drops past bottom
      if (it.y > height + 80) {
        if (!it.isBomb && !it.sliced) {
          lives--;
          combo = 0;
          if (lives <= 0) {
            triggerGameOver();
            return;
          }
        }
        items.splice(i, 1);
        continue;
      }

      // Draw fruit/bomb
      ctx.save();
      ctx.translate(it.x, it.y);
      ctx.rotate(it.rotation);

      if (it.isBomb) {
        // Bomb Body
        ctx.beginPath();
        ctx.arc(0, 0, it.radius, 0, Math.PI * 2);
        ctx.fillStyle = it.color;
        ctx.fill();
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Bomb Cap & Fuse Spark
        ctx.fillStyle = '#888';
        ctx.fillRect(-5, -it.radius - 6, 10, 6);
        ctx.beginPath();
        ctx.arc(0, -it.radius - 8, 4 + Math.sin(time * 0.05) * 2, 0, Math.PI * 2);
        ctx.fillStyle = '#ffaa00';
        ctx.fill();
      } else {
        // Whole Fruit Outer
        ctx.beginPath();
        ctx.arc(0, 0, it.radius, 0, Math.PI * 2);
        ctx.fillStyle = it.rimColor;
        ctx.fill();

        // Inner flesh
        ctx.beginPath();
        ctx.arc(0, 0, it.radius - 4, 0, Math.PI * 2);
        ctx.fillStyle = it.color;
        ctx.fill();

        // Details / seeds
        ctx.fillStyle = '#fff6';
        ctx.beginPath();
        ctx.arc(-it.radius * 0.3, -it.radius * 0.3, it.radius * 0.2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // Update & draw sliced pieces
    for (let i = slicedPieces.length - 1; i >= 0; i--) {
      const p = slicedPieces[i];
      p.vy += 0.45;
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.vRot;

      if (p.y > height + 80) {
        slicedPieces.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);

      ctx.beginPath();
      if (p.half === 1) {
        ctx.arc(0, 0, p.radius, Math.PI, Math.PI * 2);
      } else {
        ctx.arc(0, 0, p.radius, 0, Math.PI);
      }
      ctx.fillStyle = p.rimColor;
      ctx.fill();

      ctx.beginPath();
      if (p.half === 1) {
        ctx.arc(0, 0, p.radius - 4, Math.PI, Math.PI * 2);
      } else {
        ctx.arc(0, 0, p.radius - 4, 0, Math.PI);
      }
      ctx.fillStyle = p.color;
      ctx.fill();
      ctx.restore();
    }

    // Update & draw particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const pt = particles[i];
      pt.x += pt.vx;
      pt.y += pt.vy;
      pt.vy += 0.2;
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

    // Blade trail update & draw
    for (let i = bladeTrail.length - 1; i >= 0; i--) {
      bladeTrail[i].life -= 0.08;
      if (bladeTrail[i].life <= 0) {
        bladeTrail.splice(i, 1);
      }
    }

    if (bladeTrail.length > 1) {
      ctx.save();
      for (let i = 1; i < bladeTrail.length; i++) {
        const p1 = bladeTrail[i - 1];
        const p2 = bladeTrail[i];
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.strokeStyle = `rgba(0, 240, 255, ${p2.life})`;
        ctx.lineWidth = p2.life * 8;
        ctx.lineCap = 'round';
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.strokeStyle = `rgba(255, 255, 255, ${p2.life})`;
        ctx.lineWidth = p2.life * 3;
        ctx.stroke();
      }
      ctx.restore();
    }

    // HUD: Score, Lives & Combo
    ctx.save();
    ctx.font = '900 28px system-ui, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 10;
    ctx.fillText(`🍉 ${score}`, 24, 46);

    // Lives as hearts / crosses
    let hearts = '';
    for (let h = 0; h < 3; h++) {
      hearts += h < lives ? '❤️ ' : '🖤 ';
    }
    ctx.font = '22px system-ui, sans-serif';
    ctx.fillText(hearts, width - 110, 44);

    // Active combo indicator
    if (combo > 1) {
      ctx.font = '900 32px system-ui, sans-serif';
      ctx.fillStyle = '#ff007f';
      ctx.shadowColor = '#ff007f';
      ctx.fillText(`${combo}x COMBO!`, width / 2 - 80, 50);
    }
    ctx.restore();

    rafId = requestAnimationFrame(render);
  }

  rafId = requestAnimationFrame(render);

  return {
    stop() {
      running = false;
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('mousedown', onPointerDown);
      canvas.removeEventListener('mousemove', onPointerMove);
      window.removeEventListener('mouseup', onPointerUp);
      canvas.removeEventListener('touchstart', onPointerDown);
      canvas.removeEventListener('touchmove', onPointerMove);
      window.removeEventListener('touchend', onPointerUp);
    }
  };
}
