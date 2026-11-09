import { z } from 'zod';

export const PageSizeNameSchema = z.enum(['A4', 'Letter', 'A5', 'Legal', 'custom']);
export type PageSizeName = z.infer<typeof PageSizeNameSchema>;

export const PageOrientationSchema = z.enum(['portrait', 'landscape']);
export type PageOrientation = z.infer<typeof PageOrientationSchema>;

export const MarginPresetSchema = z.enum(['narrow', 'normal', 'wide', 'custom']);
export type MarginPreset = z.infer<typeof MarginPresetSchema>;

export const MarginsSchema = z.object({
  top: z.number().min(0),
  right: z.number().min(0),
  bottom: z.number().min(0),
  left: z.number().min(0),
});
export type Margins = z.infer<typeof MarginsSchema>;

export const FillOrderSchema = z.enum(['down-columns', 'across-rows']);
export type FillOrder = z.infer<typeof FillOrderSchema>;

export const ContainerStyleSchema = z.enum(['boxed', 'ruled', 'shaded', 'plain']);
export type ContainerStyle = z.infer<typeof ContainerStyleSchema>;

export const CardLayoutModeSchema = z.enum(['formula-only', 'prompt-and-formula', 'answer-key']);
export type CardLayoutMode = z.infer<typeof CardLayoutModeSchema>;

export const TermsDisplayModeSchema = z.enum(['compact-inline', 'table', 'footnote', 'none']);
export type TermsDisplayMode = z.infer<typeof TermsDisplayModeSchema>;

export const ColorThemeSchema = z.enum(['color', 'grayscale', 'black-and-white', 'high-contrast']);
export type ColorTheme = z.infer<typeof ColorThemeSchema>;

export const FontFamilySchema = z.enum(['Helvetica', 'Times', 'Courier']);
export type FontFamily = z.infer<typeof FontFamilySchema>;

export const CardSortOrderSchema = z.enum([
  'original',
  'alphabetical',
  'category',
  'difficulty',
  'mastery',
  'shuffled',
]);
export type CardSortOrder = z.infer<typeof CardSortOrderSchema>;

export const CardOverrideSchema = z.object({
  cardId: z.string(),
  customTitle: z.string().optional(),
  replacementPrompt: z.string().optional(),
  replacementFormula: z.string().optional(),
  hideHint: z.boolean().optional(),
  showTerms: z.boolean().optional(),
  note: z.string().optional(),
  fontSizeOverride: z.number().positive().optional(),
  spanAllColumns: z.boolean().optional(),
  pageBreakBefore: z.boolean().optional(),
  keepTogether: z.boolean().optional(),
});
export type CardOverride = z.infer<typeof CardOverrideSchema>;

export const ExportOptionsSchema = z.object({
  pageSize: PageSizeNameSchema.default('A4'),
  customPageDimensions: z
    .object({
      width: z.number().positive(),
      height: z.number().positive(),
    })
    .optional(),
  orientation: PageOrientationSchema.default('portrait'),
  marginPreset: MarginPresetSchema.default('normal'),
  customMargins: MarginsSchema.optional(),
  columns: z.number().int().min(1).max(6).default(2),
  columnGap: z.number().min(0).default(12),
  rowGap: z.number().min(0).default(10),
  fillOrder: FillOrderSchema.default('down-columns'),
  containerStyle: ContainerStyleSchema.default('boxed'),
  keepCardsTogether: z.boolean().default(true),
  groupByCategory: z.boolean().default(false),
  fitToPageCount: z.number().int().positive().optional(),

  // Content toggles
  showCardTitle: z.boolean().default(true),
  showCardNumber: z.boolean().default(true),
  showPrompt: z.boolean().default(true),
  showFormula: z.boolean().default(true),
  showHint: z.boolean().default(false),
  termsMode: TermsDisplayModeSchema.default('compact-inline'),
  termsFilter: z.enum(['all', 'only-with-units', 'exclude-undefined']).default('all'),
  showUnits: z.boolean().default(true),
  showNotes: z.boolean().default(true),
  showCategoryLabel: z.boolean().default(false),
  showTagLabels: z.boolean().default(false),
  showSource: z.boolean().default(false),
  cardLayoutMode: CardLayoutModeSchema.default('prompt-and-formula'),
  includeGlossaryAppendix: z.boolean().default(false),
  includeTableOfContents: z.boolean().default(false),
  generatePdfBookmarks: z.boolean().default(true),

  // Header & Footer
  headerText: z.string().default('{setName}'),
  footerCustomText: z.string().default('Generated with Formula Flash'),
  showDateInHeader: z.boolean().default(true),
  showPageNumbers: z.boolean().default(true),

  // Style
  fontFamily: FontFamilySchema.default('Helvetica'),
  titleFontSize: z.number().positive().default(10),
  bodyFontSize: z.number().positive().default(8.5),
  formulaFontSize: z.number().positive().default(10),
  hintFontSize: z.number().positive().default(7.5),
  termsFontSize: z.number().positive().default(7.5),
  globalScale: z.number().positive().default(1.0),
  formulaScale: z.number().positive().default(1.0),
  lineSpacing: z.number().positive().default(1.2),
  colorTheme: ColorThemeSchema.default('color'),
  useCategoryColors: z.boolean().default(true),
  borderRadius: z.number().min(0).default(4),
  ruleWeight: z.number().min(0.25).default(0.75),

  // Sort & selection
  sortOrder: CardSortOrderSchema.default('original'),
  selectedCardIds: z.array(z.string()).default([]),
  cardOverrides: z.record(CardOverrideSchema).default({}),
});
export type ExportOptions = z.infer<typeof ExportOptionsSchema>;

export const ExportPresetSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  description: z.string().optional(),
  version: z.number().int().default(1),
  createdAt: z.number(),
  updatedAt: z.number(),
  isBuiltIn: z.boolean().optional(),
  options: ExportOptionsSchema,
});
export type ExportPreset = z.infer<typeof ExportPresetSchema>;

// ---------- Page Model Types ----------
export interface Point {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type TextRunStyle = 'regular' | 'bold' | 'italic' | 'code';

export interface TextRun {
  type: 'text';
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  fontFamily: FontFamily;
  style: TextRunStyle;
  color: string;
}

export interface FormulaBlock {
  type: 'formula';
  latex: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  altText?: string;
  failed?: boolean;
}

export interface BoxItem {
  id: string;
  type: 'card' | 'category-header' | 'appendix-item' | 'toc-item';
  rect: Rect;
  cardId?: string;
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  runs: TextRun[];
  formulas: FormulaBlock[];
  warning?: string;
}

export interface PageHeaderFooter {
  headerLeft?: string;
  headerRight?: string;
  footerLeft?: string;
  footerRight?: string;
  lineY?: number;
}

export interface PageModel {
  pageNumber: number;
  totalPages: number;
  width: number;
  height: number;
  margins: Margins;
  boxes: BoxItem[];
  headerFooter: PageHeaderFooter;
}

export interface DocumentModel {
  id: string;
  title: string;
  author: string;
  subject?: string;
  keywords?: string[];
  options: ExportOptions;
  pages: PageModel[];
  bookmarks: Array<{ title: string; pageNumber: number; level: number }>;
  warnings: string[];
}
