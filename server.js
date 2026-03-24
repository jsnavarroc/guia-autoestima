/**
 * server.js — Servidor para la Guía de Autoestima
 *
 * - Sirve archivos estáticos
 * - API REST para persistir datos
 * - MongoDB Atlas en producción, JSON local en desarrollo
 *
 * Uso: node server.js
 * Env: MONGODB_URI=mongodb+srv://... (opcional, si no existe usa JSON local)
 */

const express = require('express');
const fs = require('fs');
const path = require('path');
const { MongoClient, ServerApiVersion } = require('mongodb');

const app = express();
const PORT = process.env.PORT || 3040;
const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = 'guia_autoestima';
const COLLECTION = 'users';
const DB_FILE = path.join(__dirname, 'data', 'users_db.json');

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.static(__dirname));

// ============================================
// Database abstraction layer
// ============================================

let mongoClient = null;
let db = null;
let useMongo = false;

async function initDB() {
  if (MONGODB_URI) {
    try {
      mongoClient = new MongoClient(MONGODB_URI, {
        serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true }
      });
      await mongoClient.connect();
      db = mongoClient.db(DB_NAME);
      // Create index on _id (already exists by default)
      useMongo = true;
      console.log('   DB: MongoDB Atlas conectado');
    } catch (e) {
      console.error('   DB: Error conectando MongoDB, usando JSON local:', e.message);
      useMongo = false;
    }
  } else {
    console.log('   DB: JSON local (data/users_db.json)');
    useMongo = false;
  }
}

// --- MongoDB operations ---
const mongoDB = {
  async findAll() {
    return db.collection(COLLECTION).find({}).project({ answers: 0 }).toArray();
  },
  async findUser(id) {
    return db.collection(COLLECTION).findOne({ _id: id });
  },
  async upsertUser(id, data) {
    const now = new Date().toISOString();
    const result = await db.collection(COLLECTION).findOneAndUpdate(
      { _id: id },
      {
        $set: { ...data, _id: id, updatedAt: now, lastLogin: now },
        $setOnInsert: { createdAt: now }
      },
      { upsert: true, returnDocument: 'after' }
    );
    return result;
  },
  async updateField(id, field, value) {
    const now = new Date().toISOString();
    await db.collection(COLLECTION).updateOne(
      { _id: id },
      { $set: { [field]: value, updatedAt: now } }
    );
  },
  async pushAssessment(id, assessment) {
    const now = new Date().toISOString();
    await db.collection(COLLECTION).updateOne(
      { _id: id },
      {
        $push: { assessments: assessment },
        $set: { scores: assessment.scores, profile: assessment.profile, updatedAt: now }
      }
    );
  },
  async pushExercise(id, exerciseId, data) {
    const now = new Date().toISOString();
    await db.collection(COLLECTION).updateOne(
      { _id: id },
      {
        $push: { [`exercises.${exerciseId}`]: { ...data, date: now } },
        $set: { updatedAt: now }
      }
    );
  },
  async getExercises(id, exerciseId) {
    const user = await db.collection(COLLECTION).findOne(
      { _id: id },
      { projection: { [`exercises.${exerciseId}`]: 1 } }
    );
    return user?.exercises?.[exerciseId] || [];
  },
  async deleteUser(id) {
    await db.collection(COLLECTION).deleteOne({ _id: id });
  }
};

// --- JSON file operations (fallback) ---
function readJSON() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      const initial = { _metadata: { version: '1.0', created: new Date().toISOString() }, users: [] };
      fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf-8');
      return initial;
    }
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
  } catch (e) {
    return { _metadata: {}, users: [] };
  }
}

function writeJSON(data) {
  try {
    data._metadata.lastModified = new Date().toISOString();
    data._metadata.totalUsers = data.users.length;
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error writing JSON:', e);
  }
}

const jsonDB = {
  async findAll() {
    const data = readJSON();
    return data.users.map(u => ({
      _id: u._id, name: u.name || '', registeredAt: u.createdAt,
      lastLogin: u.lastLogin, hasAssessment: !!(u.scores && Object.keys(u.scores).length > 0)
    }));
  },
  async findUser(id) {
    const data = readJSON();
    return data.users.find(u => u._id === id) || null;
  },
  async upsertUser(id, userData) {
    const data = readJSON();
    const now = new Date().toISOString();
    let user = data.users.find(u => u._id === id);
    if (user) {
      Object.assign(user, userData, { _id: id, updatedAt: now, lastLogin: now });
    } else {
      user = { ...userData, _id: id, createdAt: now, updatedAt: now, lastLogin: now };
      data.users.push(user);
    }
    writeJSON(data);
    return user;
  },
  async updateField(id, field, value) {
    const data = readJSON();
    const user = data.users.find(u => u._id === id);
    if (user) {
      user[field] = value;
      user.updatedAt = new Date().toISOString();
      writeJSON(data);
    }
  },
  async pushAssessment(id, assessment) {
    const data = readJSON();
    const user = data.users.find(u => u._id === id);
    if (user) {
      if (!user.assessments) user.assessments = [];
      user.assessments.push(assessment);
      user.scores = assessment.scores;
      user.profile = assessment.profile;
      user.updatedAt = new Date().toISOString();
      writeJSON(data);
    }
  },
  async pushExercise(id, exerciseId, exerciseData) {
    const data = readJSON();
    const user = data.users.find(u => u._id === id);
    if (user) {
      if (!user.exercises) user.exercises = {};
      if (!user.exercises[exerciseId]) user.exercises[exerciseId] = [];
      user.exercises[exerciseId].push({ ...exerciseData, date: new Date().toISOString() });
      user.updatedAt = new Date().toISOString();
      writeJSON(data);
    }
  },
  async getExercises(id, exerciseId) {
    const data = readJSON();
    const user = data.users.find(u => u._id === id);
    return user?.exercises?.[exerciseId] || [];
  },
  async deleteUser(id) {
    const data = readJSON();
    data.users = data.users.filter(u => u._id !== id);
    writeJSON(data);
  }
};

// Get active DB layer
function getDB() {
  return useMongo ? mongoDB : jsonDB;
}

// ============================================
// API Routes
// ============================================

// GET /api/users
app.get('/api/users', async (req, res) => {
  try {
    const users = await getDB().findAll();
    res.json({ ok: true, users });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// GET /api/users/:id
app.get('/api/users/:id', async (req, res) => {
  try {
    const user = await getDB().findUser(req.params.id);
    if (!user) return res.status(404).json({ ok: false, error: 'Usuario no encontrado' });
    res.json({ ok: true, user });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// POST /api/users
app.post('/api/users', async (req, res) => {
  try {
    const data = req.body;
    const id = data._id || data.cedula;
    if (!id) return res.status(400).json({ ok: false, error: 'Se requiere _id' });
    const user = await getDB().upsertUser(id, data);
    res.json({ ok: true, user });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// PUT /api/users/:id/scores
app.put('/api/users/:id/scores', async (req, res) => {
  try {
    const { scores, profile, answers } = req.body;
    const db = getDB();
    // Ensure user exists
    await db.upsertUser(req.params.id, { answers });
    await db.pushAssessment(req.params.id, {
      date: new Date().toISOString(), scores, profile
    });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// PUT /api/users/:id/weeks
app.put('/api/users/:id/weeks', async (req, res) => {
  try {
    await getDB().updateField(req.params.id, 'weeks', req.body.weeks || req.body);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// POST /api/users/:id/exercises
app.post('/api/users/:id/exercises', async (req, res) => {
  try {
    const { exerciseId, data } = req.body;
    await getDB().pushExercise(req.params.id, exerciseId, data);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// GET /api/users/:id/exercises/:exerciseId
app.get('/api/users/:id/exercises/:exerciseId', async (req, res) => {
  try {
    const logs = await getDB().getExercises(req.params.id, req.params.exerciseId);
    res.json({ ok: true, logs });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// DELETE /api/users/:id
app.delete('/api/users/:id', async (req, res) => {
  try {
    await getDB().deleteUser(req.params.id);
    res.json({ ok: true, message: 'Usuario eliminado' });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// POST /api/migrate-localstorage
app.post('/api/migrate-localstorage', async (req, res) => {
  const localData = req.body;
  let migrated = 0;

  for (const [key, value] of Object.entries(localData)) {
    if (key === 'guia_users') continue;
    const match = key.match(/^guia_(.+?)_data$/);
    if (!match) continue;
    const id = match[1];
    let userData;
    try { userData = JSON.parse(value); } catch (e) { continue; }

    await getDB().upsertUser(id, {
      ...userData, migratedFrom: 'localStorage', migratedAt: new Date().toISOString()
    });

    // Weeks
    const weeksKey = `guia_${id}_weeks`;
    if (localData[weeksKey]) {
      try {
        await getDB().updateField(id, 'weeks', JSON.parse(localData[weeksKey]));
      } catch (e) {}
    }

    // Exercises
    for (const [eKey, eVal] of Object.entries(localData)) {
      const eMatch = eKey.match(new RegExp(`^guia_${id}_exercise_(.+)$`));
      if (eMatch) {
        try {
          const exercises = JSON.parse(eVal);
          for (const ex of exercises) {
            await getDB().pushExercise(id, eMatch[1], ex);
          }
        } catch (e) {}
      }
    }
    migrated++;
  }

  res.json({ ok: true, migrated });
});

// ============================================
// Start server
// ============================================

async function start() {
  await initDB();
  app.listen(PORT, () => {
    console.log(`\n🌱 Guía de Autoestima — Servidor activo`);
    console.log(`   URL: http://localhost:${PORT}`);
    console.log(`   Mode: ${useMongo ? 'MongoDB Atlas' : 'JSON local'}\n`);
  });
}

start().catch(console.error);
