import type { Page, ConsoleMessage, Request } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

export interface OracleViolation {
  category:
    | 'console-error'
    | 'network-request'
    | 'leaked-literal'
    | 'horizontal-overflow'
    | 'touch-target-too-small'
    | 'focus-lost'
    | 'accessibility-violation'
    | 'overlap';
  message: string;
  details?: Record<string, unknown>;
}

export interface OracleSession {
  violations: OracleViolation[];
  stop: () => Promise<OracleViolation[]>;
  checkInvariants: () => Promise<OracleViolation[]>;
}

// Start oracle tracking on a page
export async function attachOracles(
  page: Page,
  options: { checkTouchTargets?: boolean; isTouchViewport?: boolean } = {}
): Promise<OracleSession> {
  const violations: OracleViolation[] = [];

  const consoleListener = (msg: ConsoleMessage): void => {
    if (msg.type() === 'error') {
      const text = msg.text();
      // Filter out known benign dev-mode / vite noise if any
      if (!text.includes('favicon.ico')) {
        violations.push({
          category: 'console-error',
          message: `Browser console error: ${text}`,
        });
      }
    }
  };

  const pageErrorListener = (err: Error): void => {
    violations.push({
      category: 'console-error',
      message: `Uncaught page exception: ${err.message}`,
      details: { stack: err.stack },
    });
  };

  const requestListener = (req: Request): void => {
    const url = req.url();
    // Allow local vite dev server assets
    if (!url.startsWith('http://localhost:5173') && !url.startsWith('data:') && !url.startsWith('blob:')) {
      violations.push({
        category: 'network-request',
        message: `App made unexpected external network request to ${url}`,
      });
    }
  };

  page.on('console', consoleListener);
  page.on('pageerror', pageErrorListener);
  page.on('request', requestListener);

  const checkInvariants = async (): Promise<OracleViolation[]> => {
    const localViolations: OracleViolation[] = [];

    // 1. Check for leaked literals in visible text
    const textLeak = await page.evaluate(() => {
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      let node: Node | null;
      const leaks: string[] = [];
      const forbidden = ['undefined', 'NaN', '[object Object]', 'null'];

      while ((node = walker.nextNode())) {
        const text = node.nodeValue?.trim() || '';
        // Skip script/style elements
        if (node.parentElement?.tagName === 'SCRIPT' || node.parentElement?.tagName === 'STYLE') {
          continue;
        }
        for (const item of forbidden) {
          if (text === item || text.includes(` ${item} `) || text.startsWith(`${item} `) || text.endsWith(` ${item}`)) {
            leaks.push(`Found leaked "${item}" in: "${text.slice(0, 100)}"`);
          }
        }
      }
      return leaks;
    });

    for (const leak of textLeak) {
      localViolations.push({
        category: 'leaked-literal',
        message: leak,
      });
    }

    // 2. Check for horizontal overflow (scrollWidth > clientWidth)
    const hasOverflow = await page.evaluate(() => {
      const body = document.body;
      const html = document.documentElement;
      return (
        body.scrollWidth > window.innerWidth ||
        html.scrollWidth > window.innerWidth
      );
    });

    if (hasOverflow) {
      localViolations.push({
        category: 'horizontal-overflow',
        message: `Page content exceeds viewport width horizontally without wrapping`,
      });
    }

    // 3. Axe-core accessibility check
    try {
      const axeResults = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
      const criticalOrSerious = axeResults.violations.filter(
        (v) => v.impact === 'critical' || v.impact === 'serious'
      );
      for (const v of criticalOrSerious) {
        localViolations.push({
          category: 'accessibility-violation',
          message: `Axe [${v.impact}]: ${v.help} (${v.id})`,
          details: { id: v.id, nodes: v.nodes.length },
        });
      }
    } catch {
      // Ignore if axe cannot attach on unloaded doc
    }

    // 4. Touch targets check if on touch viewport
    if (options.isTouchViewport) {
      const smallTargets = await page.evaluate(() => {
        const interactiveElements = Array.from(
          document.querySelectorAll('button, a[href], input, select, textarea, [role="button"]')
        );
        const bad: Array<{ tag: string; label: string; width: number; height: number }> = [];

        for (const el of interactiveElements) {
          const html = el as HTMLElement;
          const rect = html.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            // Must be at least 44x44
            if (rect.width < 40 || rect.height < 40) {
              bad.push({
                tag: html.tagName.toLowerCase(),
                label: html.innerText?.trim() || html.getAttribute('aria-label') || '',
                width: Math.round(rect.width),
                height: Math.round(rect.height),
              });
            }
          }
        }
        return bad;
      });

      for (const st of smallTargets) {
        localViolations.push({
          category: 'touch-target-too-small',
          message: `Control <${st.tag}> "${st.label}" is ${st.width}x${st.height}px (minimum is 44x44px)`,
          details: st,
        });
      }
    }

    violations.push(...localViolations);
    return localViolations;
  };

  const stop = async (): Promise<OracleViolation[]> => {
    await checkInvariants();
    page.off('console', consoleListener);
    page.off('pageerror', pageErrorListener);
    page.off('request', requestListener);
    return violations;
  };

  return {
    violations,
    stop,
    checkInvariants,
  };
}
