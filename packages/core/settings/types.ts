import { z } from 'zod';

export const StrictnessSchema = z.enum(['lenient', 'normal', 'strict']);
export type Strictness = z.infer<typeof StrictnessSchema>;

export const ThemeSchema = z.enum(['light', 'dark', 'amoled', 'system']);
export type Theme = z.infer<typeof ThemeSchema>;

export const FontSizeSchema = z.enum(['small', 'medium', 'large']);
export type FontSize = z.infer<typeof FontSizeSchema>;

export const MathSizeSchema = z.enum(['small', 'medium', 'large']);
export type MathSize = z.infer<typeof MathSizeSchema>;

export const CardDensitySchema = z.enum(['compact', 'comfortable']);
export type CardDensity = z.infer<typeof CardDensitySchema>;

export const DirectionPreferenceSchema = z.enum(['front->back', 'back->front', 'both']);
export type DirectionPreference = z.infer<typeof DirectionPreferenceSchema>;

export const DefaultInputModeSchema = z.enum(['math', 'text', 'latex']);
export type DefaultInputMode = z.infer<typeof DefaultInputModeSchema>;

export const SettingsSchema = z.object({
  // Appearance
  theme: ThemeSchema,
  fontSize: FontSizeSchema,
  mathSize: MathSizeSchema,
  cardDensity: CardDensitySchema,
  animations: z.boolean(),
  reducedMotion: z.boolean(),
  leftHandedLayout: z.boolean(),

  // Math entry
  defaultInputMode: DefaultInputModeSchema,
  showLatexToggle: z.boolean(),

  // Checking
  strictness: StrictnessSchema,
  accentsMatter: z.boolean(),
  allowSideSwap: z.boolean(),
  allowEquivalentForms: z.boolean(),
  samplingCount: z.number().int().positive(),
  samplingTolerance: z.number().positive(),
  requireSameVariables: z.boolean(),
  greekVariantsEqual: z.boolean(),
  textFuzzyThreshold: z.number().min(0).max(1),
  ignoreCase: z.boolean(),
  ignorePunctuation: z.boolean(),
  ignoreDiacritics: z.boolean(),

  // Learn & study options
  directionPreference: DirectionPreferenceSchema,
  roundSize: z.number().int().min(3).max(20),
  shuffle: z.boolean(),
  retypeAfterMiss: z.boolean(),
  proveItGate: z.boolean(),
  mcOptionCount: z.number().int().min(2).max(6),
  noneOfTheAboveRate: z.number().min(0).max(1),
  hintPenalty: z.boolean(),

  // Audio & haptics
  soundEnabled: z.boolean(),
  hapticsEnabled: z.boolean(),
  ttsEnabled: z.boolean(),

  // Notifications
  dailyReminderEnabled: z.boolean(),
});

export type SettingsValues = z.infer<typeof SettingsSchema>;

export const SettingsOverridesSchema = SettingsSchema.partial();
export type SettingsOverrides = z.infer<typeof SettingsOverridesSchema>;

export const DEFAULT_SETTINGS: SettingsValues = {
  // Appearance
  theme: 'system',
  fontSize: 'medium',
  mathSize: 'medium',
  cardDensity: 'comfortable',
  animations: true,
  reducedMotion: false,
  leftHandedLayout: false,

  // Math entry
  defaultInputMode: 'math',
  showLatexToggle: false,

  // Checking
  strictness: 'normal',
  accentsMatter: true,
  allowSideSwap: true,
  allowEquivalentForms: true,
  samplingCount: 24,
  samplingTolerance: 1e-9,
  requireSameVariables: true,
  greekVariantsEqual: true,
  textFuzzyThreshold: 0.8,
  ignoreCase: true,
  ignorePunctuation: true,
  ignoreDiacritics: false,

  // Learn & study options
  directionPreference: 'front->back',
  roundSize: 7,
  shuffle: true,
  retypeAfterMiss: true,
  proveItGate: true,
  mcOptionCount: 4,
  noneOfTheAboveRate: 0.1,
  hintPenalty: true,

  // Audio & haptics
  soundEnabled: true,
  hapticsEnabled: true,
  ttsEnabled: false,

  // Notifications
  dailyReminderEnabled: false,
};

export type SettingProvenance = 'app' | 'set' | 'card' | 'default';

export type SettingsProvenanceMap = Record<keyof SettingsValues, SettingProvenance>;

export interface ResolvedSettingsResult {
  settings: SettingsValues;
  provenance: SettingsProvenanceMap;
}
