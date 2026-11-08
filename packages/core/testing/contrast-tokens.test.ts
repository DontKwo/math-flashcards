import { describe, it, expect } from 'vitest';

function parseRgb(strVal: string): [number, number, number] {
  const hexMatch = strVal.match(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/);
  if (hexMatch) {
    let hex = hexMatch[1];
    if (hex.length === 3) {
      hex = hex.split('').map((c) => c + c).join('');
    }
    return [
      parseInt(hex.slice(0, 2), 16),
      parseInt(hex.slice(2, 4), 16),
      parseInt(hex.slice(4, 6), 16),
    ];
  }
  const rgbMatch = strVal.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (rgbMatch) {
    return [parseInt(rgbMatch[1], 10), parseInt(rgbMatch[2], 10), parseInt(rgbMatch[3], 10)];
  }
  throw new Error(`Invalid color value: ${strVal}`);
}

function getLuminance(r: number, g: number, b: number): number {
  const a = [r, g, b].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

function getContrastRatio(fgStr: string, bgStr: string): number {
  const fg = parseRgb(fgStr);
  const bg = parseRgb(bgStr);
  const l1 = getLuminance(fg[0], fg[1], fg[2]);
  const l2 = getLuminance(bg[0], bg[1], bg[2]);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

describe('Design Token WCAG AA Contrast Compliance', () => {
  const darkPairs = [
    { name: 'Primary text on dark background', fg: '#f8fafc', bg: '#0f172a', min: 4.5 },
    { name: 'Secondary text on dark background', fg: '#94a3b8', bg: '#0f172a', min: 4.5 },
    { name: 'Primary text on dark card', fg: '#f8fafc', bg: '#1e293b', min: 4.5 },
    { name: 'Secondary text on dark card', fg: '#94a3b8', bg: '#1e293b', min: 4.5 },
    { name: 'Accent text badge on tinted card', fg: '#a5b4fc', bg: '#1c2348', min: 4.5 },
    { name: 'White text on accent-strong button', fg: '#ffffff', bg: '#4f46e5', min: 4.5 },
    { name: 'Danger text on error background', fg: '#fca5a5', bg: '#311e2e', min: 4.5 },
    { name: 'Success text on success background', fg: '#6ee7b7', bg: '#142a27', min: 4.5 },
  ];

  darkPairs.forEach(({ name, fg, bg, min }) => {
    it(`should meet contrast ratio >= ${min}:1 for ${name}`, () => {
      const ratio = getContrastRatio(fg, bg);
      expect(ratio).toBeGreaterThanOrEqual(min);
    });
  });

  const lightPairs = [
    { name: 'Primary text on light background', fg: '#0f172a', bg: '#f8fafc', min: 4.5 },
    { name: 'Secondary text on light background', fg: '#475569', bg: '#f8fafc', min: 4.5 },
    { name: 'Primary text on light card', fg: '#0f172a', bg: '#ffffff', min: 4.5 },
    { name: 'Secondary text on light card', fg: '#475569', bg: '#ffffff', min: 4.5 },
    { name: 'White text on light accent button', fg: '#ffffff', bg: '#4338ca', min: 4.5 },
  ];

  lightPairs.forEach(({ name, fg, bg, min }) => {
    it(`should meet contrast ratio >= ${min}:1 for ${name} in light mode`, () => {
      const ratio = getContrastRatio(fg, bg);
      expect(ratio).toBeGreaterThanOrEqual(min);
    });
  });
});
