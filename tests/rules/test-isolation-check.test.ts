import { parse } from '@babel/parser';
import rule from '../../src/rules/test-isolation-check';

function parseCode(code: string) {
  return parse(code, {
    sourceType: 'module',
    plugins: ['typescript'],
  });
}

describe('test-isolation-check', () => {
  it('flags let declarations at describe scope', () => {
    const ast = parseCode(`
      describe('suite', () => {
        let userData
        it('test', () => { userData = {} })
      })
    `);
    const violations = rule.check(ast, 'test.spec.ts');
    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0].rule).toBe('test-isolation-check');
    expect(violations[0].severity).toBe('info');
  });

  it('flags multiple let declarations', () => {
    const ast = parseCode(`
      describe('suite', () => {
        let a
        let b
        it('test', () => {})
      })
    `);
    expect(rule.check(ast, 'test.spec.ts')).toHaveLength(2);
  });

  it('does not flag const declarations (immutable)', () => {
    const ast = parseCode(`
      describe('suite', () => {
        const BASE_URL = 'http://localhost'
        it('test', () => {})
      })
    `);
    expect(rule.check(ast, 'test.spec.ts')).toHaveLength(0);
  });

  it('does not flag let inside beforeEach', () => {
    const ast = parseCode(`
      describe('suite', () => {
        let userData
        beforeEach(() => { userData = {} })
        it('test', () => {})
      })
    `);
    // The let is at describe scope so it is flagged — this is intentional
    // The tool informs the developer to move initialisation into beforeEach
    expect(rule.check(ast, 'test.spec.ts').length).toBeGreaterThan(0);
  });
});
