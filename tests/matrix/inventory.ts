import type { Page } from '@playwright/test';

export interface DiscoveredControl {
  route: string;
  testId?: string;
  role: string;
  accessibleName?: string;
  tag: string;
  type?: string;
  selector: string;
  visible: boolean;
  boundingBox?: { x: number; y: number; width: number; height: number } | null;
}

export interface InventoryResult {
  timestamp: string;
  routes: string[];
  controls: DiscoveredControl[];
  violations: Array<{
    route: string;
    description: string;
    selector: string;
    htmlSnippet: string;
  }>;
}

// Extract interactive controls visible on current page
export async function scanPageControls(page: Page, route: string): Promise<{
  controls: DiscoveredControl[];
  violations: InventoryResult['violations'];
}> {
  return await page.evaluate((currentRoute) => {
    const controls: DiscoveredControl[] = [];
    const violations: Array<{ route: string; description: string; selector: string; htmlSnippet: string }> = [];

    // All interactive candidate elements
    const elements = Array.from(
      document.querySelectorAll(
        'button, a[href], input, textarea, select, math-field, [role="button"], [role="tab"], [role="menuitem"], [role="checkbox"], [role="switch"]'
      )
    );

    for (const el of elements) {
      const htmlEl = el as HTMLElement;
      // Check visibility
      const style = window.getComputedStyle(htmlEl);
      const isVisible =
        style.display !== 'none' &&
        style.visibility !== 'hidden' &&
        style.opacity !== '0' &&
        htmlEl.offsetWidth > 0 &&
        htmlEl.offsetHeight > 0;

      if (!isVisible) continue;

      const rect = htmlEl.getBoundingClientRect();
      const testId = htmlEl.getAttribute('data-testid') || undefined;
      const role =
        htmlEl.getAttribute('role') ||
        (htmlEl.tagName.toLowerCase() === 'math-field'
          ? 'math-field'
          : htmlEl.tagName.toLowerCase());
      const accessibleName =
        htmlEl.getAttribute('aria-label') ||
        htmlEl.getAttribute('placeholder') ||
        htmlEl.innerText?.trim().slice(0, 50) ||
        htmlEl.getAttribute('title') ||
        undefined;

      const selector = testId
        ? `[data-testid="${testId}"]`
        : htmlEl.id
        ? `#${htmlEl.id}`
        : `${htmlEl.tagName.toLowerCase()}${accessibleName ? `[aria-label="${accessibleName}"]` : ''}`;

      controls.push({
        route: currentRoute,
        testId,
        role,
        accessibleName,
        tag: htmlEl.tagName.toLowerCase(),
        type: htmlEl.getAttribute('type') || undefined,
        selector,
        visible: isVisible,
        boundingBox: {
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        },
      });

      // Verification checks
      const htmlSnippet = htmlEl.outerHTML.slice(0, 150);
      if (!testId) {
        violations.push({
          route: currentRoute,
          description: 'Interactive control is missing data-testid',
          selector,
          htmlSnippet,
        });
      } else if (!/^[a-z0-9]+(-[a-z0-9]+)+$/.test(testId)) {
        violations.push({
          route: currentRoute,
          description: `data-testid="${testId}" does not follow <screen>-<element> naming standard`,
          selector,
          htmlSnippet,
        });
      }

      if (!accessibleName && role !== 'math-field') {
        violations.push({
          route: currentRoute,
          description: 'Interactive control lacks accessible name or label',
          selector,
          htmlSnippet,
        });
      }
    }

    return { controls, violations };
  }, route);
}
