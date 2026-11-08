import React, { useState, useEffect } from 'react';

export type TermDefinitionsSetting = 'off' | 'on-request' | 'after-answer' | 'hint-before-answer';

export interface AppSettings {
  accentsMatter: boolean;
  greekVariantsEqual: boolean;
  allowSideSwap: boolean;
  theme: 'dark' | 'light' | 'system';
  termDefinitionsMode: TermDefinitionsSetting;
}

export const DEFAULT_SETTINGS: AppSettings = {
  accentsMatter: true,
  greekVariantsEqual: true,
  allowSideSwap: true,
  theme: 'dark',
  termDefinitionsMode: 'on-request',
};

const STORAGE_KEY = 'formulaflash_settings';

export const loadSettings = (): AppSettings => {
  const data = localStorage.getItem(STORAGE_KEY);
  if (data) {
    try {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
    } catch {
      return DEFAULT_SETTINGS;
    }
  }
  return DEFAULT_SETTINGS;
};

export const saveSettings = (settings: AppSettings): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
};

export const applyTheme = (theme: AppSettings['theme']): void => {
  const root = document.documentElement;
  if (theme === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
  } else {
    root.setAttribute('data-theme', theme);
  }
};

export interface SettingsModalProps {
  currentSettings: AppSettings;
  onSave: (settings: AppSettings) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ currentSettings, onSave, onClose }) => {
  const [settings, setSettings] = useState<AppSettings>(currentSettings);
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleToggle = (key: keyof Omit<AppSettings, 'theme' | 'termDefinitionsMode'>): void => {
    const nextSettings: AppSettings = {
      ...settings,
      [key]: !settings[key],
    };
    setSettings(nextSettings);
    saveSettings(nextSettings);
    onSave(nextSettings);
  };

  const handleThemeChange = (newTheme: AppSettings['theme']): void => {
    const nextSettings: AppSettings = {
      ...settings,
      theme: newTheme,
    };
    setSettings(nextSettings);
    saveSettings(nextSettings);
    applyTheme(newTheme);
    onSave(nextSettings);
  };

  const handleTermDefinitionsChange = (mode: TermDefinitionsSetting): void => {
    const nextSettings: AppSettings = {
      ...settings,
      termDefinitionsMode: mode,
    };
    setSettings(nextSettings);
    saveSettings(nextSettings);
    onSave(nextSettings);
  };

  const handleResetToDefaults = (): void => {
    setSettings(DEFAULT_SETTINGS);
    saveSettings(DEFAULT_SETTINGS);
    applyTheme(DEFAULT_SETTINGS.theme);
    onSave(DEFAULT_SETTINGS);
    setShowConfirmReset(false);
  };

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-dialog-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-content">
        <div className="modal-header">
          <h2 id="settings-dialog-title" className="modal-title">
            Settings
          </h2>
          <button
            type="button"
            data-testid="settings-close-btn"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close Settings dialog"
          >
            ×
          </button>
        </div>

        <div className="settings-section">
          <span className="settings-section-title">Term Definitions</span>
          <div className="settings-group">
            <div className="settings-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
              <div className="settings-label-group">
                <span className="settings-label">Equation Term Definitions Mode</span>
                <span className="settings-desc">Choose when symbol definitions and interactive formulas appear while studying.</span>
              </div>
              <div className="segmented-control" role="group" aria-label="Term Definitions Mode" style={{ width: '100%' }}>
                <button
                  type="button"
                  data-testid="settings-terms-off-btn"
                  className={`segmented-btn ${settings.termDefinitionsMode === 'off' ? 'active' : ''}`}
                  onClick={() => handleTermDefinitionsChange('off')}
                  aria-pressed={settings.termDefinitionsMode === 'off'}
                  style={{ fontSize: '12px' }}
                >
                  Off
                </button>
                <button
                  type="button"
                  data-testid="settings-terms-on-request-btn"
                  className={`segmented-btn ${settings.termDefinitionsMode === 'on-request' ? 'active' : ''}`}
                  onClick={() => handleTermDefinitionsChange('on-request')}
                  aria-pressed={settings.termDefinitionsMode === 'on-request'}
                  style={{ fontSize: '12px' }}
                >
                  On request
                </button>
                <button
                  type="button"
                  data-testid="settings-terms-after-answer-btn"
                  className={`segmented-btn ${settings.termDefinitionsMode === 'after-answer' ? 'active' : ''}`}
                  onClick={() => handleTermDefinitionsChange('after-answer')}
                  aria-pressed={settings.termDefinitionsMode === 'after-answer'}
                  style={{ fontSize: '12px' }}
                >
                  After answer
                </button>
                <button
                  type="button"
                  data-testid="settings-terms-hint-btn"
                  className={`segmented-btn ${settings.termDefinitionsMode === 'hint-before-answer' ? 'active' : ''}`}
                  onClick={() => handleTermDefinitionsChange('hint-before-answer')}
                  aria-pressed={settings.termDefinitionsMode === 'hint-before-answer'}
                  style={{ fontSize: '12px' }}
                >
                  Hint before
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="settings-section">
          <span className="settings-section-title">Math & Answer Checking</span>
          <div className="settings-group">
            <div className="settings-row">
              <div className="settings-label-group">
                <label htmlFor="accents-matter" className="settings-label">
                  Accents & Decorations Matter
                </label>
                <span className="settings-desc">
                  Distinguish accented symbols (e.g. \hat&#123;R&#125; vs R). When enabled, rho-hat ≠ rho.
                </span>
              </div>
              <label className="switch">
                <input
                  id="accents-matter"
                  data-testid="settings-accents-switch"
                  type="checkbox"
                  checked={settings.accentsMatter}
                  onChange={() => handleToggle('accentsMatter')}
                />
                <span className="switch-slider" />
              </label>
            </div>

            <div className="settings-row">
              <div className="settings-label-group">
                <label htmlFor="greek-variants" className="settings-label">
                  Greek Variants Equal
                </label>
                <span className="settings-desc">
                  Treat equivalent glyph variants as identical (e.g. \epsilon = \varepsilon, \phi = \varphi).
                </span>
              </div>
              <label className="switch">
                <input
                  id="greek-variants"
                  data-testid="settings-greek-switch"
                  type="checkbox"
                  checked={settings.greekVariantsEqual}
                  onChange={() => handleToggle('greekVariantsEqual')}
                />
                <span className="switch-slider" />
              </label>
            </div>

            <div className="settings-row">
              <div className="settings-label-group">
                <label htmlFor="side-swap" className="settings-label">
                  Allow Equation Side-Swap
                </label>
                <span className="settings-desc">
                  Accept equations with swapped sides (e.g. accept nRT = PV for PV = nRT).
                </span>
              </div>
              <label className="switch">
                <input
                  id="side-swap"
                  data-testid="settings-sideswap-switch"
                  type="checkbox"
                  checked={settings.allowSideSwap}
                  onChange={() => handleToggle('allowSideSwap')}
                />
                <span className="switch-slider" />
              </label>
            </div>
          </div>
        </div>

        <div className="settings-section">
          <span className="settings-section-title">Appearance & Theme</span>
          <div className="settings-group">
            <div className="settings-row">
              <div className="settings-label-group">
                <span className="settings-label">Theme Mode</span>
                <span className="settings-desc">Choose between dark slate, light, or follow system theme.</span>
              </div>
              <div className="segmented-control" role="group" aria-label="Theme Mode Selection">
                <button
                  type="button"
                  data-testid="settings-theme-dark-btn"
                  className={`segmented-btn ${settings.theme === 'dark' ? 'active' : ''}`}
                  onClick={() => handleThemeChange('dark')}
                  aria-pressed={settings.theme === 'dark'}
                >
                  Dark
                </button>
                <button
                  type="button"
                  data-testid="settings-theme-light-btn"
                  className={`segmented-btn ${settings.theme === 'light' ? 'active' : ''}`}
                  onClick={() => handleThemeChange('light')}
                  aria-pressed={settings.theme === 'light'}
                >
                  Light
                </button>
                <button
                  type="button"
                  data-testid="settings-theme-system-btn"
                  className={`segmented-btn ${settings.theme === 'system' ? 'active' : ''}`}
                  onClick={() => handleThemeChange('system')}
                  aria-pressed={settings.theme === 'system'}
                >
                  System
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="settings-section">
          <span className="settings-section-title">Maintenance</span>
          <div className="settings-group">
            <div className="settings-row">
              <div className="settings-label-group">
                <span className="settings-label">Reset to Defaults</span>
                <span className="settings-desc">Restore checking parameters and theme to original factory values.</span>
              </div>
              {!showConfirmReset ? (
                <button
                  type="button"
                  data-testid="settings-reset-init-btn"
                  className="btn-secondary"
                  style={{ minWidth: '100px', flex: 'none', height: '40px', minHeight: '40px' }}
                  onClick={() => setShowConfirmReset(true)}
                >
                  Reset...
                </button>
              ) : (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    data-testid="settings-reset-confirm-btn"
                    className="btn-danger"
                    style={{ minWidth: '90px', flex: 'none', height: '40px', minHeight: '40px' }}
                    onClick={handleResetToDefaults}
                  >
                    Confirm
                  </button>
                  <button
                    type="button"
                    data-testid="settings-reset-cancel-btn"
                    className="btn-secondary"
                    style={{ minWidth: '70px', flex: 'none', height: '40px', minHeight: '40px' }}
                    onClick={() => setShowConfirmReset(false)}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="modal-actions">
          <button
            type="button"
            data-testid="settings-done-btn"
            className="btn-primary"
            onClick={onClose}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
