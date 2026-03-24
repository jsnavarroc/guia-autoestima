/**
 * server.js — Mini servidor para la Guía de Autoestima
 *
 * - Sirve archivos estáticos
 * - API REST para persistir datos en users_db.json
 * - Estructura MongoDB-compatible (documentos con _id, timestamps)
 *
 * Uso: node server.js
 * URL: http://localhost:3000
 */

const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3040;
const DB_FILE = path.join(__dirname, 'data', 'users_db.json');

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.static(__dirname));

// ============================================
// Database helpers (JSON file)
// ============================================

function readDB() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      const initial = { _metadata: { version: '1.0', created: new Date().toISOString(), description: 'Guía de Autoestima - Base de datos de usuarios. Compatible con MongoDB.' }, users: [] };
      fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf-8');
      return initial;
    }
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
  } catch (e) {
    console.error('Error reading DB:', e);
    return { _metadata: {}, users: [] };
  }
}

function writeDB(db) {
  try {
    db._metadata.lastModified = new Date().toISOString();
    db._metadata.totalUsers = db.users.length;
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
    return true;
  } catch (e) {
    console.error('Error writing DB:', e);
    return false;
  }
}

function findUser(db, cedula) {
  return db.users.find(u => u._id === cedula);
}

// ============================================
// API Routes
// ============================================

// GET /api/users — Listar todos los usuarios (solo resumen)
app.get('/api/users', (req, res) => {
  const db = readDB();
  const summary = db.users.map(u => ({
    _id: u._id,
    name: u.name || '',
    registeredAt: u.createdAt,
    lastLogin: u.lastLogin,
    hasAssessment: !!(u.scores && Object.keys(u.scores).length > 0)
  }));
  res.json({ ok: true, users: summary });
});

// GET /api/users/:cedula — Obtener datos completos de un usuario
app.get('/api/users/:cedula', (req, res) => {
  const db = readDB();
  const user = findUser(db, req.params.cedula);
  if (!user) {
    return res.status(404).json({ ok: false, error: 'Usuario no encontrado' });
  }
  // Update last login
  user.lastLogin = new Date().toISOString();
  writeDB(db);
  res.json({ ok: true, user });
});

// POST /api/users — Crear o actualizar usuario completo
app.post('/api/users', (req, res) => {
  const db = readDB();
  const data = req.body;

  if (!data._id && !data.cedula) {
    return res.status(400).json({ ok: false, error: 'Se requiere _id o cedula' });
  }

  const cedula = data._id || data.cedula;
  let user = findUser(db, cedula);

  if (user) {
    // Update existing
    Object.assign(user, data, {
      _id: cedula,
      updatedAt: new Date().toISOString(),
      lastLogin: new Date().toISOString()
    });
  } else {
    // Create new
    user = {
      _id: cedula,
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastLogin: new Date().toISOString()
    };
    db.users.push(user);
  }

  writeDB(db);
  res.json({ ok: true, user });
});

// PUT /api/users/:cedula/scores — Guardar/actualizar scores
app.put('/api/users/:cedula/scores', (req, res) => {
  const db = readDB();
  let user = findUser(db, req.params.cedula);

  if (!user) {
    // Auto-create user
    user = {
      _id: req.params.cedula,
      createdAt: new Date().toISOString(),
      assessments: []
    };
    db.users.push(user);
  }

  user.scores = req.body.scores;
  user.profile = req.body.profile;
  user.answers = req.body.answers;
  user.updatedAt = new Date().toISOString();

  // Append to assessments history
  if (!user.assessments) user.assessments = [];
  user.assessments.push({
    date: new Date().toISOString(),
    scores: req.body.scores,
    profile: req.body.profile
  });

  writeDB(db);
  res.json({ ok: true, user });
});

// PUT /api/users/:cedula/weeks — Guardar datos semanales
app.put('/api/users/:cedula/weeks', (req, res) => {
  const db = readDB();
  let user = findUser(db, req.params.cedula);

  if (!user) {
    return res.status(404).json({ ok: false, error: 'Usuario no encontrado' });
  }

  user.weeks = req.body.weeks || req.body;
  user.updatedAt = new Date().toISOString();

  writeDB(db);
  res.json({ ok: true });
});

// POST /api/users/:cedula/exercises — Guardar ejercicio
app.post('/api/users/:cedula/exercises', (req, res) => {
  const db = readDB();
  let user = findUser(db, req.params.cedula);

  if (!user) {
    return res.status(404).json({ ok: false, error: 'Usuario no encontrado' });
  }

  if (!user.exercises) user.exercises = {};

  const exerciseId = req.body.exerciseId;
  if (!user.exercises[exerciseId]) user.exercises[exerciseId] = [];

  user.exercises[exerciseId].push({
    ...req.body.data,
    date: new Date().toISOString()
  });

  user.updatedAt = new Date().toISOString();
  writeDB(db);
  res.json({ ok: true });
});

// GET /api/users/:cedula/exercises/:exerciseId — Obtener historial de ejercicio
app.get('/api/users/:cedula/exercises/:exerciseId', (req, res) => {
  const db = readDB();
  const user = findUser(db, req.params.cedula);

  if (!user) {
    return res.status(404).json({ ok: false, error: 'Usuario no encontrado' });
  }

  const logs = user.exercises?.[req.params.exerciseId] || [];
  res.json({ ok: true, logs });
});

// DELETE /api/users/:cedula — Eliminar usuario
app.delete('/api/users/:cedula', (req, res) => {
  const db = readDB();
  const idx = db.users.findIndex(u => u._id === req.params.cedula);

  if (idx === -1) {
    return res.status(404).json({ ok: false, error: 'Usuario no encontrado' });
  }

  db.users.splice(idx, 1);
  writeDB(db);
  res.json({ ok: true, message: 'Usuario eliminado' });
});

// GET /api/export — Exportar toda la base de datos
app.get('/api/export', (req, res) => {
  const db = readDB();
  res.setHeader('Content-Disposition', 'attachment; filename=users_db.json');
  res.json(db);
});

// ============================================
// Start server
// ============================================

app.listen(PORT, () => {
  console.log(`\n🌱 Guía de Autoestima — Servidor activo`);
  console.log(`   URL: http://localhost:${PORT}`);
  console.log(`   DB:  ${DB_FILE}`);
  console.log(`   API: http://localhost:${PORT}/api/users\n`);
});

// One-time migration endpoint: receives localStorage dump and imports to JSON
app.post('/api/migrate-localstorage', (req, res) => {
  const localData = req.body;
  const db = readDB();
  let migrated = 0;

  // Find all user data keys
  for (const [key, value] of Object.entries(localData)) {
    if (key === 'guia_users') continue; // skip index
    
    const match = key.match(/^guia_(.+?)_data$/);
    if (!match) continue;
    
    const cedula = match[1];
    let userData;
    try {
      userData = JSON.parse(value);
    } catch (e) { continue; }

    let user = findUser(db, cedula);
    if (!user) {
      user = { _id: cedula, createdAt: new Date().toISOString() };
      db.users.push(user);
    }

    // Merge all data
    Object.assign(user, userData, {
      _id: cedula,
      updatedAt: new Date().toISOString(),
      migratedFrom: 'localStorage',
      migratedAt: new Date().toISOString()
    });

    // Also look for weeks data
    const weeksKey = `guia_${cedula}_weeks`;
    if (localData[weeksKey]) {
      try {
        user.weeks = JSON.parse(localData[weeksKey]);
      } catch (e) {}
    }

    // Look for exercise data
    for (const [eKey, eVal] of Object.entries(localData)) {
      const eMatch = eKey.match(new RegExp(`^guia_${cedula}_exercise_(.+)$`));
      if (eMatch) {
        if (!user.exercises) user.exercises = {};
        try {
          user.exercises[eMatch[1]] = JSON.parse(eVal);
        } catch (e) {}
      }
    }

    migrated++;
  }

  // Also import user index
  if (localData['guia_users']) {
    try {
      const usersList = JSON.parse(localData['guia_users']);
      for (const u of usersList) {
        let existing = findUser(db, u.cedula);
        if (existing && !existing.name && u.name) {
          existing.name = u.name;
        }
      }
    } catch (e) {}
  }

  writeDB(db);
  res.json({ ok: true, migrated, totalUsers: db.users.length });
});
