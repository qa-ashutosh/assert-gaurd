import traverse from '@babel/traverse';
import * as t from '@babel/types';
import type { Rule, Violation } from '../types';

const CREDENTIAL_KEYS = [
  /password/i, /passwd/i, /secret/i, /api[_-]?key/i,
  /auth[_-]?token/i, /access[_-]?token/i, /private[_-]?key/i,
  /client[_-]?secret/i, /bearer/i,
];

const SUSPICIOUS_VALUE = /^(?!.*\$\{)(?!.*process\.env)[A-Za-z0-9+/]{8,}={0,2}$/;

const PREFIXED_KEY = /^(sk|pk|rk|api|token|secret|bearer)[_-](live|test|prod|dev|staging)?[_-]?[A-Za-z0-9]{8,}/i;

function looksLikeCredential(value: string): boolean {
  if (value.length < 6) return false;
  if (value.includes('process.env')) return false;
  if (value.includes('${')) return false;
  // Prefixed key patterns like sk-live-xxx, pk-prod-xxx always flagged
  if (PREFIXED_KEY.test(value)) return true;
  // Generic noise filter
  if (['password', 'secret', 'token', 'key', 'test', 'example', 'placeholder', 'your-'].some(s => value.toLowerCase().includes(s))) return false;
  return SUSPICIOUS_VALUE.test(value);
}

const rule: Rule = {
  name: 'no-hardcoded-credentials',
  description: 'Detects hardcoded passwords, tokens, and secrets in test files.',
  severity: 'error',
  hint: 'Use environment variables (process.env.PASSWORD) or a secrets manager. Never commit credentials.',

  check(ast: t.File, filePath: string): Violation[] {
    const violations: Violation[] = [];

    traverse(ast, {
      ObjectProperty(path) {
        const { key, value } = path.node;

        const keyName =
          t.isIdentifier(key) ? key.name :
          t.isStringLiteral(key) ? key.value : '';

        const isCredentialKey = CREDENTIAL_KEYS.some(p => p.test(keyName));

        if (isCredentialKey && t.isStringLiteral(value)) {
          if (looksLikeCredential(value.value)) {
            violations.push({
              rule: rule.name,
              severity: rule.severity,
              message: `Possible hardcoded credential in property "${keyName}"`,
              file: filePath,
              line: path.node.loc?.start.line ?? 0,
              column: path.node.loc?.start.column ?? 0,
              hint: rule.hint,
            });
          }
        }
      },

      AssignmentExpression(path) {
        const { left, right } = path.node;
        if (!t.isStringLiteral(right)) return;

        const varName =
          t.isIdentifier(left) ? left.name :
          t.isMemberExpression(left) && t.isIdentifier(left.property) ? left.property.name : '';

        if (CREDENTIAL_KEYS.some(p => p.test(varName)) && looksLikeCredential(right.value)) {
          violations.push({
            rule: rule.name,
            severity: rule.severity,
            message: `Possible hardcoded credential assigned to "${varName}"`,
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
