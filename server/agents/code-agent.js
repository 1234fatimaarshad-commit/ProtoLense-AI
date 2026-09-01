const BaseAgent = require('./base-agent');

/**
 * Code Analysis Agent
 * Analyzes code quality, bugs, logic errors, maintainability, and code smells
 */
class CodeAnalysisAgent extends BaseAgent {
  constructor() {
    super('Code Analysis Agent', 'Analyzes code quality, bugs, logic, maintainability, and code smells');
  }

  analyze(projectData) {
    const { source_code, file_structure, tech_stack, name } = projectData;
    const findings = [];
    const code = source_code || '';
    const files = file_structure || '';
    const tech = (tech_stack || '').toLowerCase();

    // Analyze for common code quality issues
    if (code.length < 100) {
      findings.push(this.createFinding({
        category: 'Code Coverage',
        severity: 'Medium',
        affectedFile: 'Project-wide',
        evidence: 'Minimal source code provided for analysis',
        explanation: 'The submitted codebase appears to have limited code. A more complete submission would allow for deeper analysis.',
        impact: 'Insufficient code may indicate an incomplete project or missing components.',
        solution: 'Ensure all relevant source files, modules, and configurations are included in the submission.'
      }));
    }

    // Check for code smells
    const longFunctions = (code.match(/function\s+\w+\s*\([^)]*\)\s*\{/g) || []).length;
    if (longFunctions > 10) {
      findings.push(this.createFinding({
        category: 'Code Smell',
        severity: 'Medium',
        affectedFile: 'Multiple files',
        evidence: `Detected ${longFunctions} function definitions that may benefit from decomposition`,
        explanation: 'A high number of functions may indicate complex modules that could be harder to maintain.',
        impact: 'Reduced maintainability and increased risk of introducing bugs during changes.',
        solution: 'Consider applying the Single Responsibility Principle and breaking large functions into smaller, focused units.'
      }));
    }

    // Check for TODO/FIXME comments
    const todos = (code.match(/TODO|FIXME|HACK|XXX/gi) || []).length;
    if (todos > 0) {
      findings.push(this.createFinding({
        category: 'Technical Debt',
        severity: 'Low',
        affectedFile: 'Various',
        evidence: `Found ${todos} TODO/FIXME/HACK markers in the codebase`,
        explanation: 'Unresolved TODO markers indicate known issues or incomplete implementations.',
        impact: 'Technical debt accumulation and potential hidden bugs.',
        solution: 'Address outstanding TODOs and track them in your issue management system.'
      }));
    }

    // Check for error handling patterns
    const tryCatchCount = (code.match(/try\s*\{/g) || []).length;
    const asyncCount = (code.match(/async\s/g) || []).length;
    if (asyncCount > 0 && tryCatchCount === 0) {
      findings.push(this.createFinding({
        category: 'Error Handling',
        severity: 'High',
        affectedFile: 'Async operations',
        evidence: `Found ${asyncCount} async operations with no try-catch error handling`,
        explanation: 'Asynchronous operations without proper error handling can lead to unhandled promise rejections.',
        impact: 'Application crashes, silent failures, and unpredictable behavior in production.',
        solution: 'Wrap all async operations in try-catch blocks and implement proper error propagation.'
      }));
    }

    // Check for console.log statements (debug artifacts)
    const consoleLogs = (code.match(/console\.(log|debug|info)\s*\(/g) || []).length;
    if (consoleLogs > 5) {
      findings.push(this.createFinding({
        category: 'Code Quality',
        severity: 'Low',
        affectedFile: 'Multiple files',
        evidence: `Found ${consoleLogs} console.log/debug statements`,
        explanation: 'Excessive logging statements are typically debug artifacts that should be removed or replaced with a proper logging framework.',
        impact: 'Performance overhead and information leakage in production.',
        solution: 'Replace console.log with a structured logging library (e.g., Winston, Pino) and use log levels.'
      }));
    }

    // Check for hardcoded values
    const hardcodedIPs = code.match(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g);
    if (hardcodedIPs && hardcodedIPs.length > 0) {
      findings.push(this.createFinding({
        category: 'Maintainability',
        severity: 'Medium',
        affectedFile: 'Configuration',
        evidence: `Found hardcoded IP addresses: ${hardcodedIPs.slice(0, 3).join(', ')}`,
        explanation: 'Hardcoded values reduce flexibility and make environment-specific configuration difficult.',
        impact: 'Deployment issues when moving between environments and potential security exposure.',
        solution: 'Use environment variables or configuration files for all environment-specific values.'
      }));
    }

    // Check for naming conventions
    const singleCharVars = code.match(/\b(let|const|var)\s+[a-z]\s*=/g);
    if (singleCharVars && singleCharVars.length > 3) {
      findings.push(this.createFinding({
        category: 'Code Readability',
        severity: 'Low',
        affectedFile: 'Various',
        evidence: `Found ${singleCharVars.length} single-character variable names`,
        explanation: 'Single-character variable names (except loop counters) reduce code readability.',
        impact: 'Difficulty understanding code intent during reviews and maintenance.',
        solution: 'Use descriptive variable names that convey purpose and meaning.'
      }));
    }

    // Check for proper module structure
    if (files && !files.includes('package.json') && !files.includes('requirements.txt') && !files.includes('go.mod')) {
      findings.push(this.createFinding({
        category: 'Project Structure',
        severity: 'Medium',
        affectedFile: 'Root directory',
        evidence: 'No standard dependency manifest file detected',
        explanation: 'Projects should include standard dependency management files for their language/framework.',
        impact: 'Difficulty reproducing builds and managing dependencies.',
        solution: 'Include appropriate dependency manifest files (package.json, requirements.txt, go.mod, etc.).'
      }));
    }

    // Add positive findings
    if (code.length > 500) {
      findings.push(this.createFinding({
        category: 'Code Organization',
        severity: 'Low',
        affectedFile: 'Project-wide',
        evidence: 'Codebase shows evidence of structured implementation',
        explanation: 'The project demonstrates organized code with reasonable structure.',
        impact: 'Positive maintainability and onboarding experience.',
        solution: 'Continue following established patterns and consider adding inline documentation.'
      }));
    }

    const score = this.calculateScore(findings);

    return {
      agent: this.name,
      description: this.description,
      score,
      summary: `Code analysis of "${name}" identified ${findings.length} findings. Score: ${score}/100.`,
      findings
    };
  }
}

module.exports = CodeAnalysisAgent;
