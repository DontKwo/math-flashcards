import type {
  PageSizeName,
  PageOrientation,
  MarginPreset,
  Margins,
  ColorTheme,
} from './types.js';

// Standard paper dimensions in points (72 pt/inch)
export const PAGE_SIZES_PT: Record<Exclude<PageSizeName, 'custom'>, { width: number; height: number }> = {
  A4: { width: 595.28, height: 841.89 },
  Letter: { width: 612.0, height: 792.0 },
  A5: { width: 419.53, height: 595.28 },
  Legal: { width: 612.0, height: 1008.0 },
};

export const MARGIN_PRESETS_PT: Record<Exclude<MarginPreset, 'custom'>, Margins> = {
  narrow: { top: 20, right: 20, bottom: 20, left: 20 },
  normal: { top: 36, right: 36, bottom: 36, left: 36 },
  wide: { top: 54, right: 54, bottom: 54, left: 54 },
};

export function getPageDimensions(
  pageSize: PageSizeName,
  orientation: PageOrientation,
  custom?: { width?: number; height?: number }
): { width: number; height: number } {
  let base: { width: number; height: number };
  if (pageSize === 'custom' && custom && custom.width && custom.height) {
    base = { width: custom.width, height: custom.height };
  } else if (pageSize === 'custom') {
    base = PAGE_SIZES_PT.A4;
  } else {
    base = PAGE_SIZES_PT[pageSize];
  }

  if (orientation === 'landscape') {
    return {
      width: Math.max(base.width, base.height),
      height: Math.min(base.width, base.height),
    };
  }
  return {
    width: Math.min(base.width, base.height),
    height: Math.max(base.width, base.height),
  };
}

export function getMargins(preset: MarginPreset, custom?: Margins): Margins {
  if (preset === 'custom' && custom) {
    return custom;
  }
  if (preset === 'custom') {
    return MARGIN_PRESETS_PT.normal;
  }
  return MARGIN_PRESETS_PT[preset];
}

// Approximate character widths per font at 1pt (in points)
// Used for pure TS text wrapping without DOM
const CHAR_WIDTH_APPROX: Record<string, number> = {
  Helvetica: 0.52,
  Times: 0.48,
  Courier: 0.60,
};

export function measureTextWidth(text: string, fontSize: number, fontFamily: string): number {
  const factor = CHAR_WIDTH_APPROX[fontFamily] || 0.52;
  return text.length * fontSize * factor;
}

export function wrapText(
  text: string,
  maxWidth: number,
  fontSize: number,
  fontFamily: string
): string[] {
  if (!text) return [];
  const lines: string[] = [];
  const rawParagraphs = text.split('\n');

  for (const para of rawParagraphs) {
    if (!para) {
      lines.push('');
      continue;
    }
    const words = para.split(' ');
    let currentLine = '';

    for (const word of words) {
      const candidate = currentLine ? `${currentLine} ${word}` : word;
      const width = measureTextWidth(candidate, fontSize, fontFamily);
      if (width <= maxWidth) {
        currentLine = candidate;
      } else {
        if (currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          // Word itself is wider than line, hard slice
          lines.push(word);
          currentLine = '';
        }
      }
    }
    if (currentLine) {
      lines.push(currentLine);
    }
  }

  return lines;
}

export interface ColorPalette {
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  bgCard: string;
  borderCard: string;
  accent: string;
}

export function getColorPalette(theme: ColorTheme, categoryColor?: string): ColorPalette {
  switch (theme) {
    case 'black-and-white':
      return {
        textPrimary: '#000000',
        textSecondary: '#222222',
        textMuted: '#444444',
        bgCard: '#ffffff',
        borderCard: '#000000',
        accent: '#000000',
      };
    case 'grayscale':
      return {
        textPrimary: '#111111',
        textSecondary: '#444444',
        textMuted: '#777777',
        bgCard: '#f5f5f5',
        borderCard: '#cccccc',
        accent: '#555555',
      };
    case 'high-contrast':
      return {
        textPrimary: '#000000',
        textSecondary: '#000000',
        textMuted: '#222222',
        bgCard: '#ffffff',
        borderCard: '#000000',
        accent: '#0000ee',
      };
    case 'color':
    default:
      return {
        textPrimary: '#0f172a',
        textSecondary: '#475569',
        textMuted: '#64748b',
        bgCard: '#f8fafc',
        borderCard: '#cbd5e1',
        accent: categoryColor || '#3b82f6',
      };
  }
}
