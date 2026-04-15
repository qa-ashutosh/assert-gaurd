import { parse } from '@babel/parser';
import rule from '../../src/rules/no-flaky-selectors';

function parseCode(code: string) {
  return parse(code, { sourceType: 'module', plugins: ['typescript'] });
}

describe('no-flaky-selectors', () => {
  it('flags nth-child positional selectors', () => {
    const ast = parseCode(`cy.get('li:nth-child(2)')`);
    expect(rule.check(ast, 'test.spec.ts').length).toBeGreaterThan(0);
  });

  it('flags absolute XPath selectors', () => {
    const ast = parseCode(`cy.get('//div/span[1]')`);
    expect(rule.check(ast, 'test.spec.ts').length).toBeGreaterThan(0);
  });

  it('does not flag data-testid selectors', () => {
    const ast = parseCode(`cy.get('[data-testid="submit-btn"]')`);
    expect(rule.check(ast, 'test.spec.ts')).toHaveLength(0);
  });

  it('does not flag aria-label selectors', () => {
    const ast = parseCode(`cy.get('[aria-label="Submit"]')`);
    expect(rule.check(ast, 'test.spec.ts')).toHaveLength(0);
  });

  it('does not flag role-based selectors', () => {
    const ast = parseCode(`page.getByRole('button', { name: 'Submit' })`);
    expect(rule.check(ast, 'test.spec.ts')).toHaveLength(0);
  });
});
