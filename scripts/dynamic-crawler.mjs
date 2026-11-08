import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';

async function main() {
  console.log('Starting preview server...');
  const server = spawn('pnpm', ['--filter', 'app', 'run', 'preview', '--port', '4173'], {
    stdio: 'inherit',
    detached: true,
  });

  // Wait for server to become responsive
  let ready = false;
  for (let i = 0; i < 20; i++) {
    try {
      const res = await fetch('http://localhost:4173');
      if (res.ok) {
        ready = true;
        break;
      }
    } catch {
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  if (!ready) {
    if (server.pid) {
      try { process.kill(-server.pid, 'SIGKILL'); } catch { /* ignore */ }
    }
    throw new Error('Server failed to start on port 4173');
  }

  console.log('Server ready. Launching headless browser...');
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:4173');

  const collectedActions = [];

  async function registerVisibleInteractiveElements(screenName, precondition) {
    const elements = await page.$$eval('[data-testid], button, input, select, textarea, [role="tab"], [role="option"], [role="button"]', (nodes) => {
      return nodes.map((el) => {
        const testId = el.getAttribute('data-testid') || '';
        const role = el.getAttribute('role') || el.tagName.toLowerCase();
        const label = el.getAttribute('aria-label') || el.innerText || el.getAttribute('title') || el.getAttribute('placeholder') || '';
        const tagName = el.tagName.toLowerCase();
        return { testId, role, label: label.trim().slice(0, 50), tagName };
      });
    });

    for (const el of elements) {
      if (!el.testId) continue;
      if (!collectedActions.find(a => a.testId === el.testId && a.screen === screenName)) {
        collectedActions.push({
          screen: screenName,
          testId: el.testId,
          role: el.role,
          label: el.label,
          preconditions: precondition,
          inputs: el.tagName === 'input' || el.tagName === 'textarea' || el.tagName === 'select' ? ['text', 'formula'] : [],
          expectedEffect: `Interacts with ${el.testId} on screen ${screenName}`
        });
      }
    }
  }

  // 1. Initial screen (Learn mode)
  await page.waitForSelector('[data-testid="mode-tab-learn"]');
  await registerVisibleInteractiveElements('learn', 'Main learn mode with sample deck');

  // Trigger reveal so verdict-continue-btn appears
  await page.click('[data-testid="learn-reveal-btn"]');
  await page.waitForSelector('[data-testid="verdict-continue-btn"]');
  await registerVisibleInteractiveElements('learn-verdict', 'Answer checked or revealed');
  await page.click('[data-testid="verdict-continue-btn"]');

  // 2. Study mode (Cards)
  await page.click('[data-testid="mode-tab-study"]');
  await page.waitForSelector('[data-testid="study-flip-btn"]');
  await registerVisibleInteractiveElements('study', 'Study flashcards mode');

  // 3. Analytics mode
  await page.click('[data-testid="mode-tab-analytics"]');
  await registerVisibleInteractiveElements('analytics', 'Analytics stats mode');

  // 4. Open Settings Modal
  await page.click('[data-testid="nav-settings-btn"]');
  await page.waitForSelector('[data-testid="settings-close-btn"]');
  await registerVisibleInteractiveElements('settings-modal', 'Settings dialog open');
  // click Reset... in Settings to reveal confirm
  await page.click('[data-testid="settings-reset-init-btn"]');
  await registerVisibleInteractiveElements('settings-modal', 'Settings reset confirmation state');
  await page.click('[data-testid="settings-reset-cancel-btn"]');
  await page.click('[data-testid="settings-done-btn"]');

  // 5. Open Deck Selector Modal
  await page.click('[data-testid="nav-decks-btn"]');
  await page.waitForSelector('[data-testid="set-selector-new-btn"]');
  await registerVisibleInteractiveElements('set-selector-modal', 'Deck selector modal open');
  // switch to new deck creation
  await page.click('[data-testid="set-selector-new-btn"]');
  await registerVisibleInteractiveElements('set-selector-modal', 'Deck creation form open');
  await page.click('[data-testid="set-create-back-btn"]');
  await page.click('[data-testid="set-selector-close-btn"]');

  // 6. Open Card Creator Modal
  await page.click('[data-testid="nav-add-card-btn"]');
  await page.waitForSelector('[data-testid="creator-title-input"]');
  await registerVisibleInteractiveElements('card-creator-modal', 'Single card creator mode');
  // switch to Bulk tab
  await page.click('[data-testid="creator-tab-bulk-btn"]');
  await registerVisibleInteractiveElements('card-creator-modal', 'Bulk paste creator mode');
  await page.click('[data-testid="creator-close-btn"]');

  await browser.close();

  if (server.pid) {
    try {
      process.kill(-server.pid, 'SIGKILL');
    } catch {
      // ignore
    }
  }

  mkdirSync('tests/e2e/registry', { recursive: true });
  writeFileSync('tests/e2e/registry/actions.generated.json', JSON.stringify(collectedActions, null, 2));
  console.log(`Discovered & generated ${collectedActions.length} dynamic actions!`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
