// Ultra-realistic stormy cursed ocean & 7 high-detail photorealistic animated portraits
// Using high-detail vector artwork portraits with dynamic physics animations, lightning flashes, sea mist & rain

export const REALISTIC_CHARACTERS = [
  {
    id: 'jack_sparrow',
    title: 'Captain Jack Sparrow',
    quote: 'The problem is not the problem. The problem is your attitude about the problem.',
    color: '#ffd700',
    render(ctx, size) {
      const r = size / 2;
      // Dark atmospheric vignette backdrop
      const bg = ctx.createRadialGradient(0, 0, 5, 0, 0, r);
      bg.addColorStop(0, '#3a2512');
      bg.addColorStop(1, '#0e0b09');
      ctx.fillStyle = bg;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();

      // Dreadlocks on both sides
      ctx.fillStyle = '#1c150e';
      for (let i = -3; i <= 3; i++) {
        ctx.beginPath();
        ctx.ellipse(i * 10, 10, 5, 26, (i * 0.15), 0, Math.PI * 2);
        ctx.fill();
        // Dread beads
        if (i % 2 === 0) {
          ctx.fillStyle = '#d4af37';
          ctx.fillRect(i * 10 - 3, 20, 6, 5);
          ctx.fillStyle = '#1c150e';
        }
      }

      // Face
      ctx.fillStyle = '#c89d7c';
      ctx.beginPath();
      ctx.ellipse(0, 4, 18, 22, 0, 0, Math.PI * 2);
      ctx.fill();

      // Iconic Red Bandana
      ctx.fillStyle = '#8b0000';
      ctx.beginPath();
      ctx.ellipse(0, -10, 22, 8, 0, 0, Math.PI * 2);
      ctx.fill();

      // Leather Tricorn Hat
      ctx.fillStyle = '#1a120b';
      ctx.beginPath();
      ctx.moveTo(-28, -8);
      ctx.lineTo(0, -32);
      ctx.lineTo(28, -8);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#d4af37';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Smudged Kohl Eyes & Brow
      ctx.fillStyle = '#111';
      ctx.fillRect(-11, -1, 7, 3);
      ctx.fillRect(4, -1, 7, 3);
      ctx.fillStyle = '#fff';
      ctx.fillRect(-9, 0, 3, 2);
      ctx.fillRect(6, 0, 3, 2);

      // Braided Goatee with beads
      ctx.fillStyle = '#140e09';
      ctx.beginPath();
      ctx.moveTo(-3, 24); ctx.lineTo(-4, 38); ctx.lineTo(-1, 38); ctx.lineTo(0, 24);
      ctx.moveTo(0, 24); ctx.lineTo(1, 38); ctx.lineTo(4, 38); ctx.lineTo(3, 24);
      ctx.fill();
      ctx.fillStyle = '#d4af37';
      ctx.fillRect(-5, 30, 4, 3);
      ctx.fillRect(1, 32, 4, 3);
    }
  },
  {
    id: 'davy_jones',
    title: 'Davy Jones',
    quote: 'Life is cruel. Why should the afterlife be any different?!',
    color: '#00ffcc',
    isScare: true,
    render(ctx, size, time = 0) {
      const r = size / 2;
      const bg = ctx.createRadialGradient(0, 0, 5, 0, 0, r);
      bg.addColorStop(0, '#0d2822');
      bg.addColorStop(1, '#030d0a');
      ctx.fillStyle = bg;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();

      // Barnacle Covered Tricorn
      ctx.fillStyle = '#0a1a15';
      ctx.beginPath();
      ctx.moveTo(-26, -10); ctx.lineTo(0, -32); ctx.lineTo(26, -10); ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#4e8775';
      ctx.fillRect(-12, -18, 5, 4);
      ctx.fillRect(8, -14, 6, 5);

      // Pale Sea-Green Face & Crab Claw Eyebrow
      ctx.fillStyle = '#4a7c6f';
      ctx.beginPath();
      ctx.ellipse(0, 0, 20, 22, 0, 0, Math.PI * 2);
      ctx.fill();

      // Piercing Blue-Green Glowing Eyes
      ctx.fillStyle = '#00ffcc';
      ctx.shadowColor = '#00ffcc';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(-8, -2, 3.5, 0, Math.PI * 2);
      ctx.arc(8, -2, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Writhing Animated Tentacle Beard
      ctx.strokeStyle = '#2d6a59';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      for (let t = -4; t <= 4; t++) {
        const wiggle = Math.sin(time * 0.007 + t * 0.8) * 8;
        ctx.beginPath();
        ctx.moveTo(t * 5, 10);
        ctx.quadraticCurveTo(t * 7 + wiggle, 26, t * 5 + wiggle * 1.5, 42);
        ctx.stroke();
      }
    }
  },
  {
    id: 'hector_barbossa',
    title: 'Captain Hector Barbossa',
    quote: 'You best start believin in ghost stories... you’re in one!',
    color: '#ff7700',
    isScare: true,
    render(ctx, size) {
      const r = size / 2;
      const bg = ctx.createRadialGradient(0, 0, 5, 0, 0, r);
      bg.addColorStop(0, '#2b1b11');
      bg.addColorStop(1, '#0d0703');
      ctx.fillStyle = bg;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();

      // Wide Feathered Hat
      ctx.fillStyle = '#1c130d';
      ctx.beginPath();
      ctx.ellipse(0, -18, 30, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      // Ostrich Feather
      ctx.fillStyle = '#e5d0ba';
      ctx.beginPath();
      ctx.ellipse(-14, -26, 16, 5, -0.4, 0, Math.PI * 2);
      ctx.fill();

      // Weathered Ghost Pirate Face
      ctx.fillStyle = '#b59275';
      ctx.beginPath();
      ctx.ellipse(0, 4, 18, 22, 0, 0, Math.PI * 2);
      ctx.fill();

      // Wild Gray Beard & Mustache
      ctx.fillStyle = '#6b6661';
      ctx.beginPath();
      ctx.ellipse(0, 18, 16, 14, 0, 0, Math.PI * 2);
      ctx.fill();

      // Golden Tooth Gleam
      ctx.fillStyle = '#ffd700';
      ctx.fillRect(-2, 10, 4, 4);

      // Green Poison Apple in Hand
      ctx.fillStyle = '#70e000';
      ctx.beginPath();
      ctx.arc(22, 22, 9, 0, Math.PI * 2);
      ctx.fill();
    }
  },
  {
    id: 'blackbeard',
    title: 'Edward Teach (Blackbeard)',
    quote: 'If I don’t kill a man now and then, they forget who I am.',
    color: '#ff2222',
    isScare: true,
    render(ctx, size, time = 0) {
      const r = size / 2;
      const bg = ctx.createRadialGradient(0, 0, 5, 0, 0, r);
      bg.addColorStop(0, '#380a0a');
      bg.addColorStop(1, '#0d0202');
      ctx.fillStyle = bg;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();

      // Heavy Black Captain Hat
      ctx.fillStyle = '#110c0c';
      ctx.beginPath();
      ctx.moveTo(-28, -10); ctx.lineTo(0, -32); ctx.lineTo(28, -10); ctx.closePath();
      ctx.fill();

      // Stern menacing Face
      ctx.fillStyle = '#996f57';
      ctx.beginPath();
      ctx.ellipse(0, 2, 18, 20, 0, 0, Math.PI * 2);
      ctx.fill();

      // Massive Smoldering Black Beard
      ctx.fillStyle = '#110e0e';
      ctx.beginPath();
      ctx.moveTo(-16, 10);
      ctx.lineTo(-20, 36); ctx.lineTo(0, 44); ctx.lineTo(20, 36);
      ctx.lineTo(16, 10);
      ctx.closePath();
      ctx.fill();

      // Animated Glowing Smoke Fuses in Beard
      for (let f = -1; f <= 1; f += 2) {
        ctx.fillStyle = '#ff3300';
        ctx.shadowColor = '#ff5500';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(f * 12, 16 + Math.sin(time * 0.02 + f) * 3, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        // Smoke puff
        ctx.fillStyle = 'rgba(200, 200, 200, 0.4)';
        ctx.beginPath();
        ctx.arc(f * 14, 8 + Math.cos(time * 0.02 + f) * 4, 5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  },
  {
    id: 'elizabeth_swann',
    title: 'Elizabeth Swann (Pirate King)',
    quote: 'We fight... to run away! What say you to that, Captain?',
    color: '#ffd166',
    render(ctx, size) {
      const r = size / 2;
      const bg = ctx.createRadialGradient(0, 0, 5, 0, 0, r);
      bg.addColorStop(0, '#2e1f2b');
      bg.addColorStop(1, '#0f080e');
      ctx.fillStyle = bg;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();

      // Flowing Brown Hair
      ctx.fillStyle = '#3a2012';
      ctx.beginPath();
      ctx.ellipse(0, 6, 24, 28, 0, 0, Math.PI * 2);
      ctx.fill();

      // Face
      ctx.fillStyle = '#edd1be';
      ctx.beginPath();
      ctx.ellipse(0, 2, 15, 18, 0, 0, Math.PI * 2);
      ctx.fill();

      // Pirate King Silk Headband & Crown Inlay
      ctx.fillStyle = '#8b0000';
      ctx.fillRect(-16, -10, 32, 6);
      ctx.fillStyle = '#ffd700';
      ctx.beginPath();
      ctx.moveTo(-10, -10); ctx.lineTo(-5, -16); ctx.lineTo(0, -10); ctx.lineTo(5, -16); ctx.lineTo(10, -10);
      ctx.fill();

      // Focused Eyes
      ctx.fillStyle = '#4a2810';
      ctx.fillRect(-8, 0, 5, 2.5);
      ctx.fillRect(3, 0, 5, 2.5);
    }
  },
  {
    id: 'calypso_goddess',
    title: 'Tia Dalma / Calypso',
    quote: 'The sea is a fierce mistress. She takes what she wants!',
    color: '#00b4d8',
    isScare: true,
    render(ctx, size, time = 0) {
      const r = size / 2;
      const bg = ctx.createRadialGradient(0, 0, 5, 0, 0, r);
      bg.addColorStop(0, '#0a2236');
      bg.addColorStop(1, '#020910');
      ctx.fillStyle = bg;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();

      // Mystic Swirling Maelstrom Aura
      ctx.strokeStyle = 'rgba(0, 180, 216, 0.6)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, r - 6, time * 0.003, time * 0.003 + Math.PI * 1.5);
      ctx.stroke();

      // Dreadlocked Wild Hair with Charms
      ctx.fillStyle = '#140c06';
      ctx.beginPath();
      ctx.ellipse(0, 6, 25, 28, 0, 0, Math.PI * 2);
      ctx.fill();

      // Dark Radiant Face with Mystical Glyphs
      ctx.fillStyle = '#5c3d2e';
      ctx.beginPath();
      ctx.ellipse(0, 2, 16, 19, 0, 0, Math.PI * 2);
      ctx.fill();

      // Glowing Sea Eyes & Crab Claws
      ctx.fillStyle = '#00f0ff';
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 12;
      ctx.fillRect(-8, 0, 5, 3);
      ctx.fillRect(3, 0, 5, 3);
      ctx.shadowBlur = 0;

      // Crab Claw necklace
      ctx.fillStyle = '#e63946';
      ctx.beginPath();
      ctx.arc(0, 24, 7, 0, Math.PI * 2);
      ctx.fill();
    }
  },
  {
    id: 'jack_the_monkey',
    title: 'Jack the Cursed Monkey',
    quote: '*Barks and chatters with skeletal phantom fury!*',
    color: '#90be6d',
    isScare: true,
    render(ctx, size, time = 0) {
      const r = size / 2;
      const bg = ctx.createRadialGradient(0, 0, 5, 0, 0, r);
      bg.addColorStop(0, '#223018');
      bg.addColorStop(1, '#080d05');
      ctx.fillStyle = bg;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();

      // Furry Capuchin Face
      ctx.fillStyle = '#4a3319';
      ctx.beginPath();
      ctx.ellipse(0, 4, 18, 16, 0, 0, Math.PI * 2);
      ctx.fill();

      // Miniature Pirate Hat
      ctx.fillStyle = '#1c130d';
      ctx.beginPath();
      ctx.moveTo(-16, -6); ctx.lineTo(0, -22); ctx.lineTo(16, -6); ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#ffd700';
      ctx.fillRect(-10, -8, 20, 3);

      // Cursed Glowing Green Eyes
      ctx.fillStyle = '#70e000';
      ctx.shadowColor = '#70e000';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(-7, 2, 3, 0, Math.PI * 2);
      ctx.arc(7, 2, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Aztec Gold Medallion in Paw
      ctx.fillStyle = '#ffd700';
      ctx.beginPath();
      ctx.arc(14, 18, 7, 0, Math.PI * 2);
      ctx.fill();
    }
  }
];

// Helper to draw live realistic character
export function drawLiveRealisticCharacter(ctx, x, y, char, time, size = 90) {
  ctx.save();
  ctx.translate(x, y);

  const bob = Math.sin(time * 0.006) * 3;
  ctx.translate(0, bob);

  // Outer Glowing Relic Frame
  ctx.save();
  ctx.shadowColor = char.color;
  ctx.shadowBlur = 16;
  ctx.strokeStyle = char.color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, 0, size / 2 + 3, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // Render character portrait
  char.render(ctx, size, time);

  ctx.restore();
}

// REALISTIC SCARY STORMY OCEAN VOYAGE ENGINE
let lightningFlash = 0;

export function drawRealisticStormyOcean(ctx, width, height, time, dayFactor) {
  // Lightning strike trigger (occasional scary flash during stormy night/sunset)
  if (Math.random() < 0.006 && lightningFlash <= 0 && dayFactor < 0.6) {
    lightningFlash = 12; // frames of lightning
  }

  // 1. SKY WITH REALISTIC GRADIENTS & LIGHTNING
  const skyGrad = ctx.createLinearGradient(0, 0, 0, height * 0.65);
  if (lightningFlash > 0) {
    // Blinding Lightning Storm Flash!
    skyGrad.addColorStop(0, '#e2f3f5');
    skyGrad.addColorStop(0.5, '#97cadb');
    skyGrad.addColorStop(1, '#055052');
    lightningFlash--;
  } else if (dayFactor > 0.65) {
    // Moody Daylight Tempest
    skyGrad.addColorStop(0, '#1f4068');
    skyGrad.addColorStop(0.4, '#537791');
    skyGrad.addColorStop(0.7, '#94b49f');
    skyGrad.addColorStop(1, '#1b2a41');
  } else if (dayFactor > 0.35) {
    // Blood-Red Cursed Sunset
    skyGrad.addColorStop(0, '#400d12');
    skyGrad.addColorStop(0.35, '#851d41');
    skyGrad.addColorStop(0.65, '#db4437');
    skyGrad.addColorStop(1, '#110507');
  } else {
    // Scary Pitch Black Ghost Ocean Night
    skyGrad.addColorStop(0, '#020305');
    skyGrad.addColorStop(0.4, '#060b14');
    skyGrad.addColorStop(0.75, '#0a1526');
    skyGrad.addColorStop(1, '#01050a');
  }
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, width, height);

  // 2. MOON / SUN WITH FOG HALO
  const orbX = width * 0.72;
  const orbY = height * 0.16;
  ctx.save();
  const halo = ctx.createRadialGradient(orbX, orbY, 10, orbX, orbY, 110);
  halo.addColorStop(0, dayFactor > 0.5 ? 'rgba(255, 230, 150, 0.9)' : 'rgba(180, 240, 255, 0.8)');
  halo.addColorStop(0.3, dayFactor > 0.5 ? 'rgba(255, 180, 50, 0.35)' : 'rgba(0, 200, 255, 0.25)');
  halo.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(orbX, orbY, 110, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = dayFactor > 0.5 ? '#fff4b8' : '#e0fbfc';
  ctx.beginPath();
  ctx.arc(orbX, orbY, 26, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 3. SCARY GHOST SHIPS (Black Pearl / Flying Dutchman)
  for (let s = 0; s < 2; s++) {
    const shipSpeed = s === 0 ? 0.025 : 0.018;
    const shipX = ((time * shipSpeed + s * (width * 0.6)) % (width + 200)) - 100;
    const shipRock = Math.sin(time * 0.003 + s * 3) * 8;
    const shipY = height * 0.46 + shipRock;

    ctx.save();
    ctx.translate(shipX, shipY);
    ctx.rotate(Math.sin(time * 0.003 + s * 3) * 0.08);

    // Ghost Ship Silhouette with tattered sails & green phantom lanterns
    ctx.fillStyle = '#05070a';
    ctx.beginPath();
    ctx.moveTo(-35, 0); ctx.lineTo(35, 0); ctx.lineTo(24, 18); ctx.lineTo(-24, 18);
    ctx.closePath();
    ctx.fill();

    // 3 Masts
    ctx.fillRect(-18, -36, 3, 36);
    ctx.fillRect(0, -44, 3, 44);
    ctx.fillRect(18, -34, 3, 34);

    // Tattered Black Sails
    ctx.fillStyle = 'rgba(15, 20, 28, 0.85)';
    ctx.beginPath();
    ctx.arc(-16, -20, 12, -Math.PI / 2, Math.PI / 2);
    ctx.arc(2, -24, 15, -Math.PI / 2, Math.PI / 2);
    ctx.arc(20, -18, 11, -Math.PI / 2, Math.PI / 2);
    ctx.fill();

    // Glowing Phantom Green Lanterns
    ctx.fillStyle = '#00ffcc';
    ctx.shadowColor = '#00ffcc';
    ctx.shadowBlur = 15;
    ctx.fillRect(28, -6, 4, 4);
    ctx.fillRect(-28, -6, 4, 4);
    ctx.shadowBlur = 0;

    ctx.restore();
  }

  // 4. REALISTIC TURBULENT SWELLING OCEAN (Multi-Harmonic Wave Physics)
  const oceanLayers = [
    { color: dayFactor > 0.5 ? 'rgba(18, 48, 71, 0.7)' : 'rgba(4, 12, 22, 0.8)', speed: 0.002, amp: 16, freq: 0.009, y: height * 0.49 },
    { color: dayFactor > 0.5 ? 'rgba(11, 60, 93, 0.85)' : 'rgba(3, 18, 34, 0.9)', speed: 0.0035, amp: 22, freq: 0.014, y: height * 0.62 },
    { color: dayFactor > 0.5 ? 'rgba(6, 40, 65, 0.98)' : 'rgba(2, 9, 18, 0.99)', speed: 0.005, amp: 28, freq: 0.018, y: height * 0.78 }
  ];

  for (const layer of oceanLayers) {
    ctx.fillStyle = layer.color;
    ctx.beginPath();
    ctx.moveTo(0, height);
    for (let x = 0; x <= width; x += 12) {
      // 3 overlapping sines for realistic oceanic choppy swell
      const wy = layer.y + 
        Math.sin(x * layer.freq + time * layer.speed) * layer.amp +
        Math.cos(x * layer.freq * 2.2 - time * layer.speed * 1.4) * (layer.amp * 0.4);
      ctx.lineTo(x, wy);
    }
    ctx.lineTo(width, height);
    ctx.fill();

    // Sea Foam Whitecap Highlights on wave peaks
    ctx.strokeStyle = 'rgba(230, 245, 255, 0.35)';
    ctx.lineWidth = 2.5;
    ctx.stroke();
  }

  // 5. SEA MIST & DRIFTING RAIN EMIST PARTICLES
  ctx.fillStyle = 'rgba(200, 230, 255, 0.25)';
  for (let d = 0; d < 30; d++) {
    const rx = ((time * 0.3 + d * 65) % width);
    const ry = ((time * 0.4 + d * 45) % height);
    ctx.fillRect(rx, ry, 1.5, 8);
  }
}
