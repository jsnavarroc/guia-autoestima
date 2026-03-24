/**
 * tracker.js — Persistencia dual: localStorage (cache) + API JSON (permanente)
 *
 * Guarda en localStorage para velocidad y en el servidor JSON para persistencia.
 * Estructura MongoDB-compatible: cada usuario es un documento con _id = cédula.
 */

const Tracker = {
  userId: null,
  API_BASE: '/api',

  // ============================================
  // User management
  // ============================================

  setUser(cedula) {
    this.userId = cedula;
  },

  _localKey(suffix) {
    return `guia_${this.userId}_${suffix}`;
  },

  // Check if user exists (API first, fallback to localStorage)
  async userExistsAsync(cedula) {
    try {
      const res = await fetch(`${this.API_BASE}/users/${cedula}`);
      if (res.ok) return true;
    } catch (e) { /* offline fallback */ }
    return localStorage.getItem(`guia_${cedula}_data`) !== null;
  },

  // Sync check (for non-async contexts)
  userExists(cedula) {
    return localStorage.getItem(`guia_${cedula}_data`) !== null;
  },

  // Get all registered users
  async getAllUsersAsync() {
    try {
      const res = await fetch(`${this.API_BASE}/users`);
      if (res.ok) {
        const data = await res.json();
        return data.users || [];
      }
    } catch (e) { /* offline fallback */ }
    return this.getAllUsers();
  },

  getAllUsers() {
    try {
      return JSON.parse(localStorage.getItem('guia_users') || '[]');
    } catch (e) {
      return [];
    }
  },

  registerUser(cedula, name) {
    // localStorage
    const users = this.getAllUsers();
    if (!users.find(u => u.cedula === cedula)) {
      users.push({ cedula, name, registeredAt: new Date().toISOString() });
      localStorage.setItem('guia_users', JSON.stringify(users));
    }
    // API (fire and forget)
    this._apiPost('/users', { _id: cedula, name }).catch(() => {});
  },

  // ============================================
  // User data (scores, profile, answers)
  // ============================================

  saveUserData(data) {
    if (!this.userId) return;
    // localStorage (cache)
    localStorage.setItem(this._localKey('data'), JSON.stringify(data));
    // API (persistent)
    this._apiPost('/users', {
      _id: this.userId,
      ...data
    }).catch(e => console.warn('API save failed, data in localStorage:', e));
  },

  loadUserData() {
    if (!this.userId) return null;
    try {
      const data = localStorage.getItem(this._localKey('data'));
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  },

  // Load from API and update localStorage
  async loadUserDataAsync() {
    if (!this.userId) return null;
    try {
      const res = await fetch(`${this.API_BASE}/users/${this.userId}`);
      if (res.ok) {
        const { user } = await res.json();
        // Update localStorage cache
        localStorage.setItem(this._localKey('data'), JSON.stringify(user));
        return user;
      }
    } catch (e) { /* offline fallback */ }
    return this.loadUserData();
  },

  // Save scores specifically
  saveScores(scores, profile, answers) {
    // API
    this._apiPut(`/users/${this.userId}/scores`, { scores, profile, answers })
      .catch(e => console.warn('API scores save failed:', e));
  },

  // ============================================
  // Weekly tracking
  // ============================================

  getCurrentWeekNumber() {
    const userData = this.loadUserData();
    if (!userData?.assessmentDate) return 1;
    const start = new Date(userData.assessmentDate);
    const now = new Date();
    const diff = Math.floor((now - start) / (7 * 24 * 60 * 60 * 1000));
    return Math.max(1, diff + 1);
  },

  getCurrentWeek() {
    const weeks = this.getWeeks();
    const weekNum = this.getCurrentWeekNumber();
    return weeks[weekNum] || {
      week: weekNum,
      checklist: {},
      wellbeing: 5,
      selfCriticism: 5,
      sleepHours: 7,
      exerciseMinutes: 0,
      completionRate: 0
    };
  },

  getWeeks() {
    if (!this.userId) return {};
    try {
      return JSON.parse(localStorage.getItem(this._localKey('weeks')) || '{}');
    } catch (e) {
      return {};
    }
  },

  updateCurrentWeek(key, value) {
    const weeks = this.getWeeks();
    const weekNum = this.getCurrentWeekNumber();
    if (!weeks[weekNum]) weeks[weekNum] = { week: weekNum, checklist: {} };
    weeks[weekNum][key] = value;
    this.saveWeeks(weeks);
  },

  updateChecklist(key, checked) {
    const weeks = this.getWeeks();
    const weekNum = this.getCurrentWeekNumber();
    if (!weeks[weekNum]) weeks[weekNum] = { week: weekNum, checklist: {} };
    if (!weeks[weekNum].checklist) weeks[weekNum].checklist = {};
    weeks[weekNum].checklist[key] = checked;

    const total = 8;
    const completed = Object.values(weeks[weekNum].checklist).filter(v => v).length;
    weeks[weekNum].completionRate = Math.round((completed / total) * 100);
    this.saveWeeks(weeks);
  },

  saveCurrentWeek() {
    const weeks = this.getWeeks();
    const weekNum = this.getCurrentWeekNumber();
    if (weeks[weekNum]) {
      weeks[weekNum].savedAt = new Date().toISOString();
      this.saveWeeks(weeks);
    }
  },

  saveWeeks(weeks) {
    if (!this.userId) return;
    // localStorage
    localStorage.setItem(this._localKey('weeks'), JSON.stringify(weeks));
    // API
    this._apiPut(`/users/${this.userId}/weeks`, { weeks })
      .catch(e => console.warn('API weeks save failed:', e));
  },

  getHistory() {
    const weeks = this.getWeeks();
    return Object.values(weeks).sort((a, b) => a.week - b.week);
  },

  // ============================================
  // Exercise log
  // ============================================

  logExercise(exerciseId, data) {
    if (!this.userId) return;
    // localStorage
    const key = this._localKey(`exercise_${exerciseId}`);
    try {
      const existing = JSON.parse(localStorage.getItem(key) || '[]');
      existing.push({ ...data, date: new Date().toISOString() });
      localStorage.setItem(key, JSON.stringify(existing));
    } catch (e) {}
    // API
    this._apiPost(`/users/${this.userId}/exercises`, { exerciseId, data })
      .catch(e => console.warn('API exercise save failed:', e));
  },

  getExerciseLog(exerciseId) {
    if (!this.userId) return [];
    try {
      return JSON.parse(localStorage.getItem(this._localKey(`exercise_${exerciseId}`)) || '[]');
    } catch (e) {
      return [];
    }
  },

  // ============================================
  // Export / Import
  // ============================================

  exportData() {
    return {
      _id: this.userId,
      userData: this.loadUserData(),
      weeks: this.getWeeks(),
      exportDate: new Date().toISOString()
    };
  },

  // ============================================
  // Logout / Clear
  // ============================================

  logout() {
    this.userId = null;
  },

  clearUser() {
    if (!this.userId) return;
    const prefix = `guia_${this.userId}_`;
    Object.keys(localStorage)
      .filter(k => k.startsWith(prefix))
      .forEach(k => localStorage.removeItem(k));
  },

  // ============================================
  // API helpers (fire-and-forget by default)
  // ============================================

  async _apiPost(path, body) {
    const res = await fetch(`${this.API_BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    return res.json();
  },

  async _apiPut(path, body) {
    const res = await fetch(`${this.API_BASE}${path}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    return res.json();
  }
};
