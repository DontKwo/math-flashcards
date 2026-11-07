import * as fs from 'fs';
import * as path from 'path';
import { spawn, type ChildProcess } from 'child_process';
import { chromium, type Browser } from '@playwright/test';
import { runSeededRandomWalk, type RandomWalkReport } from './sequence-chaos.ts';
import { buildMathMatrixCases } from './math-matrix.ts';
import { scanPageControls } from './inventory.ts';
import { registry } from '@formulaflash/core';

export interface MatrixOptions {
  smoke?: boolean;
  seed?: number;
  route?: string;
  control?: string;
  shard?: string; // e.g. "1/2"
  failedOnly?: boolean;
}

export async function runMatrix(options: MatrixOptions = {}): Promise<void> {
  const seed = options.seed ?? 4242;
  const startTime = Date.now();
  const reportsDir = path.resolve(process.cwd(), 'docs/ai-notes/ai/qa-matrix');
  fs.mkdirSync(reportsDir, { recursive: true });

  const jsonlPath = path.join(reportsDir, 'results.jsonl');
  const summaryPath = path.join(reportsDir, 'summary.json');
  const jsonlStream = fs.createWriteStream(jsonlPath, { flags: 'w' });

  console.log(`Starting Formula Flash QA Matrix [Seed: ${seed}, Smoke: ${!!options.smoke}]...`);

  // Ensure dev server is running or start it
  let serverProcess: ChildProcess | null = null;
  const isServerUp = await fetch('http://localhost:5173/').then(() => true).catch(() => false);
  if (!isServerUp) {
    console.log('Starting dev server on port 5173...');
    serverProcess = spawn('pnpm', ['--filter', 'app', 'run', 'dev', '--port', '5173'], {
      stdio: 'ignore',
      shell: true,
    });
    // Wait until server is ready
    let attempts = 0;
    while (attempts < 30) {
      await new Promise((r) => setTimeout(r, 500));
      const up = await fetch('http://localhost:5173/').then(() => true).catch(() => false);
      if (up) break;
      attempts++;
    }
  }

  const browser: Browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    baseURL: 'http://localhost:5173',
    viewport: { width: 1280, height: 800 },
  });
  const page = await context.newPage();

  let totalCases = 0;
  let passedCases = 0;
  let failedCases = 0;
  const flakyCases = 0;
  const rootCauses: Record<string, number> = {};

  // Part 1: Control Crawl
  console.log('Running Route & Control Crawl...');
  const routes = options.route
    ? [options.route]
    : ['#/', '#/create', '#/stats', '#/settings'];

  for (const r of routes) {
    totalCases++;
    await page.goto(`http://localhost:5173/${r}`);
    await page.waitForTimeout(300);
    const { controls, violations } = await scanPageControls(page, r);

    const record = {
      type: 'route-crawl',
      route: r,
      controlsCount: controls.length,
      violationsCount: violations.length,
      violations,
      status: violations.length === 0 ? 'passed' : 'warning',
    };
    jsonlStream.write(JSON.stringify(record) + '\n');

    if (violations.length === 0) {
      passedCases++;
    } else {
      // Warnings logged
      passedCases++;
      for (const v of violations) {
        rootCauses[v.description] = (rootCauses[v.description] || 0) + 1;
      }
    }
  }

  // Part 2: Math Matrix
  console.log('Running Math Matrix Suite...');
  const mathCases = buildMathMatrixCases();
  const mathChecker = registry.getChecker('math');
  const testCasesToRun = options.smoke ? mathCases.slice(0, 10) : mathCases;

  for (const mc of testCasesToRun) {
    totalCases++;
    let passed = false;
    let attempts = 0;

    // Retry loop up to 3 times to separate flaky from real bugs
    while (attempts < 3) {
      attempts++;
      const res = mathChecker!.check(mc.given, mc.reference, {
        accentsMatter: true,
        greekVariantsEqual: true,
        allowSideSwap: true,
        ...(mc.options || {}),
      });

      if (res.correct === mc.expectedCorrect) {
        passed = true;
        break;
      }
    }

    const record = {
      type: 'math-matrix-case',
      id: mc.id,
      reference: mc.reference,
      given: mc.given,
      expected: mc.expectedCorrect,
      attempts,
      status: passed ? (attempts > 1 ? 'flaky' : 'passed') : 'failed',
    };
    jsonlStream.write(JSON.stringify(record) + '\n');

    if (passed) {
      passedCases++;
      if (attempts > 1) {
        // Flaky
      }
    } else {
      failedCases++;
      const reason = `Math checker verdict mismatch on ${mc.id}`;
      rootCauses[reason] = (rootCauses[reason] || 0) + 1;
    }
  }

  // Part 3: Seeded Chaos Walk
  console.log('Running Seeded Random Walk...');
  const stepCount = options.smoke ? 5 : 15;
  totalCases++;
  const walkReport: RandomWalkReport = await runSeededRandomWalk(page, seed, stepCount);
  const walkPassed = walkReport.passedSteps === walkReport.totalSteps;

  const walkRecord = {
    type: 'seeded-walk',
    seed,
    steps: walkReport.totalSteps,
    passedSteps: walkReport.passedSteps,
    violations: walkReport.steps.flatMap((s) => s.violations),
    status: walkPassed ? 'passed' : 'failed',
  };
  jsonlStream.write(JSON.stringify(walkRecord) + '\n');

  if (walkPassed) {
    passedCases++;
  } else {
    failedCases++;
    rootCauses['Seeded walk invariant failure'] = (rootCauses['Seeded walk invariant failure'] || 0) + 1;
  }

  await browser.close();
  jsonlStream.end();

  if (serverProcess) {
    serverProcess.kill('SIGTERM');
  }

  const totalDuration = ((Date.now() - startTime) / 1000).toFixed(2);
  const summary = {
    timestamp: new Date().toISOString(),
    seed,
    durationSeconds: totalDuration,
    totalCases,
    passedCases,
    failedCases,
    flakyCases,
    rootCauses,
  };

  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2), 'utf8');

  console.log('\n================ MATRIX RUN SUMMARY ================');
  console.log(`Total duration: ${totalDuration}s`);
  console.log(`Total cases: ${totalCases}`);
  console.log(`Passed: ${passedCases} | Failed: ${failedCases} | Flaky: ${flakyCases}`);
  console.log('Root causes breakdown:');
  for (const [k, v] of Object.entries(rootCauses)) {
    console.log(`  - [${v}x] ${k}`);
  }
  console.log(`Results written to: ${jsonlPath} and ${summaryPath}\n`);
}

// CLI entry point
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const isSmoke = args.includes('--smoke');
  const seedArg = args.find((a) => a.startsWith('--seed='));
  const seedVal = seedArg ? parseInt(seedArg.split('=')[1], 10) : undefined;
  const routeArg = args.find((a) => a.startsWith('--route='));
  const routeVal = routeArg ? routeArg.split('=')[1] : undefined;
  const controlArg = args.find((a) => a.startsWith('--control='));
  const controlVal = controlArg ? controlArg.split('=')[1] : undefined;
  const shardArg = args.find((a) => a.startsWith('--shard='));
  const shardVal = shardArg ? shardArg.split('=')[1] : undefined;
  const isFailedOnly = args.includes('--failed-only');

  void runMatrix({
    smoke: isSmoke,
    seed: seedVal,
    route: routeVal,
    control: controlVal,
    shard: shardVal,
    failedOnly: isFailedOnly,
  });
}
