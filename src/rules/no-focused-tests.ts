import traverse from '@babel/traverse';
import * as t from '@babel/types';
import type { Rule, Violation } from '../types';

const FOCUSED_IDENTIFIERS = new Set(['it.only', 'test.only', 'describe.only', 'fit', 'fdescribe']);

const rule: Rule = {
  name: 'no-focused-tests',
  description: 'Disallows .only() and focused test blocks that skip the rest of the suite in CI.',
  severity: 'error',
  hint: 'Remove .only() before committing. Focused tests silently skip your entire suite in CI.',

  check(ast: t.File, filePath: string): Violation[] {
    const violations: Violation[] = [];

    traverse(ast, {
      CallExpression(path) {
        const { callee } = path.node;

        // it.only(...) / test.only(...) / describe.only(...)
        if (
          t.isMemberExpression(callee) &&
          t.isIdentifier(callee.object) &&
          t.isIdentifier(callee.property, { name: 'only' })
        ) {
          const objectName = callee.object.name;
          if (['it', 'test', 'describe'].includes(objectName)) {
            violations.push({
              rule: rule.name,
              severity: rule.severity,
              message: `${objectName}.only() found — this skips all other tests in CI`,
              file: filePath,
              line: path.node.loc?.start.line ?? 0,
              column: path.node.loc?.start.column ?? 0,
              hint: rule.hint,
            });
          }
        }

        // fit(...) / fdescribe(...)
        if (t.isIdentifier(callee) && FOCUSED_IDENTIFIERS.has(callee.name)) {
          violations.push({
            rule: rule.name,
            severity: rule.severity,
            message: `${callee.name}() is a focused test alias — remove before merge`,
            file: filePath,
            line: path.node.loc?.start.line ?? 0,
            column: path.node.loc?.start.column ?? 0,
            hint: rule.hint,
          });
        }
      },
    });

    return violations;
  },
};

export default rule;
