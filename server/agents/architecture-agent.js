const BaseAgent = require('./base-agent');

/**
 * Architecture Agent
 * Evaluates project structure, dependencies, APIs, component relationships, and scalability
 */
class ArchitectureAgent extends BaseAgent {
  constructor() {
    super('Architecture Agent', 'Evaluates project structure, dependencies, APIs, component relationships, and scalability');
  }

  analyze(projectData) {
    const { source_code, file_structure, tech_stack, name, description } = projectData;
    const findings = [];
    const code = source_code || '';
    const files = file_structure || '';
    const tech = (tech_stack || '').toLowerCase();

    // Check for modular structure
    const hasSrcDir = files.includes('src/') || files.includes('src\\') || files.includes('/src');
    const hasTests = files.includes('test') || files.includes('spec') || files.includes('__tests__');
    const hasConfig = files.includes('config') || files.includes('.env') || files.includes('settings');

    if (!hasSrcDir) {
      findings.push(this.createFinding({
        category: 'Project Structure',
        severity: 'Medium',
        affectedFile: 'Root directory',
        evidence: 'No standard source directory (src/) detected in project structure',
        explanation: 'A well-organized project typically separates source code from configuration, tests, and documentation.',
        impact: 'Reduced maintainability and difficulty navigating the codebase as it grows.',
        solution: 'Organize code into a src/ directory with subdirectories for different concerns (controllers, models, services, etc.).'
      }));
    }

    if (!hasTests) {
      findings.push(this.createFinding({
        category: 'Testing Architecture',
        severity: 'High',
        affectedFile: 'Project-wide',
        evidence: 'No test files or test directories detected',
        explanation: 'Absence of tests increases the risk of regressions and makes refactoring dangerous.',
        impact: 'Higher bug rates, difficult refactoring, and reduced confidence in deployments.',
        solution: 'Implement a testing strategy with unit tests, integration tests, and end-to-end tests using appropriate frameworks.'
      }));
    }

    // Check for separation of concerns
    const hasModels = code.includes('model') || code.includes('Model') || files.includes('models');
    const hasRoutes = code.includes('route') || code.includes('Route') || files.includes('routes');
    const hasControllers = code.includes('controller') || code.includes('Controller') || files.includes('controllers');

    if (!hasModels && !hasRoutes && !hasControllers) {
      findings.push(this.createFinding({
        category: 'Separation of Concerns',
        severity: 'Medium',
        affectedFile: 'Application structure',
        evidence: 'No clear MVC/service layer pattern detected',
        explanation: 'Applications benefit from clear separation between data models, business logic, and presentation/routing layers.',
        impact: 'Tight coupling makes the application harder to test, maintain, and scale.',
        solution: 'Implement a layered architecture (e.g., MVC, Clean Architecture, or hexagonal) appropriate for your framework.'
      }));
    }

    // Check dependency management
    if (tech.includes('node') || tech.includes('javascript') || tech.includes('typescript') || tech.includes('react')) {
      const hasPackageLock = files.includes('package-lock.json') || files.includes('yarn.lock') || files.includes('pnpm-lock');
      if (!hasPackageLock) {
        findings.push(this.createFinding({
          category: 'Dependency Management',
          severity: 'Medium',
          affectedFile: 'Root directory',
          evidence: 'No lock file detected for Node.js project',
          explanation: 'Lock files ensure consistent dependency versions across environments.',
          impact: 'Build inconsistencies, "works on my machine" problems, and potential security vulnerabilities.',
          solution: 'Commit your package-lock.json or yarn.lock to version control.'
        }));
      }
    }

    // Check for API design patterns
    const hasApiPrefix = code.includes('/api/') || code.includes('api/') || files.includes('api');
    const hasVersioning = code.includes('/v1/') || code.includes('v2') || code.includes('version');

    if (hasApiPrefix && !hasVersioning) {
      findings.push(this.createFinding({
        category: 'API Design',
        severity: 'Low',
        affectedFile: 'API routes',
        evidence: 'API routes detected but no versioning scheme',
        explanation: 'API versioning allows breaking changes without disrupting existing clients.',
        impact: 'Difficulty evolving the API without breaking backward compatibility.',
        solution: 'Implement API versioning (e.g., /api/v1/) from the start to support future evolution.'
      }));
    }

    // Check for environment configuration
    const hasEnvConfig = code.includes('process.env') || code.includes('os.environ') || code.includes('dotenv') || files.includes('.env');
    if (!hasEnvConfig && code.length > 200) {
      findings.push(this.createFinding({
        category: 'Configuration Management',
        severity: 'Medium',
        affectedFile: 'Application config',
        evidence: 'No environment-based configuration pattern detected',
        explanation: 'Applications should use environment variables for configuration that varies between deployments.',
        impact: 'Hardcoded configuration makes multi-environment deployment difficult.',
        solution: 'Use a .env file with a dotenv library and ensure sensitive values are never committed to version control.'
      }));
    }

    // Check for documentation
    const hasReadme = files.includes('README') || files.includes('readme');
    if (!hasReadme) {
      findings.push(this.createFinding({
        category: 'Documentation',
        severity: 'Low',
        affectedFile: 'Root directory',
        evidence: 'No README file detected',
        explanation: 'A README provides essential project documentation including setup instructions, architecture overview, and usage guides.',
        impact: 'Difficult onboarding for new developers and poor project discoverability.',
        solution: 'Create a comprehensive README.md with project description, setup instructions, architecture diagrams, and API documentation.'
      }));
    }

    // Positive: check for good patterns
    if (hasSrcDir && hasTests && (hasModels || hasRoutes || hasControllers)) {
      findings.push(this.createFinding({
        category: 'Architecture Quality',
        severity: 'Low',
        affectedFile: 'Project-wide',
        evidence: 'Project demonstrates good architectural patterns',
        explanation: 'The project shows evidence of proper modular design with testing infrastructure.',
        impact: 'Positive scalability and maintainability characteristics.',
        solution: 'Continue maintaining these patterns and consider adding architectural decision records (ADRs).'
      }));
    }

    const score = this.calculateScore(findings);

    return {
      agent: this.name,
      description: this.description,
      score,
      summary: `Architecture analysis of "${name}" identified ${findings.length} findings. Score: ${score}/100.`,
      findings
    };
  }
}

module.exports = ArchitectureAgent;
