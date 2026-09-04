const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDatabase } = require('./db/init');
const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const auditRoutes = require('./routes/audits');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '1gb' }));
app.use(express.urlencoded({ limit: '1gb', extended: true }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/audits', auditRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'ProtoLens AI', version: '1.0.0' });
});

// Serve static frontend in production
const clientBuild = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientBuild));
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(clientBuild, 'index.html'));
  }
});

// Initialize database and start server
initDatabase();

// Only call listen() in local / non-Vercel environments.
// Vercel's serverless runtime invokes the exported handler directly.
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`ProtoLens AI server running on port ${PORT}`);
  });
}

module.exports = app;
