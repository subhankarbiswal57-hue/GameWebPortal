import { loadRegistry, loadGameModule } from '../core/game-registry.js';
import { initRouter, goTo } from '../core/router.js';
import { bus } from '../core/event-bus.js';
import { initModals } from '../ui/modals.js';
import { showScoreCard, initScoreCardUI } from '../ui/scorecard.js';
import { sound } from '../shared/audio.js';
import { init3DIntro } from '../intro/intro-3d.js';

const hubEl = document.getElementById('hub');
const gameView = document.getElementById('game-view');
const canvas = document.getElementById('game-canvas');
const backBtn = document.getElementById('back-btn');
const overlay = document.getElementById('game-overlay');

let activeGame = null;     // holds {stop()} returned by game module
let activeManifest = null;
let pendingGameId = null;

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/workers/service-worker.js').catch(console.error);
}

// Initialize 3D Intro & Modals
init3DIntro();

initModals(() => {
  // Callback upon login/registration: direct user immediately to their pending game or first featured game
  if (pendingGameId) {
    goTo(pendingGameId);
    pendingGameId = null;
  } else {
    // Redirect user to Fruit Blade or current selected game
    goTo('fruit-blade');
  }
});

initScoreCardUI(() => goTo(null));

const manifests = await loadRegistry();
renderCards(manifests);
initRouter();

bus.on('route:change', async (id) => {
  if (!id) return showHub();
  const manifest = manifests.find(m => m.id === id);
  if (!manifest) return showHub();
  await openGame(manifest);
});

function renderCards(list) {
  if (!list.length) {
    hubEl.innerHTML = `<p class="empty-state">No voyages available right now. Check back later.</p>`;
    return;
  }
  hubEl.innerHTML = '';
  for (const m of list) {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <img src="${m.thumbnail}" alt="${m.title}" loading="lazy"
           onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22/%3E'">
      <div class="body">
        <div>
          <h3>${m.title}</h3>
          <p>${m.description}</p>
        </div>
        <div class="play-tag">Set Sail &rarr;</div>
      </div>`;
    card.addEventListener('click', () => {
      sound.init();
      pendingGameId = m.id;
      goTo(m.id);
    });
    hubEl.appendChild(card);
  }
}

async function openGame(manifest) {
  activeManifest = manifest;
  hubEl.classList.add('hidden');
  gameView.classList.remove('hidden');
  overlay.classList.add('hidden');
  document.getElementById('scorecard-modal').classList.add('hidden');
  
  try {
    const mod = await loadGameModule(manifest);
    activeGame = mod.start(canvas);
    canvas.addEventListener('gameover', onGameOver, { once: true });
  } catch (err) {
    console.error(err);
    overlay.innerHTML = `<p>Couldn't load this voyage.</p><button id="ov-back">Back to Harbor</button>`;
    overlay.classList.remove('hidden');
    document.getElementById('ov-back').addEventListener('click', () => goTo(null));
  }
}

function onGameOver(e) {
  const detail = e.detail || {};
  const score = detail.score || 0;
  const stats = detail.stats || [];

  // Display rich scorecard modal
  showScoreCard({
    gameId: activeManifest.id,
    score: score,
    stats: stats,
    onRetry: () => {
      const m = activeManifest;
      teardownGame();
      openGame(m);
    },
    onHub: () => {
      goTo(null);
    }
  });
}

function teardownGame() {
  canvas.removeEventListener('gameover', onGameOver);
  if (activeGame) { 
    try { activeGame.stop(); } catch(e) {}
    activeGame = null; 
  }
}

function showHub() {
  gameView.classList.add('hidden');
  overlay.classList.add('hidden');
  document.getElementById('scorecard-modal').classList.add('hidden');
  hubEl.classList.remove('hidden');
  teardownGame();
}

backBtn.addEventListener('click', () => goTo(null));
