const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db/init');
const { authMiddleware } = require('../middleware/auth');
const OrchestratorAgent = require('../agents/orchestrator');

const router = express.Router();
router.use(authMiddleware);

// Start a new audit for a project
router.post('/start/:projectId', (req, res) => {
  try {
    const db = getDb();
    const project = db.getProjectById(req.params.projectId, req.user.id);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const auditId = uuidv4();
    const now = new Date().toISOString();

    // Create audit record
    db.createAudit({
      id: auditId,
      project_id: project.id,
      user_id: req.user.id,
      status: 'running',
      started_at: now,
      created_at: now
    });

    // Update project status
    db.updateProject(project.id, { status: 'analyzing' });

    // Run the orchestrator pipeline
    const orchestrator = new OrchestratorAgent();
    const report = orchestrator.runPipeline({
      name: project.name,
      description: project.description,
      source_code: project.source_code,
      file_structure: project.file_structure,
      tech_stack: project.tech_stack,
      repository_url: project.repository_url
    });

    const completedAt = new Date().toISOString();

    // Store individual agent results
    const codeResult = report.agent_details.find(a => a.agent === 'Code Analysis Agent');
    const archResult = report.agent_details.find(a => a.agent === 'Architecture Agent');
    const secResult = report.agent_details.find(a => a.agent === 'Security Agent');
    const perfResult = report.agent_details.find(a => a.agent === 'Performance Agent');
    const uxResult = report.agent_details.find(a => a.agent === 'Product/UX Agent');

    // Update audit with results
    db.updateAudit(auditId, {
      status: 'completed',
      overall_score: report.overall_score,
      code_analysis: JSON.stringify(codeResult),
      architecture_analysis: JSON.stringify(archResult),
      security_analysis: JSON.stringify(secResult),
      performance_analysis: JSON.stringify(perfResult),
      product_ux_analysis: JSON.stringify(uxResult),
      consolidated_report: JSON.stringify(report),
      completed_at: completedAt
    });

    // Update project status
    db.updateProject(project.id, { status: 'audited' });

    res.json({ audit: { id: auditId, ...report } });
  } catch (err) {
    console.error('Audit error:', err);
    res.status(500).json({ error: 'Audit failed: ' + err.message });
  }
});

// Get audit by ID
router.get('/:auditId', (req, res) => {
  try {
    const db = getDb();
    const audit = db.getAuditById(req.params.auditId, req.user.id);

    if (!audit) {
      return res.status(404).json({ error: 'Audit not found' });
    }

    const report = audit.consolidated_report ? JSON.parse(audit.consolidated_report) : null;

    res.json({
      audit: {
        id: audit.id,
        project_id: audit.project_id,
        status: audit.status,
        overall_score: audit.overall_score,
        started_at: audit.started_at,
        completed_at: audit.completed_at,
        report
      }
    });
  } catch (err) {
    console.error('Get audit error:', err);
    res.status(500).json({ error: 'Failed to fetch audit' });
  }
});

// Get all audits for a project
router.get('/project/:projectId', (req, res) => {
  try {
    const db = getDb();
    const project = db.getProjectById(req.params.projectId, req.user.id);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const audits = db.getAuditsByProject(req.params.projectId).map(a => ({
      id: a.id,
      project_id: a.project_id,
      status: a.status,
      overall_score: a.overall_score,
      started_at: a.started_at,
      completed_at: a.completed_at,
      created_at: a.created_at
    }));

    res.json({ audits });
  } catch (err) {
    console.error('Get project audits error:', err);
    res.status(500).json({ error: 'Failed to fetch audits' });
  }
});

module.exports = router;
