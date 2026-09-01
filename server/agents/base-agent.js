/**
 * Base Agent - Foundation class for all specialist agents
 * Provides common interface and structured output schema
 */
class BaseAgent {
  constructor(name, description) {
    this.name = name;
    this.description = description;
  }

  /**
   * Create a standardized finding object
   */
  createFinding({ category, severity, affectedFile, evidence, explanation, impact, solution }) {
    return {
      category: category || 'General',
      severity: severity || 'Low',
      affected_file: affectedFile || 'N/A',
      evidence: evidence || '',
      explanation: explanation || '',
      potential_impact: impact || '',
      recommended_solution: solution || ''
    };
  }

  /**
   * Calculate agent score from findings (0-100)
   */
  calculateScore(findings) {
    if (!findings || findings.length === 0) return 85;

    const penalties = { Critical: 20, High: 12, Medium: 6, Low: 2 };
    let score = 100;
    for (const f of findings) {
      score -= penalties[f.severity] || 0;
    }
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Analyze method - must be overridden by subclasses
   */
  analyze(projectData) {
    throw new Error(`${this.name}: analyze() must be implemented`);
  }
}

module.exports = BaseAgent;
