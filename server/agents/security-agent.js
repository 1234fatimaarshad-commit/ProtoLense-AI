const BaseAgent = require('./base-agent');

/**
 * Security Agent
 * Identifies potential vulnerabilities in authentication, authorization, data handling, APIs, and application logic
 */
class SecurityAgent extends BaseAgent {
  constructor() {
    super('Security Agent', 'Identifies potential vulnerabilities and weaknesses in authentication, authorization, data handling, APIs, and application logic');
  }

  analyze(projectData) {
    const { source_code, file_structure, tech_stack, name } = projectData;
    const findings = [];
    const code = source_code || '';
    const files = file_structure || '';
    const tech = (tech_stack || '').toLowerCase();

    // Check for hardcoded secrets
    const secretPatterns = [
      { regex: /password\s*[:=]\s*['"][^'"]{3,}['"]/gi, name: 'Hardcoded password' },
      { regex: /api[_-]?key\s*[:=]\s*['"][^'"]{8,}['"]/gi, name: 'Hardcoded API key' },
      { regex: /secret\s*[:=]\s*['"][^'"]{3,}['"]/gi, name: 'Hardcoded secret' },
      { regex: /token\s*[:=]\s*['"][a-zA-Z0-9]{20,}['"]/gi, name: 'Hardcoded token' }
    ];

    for (const pattern of secretPatterns) {
      const matches = code.match(pattern.regex);
      if (matches && matches.length > 0) {
        findings.push(this.createFinding({
          category: 'Credential Management',
          severity: 'Critical',
          affectedFile: 'Source code',
          evidence: `${pattern.name} detected: ${matches[0].substring(0, 50)}...`,
          explanation: `${pattern.name}s in source code can be exposed through version control, logs, or error messages.`,
          impact: 'Unauthorized access to systems, data breaches, and potential financial loss.',
          solution: 'Move all secrets to environment variables, use a secrets manager (e.g., AWS Secrets Manager, HashiCorp Vault), and rotate exposed credentials immediately.'
        }));
        break;
      }
    }

    // Check for SQL injection vulnerabilities
    const sqlInjectionPatterns = code.match(/(`SELECT|INSERT|UPDATE|DELETE).*\$\{.*\}/gi) || code.match(/query\s*\(.*\+/gi);
    if (sqlInjectionPatterns) {
      findings.push(this.createFinding({
        category: 'Injection Vulnerability',
        severity: 'Critical',
        affectedFile: 'Database operations',
        evidence: `Potential SQL injection: string concatenation in queries detected`,
        explanation: 'Building SQL queries with string concatenation allows attackers to inject malicious SQL commands.',
        impact: 'Data theft, data manipulation, unauthorized access, and potential complete database compromise.',
        solution: 'Use parameterized queries or prepared statements. Never concatenate user input into SQL strings.'
      }));
    }

    // Check for XSS vulnerabilities
    const xssPatterns = code.match(/innerHTML\s*=/g) || code.match(/dangerouslySetInnerHTML/g);
    if (xssPatterns) {
      findings.push(this.createFinding({
        category: 'Cross-Site Scripting (XSS)',
        severity: 'High',
        affectedFile: 'Frontend components',
        evidence: `Potential XSS vector: ${xssPatterns.length} instances of direct HTML injection`,
        explanation: 'Setting innerHTML or using dangerouslySetInnerHTML with unsanitized user input enables XSS attacks.',
        impact: 'Session hijacking, credential theft, defacement, and malware distribution.',
        solution: 'Use framework-native rendering, sanitize all user input with DOMPurify, and implement Content Security Policy headers.'
      }));
    }

    // Check for authentication patterns
    const hasAuth = code.includes('jwt') || code.includes('bcrypt') || code.includes('passport') || code.includes('auth');
    const hasHashedPasswords = code.includes('bcrypt') || code.includes('hash') || code.includes('argon2') || code.includes('scrypt');

    if (hasAuth && !hasHashedPasswords) {
      findings.push(this.createFinding({
        category: 'Authentication Security',
        severity: 'Critical',
        affectedFile: 'Authentication module',
        evidence: 'Authentication code detected without password hashing',
        explanation: 'Passwords must be hashed with a strong algorithm (bcrypt, argon2, scrypt) before storage.',
        impact: 'Plain-text password storage leads to credential exposure in any data breach.',
        solution: 'Use bcrypt (cost factor >= 12) or argon2id for password hashing. Never store plain-text passwords.'
      }));
    }

    // Check for CORS configuration
    const hasCors = code.includes('cors') || code.includes('CORS') || code.includes('Access-Control');
    const hasPermissiveCors = code.includes("origin: '*'") || code.includes("origin:'*'") || code.includes('origin: "*"');

    if (hasPermissiveCors) {
      findings.push(this.createFinding({
        category: 'CORS Configuration',
        severity: 'High',
        affectedFile: 'Server configuration',
        evidence: 'Wildcard CORS origin detected (Access-Control-Allow-Origin: *)',
        explanation: 'Allowing all origins to make cross-origin requests can enable CSRF and data theft.',
        impact: 'Unauthorized cross-origin requests, data exfiltration, and CSRF attacks.',
        solution: 'Restrict CORS origins to specific trusted domains. Use an allowlist approach.'
      }));
    }

    // Check for input validation
    const hasValidation = code.includes('validate') || code.includes('validator') || code.includes('joi') || code.includes('zod') || code.includes('yup');
    if (!hasValidation && code.length > 200) {
      findings.push(this.createFinding({
        category: 'Input Validation',
        severity: 'High',
        affectedFile: 'API endpoints',
        evidence: 'No input validation library or patterns detected',
        explanation: 'All user input should be validated and sanitized before processing.',
        impact: 'Injection attacks, data corruption, and unexpected application behavior.',
        solution: 'Implement input validation using libraries like Joi, Zod, or Yup. Validate all inputs at the API boundary.'
      }));
    }

    // Check for HTTPS enforcement
    const hasHttps = code.includes('https') || code.includes('HTTPS') || files.includes('ssl') || files.includes('cert');
    if (!hasHttps && code.length > 200) {
      findings.push(this.createFinding({
        category: 'Transport Security',
        severity: 'Medium',
        affectedFile: 'Server configuration',
        evidence: 'No HTTPS/TLS configuration detected',
        explanation: 'Applications should enforce HTTPS to encrypt data in transit.',
        impact: 'Man-in-the-middle attacks, credential interception, and data eavesdropping.',
        solution: 'Configure TLS/SSL certificates and enforce HTTPS redirects. Set HSTS headers.'
      }));
    }

    // Check for rate limiting
    const hasRateLimit = code.includes('rateLimit') || code.includes('rate-limit') || code.includes('throttle');
    if (!hasRateLimit && hasAuth) {
      findings.push(this.createFinding({
        category: 'Brute Force Protection',
        severity: 'Medium',
        affectedFile: 'Authentication endpoints',
        evidence: 'No rate limiting detected on authentication endpoints',
        explanation: 'Without rate limiting, attackers can perform brute force attacks on login endpoints.',
        impact: 'Account compromise through credential stuffing and brute force attacks.',
        solution: 'Implement rate limiting on authentication endpoints using express-rate-limit or similar middleware.'
      }));
    }

    // Check for security headers
    const hasHelmet = code.includes('helmet') || code.includes('Content-Security-Policy') || code.includes('X-Frame-Options');
    if (!hasHelmet && code.length > 200) {
      findings.push(this.createFinding({
        category: 'Security Headers',
        severity: 'Low',
        affectedFile: 'HTTP configuration',
        evidence: 'No security headers middleware detected',
        explanation: 'Security headers protect against common web vulnerabilities like clickjacking and MIME sniffing.',
        impact: 'Increased vulnerability to clickjacking, XSS, and MIME-type attacks.',
        solution: 'Use helmet.js or configure security headers: CSP, X-Frame-Options, X-Content-Type-Options, etc.'
      }));
    }

    const score = this.calculateScore(findings);

    return {
      agent: this.name,
      description: this.description,
      score,
      summary: `Security analysis of "${name}" identified ${findings.length} findings (${findings.filter(f => f.severity === 'Critical').length} critical). Score: ${score}/100.`,
      findings
    };
  }
}

module.exports = SecurityAgent;
