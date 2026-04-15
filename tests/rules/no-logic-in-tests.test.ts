import { parse } from '@babel/parser';
import rule from '../../src/rules/no-logic-in-tests';

function parseCode(code: string) {
  return parse(code, {
    sourceType: 'module',
    plugins: ['typescript'],
  });
}

describe('no-logic-in-tests', () => {
  it('flags an if statement inside it()', () => {
    const ast = parseCode(`
      it('test', () => {
        if (condition) { doSomething() }
      })
    `);
    const violations = rule.check(ast, 'test.spec.ts');
    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0].rule).toBe('no-logic-in-tests');
    expect(violations[0].severity).toBe('error');
  });

  it('flags a for loop inside it()', () => {
    const ast = parseCode(`
      it('test', () => {
        for (let i = 0; i < 3; i++) { doSomething() }
      })
    `);
    expect(rule.check(ast, 'test.spec.ts').length).toBeGreaterThan(0);
  });

  it('flags a for..of loop inside test()', () => {
    const ast = parseCode(`
      test('test', () => {
        for (const item of items) { check(item) }
      })
    `);
    expect(rule.check(ast, 'test.spec.ts').length).toBeGreaterThan(0);
  });

  it('flags try/catch inside it()', () => {
    const ast = parseCode(`
      it('test', () => {
        try { doSomething() } catch(e) { handle(e) }
      })
    `);
    expect(rule.check(ast, 'test.spec.ts').length).toBeGreaterThan(0);
  });

  it('does not flag if/else outside test blocks', () => {
    const ast = parseCode(`
      function helper() {
        if (condition) { return true }
      }
      it('test', () => { helper() })
    `);
    expect(rule.check(ast, 'test.spec.ts')).toHaveLength(0);
  });

  it('does not flag clean test bodies', () => {
    const ast = parseCode(`
      it('test', () => {
        cy.visit('/home')
        cy.get('[data-testid="title"]').should('be.visible')
      })
    `);
    expect(rule.check(ast, 'test.spec.ts')).toHaveLength(0);
  });
});
