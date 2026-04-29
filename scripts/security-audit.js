const { execFileSync } = require('node:child_process');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');

const args = process.argv.slice(2);
const auditArgs = ['audit', '--json', ...args];
const pnpmEntrypoint = process.env.npm_execpath;
const severityRank = { low: 1, moderate: 2, high: 3, critical: 4 };
const requestedLevel = args.includes('--audit-level')
  ? args[args.indexOf('--audit-level') + 1]
  : 'low';

function runAudit() {
  const command = pnpmEntrypoint
    ? process.execPath
    : process.platform === 'win32'
      ? 'pnpm.cmd'
      : 'pnpm';
  const commandArgs = pnpmEntrypoint ? [pnpmEntrypoint, ...auditArgs] : auditArgs;
  try {
    return execFileSync(command, commandArgs, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch (error) {
    if (typeof error.stdout === 'string' && error.stdout.trim()) return error.stdout;
    throw error;
  }
}

function parseVersion(version) {
  return version
    .split('-')[0]
    .split('.')
    .map((part) => Number(part));
}

function compareVersions(left, right) {
  const a = parseVersion(left);
  const b = parseVersion(right);
  for (let i = 0; i < 3; i += 1) {
    const diff = (a[i] || 0) - (b[i] || 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

function satisfiesPatchedVersion(version, patchedVersions) {
  return patchedVersions
    .split('||')
    .map((range) => range.trim())
    .filter((range) => range.startsWith('>='))
    .some((range) => compareVersions(version, range.slice(2).trim()) >= 0);
}

function isElectronWorkspaceFalsePositive(advisory) {
  if (advisory.module_name !== 'electron') return false;
  const findings = advisory.findings || [];
  if (!findings.length || findings.some((finding) => (finding.paths || []).length > 0))
    return false;

  const electronPackage = JSON.parse(
    readFileSync(join(process.cwd(), 'electron', 'package.json'), 'utf8'),
  );
  const installedElectron = electronPackage.devDependencies?.electron?.replace(/^[^\d]*/, '');
  if (!installedElectron) return false;

  return satisfiesPatchedVersion(installedElectron, advisory.patched_versions || '');
}

const report = JSON.parse(runAudit());
const advisories = Object.values(report.advisories || {}).filter(
  (advisory) => severityRank[advisory.severity] >= severityRank[requestedLevel],
);
const actionable = advisories.filter((advisory) => !isElectronWorkspaceFalsePositive(advisory));

if (actionable.length > 0) {
  console.error(`Security audit failed: ${actionable.length} actionable advisories found.`);
  for (const advisory of actionable) {
    const id = advisory.github_advisory_id || advisory.id;
    console.error(`- ${advisory.severity}: ${advisory.module_name} ${id} ${advisory.title}`);
  }
  process.exit(1);
}

const muted = advisories.length - actionable.length;
if (muted > 0) {
  console.log(`Security audit passed; muted ${muted} pnpm workspace false positives for electron.`);
} else {
  console.log('Security audit passed.');
}
