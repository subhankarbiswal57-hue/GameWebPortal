// Authentication & Profile Manager
const USER_KEY = 'gwp_auth_user';
const USERS_DB_KEY = 'gwp_users_db';

const AVATARS = ['🦊', '🐱', '🐼', '🦁', '🚀', '⚡', '🎮', '👑', '🐉', '👾'];

class AuthManager {
  constructor() {
    this.currentUser = null;
    this.listeners = new Set();
    this.init();
  }

  init() {
    try {
      const stored = localStorage.getItem(USER_KEY);
      if (stored) {
        this.currentUser = JSON.parse(stored);
      } else {
        // default guest
        this.setGuest();
      }
    } catch (e) {
      this.setGuest();
    }
  }

  setGuest() {
    this.currentUser = {
      username: 'Guest_' + Math.floor(1000 + Math.random() * 9000),
      avatar: AVATARS[Math.floor(Math.random() * AVATARS.length)],
      isGuest: true,
      highScores: {}
    };
    this.saveSession();
  }

  saveSession() {
    try {
      localStorage.setItem(USER_KEY, JSON.stringify(this.currentUser));
      this.notify();
    } catch (e) {
      console.warn('LocalStorage save failed', e);
    }
  }

  getUsersDB() {
    try {
      return JSON.parse(localStorage.getItem(USERS_DB_KEY) || '{}');
    } catch (e) {
      return {};
    }
  }

  saveUsersDB(db) {
    try {
      localStorage.setItem(USERS_DB_KEY, JSON.stringify(db));
    } catch (e) {
      console.warn('LocalStorage save DB failed', e);
    }
  }

  register(username, password, avatar = '🦊') {
    const cleanName = username.trim();
    if (!cleanName || cleanName.length < 3) {
      throw new Error('Username must be at least 3 characters');
    }
    if (!password || password.length < 4) {
      throw new Error('Password must be at least 4 characters');
    }

    const db = this.getUsersDB();
    if (db[cleanName.toLowerCase()]) {
      throw new Error('Username already exists');
    }

    const userData = {
      username: cleanName,
      password: password, // local client demo store
      avatar: avatar,
      isGuest: false,
      createdAt: Date.now(),
      highScores: {}
    };

    db[cleanName.toLowerCase()] = userData;
    this.saveUsersDB(db);

    this.currentUser = {
      username: userData.username,
      avatar: userData.avatar,
      isGuest: false,
      highScores: {}
    };
    this.saveSession();
    return this.currentUser;
  }

  login(username, password) {
    const cleanName = username.trim().toLowerCase();
    const db = this.getUsersDB();
    const user = db[cleanName];

    if (!user || user.password !== password) {
      throw new Error('Invalid username or password');
    }

    this.currentUser = {
      username: user.username,
      avatar: user.avatar || '🦊',
      isGuest: false,
      highScores: user.highScores || {}
    };
    this.saveSession();
    return this.currentUser;
  }

  updateProfile(avatar) {
    if (!this.currentUser) return;
    this.currentUser.avatar = avatar;
    if (!this.currentUser.isGuest) {
      const db = this.getUsersDB();
      const cleanName = this.currentUser.username.toLowerCase();
      if (db[cleanName]) {
        db[cleanName].avatar = avatar;
        this.saveUsersDB(db);
      }
    }
    this.saveSession();
  }

  logout() {
    this.setGuest();
  }

  getUser() {
    return this.currentUser;
  }

  updateHighScore(gameId, score) {
    if (!this.currentUser) return;
    if (!this.currentUser.highScores) this.currentUser.highScores = {};
    const curr = this.currentUser.highScores[gameId] || 0;
    if (score > curr) {
      this.currentUser.highScores[gameId] = score;
      if (!this.currentUser.isGuest) {
        const db = this.getUsersDB();
        const cleanName = this.currentUser.username.toLowerCase();
        if (db[cleanName]) {
          db[cleanName].highScores = this.currentUser.highScores;
          this.saveUsersDB(db);
        }
      }
      this.saveSession();
      return true; // new high score
    }
    return false;
  }

  subscribe(callback) {
    this.listeners.add(callback);
    callback(this.currentUser);
    return () => this.listeners.delete(callback);
  }

  notify() {
    this.listeners.forEach(cb => cb(this.currentUser));
  }
}

export const auth = new AuthManager();
export const AVAILABLE_AVATARS = AVATARS;
