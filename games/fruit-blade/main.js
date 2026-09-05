import { sound } from '../../apps/portal/js/shared/audio.js';
import { REALISTIC_CHARACTERS, drawLiveRealisticCharacter, drawRealisticStormyOcean } from '../../apps/portal/js/shared/sea-engine.js';

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

  // Lifelines
  let lifelines = { freeze: 1, blast: 1, heal: 1 };
  let slowMoTimer = 0;

  // Jumpscares & Popups
  let activePopups = [];
  let jumpScare = null;
  let nextPopupTimer = 160;

  const FRUIT_TYPES = [
    { type: 'watermelon', radius: 38, color: '#e82a47', rimColor: '#2d8a4e', points: 2, icon: '🍉' },
    { type: 'orange', radius: 32, color: '#ff7700', rimColor: '#ffa834', points: 1, icon: '🍊' },
    { type: 'apple', radius: 30, color: '#44cc44', rimColor: '#aaff66', points: 1, icon: '🍏' },
    { type: 'strawberry', radius: 26, color: '#ff1a75', rimColor: '#44aa22', points: 3, icon: '🍓' },
    { type: 'banana', radius: 28, color: '#fdd835', rimColor: '#fff59d', points: 2, icon: '🍌' },
    { type: 'heart', radius: 28, color: '#ff0055', rimColor: '#ffffff', points: 5, isHeart: true, icon: '💖' },
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

  function onPointerDown(e) {
    isPointerDown = true;
    sound.init();
    
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX ?? (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
    const clientY = e.clientY ?? (e.touches && e.touches[0] ? e.touches[0].clientY : 0);
    const px = clientX - rect.left;
    const py = clientY - rect.top;

    if (py > 75 && py < 125) {
      if (px > 24 && px < 74 && lifelines.freeze > 0) {
        lifelines.freeze--;
        slowMoTimer = 220;
        sound.playVictory();
        addFloatingText(px + 25, py, '❄️ CALM SEA FREEZE!', '#00f0ff');
        return;
      }
      if (px > 84 && px < 134 && lifelines.blast > 0) {
        lifelines.blast--;
        sound.playSlice();
        sound.playVictory();
        addFloatingText(width / 2, height / 2, '⚡ MYSTIC CUTLASS SLICE!', '#ffd700');
        for (let i = items.length - 1; i >= 0; i--) {
          if (!items[i].isBomb) {
            score += items[i].points * 2;
            createSplatter(items[i].x, items[i].y, items[i].color, 25);
            items.splice(i, 1);
          }
        }
        return;
      }
      if (px > 144 && px < 194 && lifelines.heal > 0) {
        lifelines.heal--;
        lives = Math.min(3, lives + 1);
        sound.playVictory();
        addFloatingText(px + 25, py, '+1 EXTRA HEART! ❤️', '#ff3366');
        return;
      }
    }

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

  function triggerJumpscare(char) {
    jumpScare = {
      ...char,
      alpha: 1.0,
      scale: 0.15,
      maxScale: 1.6,
      timer: 55
    };
    sound.playCrash();
  }

  function spawnFruit() {
    const isBomb = Math.random() < 0.22;
    const isHeart = Math.random() < 0.08 && lives < 3;
    let typeObj;
    if (isHeart) {
      typeObj = FRUIT_TYPES.find(f => f.isHeart);
    } else if (isBomb) {
      typeObj = FRUIT_TYPES.find(f => f.isBomb);
    } else {
      typeObj = FRUIT_TYPES.filter(f => !f.isBomb && !f.isHeart)[Math.floor(Math.random() * 5)];
    }

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
        
        if (it.isHeart) {
          lives = Math.min(3, lives + 1);
          sound.playVictory();
          createSplatter(it.x, it.y, '#ff0055', 30);
          addFloatingText(it.x, it.y - 15, '❤️ EXTRA HEART!', '#ff0055');
          items.splice(i, 1);
          return;
        }

        if (it.isBomb) {
          sound.playBombExplode();
          createSplatter(it.x, it.y, '#ff3300', 40);
          addFloatingText(it.x, it.y - 20, '💥 BOOM!', '#ff4444');
          stats.bombsHit++;
          lives--;
          items.splice(i, 1);
          
          const scareChars = REALISTIC_CHARACTERS.filter(c => c.isScare);
          const scareChar = scareChars[Math.floor(Math.random() * scareChars.length)];
          triggerJumpscare(scareChar);

          if (lives <= 0) {
            triggerGameOver();
          }
          return;
        }

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

    // --- REALISTIC OCEAN & DAY/NIGHT CYCLE ---
    const cycleSpeed = 0.00012;
    const dayFactor = (Math.sin(time * cycleSpeed) + 1) / 2;

    drawRealisticStormyOcean(ctx, width, height, time, dayFactor);

    const speedMult = slowMoTimer > 0 ? 0.35 : 1.0;
    if (slowMoTimer > 0) slowMoTimer--;

    // 7 REALISTIC MOVING CHARACTERS SLIDING IN
    nextPopupTimer--;
    if (nextPopupTimer <= 0) {
      nextPopupTimer = 220 + Math.floor(Math.random() * 180);
      const char = REALISTIC_CHARACTERS[Math.floor(Math.random() * REALISTIC_CHARACTERS.length)];
      activePopups.push({
        char,
        x: Math.random() < 0.5 ? -260 : width + 260,
        targetX: Math.random() < 0.5 ? 50 : width - 290,
        y: height - 200,
        alpha: 1.0,
        timer: 160
      });
    }

    for (let i = activePopups.length - 1; i >= 0; i--) {
      const p = activePopups[i];
      p.x += (p.targetX - p.x) * 0.08;
      p.timer--;
      if (p.timer < 30) p.alpha = p.timer / 30;

      if (p.timer <= 0) {
        activePopups.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.globalAlpha = p.alpha;
      
      // Dialogue parchment box
      ctx.fillStyle = 'rgba(15, 12, 18, 0.95)';
      ctx.roundRect(p.x, p.y, 250, 85, 14);
      ctx.fill();
      ctx.strokeStyle = p.char.color;
      ctx.lineWidth = 2.5;
      ctx.shadowColor = p.char.color;
      ctx.shadowBlur = 10;
      ctx.stroke();

      // Realistic Animated Portrait
      drawLiveRealisticCharacter(ctx, p.x + 45, p.y + 42, p.char, time, 65);

      ctx.font = '900 13px Cinzel, serif';
      ctx.fillStyle = p.char.color;
      ctx.fillText(p.char.title, p.x + 85, p.y + 28);

      ctx.font = '11px system-ui';
      ctx.fillStyle = '#fff';
      ctx.fillText(p.char.quote, p.x + 85, p.y + 52, 155);
      ctx.restore();
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
      it.vy += 0.36 * speedMult;
      it.x += it.vx * speedMult;
      it.y += it.vy * speedMult;
      it.rotation += it.vRot * speedMult;

      if (it.y > height + 80) {
        if (!it.isBomb && !it.isHeart && !it.sliced) {
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

      if (it.isHeart) {
        ctx.font = '40px system-ui';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = '#ff0055';
        ctx.shadowBlur = 15;
        ctx.fillText('💖', 0, 0);
      } else if (it.isBomb) {
        ctx.beginPath();
        ctx.arc(0, 0, it.radius, 0, Math.PI * 2);
        ctx.fillStyle = it.color;
        ctx.fill();
        ctx.strokeStyle = '#d4af37';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        ctx.font = '22px system-ui';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('💣', 0, 2);
      } else {
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
      p.vy += 0.48 * speedMult;
      p.x += p.vx * speedMult;
      p.y += p.vy * speedMult;
      p.rotation += p.vRot * speedMult;

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

    // PARTICLES
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

    // FLOATING TEXTS
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

    // BLADE TRAIL
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

    // JUMPSCARE SCREEN OVERLAY WITH REALISTIC PORTRAIT
    if (jumpScare) {
      jumpScare.timer--;
      jumpScare.scale = Math.min(jumpScare.maxScale, jumpScare.scale + 0.12);
      
      ctx.save();
      ctx.fillStyle = `rgba(139, 0, 0, ${jumpScare.timer > 20 ? 0.75 : jumpScare.timer * 0.035})`;
      ctx.fillRect(0, 0, width, height);

      drawLiveRealisticCharacter(ctx, width / 2, height / 2 - 35, jumpScare, time, 120 * jumpScare.scale);

      ctx.font = '900 34px Cinzel, serif';
      ctx.fillStyle = '#ffd700';
      ctx.textAlign = 'center';
      ctx.fillText(jumpScare.title.toUpperCase(), width / 2, height / 2 + 85);

      ctx.font = '700 20px Cinzel, serif';
      ctx.fillStyle = '#fff';
      ctx.fillText(`"${jumpScare.quote}"`, width / 2, height / 2 + 120);
      ctx.restore();

      if (jumpScare.timer <= 0) {
        jumpScare = null;
      }
    }

    // TOP HUD: SCORE & LIVES
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

    // LIFELINES HUD
    const llY = 82;
    ctx.fillStyle = lifelines.freeze > 0 ? 'rgba(0, 240, 255, 0.25)' : 'rgba(0, 0, 0, 0.4)';
    ctx.strokeStyle = lifelines.freeze > 0 ? '#00f0ff' : '#555';
    ctx.lineWidth = 1.5;
    ctx.roundRect(24, llY, 50, 40, 8);
    ctx.fill(); ctx.stroke();
    ctx.font = '20px system-ui';
    ctx.fillText('❄️', 36, llY + 28);

    ctx.fillStyle = lifelines.blast > 0 ? 'rgba(255, 215, 0, 0.25)' : 'rgba(0, 0, 0, 0.4)';
    ctx.strokeStyle = lifelines.blast > 0 ? '#ffd700' : '#555';
    ctx.roundRect(84, llY, 50, 40, 8);
    ctx.fill(); ctx.stroke();
    ctx.fillText('⚡', 96, llY + 28);

    ctx.fillStyle = lifelines.heal > 0 ? 'rgba(255, 0, 85, 0.25)' : 'rgba(0, 0, 0, 0.4)';
    ctx.strokeStyle = lifelines.heal > 0 ? '#ff0055' : '#555';
    ctx.roundRect(144, llY, 50, 40, 8);
    ctx.fill(); ctx.stroke();
    ctx.fillText('💖', 156, llY + 28);

    ctx.font = '700 10px Cinzel, serif';
    ctx.fillStyle = '#fff';
    ctx.fillText('LIFELINES (CLICK TO USE)', 24, llY + 54);

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
