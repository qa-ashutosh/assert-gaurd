import { parse } from '@babel/parser';
import rule from '../../src/rules/no-hard-waits';

function parseCode(code: string) {
  return parse(code, { sourceType: 'module', plugins: ['typescript'] });
}

describe('no-hard-waits', () => {
  it('flags cy.wait() with a numeric literal', () => {
    const ast = parseCode(`cy.wait(3000)`);
    const violations = rule.check(ast, 'test.spec.ts');
    expect(violations).toHaveLength(1);
    expect(violations[0].rule).toBe('no-hard-waits');
    expect(violations[0].severity).toBe('error');
  });

  it('does not flag cy.wait() with an alias string', () => {
    const ast = parseCode(`cy.wait('@apiRequest')`);
    const violations = rule.check(ast, 'test.spec.ts');
    expect(violations).toHaveLength(0);
  });

  it('does not flag unrelated wait calls', () => {
    const ast = parseCode(`browser.wait(EC.visibilityOf(el))`);
    const violations = rule.check(ast, 'test.spec.ts');
    expect(violations).toHaveLength(0);
  });

  it('returns correct line number', () => {
    const ast = parseCode(`\n\ncy.wait(5000)`);
    const violations = rule.check(ast, 'test.spec.ts');
    expect(violations[0].line).toBe(3);
  });
});
