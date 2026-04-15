import traverse from '@babel/traverse';
import * as t from '@babel/types';
import type { Rule, Violation } from '../types';

const FLAKY_PATTERNS: Array<{ pattern: RegExp; message: string }> = [
  { pattern: /nth-child\(\d+\)/, message: 'nth-child() positional selector breaks when DOM order changes' },
  { pattern: /nth-of-type\(\d+\)/, message: 'nth-of-type() positional selector is fragile' },
  { pattern: /\/\/\w+\[\d+\]/, message: 'XPath index selector [N] is position-dependent and fragile' },
  { pattern: /^\/\//, message: 'Absolute XPath selectors break with any DOM restructure' },
  { pattern: /\.css-[a-z0-9]+/, message: 'Auto-generated CSS class names change on rebuild' },
  { pattern: /\[class\*="sc-"/, message: 'Styled-components generated class selectors are unstable' },
];

const SELECTOR_CALLS = new Set(['get', 'find', 'locator', 'querySelector', 'querySelectorAll', '$', '$$']);

const rule: Rule = {
  name: 'no-flaky-selectors',
  description: 'Warns about positional, XPath, and auto-generated selectors that cause flaky tests.',
  severity: 'warn',
  hint: 'Use data-testid, aria-label, or role-based selectors for stable element targeting.',

  check(ast: t.File, filePath: string): Violation[] {
    const violations: Violation[] = [];

    traverse(ast, {
      StringLiteral(path) {
        const value = path.node.value;

        for (const { pattern, message } of FLAKY_PATTERNS) {
          if (pattern.test(value)) {
            const parent = path.parent;
            const isInSelectorCall =
              t.isCallExpression(parent) &&
              t.isMemberExpression(parent.callee) &&
              t.isIdentifier(parent.callee.property) &&
              SELECTOR_CALLS.has(parent.callee.property.name);

            const isDirectCall =
              t.isCallExpression(parent) &&
              t.isIdentifier(parent.callee) &&
              SELECTOR_CALLS.has((parent.callee as t.Identifier).name);

            if (isInSelectorCall || isDirectCall || value.startsWith('//')) {
              violations.push({
                rule: rule.name,
                severity: rule.severity,
                message,
                file: filePath,
                line: path.node.loc?.start.line ?? 0,
                column: path.node.loc?.start.column ?? 0,
                hint: rule.hint,
              });
              break;
            }
          }
        }
      },
    });

    return violations;
  },
};

export default rule;
