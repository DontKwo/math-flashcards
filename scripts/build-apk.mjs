import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, copyFileSync, statSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = resolve(__filename, '..');
const rootDir = resolve(__dirname, '..');
const appDir = join(rootDir, 'apps', 'app');
const androidDir = join(appDir, 'android');
const distDir = join(rootDir, 'dist');

const isWindows = process.platform === 'win32';
const isRelease = process.argv.includes('--release');
const buildVariant = isRelease ? 'Release' : 'Debug';
const gradleTask = `assemble${buildVariant}`;

/**
 * @param {string} command
 * @param {string} cwd
 * @returns {void}
 */
function run(command, cwd) {
  console.log(`\n> [${cwd}] ${command}`);
  execSync(command, { cwd, stdio: 'inherit', env: process.env });
}

/**
 * @returns {string}
 */
function getPnpmCmd() {
  try {
    execSync(isWindows ? 'where.exe pnpm' : 'which pnpm', { stdio: 'ignore' });
    return 'pnpm';
  } catch {
    return 'npx pnpm';
  }
}

/**
 * @returns {void}
 */
function checkPrerequisites() {
  const androidHome = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT;
  if (!androidHome) {
    const defaultWin = join(process.env.LOCALAPPDATA || '', 'Android', 'Sdk');
    if (!existsSync(defaultWin)) {
      console.warn('Warning: ANDROID_HOME is not set. Android build might fail if SDK is not found.');
    }
  }

  try {
    execSync('java -version', { stdio: 'ignore' });
  } catch {
    throw new Error('Java JDK 17+ is required but java executable was not found on PATH.');
  }
}

/**
 * @returns {void}
 */
function main() {
  console.log(`Building formulaflash Android ${buildVariant} APK...`);
  checkPrerequisites();

  const pnpmCmd = getPnpmCmd();

  console.log('\n[1/4] Building web application...');
  run(`${pnpmCmd} --filter app run build`, rootDir);

  console.log('\n[2/4] Syncing web assets with Capacitor Android...');
  run('npx cap sync android', appDir);

  console.log(`\n[3/4] Running Gradle ${gradleTask}...`);
  const gradlew = isWindows ? 'gradlew.bat' : './gradlew';
  run(`${gradlew} ${gradleTask}`, androidDir);

  console.log('\n[4/4] Locating and copying output APK...');
  const apkRelativePath = isRelease
    ? join('app', 'build', 'outputs', 'apk', 'release', 'app-release-unsigned.apk')
    : join('app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk');

  const sourceApk = join(androidDir, apkRelativePath);
  if (!existsSync(sourceApk)) {
    throw new Error(`Expected APK not found at: ${sourceApk}`);
  }

  if (!existsSync(distDir)) {
    mkdirSync(distDir, { recursive: true });
  }

  const targetApkName = isRelease ? 'formulaflash-release.apk' : 'formulaflash-debug.apk';
  const targetApk = join(distDir, targetApkName);
  copyFileSync(sourceApk, targetApk);

  const stats = statSync(targetApk);
  const sizeMb = (stats.size / (1024 * 1024)).toFixed(2);

  console.log(`\nBuild successful!\nAPK generated: ${targetApk} (${sizeMb} MB)`);
}

main();
