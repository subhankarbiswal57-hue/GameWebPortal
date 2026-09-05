import { sound } from '../../apps/portal/js/shared/audio.js';

// Enhanced Fruit Blade game engine with animated dojo background, lanterns, blade trails, combo bursts
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
  let lives = 3;
  let combo = 0;
  let comboTimer = 0;
  let stats = { fruitsSliced: 0, bombsHit: 0, maxCombo: 0 };

  const FRUIT_TYPES = [
    { type: 'watermelon', radius: 38, color: '#e82a47', rimColor: '#2d8a4e', points: 2, icon: '🍉' },
    { type: 'orange', radius: 32, color: '#ff7700', rimColor: '#ffa834', points: 1, icon: '🍊' },
    { type: 'apple', radius: 30, color: '#44cc44', rimColor: '#aaff66', points: 1, icon: '🍏' },
    { type: 'strawberry', radius: 26, color: '#ff1a75', rimColor: '#44aa22', points: 3, icon: '🍓' },
    { type: 'banana', radius: 28, color: '#fdd835', rimColor: '#fff59d', points: 2, icon: '🍌' },
    { type: 'bomb', radius: 34, color: '#1a1a24', rimColor: '#ff2222', points: 0, isBomb: true, icon: '💣' }
  ];

  let items = [];
  let slicedPieces = [];
  let particles = [];
  let bladeTrail = [];
  let floatTexts = [];
  let isPointerDown = false;
  let spawnTimer = 0;
  let spawnInterval = 65;

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
    const clientX = e.clientX ?? (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
    const clientY = e.clientY ?? (e.touches && e.touches[0] ? e.touches[0].clientY : 0);
    const x = clientX - rect.left;
    const y = clientY - rect.top;
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
    const y = height + 45;
    const vx = (width / 2 - x) * 0.015 + (Math.random() - 0.5) * 5;
    const vy = -(13.5 + Math.random() * 4.5);
    const rotation = Math.random() * Math.PI * 2;
    const vRot = (Math.random() - 0.5) * 0.12;

    items.push({
      ...typeObj,
      x, y, vx, vy,
      rotation, vRot,
      sliced: false
    });
  }

  function createSplatter(x, y, color, count = 22) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2.5 + Math.random() * 8;
      particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 2.5 + Math.random() * 5,
        color: color,
        alpha: 1.0,
        decay: 0.02 + Math.random() * 0.03
      });
    }
  }

  function addFloatingText(x, y, text, color = '#ffd700') {
    floatTexts.push({ x, y, text, color, alpha: 1.0, vy: -2 });
  }

  function checkBladeCuts(x, y) {
    if (bladeTrail.length < 2) return;
    const prev = bladeTrail[bladeTrail.length - 2];
    
    for (let i = items.length - 1; i >= 0; i--) {
      const it = items[i];
      if (it.sliced) continue;

      const dist = Math.hypot(it.x - x, it.y - y);
      if (dist < it.radius + 15) {
        it.sliced = true;
        
        if (it.isBomb) {
          sound.playBombExplode();
          createSplatter(it.x, it.y, '#ff3300', 40);
          addFloatingText(it.x, it.y - 20, '💥 BOOM!', '#ff4444');
          stats.bombsHit++;
          lives--;
          items.splice(i, 1);
          if (lives <= 0) {
            triggerGameOver();
          }
          return;
        }

        // Fruit Sliced!
        sound.playSlice();
        sound.playFruitHit();
        stats.fruitsSliced++;
        
        combo++;
        comboTimer = 28;
        if (combo > stats.maxCombo) stats.maxCombo = combo;
        const comboBonus = combo > 1 ? combo : 1;
        const pts = it.points * comboBonus;
        score += pts;

        addFloatingText(it.x, it.y - 15, `+${pts}${combo > 1 ? ` (${combo}x)` : ''}`, it.color);
        createSplatter(it.x, it.y, it.color, 24);

        // Split physics
        const cutAngle = Math.atan2(y - prev.y, x - prev.x);
        const perpX = Math.cos(cutAngle + Math.PI / 2);
        const perpY = Math.sin(cutAngle + Math.PI / 2);

        slicedPieces.push({
          ...it,
          vx: it.vx - perpX * 3.5,
          vy: it.vy - perpY * 3.5,
          vRot: it.vRot - 0.1,
          half: 1
        });
        slicedPieces.push({
          ...it,
          vx: it.vx + perpX * 3.5,
          vy: it.vy + perpY * 3.5,
          vRot: it.vRot + 0.1,
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

  let rafId = null;

  function render(time) {
    if (!running) return;

    // --- ENHANCED ANIMATED BACKGROUND: MYSTIC NIGHT DOJO ---
    const bgGrad = ctx.createRadialGradient(width / 2, height * 0.4, 40, width / 2, height / 2, width * 0.8);
    bgGrad.addColorStop(0, '#261b17');
    bgGrad.addColorStop(0.5, '#150f16');
    bgGrad.addColorStop(1, '#08060a');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Glowing Wooden Floor & Bamboo Silhouette Planks
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.12)';
    ctx.lineWidth = 1.5;
    for (let y = 0; y < height; y += 65) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Glowing Lanterns in corners
    const lanternPulse = Math.sin(time * 0.003) * 0.2 + 0.8;
    ctx.save();
    // Left Lantern Glow
    const g1 = ctx.createRadialGradient(60, 80, 5, 60, 80, 90);
    g1.addColorStop(0, `rgba(255, 170, 0, ${0.4 * lanternPulse})`);
    g1.addColorStop(1, 'rgba(255, 170, 0, 0)');
    ctx.fillStyle = g1;
    ctx.fillRect(0, 0, 160, 180);

    // Right Lantern Glow
    const g2 = ctx.createRadialGradient(width - 60, 80, 5, width - 60, 80, 90);
    g2.addColorStop(0, `rgba(255, 170, 0, ${0.4 * lanternPulse})`);
    g2.addColorStop(1, 'rgba(255, 170, 0, 0)');
    ctx.fillStyle = g2;
    ctx.fillRect(width - 160, 0, 160, 180);
    ctx.restore();

    // Floating Embers Background Animation
    ctx.fillStyle = 'rgba(212, 175, 55, 0.4)';
    for (let e = 0; e < 12; e++) {
      const ex = (Math.sin(time * 0.001 + e * 45) * 0.5 + 0.5) * width;
      const ey = ((time * 0.04 + e * 70) % (height + 20));
      ctx.beginPath();
      ctx.arc(ex, height - ey, 2 + (e % 3), 0, Math.PI * 2);
      ctx.fill();
    }

    // Combo timer
    if (comboTimer > 0) {
      comboTimer--;
      if (comboTimer === 0) combo = 0;
    }

    // Spawning logic
    spawnTimer++;
    if (spawnTimer > spawnInterval) {
      spawnTimer = 0;
      const count = 1 + (Math.random() < 0.45 ? 1 : 0) + (score > 40 && Math.random() < 0.35 ? 1 : 0);
      for (let c = 0; c < count; c++) spawnFruit();
      if (spawnInterval > 38) spawnInterval -= 0.18;
    }

    // UPDATE & DRAW WHOLE FRUITS
    for (let i = items.length - 1; i >= 0; i--) {
      const it = items[i];
      it.vy += 0.36; // Gravity
      it.x += it.vx;
      it.y += it.vy;
      it.rotation += it.vRot;

      if (it.y > height + 80) {
        if (!it.isBomb && !it.sliced) {
          lives--;
          combo = 0;
          addFloatingText(Math.max(30, Math.min(width - 30, it.x)), height - 40, 'MISSED! 💔', '#ff4444');
          if (lives <= 0) {
            triggerGameOver();
            return;
          }
        }
        items.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.translate(it.x, it.y);
      ctx.rotate(it.rotation);

      if (it.isBomb) {
        // Bomb Body
        ctx.beginPath();
        ctx.arc(0, 0, it.radius, 0, Math.PI * 2);
        ctx.fillStyle = it.color;
        ctx.fill();
        ctx.strokeStyle = '#d4af37';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Fuse Spark
        ctx.fillStyle = '#888';
        ctx.fillRect(-5, -it.radius - 7, 10, 7);
        ctx.beginPath();
        ctx.arc(0, -it.radius - 10, 5 + Math.sin(time * 0.03) * 2, 0, Math.PI * 2);
        ctx.fillStyle = '#ff3300';
        ctx.shadowColor = '#ffaa00';
        ctx.shadowBlur = 12;
        ctx.fill();

        ctx.font = '22px system-ui';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('💣', 0, 2);
      } else {
        // Juicy 3D-shaded fruit
        ctx.shadowColor = it.color;
        ctx.shadowBlur = 12;

        ctx.beginPath();
        ctx.arc(0, 0, it.radius, 0, Math.PI * 2);
        ctx.fillStyle = it.rimColor;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(0, 0, it.radius - 4, 0, Math.PI * 2);
        ctx.fillStyle = it.color;
        ctx.fill();

        // Gloss Highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.beginPath();
        ctx.arc(-it.radius * 0.35, -it.radius * 0.35, it.radius * 0.25, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // UPDATE & DRAW SLICED PIECES
    for (let i = slicedPieces.length - 1; i >= 0; i--) {
      const p = slicedPieces[i];
      p.vy += 0.48;
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

    // PARTICLES SPLATTERS
    for (let i = particles.length - 1; i >= 0; i--) {
      const pt = particles[i];
      pt.x += pt.vx;
      pt.y += pt.vy;
      pt.vy += 0.22;
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

    // FLOATING HIT TEXTS
    for (let i = floatTexts.length - 1; i >= 0; i--) {
      const ft = floatTexts[i];
      ft.y += ft.vy;
      ft.alpha -= 0.025;
      if (ft.alpha <= 0) {
        floatTexts.splice(i, 1);
        continue;
      }
      ctx.save();
      ctx.globalAlpha = ft.alpha;
      ctx.font = '900 22px Cinzel, serif';
      ctx.fillStyle = ft.color;
      ctx.shadowColor = ft.color;
      ctx.shadowBlur = 8;
      ctx.textAlign = 'center';
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    }

    // GOLDEN BLADE TRAIL
    for (let i = bladeTrail.length - 1; i >= 0; i--) {
      bladeTrail[i].life -= 0.075;
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
        ctx.strokeStyle = `rgba(212, 175, 55, ${p2.life})`;
        ctx.lineWidth = p2.life * 10;
        ctx.lineCap = 'round';
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 14;
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.strokeStyle = `rgba(255, 255, 255, ${p2.life})`;
        ctx.lineWidth = p2.life * 3.5;
        ctx.stroke();
      }
      ctx.restore();
    }

    // HUD: SCORE, LIVES, COMBO
    ctx.save();
    ctx.font = '900 28px Cinzel, serif';
    ctx.fillStyle = '#ffd700';
    ctx.shadowColor = '#d4af37';
    ctx.shadowBlur = 10;
    ctx.fillText(`🍉 ${score}`, 28, 50);

    let hearts = '';
    for (let h = 0; h < 3; h++) {
      hearts += h < lives ? '❤️ ' : '🖤 ';
    }
    ctx.font = '22px system-ui';
    ctx.fillText(hearts, width - 120, 48);

    if (combo > 1) {
      ctx.font = '900 32px Cinzel, serif';
      ctx.fillStyle = '#ffaa00';
      ctx.shadowColor = '#ff5500';
      ctx.shadowBlur = 15;
      ctx.textAlign = 'center';
      ctx.fillText(`${combo}x COMBO!`, width / 2, 55);
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
