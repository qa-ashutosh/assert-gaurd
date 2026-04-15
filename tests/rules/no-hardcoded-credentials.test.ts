import { parse } from '@babel/parser';
import rule from '../../src/rules/no-hardcoded-credentials';

function parseCode(code: string) {
  return parse(code, {
    sourceType: 'module',
    plugins: ['typescript'],
  });
}

describe('no-hardcoded-credentials', () => {
  it('flags a hardcoded password in object property', () => {
    const ast = parseCode(`const creds = { password: 'Abc12345xyz' }`);
    expect(rule.check(ast, 'test.spec.ts').length).toBeGreaterThan(0);
  });

  it('flags a hardcoded apiKey in object property', () => {
    const ast = parseCode(`const cfg = { apiKey: 'sk-live-abc123def456' }`);
    expect(rule.check(ast, 'test.spec.ts').length).toBeGreaterThan(0);
  });

  it('does not flag process.env usage', () => {
    const ast = parseCode(`const password = process.env.PASSWORD`);
    expect(rule.check(ast, 'test.spec.ts')).toHaveLength(0);
  });

  it('does not flag obvious placeholder strings', () => {
    const ast = parseCode(`const cfg = { password: 'your-password-here' }`);
    expect(rule.check(ast, 'test.spec.ts')).toHaveLength(0);
  });

  it('does not flag short strings that are not credentials', () => {
    const ast = parseCode(`const x = { password: 'abc' }`);
    expect(rule.check(ast, 'test.spec.ts')).toHaveLength(0);
  });
});
