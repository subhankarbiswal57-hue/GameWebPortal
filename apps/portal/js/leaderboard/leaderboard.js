// Unified Leaderboard & Online Sync Manager
const LEADERBOARD_STORAGE_KEY = 'gwp_leaderboard_data';

// Default seeded players for realistic competition across games
const SEED_DATA = {
  'fruit-blade': [
    { name: 'NinjaMaster', avatar: '🐱', score: 485, ts: Date.now() - 3600000 * 4 },
    { name: 'BladeRunner', avatar: '⚡', score: 390, ts: Date.now() - 3600000 * 12 },
    { name: 'FruitSlicer', avatar: '🦊', score: 310, ts: Date.now() - 3600000 * 24 },
    { name: 'SamuraiJack', avatar: '🐉', score: 245, ts: Date.now() - 3600000 * 48 },
    { name: 'DojoPro', avatar: '🐼', score: 180, ts: Date.now() - 3600000 * 72 }
  ],
  'car-racer': [
    { name: 'SpeedDemon', avatar: '🚀', score: 12450, ts: Date.now() - 3600000 * 2 },
    { name: 'TurboViper', avatar: '⚡', score: 9820, ts: Date.now() - 3600000 * 8 },
    { name: 'DriftKing', avatar: '👑', score: 8150, ts: Date.now() - 3600000 * 18 },
    { name: 'ApexRider', avatar: '🦁', score: 6400, ts: Date.now() - 3600000 * 36 },
    { name: 'NitroBlast', avatar: '🎮', score: 4900, ts: Date.now() - 3600000 * 50 }
  ],
  'chess-duel': [
    { name: 'Grandmaster_X', avatar: '👑', score: 1850, ts: Date.now() - 3600000 * 5 },
    { name: 'DeepBlue_AI', avatar: '👾', score: 1620, ts: Date.now() - 3600000 * 14 },
    { name: 'KnightRider', avatar: '🦁', score: 1480, ts: Date.now() - 3600000 * 30 },
    { name: 'CheckmatePro', avatar: '🐼', score: 1350, ts: Date.now() - 3600000 * 60 },
    { name: 'PawnStormer', avatar: '🦊', score: 1200, ts: Date.now() - 3600000 * 90 }
  ],
  'game-one': [
    { name: 'OrbitPilot', avatar: '🚀', score: 3200, ts: Date.now() - 3600000 * 10 },
    { name: 'AstroDodge', avatar: '⚡', score: 2750, ts: Date.now() - 3600000 * 20 },
    { name: 'CosmicVoyager', avatar: '👾', score: 2100, ts: Date.now() - 3600000 * 40 }
  ]
};

class LeaderboardManager {
  constructor() {
    this.data = this.loadLocal();
  }

  loadLocal() {
    try {
      const stored = localStorage.getItem(LEADERBOARD_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed reading leaderboard from localStorage', e);
    }
    this.saveLocal(SEED_DATA);
    return JSON.parse(JSON.stringify(SEED_DATA));
  }

  saveLocal(data) {
    try {
      localStorage.setItem(LEADERBOARD_STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('Failed saving leaderboard to localStorage', e);
    }
  }

  async getScores(gameId = 'fruit-blade') {
    let list = this.data[gameId] || [];
    
    // Attempt online fetch if endpoint available
    try {
      const res = await fetch(`/api/leaderboard?game=${gameId}`, { signal: AbortSignal.timeout(1500) });
      if (res.ok) {
        const remoteScores = await res.json();
        if (Array.isArray(remoteScores) && remoteScores.length > 0) {
          // Merge remote and local without duplicates
          const combined = [...remoteScores, ...list];
          const unique = [];
          const seen = new Set();
          for (const item of combined) {
            const key = `${item.name}_${item.score}`;
            if (!seen.has(key)) {
              seen.add(key);
              unique.push(item);
            }
          }
          unique.sort((a, b) => b.score - a.score);
          list = unique.slice(0, 15);
          this.data[gameId] = list;
          this.saveLocal(this.data);
        }
      }
    } catch (err) {
      // Backend not running or offline, graceful fallback to local
    }

    list.sort((a, b) => b.score - a.score);
    return list;
  }

  async submitScore(gameId, playerName, score, avatar = '🦊') {
    const entry = {
      name: playerName.trim().slice(0, 20) || 'Anonymous',
      avatar: avatar,
      score: Math.floor(score),
      gameId: gameId,
      ts: Date.now()
    };

    if (!this.data[gameId]) {
      this.data[gameId] = [];
    }

    // Insert into local
    this.data[gameId].push(entry);
    this.data[gameId].sort((a, b) => b.score - a.score);
    this.data[gameId] = this.data[gameId].slice(0, 20); // Keep top 20
    this.saveLocal(this.data);

    // Compute rank
    const rank = this.data[gameId].findIndex(e => e.name === entry.name && e.score === entry.score && e.ts === entry.ts) + 1;

    // Send to remote backend if available
    try {
      await fetch('/api/score-submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: entry.name, score: entry.score, gameId, avatar: entry.avatar }),
        signal: AbortSignal.timeout(2000)
      });
    } catch (err) {
      // Ignore network errors in offline/static hosting
    }

    return { rank: rank > 0 ? rank : 1, total: this.data[gameId].length };
  }
}

export const leaderboard = new LeaderboardManager();
