const express = require('express');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db/init');
const { authMiddleware } = require('../middleware/auth');
const { processUploadedFiles, processZipUpload } = require('../utils/process-upload');

const router = express.Router();

// Multer config: memory storage, accept folder files + zip
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 1024 * 1024 * 1024,  // 1 GB per file
    files: 2000
  }
});

router.use(authMiddleware);

/**
 * Create a project — accepts either:
 *   1. multipart/form-data with folder files (field: "files") + optional zip (field: "zipfile")
 *   2. JSON body with name, description, etc. (legacy/text fallback)
 */
router.post('/', upload.fields([
  { name: 'files', maxCount: 2000 },
  { name: 'zipfile', maxCount: 1 }
]), (req, res) => {
  try {
    const { name, description, repository_url, tech_stack, relativePaths } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Project name is required' });
    }

    let fileStructure = '';
    let sourceCode = '';
    let fileCount = 0;

    // Case 1: zip file uploaded
    if (req.files && req.files.zipfile && req.files.zipfile.length > 0) {
      const zipFile = req.files.zipfile[0];
      const result = processZipUpload(zipFile.buffer);
      fileStructure = result.fileStructure;
      sourceCode = result.sourceCode;
      fileCount = result.fileCount;
    }
    // Case 2: folder / multi-file upload
    else if (req.files && req.files.files && req.files.files.length > 0) {
      const result = processUploadedFiles(req.files.files, relativePaths);
      fileStructure = result.fileStructure;
      sourceCode = result.sourceCode;
      fileCount = result.fileCount;
    }
    // Case 3: legacy JSON body with text fields
    else {
      fileStructure = req.body.file_structure || '';
      sourceCode = req.body.source_code || '';
    }

    const db = getDb();
    const id = uuidv4();
    const now = new Date().toISOString();

    const project = {
      id,
      user_id: req.user.id,
      name,
      description: description || '',
      repository_url: repository_url || '',
      tech_stack: tech_stack || '',
      file_structure: fileStructure,
      source_code: sourceCode,
      file_count: fileCount,
      status: 'created',
      created_at: now,
      updated_at: now
    };

    db.createProject(project);
    res.status(201).json({ project });
  } catch (err) {
    // Log detailed error for debugging
    console.error('Create project error:', err.message);
    console.error('Stack:', err.stack);
    if (err.code) console.error('Error code:', err.code);
    // Return specific message based on error type
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'File too large. Maximum size is 1 GB per file.' });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(413).json({ error: 'Too many files. Maximum is 2000 files per upload.' });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ error: 'Unexpected file field: ' + err.field });
    }
    res.status(500).json({ error: 'Failed to create project: ' + err.message });
  }
});

// Multer error handler — catches errors that happen BEFORE the route handler
// (e.g., file size limits, too many files). Express middleware errors with
// 4 params bypass try/catch blocks in route handlers.
router.use((err, req, res, _next) => {
  if (err && err.code && err.code.startsWith('LIMIT_')) {
    console.error('Multer error:', err.code, err.message);
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'File too large. Maximum size is 1 GB per file.' });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(413).json({ error: 'Too many files. Maximum is 2000 files per upload.' });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ error: 'Unexpected upload field: ' + err.field + '. Use "files" for folder or "zipfile" for zip.' });
    }
    return res.status(400).json({ error: 'Upload error: ' + err.message });
  }
  // Pass through other errors
  console.error('Unhandled route error:', err?.message);
  res.status(500).json({ error: err?.message || 'Internal server error' });
});

// Get all user projects
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const projects = db.getProjectsByUser(req.user.id);
    res.json({ projects });
  } catch (err) {
    console.error('Get projects error:', err);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// Get single project
router.get('/:id', (req, res) => {
  try {
    const db = getDb();
    const project = db.getProjectById(req.params.id, req.user.id);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const audits = db.getAuditsByProject(req.params.id);
    res.json({ project, audits });
  } catch (err) {
    console.error('Get project error:', err);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

// Update project
router.put('/:id', (req, res) => {
  try {
    const db = getDb();
    const project = db.getProjectById(req.params.id, req.user.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const { name, description, repository_url, tech_stack, file_structure, source_code } = req.body;
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (repository_url !== undefined) updates.repository_url = repository_url;
    if (tech_stack !== undefined) updates.tech_stack = tech_stack;
    if (file_structure !== undefined) updates.file_structure = file_structure;
    if (source_code !== undefined) updates.source_code = source_code;

    const updated = db.updateProject(req.params.id, updates);
    res.json({ project: updated });
  } catch (err) {
    console.error('Update project error:', err);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

// Delete project
router.delete('/:id', (req, res) => {
  try {
    const db = getDb();
    const project = db.getProjectById(req.params.id, req.user.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    db.deleteProject(req.params.id);
    res.json({ message: 'Project deleted successfully' });
  } catch (err) {
    console.error('Delete project error:', err);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

module.exports = router;
