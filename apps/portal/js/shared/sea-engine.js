// 7 live animated character renderers & animated sea voyage background engine
export const SEA_CHARACTERS = [
  { id: 'captain_sparrow', title: 'The Dread Captain', quote: 'Why fight when we can negotiate?', icon: '🏴‍☠️', color: '#ffd700', type: 'sparrow' },
  { id: 'tentacle_overlord', title: 'Lord of the Depths', quote: 'Do you fear the eternal locker?!', icon: '🐙', color: '#00ffcc', isScare: true, type: 'tentacle' },
  { id: 'cursed_corsair', title: 'Cursed Corsair', quote: 'You best start believin’ in ghost ships!', icon: '🍎', color: '#ff7700', type: 'corsair' },
  { id: 'dread_buccaneer', title: 'Dread Buccaneer', quote: 'No quarter, no mercy upon these seas!', icon: '🗡️', color: '#ff3333', isScare: true, type: 'buccaneer' },
  { id: 'pirate_queen', title: 'The Pirate Queen', quote: 'Hoist the colours! To the ends of the earth!', icon: '👑', color: '#f3cf58', type: 'queen' },
  { id: 'sea_goddess', title: 'Goddess of the Tides', quote: 'Release the fury of the maelstrom!', icon: '🌊', color: '#38b6ff', isScare: true, type: 'goddess' },
  { id: 'cursed_monkey', title: 'Undead Capuchin', quote: '*Screeches and barks in phantom echoes*', icon: '🐒', color: '#aaff66', type: 'monkey' }
];

// Helper to draw live animated character busts on canvas
export function drawLiveCharacter(ctx, x, y, char, time, scale = 1.0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  const bob = Math.sin(time * 0.005) * 4;
  ctx.translate(0, bob);

  // Character glowing halo
  ctx.beginPath();
  ctx.arc(0, 0, 36, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(20, 15, 24, 0.9)';
  ctx.fill();
  ctx.strokeStyle = char.color;
  ctx.lineWidth = 3;
  ctx.shadowColor = char.color;
  ctx.shadowBlur = 12;
  ctx.stroke();

  // Draw customized animated facial & accessory motifs per character
  if (char.type === 'sparrow') {
    // Tricorn hat & dread beads
    ctx.fillStyle = '#2b1d0c';
    ctx.beginPath();
    ctx.moveTo(-32, -12); ctx.lineTo(0, -38); ctx.lineTo(32, -12); ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#d4af37'; ctx.lineWidth = 2; ctx.stroke();
    // Red bandana
    ctx.fillStyle = '#c0392b';
    ctx.fillRect(-22, -12, 44, 8);
    // Face & Goatee
    ctx.font = '28px system-ui';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('🏴‍☠️', 0, 8);
  } else if (char.type === 'tentacle') {
    // Wiggling Tentacle Beard
    ctx.font = '32px system-ui';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('🐙', 0, -2);
    // Animated moving tentacles below
    ctx.strokeStyle = '#00ffcc';
    ctx.lineWidth = 3;
    for (let t = -3; t <= 3; t++) {
      const wiggle = Math.sin(time * 0.008 + t) * 6;
      ctx.beginPath();
      ctx.moveTo(t * 7, 14);
      ctx.quadraticCurveTo(t * 9 + wiggle, 28, t * 6 + wiggle * 1.5, 42);
      ctx.stroke();
    }
  } else if (char.type === 'corsair') {
    // Feathered Pirate Hat & Poison Apple
    ctx.font = '30px system-ui';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('🍎', -12, 14);
    ctx.fillText('☠️', 4, -4);
  } else if (char.type === 'buccaneer') {
    // Flaming beard embers
    ctx.font = '30px system-ui';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('🗡️', 16, -10);
    ctx.fillText('💀', 0, 4);
    // Smoldering fuses
    ctx.fillStyle = '#ffaa00';
    ctx.beginPath();
    ctx.arc(-16, -16 + Math.sin(time * 0.02) * 2, 3, 0, Math.PI * 2);
    ctx.arc(16, -16 + Math.cos(time * 0.02) * 2, 3, 0, Math.PI * 2);
    ctx.fill();
  } else if (char.type === 'queen') {
    // Golden Tiara & Royal Coat
    ctx.font = '30px system-ui';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('👑', 0, -18);
    ctx.fillText('⚔️', 0, 10);
  } else if (char.type === 'goddess') {
    // Swirling Sea Maelstrom Aura
    ctx.strokeStyle = '#38b6ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 42 + Math.sin(time * 0.006) * 4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.font = '32px system-ui';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('🌊', 0, 2);
  } else if (char.type === 'monkey') {
    // Undead Cursed Monkey
    ctx.font = '32px system-ui';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('🐒', 0, -2);
    ctx.fillText('🪙', 14, 16);
  }

  ctx.restore();
}

// Full Sea Voyage Background Renderer (Day, Golden Sunset, Mystic Night with Galleon Ships & Rolling Ocean)
export function drawSeaVoyageBackground(ctx, width, height, time, dayFactor) {
  // 1. Sky Gradient
  const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
  if (dayFactor > 0.6) {
    // Tropical Blue Voyage Day
    skyGrad.addColorStop(0, '#2193b0');
    skyGrad.addColorStop(0.45, '#6dd5ed');
    skyGrad.addColorStop(0.75, '#bbf2f6');
    skyGrad.addColorStop(1, '#005c8a');
  } else if (dayFactor > 0.3) {
    // Golden Twilight & Sunset
    skyGrad.addColorStop(0, '#651a3a');
    skyGrad.addColorStop(0.35, '#a43931');
    skyGrad.addColorStop(0.65, '#e07a22');
    skyGrad.addColorStop(1, '#2c1e14');
  } else {
    // Moonlit Cursed Caribbean Ocean
    skyGrad.addColorStop(0, '#04070f');
    skyGrad.addColorStop(0.45, '#0b1424');
    skyGrad.addColorStop(0.75, '#122538');
    skyGrad.addColorStop(1, '#020912');
  }
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, width, height);

  // 2. Distant Celestial Orb (Sun or Full Cursed Moon)
  const orbX = (width * 0.15) + (((time * 0.015) % (width * 0.7)));
  const orbY = height * 0.18 + Math.sin(time * 0.0008) * 20;
  ctx.save();
  ctx.beginPath();
  ctx.arc(orbX, orbY, 34, 0, Math.PI * 2);
  if (dayFactor > 0.4) {
    ctx.fillStyle = '#fff475';
    ctx.shadowColor = '#ffd700';
    ctx.shadowBlur = 40;
  } else {
    ctx.fillStyle = '#d8f3dc';
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 30;
  }
  ctx.fill();
  ctx.restore();

  // 3. Distant Islands & Cliffs on the Horizon
  ctx.fillStyle = dayFactor > 0.5 ? '#1b4332' : '#081c15';
  ctx.beginPath();
  ctx.moveTo(0, height * 0.48);
  for (let x = 0; x <= width; x += 40) {
    const hillY = height * 0.48 - Math.sin(x * 0.008 + 1) * 35 - Math.cos(x * 0.015) * 20;
    ctx.lineTo(x, hillY);
  }
  ctx.lineTo(width, height * 0.5);
  ctx.lineTo(0, height * 0.5);
  ctx.fill();

  // 4. Sailing Galleon Ships on the Horizon
  for (let s = 0; s < 2; s++) {
    const shipX = ((time * 0.02 + s * (width * 0.55)) % (width + 120)) - 60;
    const shipY = height * 0.47 + Math.sin(time * 0.004 + s * 2) * 5;
    ctx.save();
    ctx.fillStyle = dayFactor > 0.5 ? '#2c1e14' : '#080509';
    // Hull
    ctx.beginPath();
    ctx.moveTo(shipX - 25, shipY);
    ctx.lineTo(shipX + 25, shipY);
    ctx.lineTo(shipX + 18, shipY + 12);
    ctx.lineTo(shipX - 18, shipY + 12);
    ctx.closePath();
    ctx.fill();
    // Masts & Billowing White Sails
    ctx.fillRect(shipX - 12, shipY - 24, 2, 24);
    ctx.fillRect(shipX + 8, shipY - 28, 2, 28);
    ctx.fillStyle = dayFactor > 0.5 ? '#f4ece1' : 'rgba(180, 200, 220, 0.4)';
    ctx.beginPath();
    ctx.arc(shipX - 11, shipY - 14, 8, -Math.PI / 2, Math.PI / 2);
    ctx.arc(shipX + 9, shipY - 16, 10, -Math.PI / 2, Math.PI / 2);
    ctx.fill();
    ctx.restore();
  }

  // 5. Dynamic Rolling Ocean Waves (Multiple layers with specular highlights)
  const waveLayers = [
    { color: dayFactor > 0.4 ? 'rgba(0, 119, 182, 0.5)' : 'rgba(4, 30, 54, 0.65)', speed: 0.002, freq: 0.012, amp: 14, yBase: height * 0.52 },
    { color: dayFactor > 0.4 ? 'rgba(3, 152, 158, 0.7)' : 'rgba(3, 40, 68, 0.8)', speed: 0.003, freq: 0.016, amp: 18, yBase: height * 0.65 },
    { color: dayFactor > 0.4 ? 'rgba(0, 90, 140, 0.9)' : 'rgba(2, 22, 40, 0.95)', speed: 0.004, freq: 0.02, amp: 22, yBase: height * 0.8 }
  ];

  for (const wl of waveLayers) {
    ctx.fillStyle = wl.color;
    ctx.beginPath();
    ctx.moveTo(0, height);
    for (let x = 0; x <= width; x += 15) {
      const wy = wl.yBase + Math.sin(x * wl.freq + time * wl.speed) * wl.amp;
      ctx.lineTo(x, wy);
    }
    ctx.lineTo(width, height);
    ctx.fill();
  }
}
