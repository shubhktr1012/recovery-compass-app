import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const projectRoot = process.cwd();
const iosProjectPath = path.join(projectRoot, 'ios/recoverycompassapp.xcodeproj/project.pbxproj');

function readRemoteIosBuildNumber() {
  try {
    const output = execFileSync(
      'npx',
      ['eas-cli', 'build:version:get', '--platform', 'ios', '--profile', 'production', '--json', '--non-interactive'],
      { cwd: projectRoot, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }
    );

    const parsed = JSON.parse(output);
    const buildNumber = Number(parsed?.buildNumber ?? parsed?.ios?.buildNumber ?? parsed?.version);

    if (!Number.isInteger(buildNumber) || buildNumber < 1) {
      throw new Error(`Unexpected build number payload: ${output}`);
    }

    return buildNumber;
  } catch (error) {
    throw new Error(
      `Could not read remote iOS build number. Run "npx eas-cli build:version:get --platform ios --profile production" and retry.\n${error}`
    );
  }
}

const currentRemoteBuild = readRemoteIosBuildNumber();
const nextBuild = currentRemoteBuild + 1;

const pbxproj = fs.readFileSync(iosProjectPath, 'utf8');
const updated = pbxproj.replace(/CURRENT_PROJECT_VERSION = \d+;/g, `CURRENT_PROJECT_VERSION = ${nextBuild};`);

if (updated === pbxproj) {
  throw new Error(`Could not find CURRENT_PROJECT_VERSION entries in ${iosProjectPath}`);
}

fs.writeFileSync(iosProjectPath, updated);

console.log(
  `Aligned all iOS targets to CURRENT_PROJECT_VERSION = ${nextBuild} (remote was ${currentRemoteBuild}, autoIncrement next).`
);
