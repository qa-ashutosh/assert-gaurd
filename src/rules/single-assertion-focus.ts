import traverse from '@babel/traverse';
import * as t from '@babel/types';
import type { Rule, Violation } from '../types';

const TEST_BLOCK_NAMES = new Set(['it', 'test', 'specify']);
const ASSERTION_METHODS = new Set([
  'expect', 'assert', 'should', 'toBe', 'toEqual', 'toContain',
  'toBeTruthy', 'toBeFalsy', 'toBeNull', 'toBeUndefined', 'toBeVisible',
  'toHaveText', 'toHaveValue', 'toHaveLength', 'toMatchSnapshot',
]);

const DEFAULT_MAX = 5;

function isTestBlock(node: t.CallExpression): boolean {
  if (t.isIdentifier(node.callee)) return TEST_BLOCK_NAMES.has(node.callee.name);
  if (t.isMemberExpression(node.callee) && t.isIdentifier(node.callee.object)) {
    return TEST_BLOCK_NAMES.has(node.callee.object.name);
  }
  return false;
}

export function createRule(maxAssertions = DEFAULT_MAX): Rule {
  return {
    name: 'single-assertion-focus',
    description: `Warns when a test block contains more than ${maxAssertions} assertions.`,
    severity: 'warn',
    hint: `Split large test blocks into focused tests. Each test should verify one behaviour (max ${maxAssertions} assertions).`,

    check(ast: t.File, filePath: string): Violation[] {
      const violations: Violation[] = [];

      traverse(ast, {
        CallExpression(path) {
          if (!isTestBlock(path.node)) return;

          let assertionCount = 0;
          const testLine = path.node.loc?.start.line ?? 0;

          path.traverse({
            CallExpression(inner) {
              const callee = inner.node.callee;

              if (t.isIdentifier(callee) && ASSERTION_METHODS.has(callee.name)) {
                assertionCount++;
              }
              if (
                t.isMemberExpression(callee) &&
                t.isIdentifier(callee.property) &&
                ASSERTION_METHODS.has(callee.property.name)
              ) {
                assertionCount++;
              }
            },
          });

          if (assertionCount > maxAssertions) {
            violations.push({
              rule: 'single-assertion-focus',
              severity: 'warn',
              message: `${assertionCount} assertions in one test block (max: ${maxAssertions}) — consider splitting`,
              file: filePath,
              line: testLine,
              column: path.node.loc?.start.column ?? 0,
              hint: `Split large test blocks into focused tests. Each test should verify one behaviour (max ${maxAssertions} assertions).`,
            });
          }
        },
      });

      return violations;
    },
  };
}

const rule: Rule = createRule(DEFAULT_MAX);
export default rule;
