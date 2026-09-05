import { loadRegistry, loadGameModule } from '../core/game-registry.js';
import { initRouter, goTo } from '../core/router.js';
import { bus } from '../core/event-bus.js';

const hubEl = document.getElementById('hub');
const gameView = document.getElementById('game-view');
const canvas = document.getElementById('game-canvas');
const backBtn = document.getElementById('back-btn');
const overlay = document.getElementById('game-overlay');

let activeGame = null;     // holds {stop()} returned by game module
let activeManifest = null;

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/workers/service-worker.js').catch(console.error);
}

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
    hubEl.innerHTML = `<p class="empty-state">No games available right now. Check back later.</p>`;
    return;
  }
  hubEl.innerHTML = '';
  for (const m of list) {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <img src="${m.thumbnail}" alt="${m.title}" loading="lazy"
           onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22/%3E'">
      <div class="body"><h3>${m.title}</h3><p>${m.description}</p></div>`;
    card.addEventListener('click', () => goTo(m.id));
    hubEl.appendChild(card);
  }
}

async function openGame(manifest) {
  activeManifest = manifest;
  hubEl.classList.add('hidden');
  gameView.classList.remove('hidden');
  overlay.classList.add('hidden');
  try {
    const mod = await loadGameModule(manifest);
    activeGame = mod.start(canvas);
    canvas.addEventListener('gameover', onGameOver, { once: true });
  } catch (err) {
    console.error(err);
    overlay.innerHTML = `<p>Couldn't load this game.</p><button id="ov-back">Back to hub</button>`;
    overlay.classList.remove('hidden');
    document.getElementById('ov-back').addEventListener('click', () => goTo(null));
  }
}

function onGameOver() {
  overlay.innerHTML = `
    <p>Game over</p>
    <button id="ov-retry">Retry</button>
    <button id="ov-back">Back to hub</button>`;
  overlay.classList.remove('hidden');
  document.getElementById('ov-retry').addEventListener('click', () => {
    const m = activeManifest;
    teardownGame();
    openGame(m);
  });
  document.getElementById('ov-back').addEventListener('click', () => goTo(null));
}

function teardownGame() {
  canvas.removeEventListener('gameover', onGameOver);
  if (activeGame) { activeGame.stop(); activeGame = null; }
}

function showHub() {
  gameView.classList.add('hidden');
  overlay.classList.add('hidden');
  hubEl.classList.remove('hidden');
  teardownGame();
}

backBtn.addEventListener('click', () => goTo(null));
