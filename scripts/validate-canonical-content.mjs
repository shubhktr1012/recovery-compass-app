import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

import { canonicalDir, repoRoot, validateCanonicalProgram } from './lib/canonical-content.mjs';

function parseArgs(argv) {
  const options = {
    programSlug: null,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === '--program') {
      const nextToken = argv[index + 1];
      if (!nextToken) {
        throw new Error('Missing value for --program. Example: --program six_day_reset');
      }
      options.programSlug = nextToken;
      index += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${token}`);
  }

  return options;
}

async function listCanonicalFiles(programSlug) {
  if (programSlug) {
    return [path.join(canonicalDir, `${programSlug}.json`)];
  }

  const entries = await readdir(canonicalDir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
    .map((entry) => path.join(canonicalDir, entry.name))
    .sort();
}

async function validateFile(filePath) {
  const raw = await readFile(filePath, 'utf8');
  const parsed = JSON.parse(raw);
  const result = validateCanonicalProgram(parsed);
  return {
    filePath,
    slug: parsed?.slug ?? '(unknown)',
    ...result,
  };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const files = await listCanonicalFiles(options.programSlug);
  if (files.length === 0) {
    throw new Error(
      `No canonical files found${options.programSlug ? ` for ${options.programSlug}` : ''} in ${path.relative(
        repoRoot,
        canonicalDir
      )}`
    );
  }

  let hasErrors = false;
  for (const filePath of files) {
    const result = await validateFile(filePath);
    const relativePath = path.relative(repoRoot, filePath);
    if (!result.valid) {
      hasErrors = true;
      console.log(`[invalid] ${result.slug} -> ${relativePath}`);
      for (const error of result.errors) {
        console.log(`  - ${error}`);
      }
      continue;
    }

    console.log(`[valid] ${result.slug} -> ${relativePath}`);
    for (const warning of result.warnings) {
      console.log(`  [warning] ${warning}`);
    }
  }

  if (hasErrors) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});

