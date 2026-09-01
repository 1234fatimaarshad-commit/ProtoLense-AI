const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', '..', 'data', 'protolens.json');

let db = null;

function loadDb() {
  try {
    if (fs.existsSync(DB_PATH)) {
      const raw = fs.readFileSync(DB_PATH, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('DB load error:', err.message);
  }
  return { users: [], projects: [], audits: [] };
}

function saveDb() {
  try {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
  } catch (err) {
    console.error('DB save error:', err.message);
  }
}

function getDb() {
  if (!db) {
    db = loadDb();
  }
  return db;
}

// Simple query helpers that mimic the interface used in routes
const store = {
  // Users
  findUserByEmailOrUsername(email, username) {
    const d = getDb();
    return d.users.find(u => u.email === email || u.username === username) || null;
  },
  findUserById(id) {
    const d = getDb();
    return d.users.find(u => u.id === id) || null;
  },
  createUser(user) {
    const d = getDb();
    d.users.push(user);
    saveDb();
  },

  // Projects
  createProject(project) {
    const d = getDb();
    d.projects.push(project);
    saveDb();
  },
  getProjectsByUser(userId) {
    const d = getDb();
    return d.projects
      .filter(p => p.user_id === userId)
      .map(p => {
        const audits = d.audits.filter(a => a.project_id === p.id);
        const latestAudit = audits.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
        return {
          ...p,
          audit_count: audits.length,
          latest_score: latestAudit ? latestAudit.overall_score : null
        };
      })
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  },
  getProjectById(id, userId) {
    const d = getDb();
    return d.projects.find(p => p.id === id && p.user_id === userId) || null;
  },
  updateProject(id, updates) {
    const d = getDb();
    const idx = d.projects.findIndex(p => p.id === id);
    if (idx !== -1) {
      d.projects[idx] = { ...d.projects[idx], ...updates, updated_at: new Date().toISOString() };
      saveDb();
      return d.projects[idx];
    }
    return null;
  },
  deleteProject(id) {
    const d = getDb();
    d.projects = d.projects.filter(p => p.id !== id);
    d.audits = d.audits.filter(a => a.project_id !== id);
    saveDb();
  },

  // Audits
  createAudit(audit) {
    const d = getDb();
    d.audits.push(audit);
    saveDb();
  },
  getAuditById(id, userId) {
    const d = getDb();
    const audit = d.audits.find(a => a.id === id);
    if (!audit) return null;
    const project = d.projects.find(p => p.id === audit.project_id && p.user_id === userId);
    if (!project) return null;
    return audit;
  },
  getAuditsByProject(projectId) {
    const d = getDb();
    return d.audits
      .filter(a => a.project_id === projectId)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  },
  updateAudit(id, updates) {
    const d = getDb();
    const idx = d.audits.findIndex(a => a.id === id);
    if (idx !== -1) {
      d.audits[idx] = { ...d.audits[idx], ...updates };
      saveDb();
      return d.audits[idx];
    }
    return null;
  }
};

function initDatabase() {
  db = loadDb();
  console.log('Database initialized successfully (JSON store)');
  return store;
}

module.exports = { getDb: () => store, initDatabase, store };
