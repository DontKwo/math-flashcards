import { describe, expect, it } from 'vitest';
import {
  DEFAULT_SETTINGS,
  resolveSettings,
  SettingsOverrides,
  SettingsSchema,
  SettingsValues,
} from './index';

describe('Settings resolution and provenance', () => {
  it('returns default settings and all default provenance when no overrides are given', () => {
    const res = resolveSettings();

    expect(res.settings).toEqual(DEFAULT_SETTINGS);

    const keys = Object.keys(DEFAULT_SETTINGS) as Array<keyof SettingsValues>;
    for (const key of keys) {
      expect(res.provenance[key]).toBe('default');
    }
  });

  it('handles empty override objects cleanly with default provenance', () => {
    const res = resolveSettings({}, {}, {});

    expect(res.settings).toEqual(DEFAULT_SETTINGS);
    const keys = Object.keys(DEFAULT_SETTINGS) as Array<keyof SettingsValues>;
    for (const key of keys) {
      expect(res.provenance[key]).toBe('default');
    }
  });

  it('applies app-level overrides and marks provenance as app', () => {
    const appOverrides: SettingsOverrides = {
      theme: 'dark',
      soundEnabled: false,
      roundSize: 10,
    };

    const res = resolveSettings(appOverrides);

    expect(res.settings.theme).toBe('dark');
    expect(res.provenance.theme).toBe('app');

    expect(res.settings.soundEnabled).toBe(false);
    expect(res.provenance.soundEnabled).toBe('app');

    expect(res.settings.roundSize).toBe(10);
    expect(res.provenance.roundSize).toBe('app');

    // Untouched settings remain default
    expect(res.settings.strictness).toBe(DEFAULT_SETTINGS.strictness);
    expect(res.provenance.strictness).toBe('default');
  });

  it('applies set-level overrides over app-level settings and defaults', () => {
    const appOverrides: SettingsOverrides = {
      theme: 'dark',
      directionPreference: 'back->front',
      strictness: 'lenient',
    };

    const setOverrides: SettingsOverrides = {
      directionPreference: 'both',
      strictness: 'strict',
      hapticsEnabled: false,
    };

    const res = resolveSettings(appOverrides, setOverrides);

    // set overrides app
    expect(res.settings.directionPreference).toBe('both');
    expect(res.provenance.directionPreference).toBe('set');

    expect(res.settings.strictness).toBe('strict');
    expect(res.provenance.strictness).toBe('set');

    // set overrides default
    expect(res.settings.hapticsEnabled).toBe(false);
    expect(res.provenance.hapticsEnabled).toBe('set');

    // app overrides default
    expect(res.settings.theme).toBe('dark');
    expect(res.provenance.theme).toBe('app');

    // untouched setting remains default
    expect(res.settings.roundSize).toBe(DEFAULT_SETTINGS.roundSize);
    expect(res.provenance.roundSize).toBe('default');
  });

  it('applies card-level overrides with highest priority over set, app, and default', () => {
    const appOverrides: SettingsOverrides = {
      theme: 'dark',
      strictness: 'lenient',
      accentsMatter: false,
      directionPreference: 'front->back',
    };

    const setOverrides: SettingsOverrides = {
      strictness: 'normal',
      accentsMatter: true,
      directionPreference: 'back->front',
      roundSize: 12,
    };

    const cardOverrides: SettingsOverrides = {
      strictness: 'strict',
      accentsMatter: false,
      mcOptionCount: 6,
    };

    const res = resolveSettings(appOverrides, setOverrides, cardOverrides);

    // card overrides set and app
    expect(res.settings.strictness).toBe('strict');
    expect(res.provenance.strictness).toBe('card');

    expect(res.settings.accentsMatter).toBe(false);
    expect(res.provenance.accentsMatter).toBe('card');

    // card overrides default
    expect(res.settings.mcOptionCount).toBe(6);
    expect(res.provenance.mcOptionCount).toBe('card');

    // set overrides app
    expect(res.settings.directionPreference).toBe('back->front');
    expect(res.provenance.directionPreference).toBe('set');

    // set overrides default
    expect(res.settings.roundSize).toBe(12);
    expect(res.provenance.roundSize).toBe('set');

    // app overrides default
    expect(res.settings.theme).toBe('dark');
    expect(res.provenance.theme).toBe('app');

    // default remains default
    expect(res.settings.fontSize).toBe('medium');
    expect(res.provenance.fontSize).toBe('default');
  });

  it('does not override when property is explicitly undefined', () => {
    const appOverrides: SettingsOverrides = {
      theme: 'amoled',
    };

    const setOverrides: SettingsOverrides = {
      theme: undefined,
      soundEnabled: undefined,
    };

    const cardOverrides: SettingsOverrides = {
      theme: undefined,
      soundEnabled: false,
    };

    const res = resolveSettings(appOverrides, setOverrides, cardOverrides);

    // card has undefined theme, set has undefined theme -> app theme 'amoled' wins
    expect(res.settings.theme).toBe('amoled');
    expect(res.provenance.theme).toBe('app');

    // card has false soundEnabled -> card wins
    expect(res.settings.soundEnabled).toBe(false);
    expect(res.provenance.soundEnabled).toBe('card');
  });

  it('fails validation when an invalid setting value is provided', () => {
    expect(() => {
      resolveSettings({
        theme: 'invalid-theme' as unknown as SettingsOverrides['theme'],
      });
    }).toThrow();

    expect(() => {
      resolveSettings(
        {},
        {
          roundSize: 100,
        }
      );
    }).toThrow();

    expect(() => {
      resolveSettings(
        {},
        {},
        {
          strictness: 'super-strict' as unknown as SettingsOverrides['strictness'],
        }
      );
    }).toThrow();
  });

  it('validates default settings against SettingsSchema', () => {
    expect(() => SettingsSchema.parse(DEFAULT_SETTINGS)).not.toThrow();
  });
});
