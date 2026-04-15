import traverse from '@babel/traverse';
import * as t from '@babel/types';
import type { Rule, Violation } from '../types';

const rule: Rule = {
  name: 'no-hard-waits',
  description: 'Disallows hard-coded wait/sleep calls that cause flaky tests.',
  severity: 'error',
  hint: 'Replace hard waits with waitFor(), intercept aliases, or retry-able assertions.',

  check(ast: t.File, filePath: string): Violation[] {
    const violations: Violation[] = [];

    traverse(ast, {
      CallExpression(path) {
        const { node } = path;

        // cy.wait(number)
        if (
          t.isMemberExpression(node.callee) &&
          t.isIdentifier(node.callee.object, { name: 'cy' }) &&
          t.isIdentifier(node.callee.property, { name: 'wait' }) &&
          node.arguments.length > 0 &&
          t.isNumericLiteral(node.arguments[0])
        ) {
          violations.push({
            rule: rule.name,
            severity: rule.severity,
            message: `cy.wait(${(node.arguments[0] as t.NumericLiteral).value}) detected — hard waits cause flaky tests`,
            file: filePath,
            line: node.loc?.start.line ?? 0,
            column: node.loc?.start.column ?? 0,
            hint: rule.hint,
          });
        }

        // Thread.sleep() / page.waitForTimeout() / driver.manage().timeouts().implicitlyWait()
        const calleeSrc = path.toString();
        const hardWaitPatterns = [
          /Thread\.sleep\s*\(/,
          /page\.waitForTimeout\s*\(/,
          /implicitlyWait\s*\(/,
          /sleep\s*\(\d+/,
        ];

        for (const pattern of hardWaitPatterns) {
          if (pattern.test(calleeSrc)) {
            violations.push({
              rule: rule.name,
              severity: rule.severity,
              message: `Hard wait pattern detected: ${calleeSrc.slice(0, 60)}`,
              file: filePath,
              line: node.loc?.start.line ?? 0,
              column: node.loc?.start.column ?? 0,
              hint: rule.hint,
            });
            break;
          }
        }
      },
    });

    return violations;
  },
};

export default rule;
