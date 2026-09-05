import { auth, AVAILABLE_AVATARS } from '../auth/auth.js';
import { leaderboard } from '../leaderboard/leaderboard.js';

export function initModals() {
  // --- AUTH MODAL ---
  const authModal = document.getElementById('auth-modal');
  const userProfileBtn = document.getElementById('user-profile-btn');
  const authCloseBtn = document.getElementById('auth-close-btn');
  const loginTab = document.getElementById('tab-login');
  const registerTab = document.getElementById('tab-register');
  const loginForm = document.getElementById('form-login');
  const registerForm = document.getElementById('form-register');
  const authError = document.getElementById('auth-error');
  const avatarPicker = document.getElementById('avatar-picker');

  let selectedAvatar = AVAILABLE_AVATARS[0];

  // Render Avatars in registration
  avatarPicker.innerHTML = '';
  AVAILABLE_AVATARS.forEach(av => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `avatar-opt ${av === selectedAvatar ? 'active' : ''}`;
    btn.textContent = av;
    btn.addEventListener('click', () => {
      document.querySelectorAll('.avatar-opt').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedAvatar = av;
    });
    avatarPicker.appendChild(btn);
  });

  userProfileBtn.addEventListener('click', () => {
    authModal.classList.remove('hidden');
    authError.textContent = '';
  });

  authCloseBtn.addEventListener('click', () => {
    authModal.classList.add('hidden');
  });

  loginTab.addEventListener('click', () => {
    loginTab.classList.add('active');
    registerTab.classList.remove('active');
    loginForm.classList.remove('hidden');
    registerForm.classList.add('hidden');
    authError.textContent = '';
  });

  registerTab.addEventListener('click', () => {
    registerTab.classList.add('active');
    loginTab.classList.remove('active');
    registerForm.classList.remove('hidden');
    loginForm.classList.add('hidden');
    authError.textContent = '';
  });

  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const uname = document.getElementById('login-username').value;
    const pass = document.getElementById('login-password').value;
    try {
      auth.login(uname, pass);
      authModal.classList.add('hidden');
      loginForm.reset();
    } catch (err) {
      authError.textContent = err.message;
    }
  });

  registerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const uname = document.getElementById('reg-username').value;
    const pass = document.getElementById('reg-password').value;
    try {
      auth.register(uname, pass, selectedAvatar);
      authModal.classList.add('hidden');
      registerForm.reset();
    } catch (err) {
      authError.textContent = err.message;
    }
  });

  // Track user session changes in Navbar
  auth.subscribe((user) => {
    const nameEl = document.getElementById('nav-user-name');
    const avEl = document.getElementById('nav-user-avatar');
    if (user) {
      nameEl.textContent = user.username;
      avEl.textContent = user.avatar;
    }
  });

  // --- LEADERBOARD MODAL ---
  const lbModal = document.getElementById('leaderboard-modal');
  const lbBtn = document.getElementById('leaderboard-btn');
  const lbCloseBtn = document.getElementById('lb-close-btn');
  const lbList = document.getElementById('lb-list');
  const tabs = document.querySelectorAll('.lb-tab');

  let activeGameId = 'fruit-blade';

  async function renderLeaderboard() {
    lbList.innerHTML = '<p class="lb-loading">Fetching online rankings...</p>';
    const scores = await leaderboard.getScores(activeGameId);
    lbList.innerHTML = '';

    if (!scores.length) {
      lbList.innerHTML = '<p class="empty-state">No scores yet. Be the first to rank!</p>';
      return;
    }

    scores.forEach((item, index) => {
      const row = document.createElement('div');
      row.className = `lb-row ${index === 0 ? 'top-1' : index === 1 ? 'top-2' : index === 2 ? 'top-3' : ''}`;
      
      let medal = `#${index + 1}`;
      if (index === 0) medal = '🥇 1st';
      else if (index === 1) medal = '🥈 2nd';
      else if (index === 2) medal = '🥉 3rd';

      row.innerHTML = `
        <span class="lb-rank">${medal}</span>
        <span class="lb-avatar">${item.avatar || '🦊'}</span>
        <span class="lb-name">${item.name}</span>
        <span class="lb-score">${item.score.toLocaleString()}</span>
      `;
      lbList.appendChild(row);
    });
  }

  lbBtn.addEventListener('click', () => {
    lbModal.classList.remove('hidden');
    renderLeaderboard();
  });

  lbCloseBtn.addEventListener('click', () => {
    lbModal.classList.add('hidden');
  });

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      activeGameId = tab.dataset.game;
      renderLeaderboard();
    });
  });
}
