import React, { useState } from 'react';
import { Card, Button } from '../ui/index.ts';
import './screens.css';

export const SettingsScreen: React.FC = () => {
  const [accentsMatter, setAccentsMatter] = useState(true);
  const [greekVariantsEqual, setGreekVariantsEqual] = useState(true);
  const [allowSideSwap, setAllowSideSwap] = useState(true);
  const [saved, setSaved] = useState(false);

  const handleSave = (): void => {
    localStorage.setItem(
      'formulaflash_settings',
      JSON.stringify({ accentsMatter, greekVariantsEqual, allowSideSwap })
    );
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="screen-container">
      <div>
        <h1 className="screen-title">Settings</h1>
        <p className="screen-subtitle">
          Configure math checking strictness, appearance, and study behavior.
        </p>
      </div>

      <Card>
        <h3 className="home-card-title">Math Answer Checker</h3>

        <div className="editor-form">
          <label className="screen-header">
            <div>
              <span className="ui-field-label">Accents Matter</span>
              <p className="set-mode-desc">
                Distinguish decorated symbols (e.g. hat on rho vs plain rho).
              </p>
            </div>
            <input
              type="checkbox"
              checked={accentsMatter}
              onChange={(e) => setAccentsMatter(e.target.checked)}
              className="ui-checkbox"
            />
          </label>

          <label className="screen-header">
            <div>
              <span className="ui-field-label">Greek Variants Equal</span>
              <p className="set-mode-desc">
                Treat epsilon and varepsilon, phi and varphi as equivalent.
              </p>
            </div>
            <input
              type="checkbox"
              checked={greekVariantsEqual}
              onChange={(e) => setGreekVariantsEqual(e.target.checked)}
              className="ui-checkbox"
            />
          </label>

          <label className="screen-header">
            <div>
              <span className="ui-field-label">Allow Equation Side-Swap</span>
              <p className="set-mode-desc">
                Accept A = B when the reference formula is B = A.
              </p>
            </div>
            <input
              type="checkbox"
              checked={allowSideSwap}
              onChange={(e) => setAllowSideSwap(e.target.checked)}
              className="ui-checkbox"
            />
          </label>
        </div>

        <div className="set-actions">
          <Button variant="primary" onClick={handleSave} data-testid="settings-save-btn">
            Save Preferences
          </Button>
          {saved && <span className="set-mode-desc">Saved successfully!</span>}
        </div>
      </Card>
    </div>
  );
};
