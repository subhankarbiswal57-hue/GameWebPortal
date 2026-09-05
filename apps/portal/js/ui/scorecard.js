import { auth } from '../auth/auth.js';
import { leaderboard } from '../leaderboard/leaderboard.js';
import { sound } from '../shared/audio.js';

let currentOnRetry = null;
let currentOnHub = null;

export function showScoreCard({ gameId, score, stats = [], onRetry, onHub }) {
  currentOnRetry = onRetry;
  currentOnHub = onHub;

  const modal = document.getElementById('scorecard-modal');
  const user = auth.getUser();
  const isNewBest = auth.updateHighScore(gameId, score);

  // Submit score to local & online leaderboard
  leaderboard.submitScore(gameId, user.username, score, user.avatar).then(({ rank, total }) => {
    const rankEl = document.getElementById('sc-rank');
    if (rankEl) {
      rankEl.innerHTML = `Global Rank: <strong>#${rank}</strong> <span class="muted">(of ${total})</span>`;
    }
  });

  // Populate Scorecard Elements
  document.getElementById('sc-avatar').textContent = user.avatar;
  document.getElementById('sc-username').textContent = user.username;
  document.getElementById('sc-score').textContent = score.toLocaleString();
  
  const bestBadge = document.getElementById('sc-best-badge');
  if (isNewBest && score > 0) {
    bestBadge.classList.remove('hidden');
    sound.playVictory();
  } else {
    bestBadge.classList.add('hidden');
  }

  // Populate custom stats breakdown
  const statsGrid = document.getElementById('sc-stats-grid');
  statsGrid.innerHTML = '';
  if (stats && stats.length) {
    for (const st of stats) {
      const item = document.createElement('div');
      item.className = 'stat-item';
      item.innerHTML = `<span class="stat-label">${st.label}</span><span class="stat-value">${st.value}</span>`;
      statsGrid.appendChild(item);
    }
  }

  modal.classList.remove('hidden');
}

export function initScoreCardUI(goToHub) {
  const modal = document.getElementById('scorecard-modal');
  const retryBtn = document.getElementById('sc-retry-btn');
  const hubBtn = document.getElementById('sc-hub-btn');
  const viewLbBtn = document.getElementById('sc-view-lb-btn');

  retryBtn.addEventListener('click', () => {
    modal.classList.add('hidden');
    if (currentOnRetry) currentOnRetry();
  });

  hubBtn.addEventListener('click', () => {
    modal.classList.add('hidden');
    if (currentOnHub) currentOnHub();
    else goToHub();
  });

  viewLbBtn.addEventListener('click', () => {
    modal.classList.add('hidden');
    document.getElementById('leaderboard-btn').click();
  });
}
