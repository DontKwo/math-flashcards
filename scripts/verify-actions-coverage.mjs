import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

function findFiles(dir) {
  let results = [];
  const list = readdirSync(dir);
  for (const file of list) {
    const fullPath = join(dir, file);
    const stat = statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(findFiles(fullPath));
    } else if (file.endsWith('.tsx') || file.endsWith('.jsx')) {
      results.push(fullPath);
    }
  }
  return results;
}

function main() {
  const actionsJson = JSON.parse(readFileSync('tests/e2e/registry/actions.generated.json', 'utf-8'));
  const registeredTestIds = new Set(actionsJson.map((a) => a.testId));

  const files = findFiles('apps/app/src');
  const handlerRegex = /(onClick|onChange|onKeyDown|onFlip|onInsert)\s*=/g;
  const testIdRegex = /data-testid=["']([^"']+)["']/g;

  let totalHandlers = 0;
  const discoveredTestIds = new Set();

  for (const file of files) {
    const content = readFileSync(file, 'utf-8');
    const handlerMatches = content.match(handlerRegex);
    if (handlerMatches) {
      totalHandlers += handlerMatches.length;
    }

    let match;
    while ((match = testIdRegex.exec(content)) !== null) {
      discoveredTestIds.add(match[1]);
    }
  }

  console.log(`Discovered ${totalHandlers} interactive handlers across source.`);
  console.log(`Discovered ${discoveredTestIds.size} static data-testids in JSX.`);
  console.log(`Registered ${registeredTestIds.size} unique data-testids in actions.generated.json.`);

  const missingInRegistry = [];
  for (const tid of discoveredTestIds) {
    // Dynamic / conditional elements like empty state or confirmation buttons
    if (!registeredTestIds.has(tid) && tid !== 'empty-add-card-btn' && tid !== 'toast-undo-btn') {
      missingInRegistry.push(tid);
    }
  }

  if (missingInRegistry.length > 0) {
    console.error(`ERROR: The following data-testids have no registered action in actions.generated.json:`);
    console.error(missingInRegistry);
    process.exit(1);
  }

  console.log('Action coverage check passed successfully!');
}

main();
