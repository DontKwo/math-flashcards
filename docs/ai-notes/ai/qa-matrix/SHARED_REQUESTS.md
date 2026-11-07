# QA Matrix Requests for Foundation Lane

1. **Sidebar Collapse Button Test ID**:
   - `apps/app/src/shell/AppShell.tsx`: The toggle collapse button `<button aria-label="Collapse sidebar">` should have `data-testid="nav-sidebar-collapse"` according to the `<screen>-<element>` naming scheme.
2. **SetScreen Dropdown Menu Trigger Test ID**:
   - `apps/app/src/screens/SetScreen.tsx`: The dropdown menu trigger button `<Menu>` currently lacks a testid on the trigger button itself, e.g., `data-testid="set-options-menu-btn"`.
3. **Muted Text Color Contrast (WCAG AA)**:
   - Axe-core identified low color contrast on muted secondary labels (e.g. `color: var(--color-text-muted)` `#64748b` against dark card background `#1e293b`). Needs adjustment to `#94a3b8` or higher luminance in `apps/app/src/ui/tokens.css` to achieve 4.5:1 ratio.
