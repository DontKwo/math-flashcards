import { describe, it, expect } from 'vitest';
import { preprocessLatex } from './preprocess';

describe('preprocessLatex', () => {
  describe('whitespace and trimming', () => {
    it('normalizes whitespace and trims outer spaces', () => {
      expect(preprocessLatex('   PV   =   nRT   ')).toBe('PV=nRT');
      expect(preprocessLatex('P \t\n V   =   n  R  T')).toBe('P V=n R T');
      expect(preprocessLatex('')).toBe('');
    });

    it('strips LaTeX comments', () => {
      expect(preprocessLatex('PV = nRT % gas law')).toBe('PV=nRT');
    });
  });

  describe('delimiter standardization', () => {
    it('standardizes \\left and \\right delimiters', () => {
      expect(preprocessLatex(String.raw`\left( x \right)`)).toBe('(x)');
      expect(preprocessLatex(String.raw`\left[ x \right]`)).toBe('[x]');
      expect(preprocessLatex(String.raw`\left\{ x \right\}`)).toBe(String.raw`\{x\}`);
      expect(preprocessLatex(String.raw`\left| x \right|`)).toBe('|x|');
    });

    it('removes invisible delimiters \\left. and \\right.', () => {
      expect(preprocessLatex(String.raw`\left. \frac{df}{dx} \right|`)).toBe(String.raw`\frac{df}{dx}|`);
    });

    it('strips sizing delimiters', () => {
      expect(preprocessLatex(String.raw`\bigl( x \bigr)`)).toBe('(x)');
      expect(preprocessLatex(String.raw`\Big( x \Big)`)).toBe('(x)');
    });
  });

  describe('fraction standardization', () => {
    it('converts \\dfrac and \\tfrac to \\frac', () => {
      expect(preprocessLatex(String.raw`\dfrac{1}{2}mv^2`)).toBe(String.raw`\frac{1}{2}mv^{2}`);
      expect(preprocessLatex(String.raw`\tfrac{nRT}{V}`)).toBe(String.raw`\frac{nRT}{V}`);
    });
  });

  describe('multiplication symbol unification', () => {
    it('unifies \\times and * to \\cdot', () => {
      expect(preprocessLatex(String.raw`a \times b`)).toBe(String.raw`a \cdot b`);
      expect(preprocessLatex(String.raw`a * b`)).toBe(String.raw`a \cdot b`);
      expect(preprocessLatex(String.raw`m\cdot v^{2}/2`)).toBe(String.raw`m \cdot v^{2}/2`);
    });
  });

  describe('sub/superscript standardization', () => {
    it('standardizes single character exponent and subscript braces', () => {
      expect(preprocessLatex('v^2')).toBe('v^{2}');
      expect(preprocessLatex('x_1')).toBe('x_{1}');
      expect(preprocessLatex('v^{2}')).toBe('v^{2}');
      expect(preprocessLatex('E=0.5mv^2')).toBe('E=0.5mv^{2}');
    });
  });

  describe('inequalities', () => {
    it('normalizes \\le and \\ge to \\leq and \\geq', () => {
      expect(preprocessLatex(String.raw`x \le 5`)).toBe(String.raw`x\leq 5`);
      expect(preprocessLatex(String.raw`x \ge 5`)).toBe(String.raw`x\geq 5`);
    });
  });

  describe('\\mathrm and \\text stripping vs unit preservation', () => {
    it('strips \\mathrm and \\text around variables', () => {
      expect(preprocessLatex(String.raw`\mathrm{x} + \mathrm{y}`)).toBe('x+y');
      expect(preprocessLatex(String.raw`\text{P} = \mathrm{V}`)).toBe('P=V');
    });

    it('preserves \\mathrm and \\text for known unit strings', () => {
      expect(preprocessLatex(String.raw`5\ \mathrm{kg}`)).toBe(String.raw`5 \mathrm{kg}`);
      expect(preprocessLatex(String.raw`10\ \text{m/s}`)).toBe(String.raw`10 \text{m/s}`);
      expect(preprocessLatex(String.raw`100\ \mathrm{kPa}`)).toBe(String.raw`100 \mathrm{kPa}`);
      expect(preprocessLatex(String.raw`1\ \mathrm{mol}`)).toBe(String.raw`1 \mathrm{mol}`);
      expect(preprocessLatex(String.raw`20\ \mathrm{J}`)).toBe(String.raw`20 \mathrm{J}`);
    });

    it('supports custom preserved units', () => {
      expect(preprocessLatex(String.raw`5\ \mathrm{customUnit}`, { preservedUnits: ['customUnit'] }))
        .toBe(String.raw`5 \mathrm{customUnit}`);
      expect(preprocessLatex(String.raw`5\ \mathrm{customUnit}`))
        .toBe('5 customUnit');
    });
  });

  describe('symbol preservation and accents', () => {
    it('transforms decorated symbols to unique identifiers when accentsMatter is true', () => {
      expect(preprocessLatex(String.raw`\hat{R}`)).toBe('R__hat');
      expect(preprocessLatex(String.raw`\hat{\rho}`)).toBe('rho__hat');
      expect(preprocessLatex(String.raw`\bar{x}`)).toBe('x__bar');
      expect(preprocessLatex(String.raw`\vec{v}`)).toBe('v__vec');
      expect(preprocessLatex(String.raw`\dot{x}`)).toBe('x__dot');
      expect(preprocessLatex(String.raw`\ddot{x}`)).toBe('x__ddot');
      expect(preprocessLatex(String.raw`\tilde{y}`)).toBe('y__tilde');
    });

    it('handles unbraced single token decorators', () => {
      expect(preprocessLatex(String.raw`\hat R`)).toBe('R__hat');
      expect(preprocessLatex(String.raw`\bar x`)).toBe('x__bar');
      expect(preprocessLatex(String.raw`\vec v`)).toBe('v__vec');
      expect(preprocessLatex(String.raw`\dot x`)).toBe('x__dot');
    });

    it('strips decorators when accentsMatter is false', () => {
      expect(preprocessLatex(String.raw`\hat{R}`, { accentsMatter: false })).toBe('R');
      expect(preprocessLatex(String.raw`\hat{\rho}`, { accentsMatter: false })).toBe(String.raw`\rho`);
      expect(preprocessLatex(String.raw`\bar{x}`, { accentsMatter: false })).toBe('x');
      expect(preprocessLatex(String.raw`\vec{v}`, { accentsMatter: false })).toBe('v');
      expect(preprocessLatex(String.raw`\dot{x}`, { accentsMatter: false })).toBe('x');
      expect(preprocessLatex(String.raw`P = \hat{\rho} R T`, { accentsMatter: false })).toBe(String.raw`P=\rho R T`);
    });
  });

  describe('Greek variant unification', () => {
    it('unifies Greek letter variants by default (greekVariantsEqual=true)', () => {
      expect(preprocessLatex(String.raw`\varepsilon`)).toBe(String.raw`\epsilon`);
      expect(preprocessLatex(String.raw`\varphi`)).toBe(String.raw`\phi`);
      expect(preprocessLatex(String.raw`\vartheta`)).toBe(String.raw`\theta`);
      expect(preprocessLatex(String.raw`\varpi`)).toBe(String.raw`\pi`);
      expect(preprocessLatex(String.raw`\varrho`)).toBe(String.raw`\rho`);
      expect(preprocessLatex(String.raw`\varsigma`)).toBe(String.raw`\sigma`);
    });

    it('preserves Greek variants when greekVariantsEqual is false', () => {
      expect(preprocessLatex(String.raw`\varepsilon`, { greekVariantsEqual: false })).toBe(String.raw`\varepsilon`);
      expect(preprocessLatex(String.raw`\varphi`, { greekVariantsEqual: false })).toBe(String.raw`\varphi`);
      expect(preprocessLatex(String.raw`\vartheta`, { greekVariantsEqual: false })).toBe(String.raw`\vartheta`);
    });
  });

  describe('PLAN.md Section 6.5 cases', () => {
    it('preprocesses Ideal Gas Law references and variants', () => {
      expect(preprocessLatex('PV = nRT')).toBe('PV=nRT');
      expect(preprocessLatex('P V = n R T')).toBe('P V=n R T');
      expect(preprocessLatex(String.raw`P=\frac{nRT}{V}`)).toBe(String.raw`P=\frac{nRT}{V}`);
      expect(preprocessLatex(String.raw`P = \hat{\rho} R T`)).toBe(String.raw`P=rho__hat R T`);
      expect(preprocessLatex(String.raw`P = \rho R T`)).toBe(String.raw`P=\rho R T`);
    });

    it('preprocesses Kinetic Energy equations', () => {
      expect(preprocessLatex(String.raw`E = \frac{1}{2} m v^{2}`)).toBe(String.raw`E=\frac{1}{2} m v^{2}`);
      expect(preprocessLatex(String.raw`E=\frac12mv^2`)).toBe(String.raw`E=\frac12mv^{2}`);
      expect(preprocessLatex(String.raw`E=m\cdot v^{2}/2`)).toBe(String.raw`E=m \cdot v^{2}/2`);
    });

    it('preprocesses Gibbs Free Energy equations', () => {
      expect(preprocessLatex(String.raw`\Delta G = \Delta H - T\Delta S`)).toBe(String.raw`\Delta G=\Delta H-T\Delta S`);
      expect(preprocessLatex(String.raw`\Delta H = \Delta G + T\Delta S`)).toBe(String.raw`\Delta H=\Delta G+T\Delta S`);
    });

    it('preprocesses Quadratic Formula', () => {
      expect(preprocessLatex(String.raw`x = \frac{-b\pm\sqrt{b^2-4ac}}{2a}`))
        .toBe(String.raw`x=\frac{-b\pm\sqrt{b^{2}-4ac}}{2a}`);
      expect(preprocessLatex(String.raw`x = \frac{-b\pm\sqrt{b^{2}-4ac}}{2a}`))
        .toBe(String.raw`x=\frac{-b\pm\sqrt{b^{2}-4ac}}{2a}`);
    });
  });
});
