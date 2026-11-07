import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

function getAllFiles(dirPath: string, extensions: string[]): string[] {
  let files: string[] = [];
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== 'dist' && entry.name !== 'build') {
        files = files.concat(getAllFiles(fullPath, extensions));
      }
    } else if (entry.isFile() && extensions.some((ext) => entry.name.endsWith(ext))) {
      files.push(fullPath);
    }
  }

  return files;
}

describe('Static Architectural & Design System Guards', () => {
  const srcDir = path.resolve(__dirname, '..');

  it('enforces ZERO raw inline style={{ in apps/app/src (excluding testing files)', () => {
    const sourceFiles = getAllFiles(srcDir, ['.tsx', '.ts']).filter(
      (f) => !f.includes('/testing/') && !f.includes('.test.')
    );

    const violations: { file: string; line: number; text: string }[] = [];

    for (const filePath of sourceFiles) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        // Check for style={{
        if (line.includes('style={{')) {
          violations.push({
            file: path.relative(srcDir, filePath),
            line: i + 1,
            text: line.trim(),
          });
        }
      }
    }

    if (violations.length > 0) {
      console.error('Style violations found:', violations);
    }
    expect(violations).toEqual([]);
  });

  it('enforces ZERO raw hex colors outside tokens.css', () => {
    const allFiles = getAllFiles(srcDir, ['.tsx', '.ts', '.css']).filter(
      (f) => !f.endsWith('tokens.css') && !f.includes('/testing/') && !f.includes('.test.')
    );

    const hexColorRegex = /#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/g;
    const violations: { file: string; line: number; match: string }[] = [];

    for (const filePath of allFiles) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        // Allow pure comment lines or SVG path hashes / URLs
        if (line.trim().startsWith('//') || line.trim().startsWith('/*')) continue;

        const matches = line.match(hexColorRegex);
        if (matches) {
          for (const match of matches) {
            // Ignore if it is #root (CSS selector)
            if (line.includes('#root')) continue;
            violations.push({
              file: path.relative(srcDir, filePath),
              line: i + 1,
              match,
            });
          }
        }
      }
    }

    if (violations.length > 0) {
      console.error('Raw hex color violations:', violations);
    }
    expect(violations).toEqual([]);
  });

  it('enforces data-testid attributes adhere to <screen>-<element> rule', () => {
    const sourceFiles = getAllFiles(srcDir, ['.tsx', '.ts']).filter(
      (f) => !f.includes('/testing/') && !f.includes('.test.')
    );

    const testIdRegex = /data-testid=["'`]([^"'`]+)["'`]/g;
    const namingConventionRegex = /^[a-z0-9]+-[a-z0-9-]+$/;
    const violations: { file: string; testId: string }[] = [];

    for (const filePath of sourceFiles) {
      const content = fs.readFileSync(filePath, 'utf-8');
      let match: RegExpExecArray | null;

      while ((match = testIdRegex.exec(content)) !== null) {
        const testId = match[1];
        // Allow dynamic interpolation expressions like ${s.id} or ${c.id} by normalizing
        const normalized = testId.replace(/\${[^}]+}/g, 'id');
        if (!namingConventionRegex.test(normalized)) {
          violations.push({
            file: path.relative(srcDir, filePath),
            testId,
          });
        }
      }
    }

    if (violations.length > 0) {
      console.error('data-testid format violations:', violations);
    }
    expect(violations).toEqual([]);
  });
});
