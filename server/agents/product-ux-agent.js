const BaseAgent = require('./base-agent');

/**
 * Product/UX Agent
 * Evaluates functionality, user flows, usability, accessibility, and the overall product experience
 */
class ProductUxAgent extends BaseAgent {
  constructor() {
    super('Product/UX Agent', 'Evaluates functionality, user flows, usability, accessibility, and the overall product experience');
  }

  analyze(projectData) {
    const { source_code, file_structure, tech_stack, name, description } = projectData;
    const findings = [];
    const code = source_code || '';
    const files = file_structure || '';
    const tech = (tech_stack || '').toLowerCase();

    // Check for responsive design
    const hasResponsive = code.includes('media query') || code.includes('@media') || code.includes('responsive') || code.includes('viewport') || code.includes('flexbox') || code.includes('grid');
    if (!hasResponsive && (tech.includes('react') || tech.includes('html') || tech.includes('vue') || tech.includes('angular') || code.includes('<div'))) {
      findings.push(this.createFinding({
        category: 'Responsive Design',
        severity: 'High',
        affectedFile: 'Frontend styles',
        evidence: 'No responsive design patterns detected',
        explanation: 'Modern web applications must work well across devices and screen sizes.',
        impact: 'Poor user experience on mobile and tablet devices, losing a significant portion of users.',
        solution: 'Implement responsive design using CSS media queries, flexbox/grid, and mobile-first approach.'
      }));
    }

    // Check for accessibility
    const hasAria = code.includes('aria-') || code.includes('role=') || code.includes('alt=');
    const hasSemantic = code.includes('<nav') || code.includes('<main') || code.includes('<header') || code.includes('<footer') || code.includes('<section');
    if (!hasAria && !hasSemantic && code.length > 200) {
      findings.push(this.createFinding({
        category: 'Accessibility',
        severity: 'High',
        affectedFile: 'UI components',
        evidence: 'No accessibility attributes (ARIA, semantic HTML) detected',
        explanation: 'Accessible design ensures the application is usable by people with disabilities.',
        impact: 'Exclusion of users with disabilities, potential legal compliance issues (ADA, WCAG).',
        solution: 'Use semantic HTML elements, ARIA attributes, proper heading hierarchy, and ensure keyboard navigation support.'
      }));
    }

    // Check for loading states
    const hasLoading = code.includes('loading') || code.includes('Loading') || code.includes('spinner') || code.includes('Skeleton');
    if (!hasLoading && code.length > 300) {
      findings.push(this.createFinding({
        category: 'User Experience',
        severity: 'Medium',
        affectedFile: 'UI components',
        evidence: 'No loading states or indicators detected',
        explanation: 'Users need visual feedback during async operations to understand the application state.',
        impact: 'Users may think the app is frozen or broken, leading to frustration and abandonment.',
        solution: 'Implement loading spinners, skeleton screens, or progress indicators for all async operations.'
      }));
    }

    // Check for error handling in UI
    const hasErrorUi = code.includes('error') || code.includes('Error') || code.includes('toast') || code.includes('notification') || code.includes('alert');
    if (!hasErrorUi && code.length > 300) {
      findings.push(this.createFinding({
        category: 'Error Handling UX',
        severity: 'Medium',
        affectedFile: 'UI components',
        evidence: 'No user-facing error handling patterns detected',
        explanation: 'Users should see clear, helpful error messages when operations fail.',
        impact: 'Confused users who cannot understand or recover from errors.',
        solution: 'Implement user-friendly error messages, toast notifications, and error boundary components.'
      }));
    }

    // Check for form validation
    const hasForms = code.includes('<form') || code.includes('Form') || code.includes('input') || code.includes('<input');
    const hasFormValidation = code.includes('required') || code.includes('validate') || code.includes('validation') || code.includes('valid');
    if (hasForms && !hasFormValidation) {
      findings.push(this.createFinding({
        category: 'Form UX',
        severity: 'Medium',
        affectedFile: 'Form components',
        evidence: 'Form elements detected without validation feedback',
        explanation: 'Forms should provide real-time validation feedback to guide users.',
        impact: 'Frustrated users who submit invalid data and receive unclear error responses.',
        solution: 'Implement client-side validation with clear error messages near each field. Use libraries like Formik or React Hook Form.'
      }));
    }

    // Check for navigation/routing
    const hasNavigation = code.includes('route') || code.includes('Route') || code.includes('nav') || code.includes('Link') || code.includes('router');
    if (!hasNavigation && code.length > 500) {
      findings.push(this.createFinding({
        category: 'Navigation',
        severity: 'Medium',
        affectedFile: 'Application structure',
        evidence: 'No navigation or routing patterns detected',
        explanation: 'Applications with multiple views need clear navigation structures.',
        impact: 'Users cannot easily find features or understand the application structure.',
        solution: 'Implement clear navigation with a consistent menu structure, breadcrumbs, and URL-based routing.'
      }));
    }

    // Check for empty states
    const hasEmptyStates = code.includes('empty') || code.includes('Empty') || code.includes('no data') || code.includes('No data') || code.includes('no results');
    if (!hasEmptyStates && code.length > 500) {
      findings.push(this.createFinding({
        category: 'Empty States',
        severity: 'Low',
        affectedFile: 'List/collection views',
        evidence: 'No empty state handling detected',
        explanation: 'Empty states should provide helpful information and calls to action when no data is available.',
        impact: 'Confusing blank screens that leave users unsure what to do next.',
        solution: 'Design informative empty states with illustrations and clear CTAs for first-time users.'
      }));
    }

    // Check for internationalization readiness
    const hardcodedStrings = code.match(/['"](?:Submit|Cancel|Save|Delete|Edit|Search|Login|Register|Welcome|Error)['"]/g);
    if (hardcodedStrings && hardcodedStrings.length > 5) {
      findings.push(this.createFinding({
        category: 'Internationalization',
        severity: 'Low',
        affectedFile: 'UI components',
        evidence: `Found ${hardcodedStrings.length} hardcoded UI strings`,
        explanation: 'Hardcoded strings make it difficult to support multiple languages.',
        impact: 'Significant refactoring required if internationalization is needed in the future.',
        solution: 'Use an i18n library (e.g., react-i18next, vue-i18n) to externalize strings from the start.'
      }));
    }

    // Check for consistent design patterns
    const hasDesignSystem = code.includes('theme') || code.includes('Theme') || code.includes('design-token') || code.includes('styled') || code.includes('tailwind') || code.includes('material');
    if (!hasDesignSystem && code.length > 500) {
      findings.push(this.createFinding({
        category: 'Design Consistency',
        severity: 'Low',
        affectedFile: 'Styles',
        evidence: 'No design system or theming pattern detected',
        explanation: 'A consistent design system ensures visual coherence across the application.',
        impact: 'Inconsistent UI that feels unprofessional and confuses users.',
        solution: 'Adopt a design system (Material UI, Ant Design) or create custom design tokens for colors, spacing, and typography.'
      }));
    }

    // Positive finding
    if (hasResponsive && (hasAria || hasSemantic)) {
      findings.push(this.createFinding({
        category: 'UX Quality',
        severity: 'Low',
        affectedFile: 'Project-wide',
        evidence: 'Project demonstrates good UX practices',
        explanation: 'The project shows evidence of responsive design and accessibility considerations.',
        impact: 'Positive user experience across devices and user types.',
        solution: 'Continue following UX best practices and consider user testing for validation.'
      }));
    }

    const score = this.calculateScore(findings);

    return {
      agent: this.name,
      description: this.description,
      score,
      summary: `Product/UX analysis of "${name}" identified ${findings.length} findings. Score: ${score}/100.`,
      findings
    };
  }
}

module.exports = ProductUxAgent;
