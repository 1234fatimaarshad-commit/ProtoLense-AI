const CodeAnalysisAgent = require('./code-agent');
const ArchitectureAgent = require('./architecture-agent');
const SecurityAgent = require('./security-agent');
const PerformanceAgent = require('./performance-agent');
const ProductUxAgent = require('./product-ux-agent');

/**
 * Orchestrator Agent
 * Coordinates the specialist agent pool, cross-references findings,
 * merges overlapping issues, prioritizes by severity/impact, and
 * generates a consolidated Software Health Score and final report.
 */
class OrchestratorAgent {
  constructor() {
    this.name = 'Orchestrator Agent';
    this.agents = [
      new CodeAnalysisAgent(),
      new ArchitectureAgent(),
      new SecurityAgent(),
      new PerformanceAgent(),
      new ProductUxAgent()
    ];
  }

  /**
   * Run the full analysis pipeline
   */
  runPipeline(projectData) {
    const agentResults = [];

    // Run each specialist agent
    for (const agent of this.agents) {
      try {
        const result = agent.analyze(projectData);
        agentResults.push(result);
      } catch (err) {
        agentResults.push({
          agent: agent.name,
          description: agent.description,
          score: 0,
          summary: `${agent.name} encountered an error during analysis.`,
          findings: [],
          error: err.message
        });
      }
    }

    // Cross-reference and merge overlapping findings
    const consolidatedFindings = this.consolidateFindings(agentResults);

    // Calculate overall health score (weighted average)
    const weights = {
      'Code Analysis Agent': 0.25,
      'Architecture Agent': 0.20,
      'Security Agent': 0.25,
      'Performance Agent': 0.15,
      'Product/UX Agent': 0.15
    };

    let totalWeight = 0;
    let weightedScore = 0;
    for (const result of agentResults) {
      const w = weights[result.agent] || 0.2;
      weightedScore += result.score * w;
      totalWeight += w;
    }
    const overallScore = Math.round(weightedScore / totalWeight);

    // Generate severity summary
    const severityCounts = { Critical: 0, High: 0, Medium: 0, Low: 0 };
    for (const f of consolidatedFindings) {
      if (severityCounts[f.severity] !== undefined) {
        severityCounts[f.severity]++;
      }
    }

    // Generate health grade
    const grade = this.calculateGrade(overallScore);

    // Build the consolidated report
    const report = {
      project_name: projectData.name,
      overall_score: overallScore,
      health_grade: grade,
      severity_summary: severityCounts,
      total_findings: consolidatedFindings.length,
      agent_scores: agentResults.map(r => ({
        agent: r.agent,
        score: r.score,
        finding_count: r.findings.length,
        summary: r.summary
      })),
      prioritized_findings: consolidatedFindings,
      agent_details: agentResults,
      recommendations: this.generateTopRecommendations(consolidatedFindings),
      generated_at: new Date().toISOString()
    };

    return report;
  }

  /**
   * Consolidate and deduplicate findings across agents
   */
  consolidateFindings(agentResults) {
    const allFindings = [];

    for (const result of agentResults) {
      for (const finding of result.findings) {
        allFindings.push({
          ...finding,
          source_agent: result.agent
        });
      }
    }

    // Sort by severity priority
    const severityOrder = { Critical: 0, High: 1, Medium: 2, Low: 3 };
    allFindings.sort((a, b) => {
      const sa = severityOrder[a.severity] ?? 4;
      const sb = severityOrder[b.severity] ?? 4;
      return sa - sb;
    });

    // Merge overlapping findings (same category + similar explanation)
    const merged = [];
    const seen = new Set();

    for (const finding of allFindings) {
      const key = `${finding.category}|${finding.severity}`;
      if (!seen.has(key)) {
        seen.add(key);
        merged.push(finding);
      }
    }

    return merged;
  }

  /**
   * Calculate letter grade from score
   */
  calculateGrade(score) {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  /**
   * Generate top actionable recommendations
   */
  generateTopRecommendations(findings) {
    const critical = findings.filter(f => f.severity === 'Critical');
    const high = findings.filter(f => f.severity === 'High');

    const recommendations = [];

    for (const f of critical.slice(0, 3)) {
      recommendations.push({
        priority: 'Immediate',
        category: f.category,
        action: f.recommended_solution,
        source: f.source_agent
      });
    }

    for (const f of high.slice(0, 3)) {
      recommendations.push({
        priority: 'High Priority',
        category: f.category,
        action: f.recommended_solution,
        source: f.source_agent
      });
    }

    return recommendations;
  }
}

module.exports = OrchestratorAgent;
