import React, { useState } from 'react';
import { useTheme, type Theme } from '../context/ThemeContext.tsx';

export interface AppSettings {
  accentsMatter: boolean;
  greekVariantsEqual: boolean;
  allowSideSwap: boolean;
}

const DEFAULT_SETTINGS: AppSettings = {
  accentsMatter: true,
  greekVariantsEqual: true,
  allowSideSwap: true,
};

export const loadSettings = (): AppSettings => {
  const data = localStorage.getItem('formulaflash_settings');
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
  localStorage.setItem('formulaflash_settings', JSON.stringify(settings));
};

export interface SettingsModalProps {
  currentSettings: AppSettings;
  onSave: (settings: AppSettings) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ currentSettings, onSave, onClose }) => {
  const [settings, setSettings] = useState<AppSettings>(currentSettings);
  const { theme, setTheme } = useTheme();

  const handleToggle = (key: keyof AppSettings): void => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = (): void => {
    saveSettings(settings);
    onSave(settings);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 className="modal-title">Settings</h2>

        <div className="settings-list">
          <div className="settings-item">
            <label htmlFor="theme-select">Theme</label>
            <select
              id="theme-select"
              value={theme}
              onChange={(e) => setTheme(e.target.value as Theme)}
              style={{ padding: '4px', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
            >
              <option value="system">System</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="oled">OLED Black</option>
            </select>
          </div>

          <div className="settings-item">
            <label htmlFor="accents-matter">Accents Matter</label>
            <input
              id="accents-matter"
              type="checkbox"
              checked={settings.accentsMatter}
              onChange={() => handleToggle('accentsMatter')}
            />
          </div>

          <div className="settings-item">
            <label htmlFor="greek-variants">Greek Variants Equal</label>
            <input
              id="greek-variants"
              type="checkbox"
              checked={settings.greekVariantsEqual}
              onChange={() => handleToggle('greekVariantsEqual')}
            />
          </div>

          <div className="settings-item">
            <label htmlFor="side-swap">Allow Equation Side-Swap</label>
            <input
              id="side-swap"
              type="checkbox"
              checked={settings.allowSideSwap}
              onChange={() => handleToggle('allowSideSwap')}
            />
          </div>
        </div>

        <div className="modal-actions" style={{ marginTop: '24px' }}>
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn-primary" onClick={handleSave}>
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};
