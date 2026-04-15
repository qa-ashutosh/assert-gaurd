import traverse from '@babel/traverse';
import * as t from '@babel/types';
import type { Rule, Violation } from '../types';

const TEST_BLOCK_NAMES = new Set(['it', 'test', 'specify']);

function isTestBlock(node: t.CallExpression): boolean {
  if (t.isIdentifier(node.callee)) {
    return TEST_BLOCK_NAMES.has(node.callee.name);
  }
  if (t.isMemberExpression(node.callee) && t.isIdentifier(node.callee.object)) {
    return TEST_BLOCK_NAMES.has(node.callee.object.name);
  }
  return false;
}

const rule: Rule = {
  name: 'no-logic-in-tests',
  description: 'Disallows conditional logic and loops inside test blocks.',
  severity: 'error',
  hint: 'Move logic into helper functions, data providers, or test setup. Tests should be linear and deterministic.',

  check(ast: t.File, filePath: string): Violation[] {
    const violations: Violation[] = [];
    let insideTestBlock = 0;

    traverse(ast, {
      CallExpression: {
        enter(path) {
          if (isTestBlock(path.node)) insideTestBlock++;
        },
        exit(path) {
          if (isTestBlock(path.node)) insideTestBlock--;
        },
      },

      IfStatement(path) {
        if (insideTestBlock > 0) {
          violations.push({
            rule: rule.name,
            severity: rule.severity,
            message: 'if/else statement inside a test block makes tests non-deterministic',
            file: filePath,
            line: path.node.loc?.start.line ?? 0,
            column: path.node.loc?.start.column ?? 0,
            hint: rule.hint,
          });
        }
      },

      ForStatement(path) {
        if (insideTestBlock > 0) {
          violations.push({
            rule: rule.name,
            severity: rule.severity,
            message: 'for loop inside a test block — extract to a data-driven approach',
            file: filePath,
            line: path.node.loc?.start.line ?? 0,
            column: path.node.loc?.start.column ?? 0,
            hint: rule.hint,
          });
        }
      },

      ForOfStatement(path) {
        if (insideTestBlock > 0) {
          violations.push({
            rule: rule.name,
            severity: rule.severity,
            message: 'for..of loop inside a test block — use parameterized tests instead',
            file: filePath,
            line: path.node.loc?.start.line ?? 0,
            column: path.node.loc?.start.column ?? 0,
            hint: rule.hint,
          });
        }
      },

      TryStatement(path) {
        if (insideTestBlock > 0) {
          violations.push({
            rule: rule.name,
            severity: rule.severity,
            message: 'try/catch inside a test block hides failures — let the test framework handle errors',
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
