import React, { useState, useEffect, useRef } from 'react';
import { Card, Button, ConfirmDialog } from '../ui/index.ts';
import { MathDisplay } from '../components/MathDisplay.tsx';
import { useLibrary } from '../data/useLibrary.ts';
import type { CardSet, Card as CoreCard, CardProgress, StudySession } from '@formulaflash/core';
import './screens.css';

interface LibraryBackupBundle {
  version: 1;
  exportedAt: number;
  sets: CardSet[];
  cards: CoreCard[];
  progress: CardProgress[];
  sessions: StudySession[];
}

export const SettingsScreen: React.FC = () => {
  const { repository, init: reloadLibrary } = useLibrary();

  // Checker settings
  const [accentsMatter, setAccentsMatter] = useState(true);
  const [greekVariantsEqual, setGreekVariantsEqual] = useState(true);
  const [allowSideSwap, setAllowSideSwap] = useState(true);

  // Appearance settings
  const [theme, setTheme] = useState<'system' | 'dark' | 'light' | 'amoled'>('dark');
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>('medium');

  const [saved, setSaved] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load persisted settings
  useEffect(() => {
    try {
      const stored = localStorage.getItem('formulaflash_settings');
      if (stored) {
        const parsed = JSON.parse(stored) as Record<string, unknown>;
        if (typeof parsed.accentsMatter === 'boolean') setAccentsMatter(parsed.accentsMatter);
        if (typeof parsed.greekVariantsEqual === 'boolean') setGreekVariantsEqual(parsed.greekVariantsEqual);
        if (typeof parsed.allowSideSwap === 'boolean') setAllowSideSwap(parsed.allowSideSwap);
        if (typeof parsed.theme === 'string') setTheme(parsed.theme as typeof theme);
        if (typeof parsed.fontSize === 'string') setFontSize(parsed.fontSize as typeof fontSize);
      }
    } catch {
      // Ignore parsing errors
    }
  }, []);

  const handleSave = (): void => {
    const settings = {
      accentsMatter,
      greekVariantsEqual,
      allowSideSwap,
      theme,
      fontSize,
    };
    localStorage.setItem('formulaflash_settings', JSON.stringify(settings));

    // Apply theme
    document.documentElement.classList.remove('theme-light', 'theme-dark', 'theme-oled');
    if (theme === 'light') document.documentElement.classList.add('theme-light');
    else if (theme === 'amoled') document.documentElement.classList.add('theme-oled');
    else document.documentElement.classList.add('theme-dark');

    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  // Whole-library backup export
  const handleExportLibrary = async (): Promise<void> => {
    const allSets = await repository.listSets();
    const allCards: CoreCard[] = [];
    for (const s of allSets) {
      const cards = await repository.getCards(s.id);
      allCards.push(...cards);
    }
    const allProgress = await repository.listProgress();
    const allSessions = await repository.listSessions();

    const bundle: LibraryBackupBundle = {
      version: 1,
      exportedAt: Date.now(),
      sets: allSets,
      cards: allCards,
      progress: allProgress,
      sessions: allSessions,
    };

    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `formulaflash-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Whole-library restore import
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as LibraryBackupBundle;

      if (!parsed.sets || !Array.isArray(parsed.sets)) {
        alert('Invalid backup file: missing sets array');
        return;
      }

      // Restore into repository
      for (const s of parsed.sets) {
        await repository.saveSet(s);
      }
      if (parsed.cards) {
        for (const c of parsed.cards) {
          await repository.saveCard(c);
        }
      }
      if (parsed.progress) {
        for (const p of parsed.progress) {
          await repository.saveProgress(p);
        }
      }
      if (parsed.sessions) {
        for (const sess of parsed.sessions) {
          await repository.saveSession(sess);
        }
      }

      await reloadLibrary();
      alert(`Restored ${parsed.sets.length} sets and ${parsed.cards?.length || 0} cards successfully!`);
    } catch (err) {
      alert(`Failed to restore backup: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Reset entire library
  const handleResetLibrary = async (): Promise<void> => {
    const allSets = await repository.listSets();
    for (const s of allSets) {
      await repository.deleteSet(s.id);
    }
    localStorage.removeItem('formulaflash_settings');
    await reloadLibrary();
    setShowResetConfirm(false);
  };

  return (
    <div className="screen-container">
      <div>
        <h1 className="screen-title">Settings</h1>
        <p className="screen-subtitle">
          Configure math checking strictness, appearance, and manage library backups.
        </p>
      </div>

      {/* Math Answer Checker Card */}
      <Card>
        <h3 className="home-card-title">Math Answer Checker</h3>
        <p className="set-mode-desc">
          Controls how intelligent formula equivalence behaves during study sessions.
        </p>

        <div className="editor-form">
          {/* Option: Accents Matter */}
          <div className="study-setting-row">
            <div>
              <span className="ui-field-label">Accents Matter</span>
              <p className="set-mode-desc">
                Distinguishes decorated symbols: <MathDisplay latex="\hat{\rho}" display={false} /> vs{' '}
                <MathDisplay latex="\rho" display={false} /> are treated as different variables.
              </p>
              <div className="set-card-math-box">
                <span className="set-mode-desc">Example: </span>
                <MathDisplay latex="P = \hat{\rho} R T" display={false} />
                <span className="set-mode-desc">
                  {' '}
                  {accentsMatter ? '≠' : '='}{' '}
                </span>
                <MathDisplay latex="P = \rho R T" display={false} />
              </div>
            </div>
            <input
              type="checkbox"
              checked={accentsMatter}
              onChange={(e) => setAccentsMatter(e.target.checked)}
              className="ui-checkbox"
              data-testid="settings-toggle-accents"
            />
          </div>

          {/* Option: Greek Variants Equal */}
          <div className="study-setting-row">
            <div>
              <span className="ui-field-label">Greek Variants Equal</span>
              <p className="set-mode-desc">
                Treats variant glyphs as identical: <MathDisplay latex="\epsilon \equiv \varepsilon" display={false} /> and{' '}
                <MathDisplay latex="\phi \equiv \varphi" display={false} />.
              </p>
              <div className="set-card-math-box">
                <span className="set-mode-desc">Example: </span>
                <MathDisplay latex="\epsilon_0" display={false} />
                <span className="set-mode-desc">
                  {' '}
                  {greekVariantsEqual ? '=' : '≠'}{' '}
                </span>
                <MathDisplay latex="\varepsilon_0" display={false} />
              </div>
            </div>
            <input
              type="checkbox"
              checked={greekVariantsEqual}
              onChange={(e) => setGreekVariantsEqual(e.target.checked)}
              className="ui-checkbox"
              data-testid="settings-toggle-greek"
            />
          </div>

          {/* Option: Allow Side Swap */}
          <div className="study-setting-row">
            <div>
              <span className="ui-field-label">Allow Equation Side-Swap</span>
              <p className="set-mode-desc">
                Accepts commutative equation equality: <MathDisplay latex="A = B" display={false} /> equals{' '}
                <MathDisplay latex="B = A" display={false} />.
              </p>
              <div className="set-card-math-box">
                <span className="set-mode-desc">Example: </span>
                <MathDisplay latex="nRT = PV" display={false} />
                <span className="set-mode-desc">
                  {' '}
                  {allowSideSwap ? '=' : '≠'}{' '}
                </span>
                <MathDisplay latex="PV = nRT" display={false} />
              </div>
            </div>
            <input
              type="checkbox"
              checked={allowSideSwap}
              onChange={(e) => setAllowSideSwap(e.target.checked)}
              className="ui-checkbox"
              data-testid="settings-toggle-sideswap"
            />
          </div>
        </div>
      </Card>

      {/* Appearance & Themes */}
      <Card>
        <h3 className="home-card-title">Appearance & Display</h3>

        <div className="editor-form">
          <div className="study-setting-row">
            <div>
              <span className="ui-field-label">Color Theme</span>
              <p className="set-mode-desc">Choose between dark slate, light, or pure OLED black.</p>
            </div>
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value as typeof theme)}
              className="ui-input"
              data-testid="settings-select-theme"
            >
              <option value="dark">Dark Slate</option>
              <option value="light">Light</option>
              <option value="amoled">OLED Black</option>
            </select>
          </div>

          <div className="study-setting-row">
            <div>
              <span className="ui-field-label">Font & Equation Sizing</span>
              <p className="set-mode-desc">Adjust UI scaling for comfortable readability.</p>
            </div>
            <select
              value={fontSize}
              onChange={(e) => setFontSize(e.target.value as typeof fontSize)}
              className="ui-input"
              data-testid="settings-select-size"
            >
              <option value="small">Compact</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
            </select>
          </div>
        </div>

        <div className="set-actions">
          <Button variant="primary" onClick={handleSave} data-testid="settings-save-btn">
            Save Preferences
          </Button>
          {saved && <span className="set-mode-desc">Preferences saved successfully!</span>}
        </div>
      </Card>

      {/* Data Backup & Restore */}
      <Card>
        <h3 className="home-card-title">Data Backup & Library Management</h3>
        <p className="set-mode-desc">
          Export your entire library, cards, progress, and study sessions to a backup file, or restore.
        </p>

        <input
          type="file"
          ref={fileInputRef}
          accept=".json"
          onChange={(e) => {
            void handleFileSelect(e);
          }}
          className="display-none"
          data-testid="settings-file-input"
        />

        <div className="set-actions">
          <Button
            variant="secondary"
            onClick={() => {
              void handleExportLibrary();
            }}
            data-testid="settings-export-btn"
          >
            Export Backup (.json)
          </Button>
          <Button
            variant="secondary"
            onClick={() => fileInputRef.current?.click()}
            data-testid="settings-import-btn"
          >
            Restore Backup
          </Button>
          <Button
            variant="danger"
            onClick={() => setShowResetConfirm(true)}
            data-testid="settings-reset-btn"
          >
            Reset All Data
          </Button>
        </div>
      </Card>

      <ConfirmDialog
        isOpen={showResetConfirm}
        title="Reset All Data"
        message="Are you sure you want to delete all decks, flashcards, progress, and history? This cannot be undone."
        confirmLabel="Reset Everything"
        isDestructive
        onConfirm={() => {
          void handleResetLibrary();
        }}
        onCancel={() => setShowResetConfirm(false)}
        data-testid="settings-reset-dialog"
      />
    </div>
  );
};
