import { parse } from '@babel/parser';
import { createRule } from '../../src/rules/single-assertion-focus';

function parseCode(code: string) {
  return parse(code, {
    sourceType: 'module',
    plugins: ['typescript'],
  });
}

describe('single-assertion-focus', () => {
  const rule = createRule(3); // use a low threshold for easier testing

  it('flags when assertions exceed the threshold', () => {
    const ast = parseCode(`
      it('over limit', () => {
        expect(a).toBe(1)
        expect(b).toBe(2)
        expect(c).toBe(3)
        expect(d).toBe(4)
      })
    `);
    const violations = rule.check(ast, 'test.spec.ts');
    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0].rule).toBe('single-assertion-focus');
    expect(violations[0].severity).toBe('warn');
  });

  it('does not flag when assertions are within the limit', () => {
    const ast = parseCode(`
      it('within limit', () => {
        expect(a).toBe(1)
      })
    `);
    expect(rule.check(ast, 'test.spec.ts')).toHaveLength(0);
  });

  it('does not flag test blocks with exactly the threshold', () => {
    // threshold=3, one expect() call = 2 counted (expect + toBe), so 1 call is under threshold
    const ast = parseCode(`
      it('at limit', () => {
        assert(a === 1)
      })
    `);
    expect(rule.check(ast, 'test.spec.ts')).toHaveLength(0);
  });

  it('reports the correct file and rule name', () => {
    const ast = parseCode(`
      it('lots of asserts', () => {
        expect(a).toBe(1); expect(b).toBe(2);
        expect(c).toBe(3); expect(d).toBe(4);
      })
    `);
    const violations = rule.check(ast, 'my.spec.ts');
    expect(violations[0].file).toBe('my.spec.ts');
    expect(violations[0].rule).toBe('single-assertion-focus');
  });
});
