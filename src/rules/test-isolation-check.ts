import traverse from '@babel/traverse';
import * as t from '@babel/types';
import type { Rule, Violation } from '../types';

const rule: Rule = {
  name: 'test-isolation-check',
  description: 'Detects shared mutable state declared at the describe/module level that can leak between tests.',
  severity: 'info',
  hint: 'Move shared state initialization into beforeEach() to ensure each test starts with a clean slate.',

  check(ast: t.File, filePath: string): Violation[] {
    const violations: Violation[] = [];

    traverse(ast, {
      CallExpression(path) {
        if (
          !t.isIdentifier(path.node.callee, { name: 'describe' }) &&
          !(t.isMemberExpression(path.node.callee) && t.isIdentifier((path.node.callee as t.MemberExpression).object, { name: 'describe' }))
        ) return;

        const callback = path.node.arguments[1];
        if (!callback || !t.isFunction(callback)) return;

        if (!t.isBlockStatement(callback.body)) return;

        for (const stmt of callback.body.body) {
          if (
            t.isVariableDeclaration(stmt) &&
            stmt.kind === 'let'
          ) {
            for (const decl of stmt.declarations) {
              if (t.isIdentifier(decl.id)) {
                violations.push({
                  rule: rule.name,
                  severity: rule.severity,
                  message: `"let ${decl.id.name}" declared in describe scope may leak state between tests`,
                  file: filePath,
                  line: stmt.loc?.start.line ?? 0,
                  column: stmt.loc?.start.column ?? 0,
                  hint: rule.hint,
                });
              }
            }
          }
        }
      },
    });

    return violations;
  },
};

export default rule;
