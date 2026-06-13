import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const projectRoot = process.cwd();
const checkOnly = process.argv.includes('--check');

const appJsonPath = path.join(projectRoot, 'app.json');
const androidGradlePath = path.join(projectRoot, 'android/app/build.gradle');
const iosProjectPath = path.join(projectRoot, 'ios/recoverycompassapp.xcodeproj/project.pbxproj');

const readText = (filePath) => fs.readFileSync(filePath, 'utf8');
const writeText = (filePath, value) => fs.writeFileSync(filePath, value);

const appJson = JSON.parse(readText(appJsonPath));
const version = appJson?.expo?.version;

if (typeof version !== 'string' || !/^\d+\.\d+\.\d+$/.test(version)) {
  throw new Error(`Expected expo.version in app.json to be semver-like, received: ${String(version)}`);
}

const replacements = [
  {
    label: 'Android versionName',
    filePath: androidGradlePath,
    pattern: /versionName\s+"[^"]+"/,
    replacement: `versionName "${version}"`,
  },
  {
    label: 'iOS MARKETING_VERSION',
    filePath: iosProjectPath,
    pattern: /MARKETING_VERSION = [^;]+;/g,
    replacement: `MARKETING_VERSION = ${version};`,
  },
];

const changed = [];

for (const target of replacements) {
  const current = readText(target.filePath);
  if (!target.pattern.test(current)) {
    throw new Error(`Could not find ${target.label} in ${target.filePath}`);
  }

  target.pattern.lastIndex = 0;
  const next = current.replace(target.pattern, target.replacement);
  if (next !== current) {
    changed.push(target.label);
    if (!checkOnly) {
      writeText(target.filePath, next);
    }
  }
}

if (checkOnly && changed.length > 0) {
  throw new Error(`App version drift found: ${changed.join(', ')}. Run npm run version:sync.`);
}

console.log(
  checkOnly
    ? `App version sources are in sync at ${version}.`
    : `Synced native app versions to ${version}${changed.length > 0 ? ` (${changed.join(', ')})` : ' (no changes)'}.`
);
