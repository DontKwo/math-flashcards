import {
  DEFAULT_SETTINGS,
  type ResolvedSettingsResult,
  type SettingsOverrides,
  type SettingsProvenanceMap,
  SettingsSchema,
  type SettingsValues,
} from './types.js';

export * from './types.js';

/**
 * Resolves settings across layers (card overrides > set overrides > app settings > default)
 * and returns the final resolved settings along with provenance for each setting key.
 */
export function resolveSettings(
  appSettings?: SettingsOverrides,
  setOverrides?: SettingsOverrides,
  cardOverrides?: SettingsOverrides
): ResolvedSettingsResult {
  const keys = Object.keys(DEFAULT_SETTINGS) as Array<keyof SettingsValues>;
  const resolvedValues: Partial<SettingsValues> = {};
  const provenance: Partial<SettingsProvenanceMap> = {};

  for (const key of keys) {
    if (cardOverrides && cardOverrides[key] !== undefined) {
      resolvedValues[key] = cardOverrides[key] as never;
      provenance[key] = 'card';
    } else if (setOverrides && setOverrides[key] !== undefined) {
      resolvedValues[key] = setOverrides[key] as never;
      provenance[key] = 'set';
    } else if (appSettings && appSettings[key] !== undefined) {
      resolvedValues[key] = appSettings[key] as never;
      provenance[key] = 'app';
    } else {
      resolvedValues[key] = DEFAULT_SETTINGS[key] as never;
      provenance[key] = 'default';
    }
  }

  // Validate the resolved settings against the Zod schema
  const validatedSettings = SettingsSchema.parse(resolvedValues);

  return {
    settings: validatedSettings,
    provenance: provenance as SettingsProvenanceMap,
  };
}
