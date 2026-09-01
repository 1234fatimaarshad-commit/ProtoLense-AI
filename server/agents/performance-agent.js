const BaseAgent = require('./base-agent');

/**
 * Performance Agent
 * Identifies inefficient code, database operations, resource usage, and potential bottlenecks
 */
class PerformanceAgent extends BaseAgent {
  constructor() {
    super('Performance Agent', 'Identifies inefficient code, database operations, resource usage, and potential bottlenecks');
  }

  analyze(projectData) {
    const { source_code, file_structure, tech_stack, name } = projectData;
    const findings = [];
    const code = source_code || '';
    const files = file_structure || '';
    const tech = (tech_stack || '').toLowerCase();

    // Check for synchronous operations in async context
    const syncFsOps = code.match(/fs\.(readFileSync|writeFileSync|existsSync|statSync|readdirSync)/g);
    if (syncFsOps && syncFsOps.length > 0) {
      findings.push(this.createFinding({
        category: 'Blocking I/O',
        severity: 'High',
        affectedFile: 'Server-side code',
        evidence: `Found ${syncFsOps.length} synchronous file system operations`,
        explanation: 'Synchronous I/O operations block the event loop in Node.js, preventing the server from handling other requests.',
        impact: 'Request queuing, increased latency, and potential server unresponsiveness under load.',
        solution: 'Replace synchronous operations with their async counterparts (fs.readFile, fs.promises.readFile) or use streams for large files.'
      }));
    }

    // Check for N+1 query patterns
    const loopWithQuery = code.match(/for\s*\(.*\{[^}]*query\(/gs) || code.match(/\.forEach\(.*=>[^}]*query\(/gs);
    if (loopWithQuery) {
      findings.push(this.createFinding({
        category: 'Database Performance',
        severity: 'Critical',
        affectedFile: 'Database operations',
        evidence: 'Potential N+1 query pattern detected: database queries inside loops',
        explanation: 'Executing database queries inside loops causes the N+1 query problem, where N+1 separate queries are sent instead of a single optimized query.',
        impact: 'Severe performance degradation as data grows. Each additional record adds another database round-trip.',
        solution: 'Use JOINs, batch queries, or eager loading (e.g., Sequelize include, Prisma include) to fetch related data in a single query.'
      }));
    }

    // Check for missing database indexes
    const hasDbOps = code.includes('SELECT') || code.includes('find') || code.includes('findAll') || code.includes('findOne');
    const hasIndexes = code.includes('INDEX') || code.includes('index') || files.includes('migration') || files.includes('indexes');
    if (hasDbOps && !hasIndexes) {
      findings.push(this.createFinding({
        category: 'Database Optimization',
        severity: 'Medium',
        affectedFile: 'Database schema',
        evidence: 'Database queries detected without corresponding index definitions',
        explanation: 'Queries on unindexed columns require full table scans, which become increasingly slow as data grows.',
        impact: 'Slow query execution times that worsen with data volume growth.',
        solution: 'Add indexes on frequently queried columns, especially those used in WHERE, JOIN, and ORDER BY clauses.'
      }));
    }

    // Check for memory leaks patterns
    const globalVars = code.match(/global\.\w+\s*=/g);
    if (globalVars && globalVars.length > 2) {
      findings.push(this.createFinding({
        category: 'Memory Management',
        severity: 'High',
        affectedFile: 'Application code',
        evidence: `Found ${globalVars.length} assignments to global variables`,
        explanation: 'Global variables persist for the lifetime of the application and can cause memory leaks.',
        impact: 'Increasing memory usage over time, eventual out-of-memory crashes.',
        solution: 'Avoid global variables. Use proper scoping, dependency injection, or a caching layer with TTL.'
      }));
    }

    // Check for missing caching
    const hasCaching = code.includes('cache') || code.includes('redis') || code.includes('Cache') || code.includes('memcache');
    if (!hasCaching && code.length > 500) {
      findings.push(this.createFinding({
        category: 'Caching Strategy',
        severity: 'Medium',
        affectedFile: 'Application architecture',
        evidence: 'No caching layer detected in the application',
        explanation: 'Applications that repeatedly compute or fetch the same data benefit significantly from caching.',
        impact: 'Unnecessary repeated computation and database queries increase response times.',
        solution: 'Implement caching at appropriate layers: in-memory (Map, LRU), Redis for distributed caching, HTTP caching headers.'
      }));
    }

    // Check for unoptimized loops
    const nestedLoops = code.match(/for\s*\([^)]*\)\s*\{[^}]*for\s*\(/gs);
    if (nestedLoops && nestedLoops.length > 0) {
      findings.push(this.createFinding({
        category: 'Algorithm Efficiency',
        severity: 'Medium',
        affectedFile: 'Computational code',
        evidence: `Found ${nestedLoops.length} nested loop structures`,
        explanation: 'Nested loops can indicate O(n^2) or worse time complexity, especially with large datasets.',
        impact: 'Exponential performance degradation as input size increases.',
        solution: 'Consider using hash maps, sorting + two pointers, or other algorithmic optimizations to reduce time complexity.'
      }));
    }

    // Check for large bundle indicators
    const largeImports = (code.match(/import\s/g) || []).length;
    if (largeImports > 30) {
      findings.push(this.createFinding({
        category: 'Bundle Size',
        severity: 'Low',
        affectedFile: 'Frontend modules',
        evidence: `High number of imports detected (${largeImports})`,
        explanation: 'Many imports may indicate a large bundle size that affects initial page load time.',
        impact: 'Slower initial page loads, especially on mobile connections.',
        solution: 'Implement code splitting, lazy loading, and tree shaking. Use dynamic imports for route-based splitting.'
      }));
    }

    // Check for compression
    const hasCompression = code.includes('compression') || code.includes('gzip') || code.includes('brotli');
    if (!hasCompression && code.length > 300) {
      findings.push(this.createFinding({
        category: 'Network Optimization',
        severity: 'Low',
        affectedFile: 'Server configuration',
        evidence: 'No response compression detected',
        explanation: 'Compressing HTTP responses significantly reduces transfer size and improves load times.',
        impact: 'Larger response payloads and slower page loads, especially for text-heavy content.',
        solution: 'Enable gzip or Brotli compression using compression middleware or reverse proxy configuration.'
      }));
    }

    // Check for pagination in list endpoints
    const hasListEndpoints = code.includes('findAll') || code.includes('.find()') || code.includes('getAll');
    const hasPagination = code.includes('limit') || code.includes('offset') || code.includes('page') || code.includes('paginate');
    if (hasListEndpoints && !hasPagination) {
      findings.push(this.createFinding({
        category: 'API Performance',
        severity: 'Medium',
        affectedFile: 'List endpoints',
        evidence: 'List/collection endpoints detected without pagination',
        explanation: 'Returning all records without pagination can cause memory and performance issues with large datasets.',
        impact: 'Slow API responses, high memory usage, and poor user experience with large datasets.',
        solution: 'Implement cursor-based or offset-based pagination for all list endpoints.'
      }));
    }

    const score = this.calculateScore(findings);

    return {
      agent: this.name,
      description: this.description,
      score,
      summary: `Performance analysis of "${name}" identified ${findings.length} findings. Score: ${score}/100.`,
      findings
    };
  }
}

module.exports = PerformanceAgent;
